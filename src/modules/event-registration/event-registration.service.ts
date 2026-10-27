import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import {
  DiscountType,
  EventPricingType,
  EventStatus,
  OrderStatus,
  Prisma,
  RegistrationStatus,
  TicketStatus,
} from "@internal/prisma/ems";
import { EmsPrismaService } from "../../prisma/ems-prisma.service";
import type { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import {
  CreateEventRegistrationDto,
  OrderItemRegistrationDto,
  QueryEventRegistrationDto,
  TicketAttendeeDto,
  UpdateEventRegistrationDto,
} from "./dto";

const REGISTRATION_SELECT = {
  id: true,
  eventId: true,
  userId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  event: {
    select: {
      id: true,
      title: true,
      slug: true,
      bannerImage: true,
      startDatetime: true,
      endDatetime: true,
      status: true,
      pricingType: true,
      venue: {
        select: {
          name: true,
          city: true,
        },
      },
      organizer: {
        select: {
          userId: true,
          organizationName: true,
        },
      },
    },
  },
  tickets: {
    select: {
      id: true,
      attendeeName: true,
      attendeeEmail: true,
      qrCode: true,
      status: true,
      checkedInAt: true,
      orderItem: {
        select: {
          orderId: true,
          ticketType: {
            select: {
              name: true,
              price: true,
            },
          },
        },
      },
    },
  },
} as const;

interface ResolvedOrderItem {
  ticketTypeId: string;
  ticketTypeName: string;
  unitPrice: number;
  quantity: number;
  attendees: TicketAttendeeDto[];
}

@Injectable()
export class EventRegistrationService {
  constructor(private readonly emsDb: EmsPrismaService) {}

  /**
   * Register the current user for an event.
   *
   * The client only decides *what* is booked; prices, promo validity and the
   * final amount are always recalculated on the server.
   */
  async create(userId: string, createDto: CreateEventRegistrationDto) {
    return this.emsDb.$transaction(
      async (tx) => {
        const event = await tx.event.findFirst({
          where: { id: createDto.eventId, deletedAt: null },
          select: {
            id: true,
            title: true,
            status: true,
            pricingType: true,
            organizer: {
              select: {
                userId: true,
              },
            },
            ticketTypes: {
              select: {
                id: true,
                name: true,
                price: true,
                quota: true,
                soldCount: true,
                saleStartDate: true,
                saleEndDate: true,
              },
            },
          },
        });

        if (!event) {
          throw new NotFoundException("Event tidak ditemukan");
        }

        if (event.status !== EventStatus.PUBLISHED) {
          throw new BadRequestException(
            "Event ini belum dibuka untuk pendaftaran",
          );
        }

        const existingRegistration = await tx.eventRegistration.findUnique({
          where: {
            eventId_userId: {
              eventId: createDto.eventId,
              userId,
            },
          },
        });

        if (existingRegistration) {
          throw new BadRequestException(
            "Anda sudah terdaftar pada event ini. Satu akun hanya dapat memiliki 1 pendaftaran.",
          );
        }

        const isFree = event.pricingType === EventPricingType.FREE;
        const items = this.resolveOrderItems(createDto);

        if (items.length === 0) {
          throw new BadRequestException(
            "Minimal pilih 1 tiket untuk didaftarkan",
          );
        }

        const totalQuantity = items.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );

        if (isFree && totalQuantity > 1) {
          throw new BadRequestException(
            "Untuk event gratis, pemesanan dibatasi maksimal 1 tiket per akun.",
          );
        }

        const resolvedItems: ResolvedOrderItem[] = [];
        const now = new Date();

        for (const item of items) {
          if (item.quantity < 1) {
            throw new BadRequestException("Jumlah tiket minimal 1");
          }

          let ticketType = item.ticketTypeId
            ? event.ticketTypes.find((type) => type.id === item.ticketTypeId)
            : undefined;

          if (!ticketType && !item.ticketTypeId && isFree) {
            ticketType = event.ticketTypes[0];
          }

          // Backwards compatibility: free events without ticket types get a
          // default free ticket type so registration still works.
          if (!ticketType && isFree && event.ticketTypes.length === 0) {
            ticketType = await tx.ticketType.create({
              data: {
                eventId: event.id,
                name: "Tiket Gratis",
                price: new Prisma.Decimal(0),
                quota: 1000,
              },
              select: {
                id: true,
                name: true,
                price: true,
                quota: true,
                soldCount: true,
                saleStartDate: true,
                saleEndDate: true,
              },
            });
          }

          if (!ticketType) {
            throw new BadRequestException(
              "Jenis tiket tidak valid untuk event ini",
            );
          }

          if (ticketType.saleStartDate && now < ticketType.saleStartDate) {
            throw new BadRequestException(
              `Penjualan tiket "${ticketType.name}" belum dimulai`,
            );
          }

          if (ticketType.saleEndDate && now >= ticketType.saleEndDate) {
            throw new BadRequestException(
              `Penjualan tiket "${ticketType.name}" sudah berakhir`,
            );
          }

          const remainingQuota = ticketType.quota - ticketType.soldCount;
          if (item.quantity > remainingQuota) {
            throw new BadRequestException(
              `Kuota tiket "${ticketType.name}" tersisa ${Math.max(
                remainingQuota,
                0,
              )}`,
            );
          }

          const attendees =
            item.tickets && item.tickets.length > 0
              ? item.tickets
              : (createDto.tickets ?? []).filter(
                  (ticket) => ticket.ticketTypeId === ticketType?.id,
                );

          if (attendees.length !== item.quantity) {
            throw new BadRequestException(
              `Jumlah data peserta untuk tiket "${ticketType.name}" harus ${item.quantity}`,
            );
          }

          resolvedItems.push({
            ticketTypeId: ticketType.id,
            ticketTypeName: ticketType.name,
            unitPrice: isFree ? 0 : ticketType.price.toNumber(),
            quantity: item.quantity,
            attendees,
          });
        }

        const subtotal = resolvedItems.reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0,
        );

        const { promoCode, discountAmount } = await this.resolvePromoCode(
          tx,
          event.id,
          isFree,
          subtotal,
          createDto,
        );

        const totalAmount = Math.max(0, subtotal - discountAmount);
        const registrationStatus = isFree
          ? RegistrationStatus.CONFIRMED
          : RegistrationStatus.PENDING;
        const orderStatus = isFree ? OrderStatus.PAID : OrderStatus.PENDING;

        const eventRegistration = await tx.eventRegistration.create({
          data: {
            eventId: event.id,
            userId,
            status: registrationStatus,
          },
          select: REGISTRATION_SELECT,
        });

        const order = await tx.order.create({
          data: {
            eventId: event.id,
            userId,
            promoCodeId: promoCode?.id ?? null,
            totalAmount: new Prisma.Decimal(totalAmount),
            expiresAt: isFree
              ? null
              : new Date(Date.now() + 24 * 60 * 60 * 1000),
            status: orderStatus,
          },
          select: {
            id: true,
            eventId: true,
            userId: true,
            promoCodeId: true,
            totalAmount: true,
            expiresAt: true,
            status: true,
          },
        });

        for (const item of resolvedItems) {
          const orderItem = await tx.orderItem.create({
            data: {
              orderId: order.id,
              ticketTypeId: item.ticketTypeId,
              quantity: item.quantity,
              subtotal: new Prisma.Decimal(item.unitPrice * item.quantity),
            },
            select: {
              id: true,
            },
          });

          await tx.ticket.createMany({
            data: item.attendees.map((attendee) => ({
              registrationId: eventRegistration.id,
              orderItemId: orderItem.id,
              attendeeName: attendee.attendeeName.trim(),
              attendeeEmail: attendee.attendeeEmail.trim().toLowerCase(),
              qrCode: `TKT-${randomUUID()}`,
              status: TicketStatus.VALID,
            })),
          });

          await tx.ticketType.update({
            where: { id: item.ticketTypeId },
            data: {
              soldCount: { increment: item.quantity },
            },
          });
        }

        const tickets = await tx.ticket.findMany({
          where: { registrationId: eventRegistration.id },
          select: {
            id: true,
            attendeeName: true,
            attendeeEmail: true,
            qrCode: true,
            status: true,
          },
        });

        return {
          message: "Registrasi berhasil",
          data: {
            registration: eventRegistration,
            order,
            tickets,
          },
        };
      },
      {
        maxWait: 5000,
        timeout: 10000,
      },
    );
  }

  /**
   * Get all registrations (admin only).
   */
  async findAll(user: AuthenticatedUser, query: QueryEventRegistrationDto) {
    if (!user.roles.includes("ADMIN")) {
      throw new ForbiddenException(
        "Only administrators can list all registrations",
      );
    }

    return this.findPaginated(
      this.buildWhere(query),
      query,
      "Registrations fetched successfully",
    );
  }

  /**
   * Get all registrations for the currently logged in user.
   */
  async findMyRegistrations(
    user: AuthenticatedUser,
    query: QueryEventRegistrationDto,
  ) {
    return this.findPaginated(
      this.buildWhere(query, user.sub),
      query,
      "Registrations fetched successfully",
    );
  }

  /**
   * Get all registrations for a specific event (event owner or admin).
   */
  async findByEventId(
    user: AuthenticatedUser,
    eventId: string,
    query: QueryEventRegistrationDto,
  ) {
    const event = await this.emsDb.event.findFirst({
      where: { id: eventId, deletedAt: null },
      select: {
        id: true,
        organizer: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException("Event tidak ditemukan");
    }

    const isAdmin = user.roles.includes("ADMIN");
    if (!isAdmin && event.organizer.userId !== user.sub) {
      throw new ForbiddenException(
        "Anda hanya dapat melihat pendaftaran event milik Anda",
      );
    }

    return this.findPaginated(
      this.buildWhere(query, undefined, eventId),
      query,
      "Event registrations fetched successfully",
    );
  }

  /**
   * Get registration detail by ID (registration owner, event owner or admin).
   */
  async findOne(user: AuthenticatedUser, id: string) {
    const registration = await this.findRegistrationForUser(user, id);
    return {
      message: "Registration fetched successfully",
      data: registration,
    };
  }

  /**
   * Update registration status. Only `status` is mutable through this endpoint.
   */
  async update(
    user: AuthenticatedUser,
    id: string,
    updateDto: UpdateEventRegistrationDto,
  ) {
    if (!updateDto.status) {
      throw new BadRequestException("Status pendaftaran wajib diisi");
    }

    const existing = await this.findRegistrationForUser(user, id);

    const isAdmin = user.roles.includes("ADMIN");
    const isEventOwner = existing.event.organizer.userId === user.sub;

    if (
      !isAdmin &&
      !isEventOwner &&
      updateDto.status !== RegistrationStatus.CANCELLED
    ) {
      throw new ForbiddenException(
        "Anda hanya dapat membatalkan pendaftaran Anda sendiri",
      );
    }

    if (existing.status === RegistrationStatus.CANCELLED) {
      throw new BadRequestException(
        "Pendaftaran yang sudah dibatalkan tidak dapat diubah statusnya",
      );
    }

    return this.emsDb.$transaction(async (tx) => {
      if (
        updateDto.status === RegistrationStatus.CANCELLED &&
        existing.status !== RegistrationStatus.CANCELLED
      ) {
        await this.cancelRegistration(tx, id);
      }

      const updated = await tx.eventRegistration.update({
        where: { id },
        data: { status: updateDto.status },
        select: REGISTRATION_SELECT,
      });

      return {
        message: "Registration updated successfully",
        data: updated,
      };
    });
  }

  /**
   * Cancel a registration and release the reserved ticket quota.
   */
  async remove(user: AuthenticatedUser, id: string) {
    const existing = await this.findRegistrationForUser(user, id);

    if (existing.status === RegistrationStatus.CANCELLED) {
      return {
        message: "Registration is already cancelled",
        data: existing,
      };
    }

    return this.emsDb.$transaction(async (tx) => {
      await this.cancelRegistration(tx, id);

      const updated = await tx.eventRegistration.update({
        where: { id },
        data: { status: RegistrationStatus.CANCELLED },
        select: REGISTRATION_SELECT,
      });

      return {
        message: "Registration cancelled successfully",
        data: updated,
      };
    });
  }

  private buildWhere(
    query: QueryEventRegistrationDto,
    userId?: string,
    eventId?: string,
  ): Prisma.EventRegistrationWhereInput {
    const where: Prisma.EventRegistrationWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (eventId ?? query.eventId) {
      where.eventId = eventId ?? query.eventId;
    }

    if (query.status) {
      where.status = query.status;
    }

    return where;
  }

  private async findPaginated(
    where: Prisma.EventRegistrationWhereInput,
    query: QueryEventRegistrationDto,
    message: string,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      this.emsDb.eventRegistration.count({ where }),
      this.emsDb.eventRegistration.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: REGISTRATION_SELECT,
      }),
    ]);

    return {
      message,
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async findRegistrationForUser(user: AuthenticatedUser, id: string) {
    const isAdmin = user.roles.includes("ADMIN");

    const registration = await this.emsDb.eventRegistration.findFirst({
      where: isAdmin
        ? { id }
        : {
            id,
            OR: [
              { userId: user.sub },
              { event: { organizer: { userId: user.sub } } },
            ],
          },
      select: REGISTRATION_SELECT,
    });

    if (registration) {
      return registration;
    }

    const exists = await this.emsDb.eventRegistration.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException("Registration not found");
    }

    throw new ForbiddenException(
      "You do not have permission to access this registration",
    );
  }

  private resolveOrderItems(
    createDto: CreateEventRegistrationDto,
  ): OrderItemRegistrationDto[] {
    if (createDto.items && createDto.items.length > 0) {
      return createDto.items;
    }

    if (createDto.tickets && createDto.tickets.length > 0) {
      const grouped = new Map<string, OrderItemRegistrationDto>();

      for (const ticket of createDto.tickets) {
        const existing = grouped.get(ticket.ticketTypeId);
        if (existing) {
          existing.quantity += 1;
          existing.tickets?.push({
            attendeeName: ticket.attendeeName,
            attendeeEmail: ticket.attendeeEmail,
          });
        } else {
          grouped.set(ticket.ticketTypeId, {
            ticketTypeId: ticket.ticketTypeId,
            quantity: 1,
            tickets: [
              {
                attendeeName: ticket.attendeeName,
                attendeeEmail: ticket.attendeeEmail,
              },
            ],
          });
        }
      }

      return [...grouped.values()];
    }

    if (createDto.attendees && createDto.attendees.length > 0) {
      return [
        {
          ticketTypeId: "",
          quantity: createDto.attendees.length,
          tickets: createDto.attendees,
        },
      ];
    }

    return [];
  }

  private async resolvePromoCode(
    tx: Prisma.TransactionClient,
    eventId: string,
    isFree: boolean,
    subtotal: number,
    createDto: CreateEventRegistrationDto,
  ): Promise<{
    promoCode: { id: string } | null;
    discountAmount: number;
  }> {
    if (!createDto.promoCode?.id) {
      return { promoCode: null, discountAmount: 0 };
    }

    if (isFree) {
      throw new BadRequestException(
        "Event gratis tidak dapat menggunakan kode promo",
      );
    }

    const promoCode = await tx.promoCode.findFirst({
      where: {
        id: createDto.promoCode.id,
        eventId,
      },
    });

    if (!promoCode) {
      throw new BadRequestException("Kode promo tidak valid");
    }

    const now = new Date();

    if (promoCode.validFrom && now < promoCode.validFrom) {
      throw new BadRequestException("Kode promo belum berlaku");
    }

    if (promoCode.validUntil && now >= promoCode.validUntil) {
      throw new BadRequestException("Kode promo sudah tidak berlaku");
    }

    if (
      promoCode.maxUsage !== null &&
      promoCode.usedCount >= promoCode.maxUsage
    ) {
      throw new BadRequestException(
        "Kode promo sudah mencapai batas penggunaan",
      );
    }

    const rawDiscount =
      promoCode.discountType === DiscountType.PERCENTAGE
        ? (subtotal * promoCode.discountValue.toNumber()) / 100
        : promoCode.discountValue.toNumber();

    const discountAmount = Math.max(
      0,
      Math.min(Math.round(rawDiscount), subtotal),
    );

    await tx.promoCode.update({
      where: { id: promoCode.id },
      data: {
        usedCount: { increment: 1 },
      },
    });

    return { promoCode, discountAmount };
  }

  private async cancelRegistration(
    tx: Prisma.TransactionClient,
    registrationId: string,
  ): Promise<void> {
    const tickets = await tx.ticket.findMany({
      where: {
        registrationId,
        status: { not: TicketStatus.CANCELLED },
      },
      select: {
        orderItem: {
          select: {
            ticketTypeId: true,
          },
        },
      },
    });

    if (tickets.length === 0) {
      return;
    }

    const quantities = new Map<string, number>();
    for (const ticket of tickets) {
      const ticketTypeId = ticket.orderItem.ticketTypeId;
      quantities.set(ticketTypeId, (quantities.get(ticketTypeId) ?? 0) + 1);
    }

    await tx.ticket.updateMany({
      where: {
        registrationId,
        status: { not: TicketStatus.CANCELLED },
      },
      data: {
        status: TicketStatus.CANCELLED,
      },
    });

    for (const [ticketTypeId, quantity] of quantities) {
      const ticketType = await tx.ticketType.findUnique({
        where: { id: ticketTypeId },
        select: { soldCount: true },
      });

      if (ticketType) {
        await tx.ticketType.update({
          where: { id: ticketTypeId },
          data: {
            soldCount: {
              decrement: Math.min(quantity, ticketType.soldCount),
            },
          },
        });
      }
    }
  }
}
