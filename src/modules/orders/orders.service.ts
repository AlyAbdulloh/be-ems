import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrderStatus, PaymentStatus, Prisma } from "@internal/prisma/ems";
import { EmsPrismaService } from "../../prisma/ems-prisma.service";
import type { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import { QueryOrderDto } from "./dto/query-order.dto";
import { CreatePaymentDto } from "./dto/create-payment.dto";

type OrderWithRelations = Prisma.OrderGetPayload<{
  select: typeof ORDER_SELECT;
}>;

const ORDER_SELECT = {
  id: true,
  totalAmount: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  expiresAt: true,
  event: {
    select: {
      id: true,
      title: true,
      slug: true,
      bannerImage: true,
      startDatetime: true,
      endDatetime: true,
      venue: {
        select: {
          name: true,
          city: true,
        },
      },
    },
  },
  items: {
    select: {
      id: true,
      quantity: true,
      subtotal: true,
      ticketType: {
        select: {
          name: true,
          price: true,
        },
      },
    },
  },
  payments: {
    select: {
      id: true,
      paymentMethod: true,
      amount: true,
      status: true,
      paidAt: true,
    },
    orderBy: { createdAt: "desc" },
  },
} as const;

@Injectable()
export class OrdersService {
  constructor(private readonly emsDb: EmsPrismaService) {}

  /**
   * Get all orders belonging to the currently logged in user.
   */
  async findMyOrders(user: AuthenticatedUser, query: QueryOrderDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = { userId: user.sub };

    if (query.status) {
      where.status = query.status;
    }

    const [total, items] = await Promise.all([
      this.emsDb.order.count({ where }),
      this.emsDb.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: ORDER_SELECT,
      }),
    ]);

    return {
      message: "Orders fetched successfully",
      data: items.map((order) => this.mapOrder(order)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get order detail by ID (order owner, event owner or admin).
   */
  async findOne(user: AuthenticatedUser, id: string) {
    const order = await this.findOwnedOrder(user, id);

    return {
      message: "Order fetched successfully",
      data: this.mapOrder(order),
    };
  }

  /**
   * Process payment for an order (order owner or admin).
   */
  async pay(user: AuthenticatedUser, id: string, dto: CreatePaymentDto) {
    const order = await this.findOwnedOrder(user, id);

    if (order.status === OrderStatus.PAID) {
      throw new BadRequestException("Pesanan ini sudah dibayar");
    }

    if (order.status === OrderStatus.REFUNDED) {
      throw new BadRequestException(
        "Pesanan ini sudah dikembalikan dan tidak dapat dibayar",
      );
    }

    const payment = await this.emsDb.payment.create({
      data: {
        orderId: id,
        paymentMethod: dto.paymentMethod,
        amount: order.totalAmount,
        status: PaymentStatus.SUCCESS,
        paidAt: new Date(),
      },
      select: {
        id: true,
      },
    });

    const updated = await this.emsDb.order.update({
      where: { id },
      data: { status: OrderStatus.PAID },
      select: ORDER_SELECT,
    });

    return {
      message: "Pembayaran berhasil",
      paymentId: payment.id,
      data: this.mapOrder(updated),
    };
  }

  private async findOwnedOrder(
    user: AuthenticatedUser,
    id: string,
  ): Promise<OrderWithRelations> {
    const isAdmin = user.roles.includes("ADMIN");

    const order = await this.emsDb.order.findFirst({
      where: isAdmin
        ? { id }
        : {
            id,
            OR: [
              { userId: user.sub },
              { event: { organizer: { userId: user.sub } } },
            ],
          },
      select: ORDER_SELECT,
    });

    if (!order) {
      const exists = await this.emsDb.order.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!exists) {
        throw new NotFoundException("Order not found");
      }
      throw new ForbiddenException(
        "You do not have permission to access this order",
      );
    }

    return order;
  }

  private mapOrder(order: OrderWithRelations) {
    const latestPayment = order.payments?.[0] ?? null;

    return {
      id: order.id,
      totalAmount: Number(order.totalAmount),
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      expiresAt: order.expiresAt,
      payment: latestPayment
        ? {
            method: latestPayment.paymentMethod,
            amount: Number(latestPayment.amount),
            status: latestPayment.status,
            paidAt: latestPayment.paidAt,
          }
        : {
            method: null,
            amount: 0,
            status: order.status === OrderStatus.PAID ? "PAID" : "UNPAID",
            paidAt: null,
          },
      items: (order.items ?? []).map((item) => ({
        id: item.id,
        quantity: item.quantity,
        subtotal: Number(item.subtotal),
        ticketType: {
          name: item.ticketType?.name ?? null,
          price: item.ticketType ? Number(item.ticketType.price) : null,
        },
      })),
      event: order.event,
    };
  }
}
