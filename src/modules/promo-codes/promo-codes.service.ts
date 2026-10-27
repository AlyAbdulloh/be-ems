import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { EmsPrismaService } from "../../prisma/ems-prisma.service";
import {
  CreatePromoCodeDto,
  UpdatePromoCodeDto,
  CheckPromoCodeDto,
} from "./dto/create-promo-codes";
import {
  DiscountType,
  EventPricingType,
  OrganizerStatus,
  Prisma,
} from "@internal/prisma/ems";

const PROMO_CODE_SELECT = {
  id: true,
  eventId: true,
  code: true,
  discountType: true,
  discountValue: true,
  validFrom: true,
  validUntil: true,
  maxUsage: true,
  usedCount: true,
} as const;

@Injectable()
export class PromoCodesService {
  constructor(private readonly emsDb: EmsPrismaService) {}

  private normaliseCode(code: string): string {
    return code.trim().toUpperCase();
  }

  /**
   * Ensure the current user is an approved organizer that owns the event.
   */
  private async assertEventOwnership(userId: string, eventId: string) {
    const event = await this.emsDb.event.findFirst({
      where: { id: eventId, deletedAt: null },
      select: {
        id: true,
        pricingType: true,
        organizer: {
          select: {
            userId: true,
            status: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(`Event dengan ID ${eventId} tidak ditemukan`);
    }

    if (
      event.organizer.userId !== userId ||
      event.organizer.status !== OrganizerStatus.APPROVED
    ) {
      throw new ForbiddenException(
        "Anda hanya dapat mengelola kode promo untuk event milik Anda",
      );
    }

    return event;
  }

  private parseDate(value: string | undefined): Date | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    return value ? new Date(value) : null;
  }

  private assertValidDateRange(
    validFrom: Date | null | undefined,
    validUntil: Date | null | undefined,
  ): void {
    if (validFrom && validUntil && validFrom >= validUntil) {
      throw new BadRequestException(
        "Waktu mulai promo harus lebih awal dari waktu berakhir",
      );
    }
  }

  private assertValidDiscount(
    discountType: DiscountType,
    discountValue: number,
  ): void {
    if (discountValue <= 0) {
      throw new BadRequestException("Nilai diskon harus lebih besar dari 0");
    }

    if (discountType === DiscountType.PERCENTAGE && discountValue > 100) {
      throw new BadRequestException(
        "Diskon persentase tidak boleh melebihi 100",
      );
    }
  }

  async create(userId: string, createDto: CreatePromoCodeDto) {
    const event = await this.assertEventOwnership(userId, createDto.eventId);

    if (event.pricingType === EventPricingType.FREE) {
      throw new BadRequestException(
        "Event gratis tidak dapat menambahkan kode promo",
      );
    }

    const code = this.normaliseCode(createDto.code);

    const existingPromoCode = await this.emsDb.promoCode.findUnique({
      where: { eventId_code: { eventId: createDto.eventId, code } },
    });

    if (existingPromoCode) {
      throw new BadRequestException("Kode promo sudah ada pada event ini");
    }

    const validFrom = this.parseDate(createDto.validFrom) ?? null;
    const validUntil = this.parseDate(createDto.validUntil) ?? null;
    this.assertValidDateRange(validFrom, validUntil);

    const discountType = createDto.discountType ?? DiscountType.PERCENTAGE;
    this.assertValidDiscount(discountType, createDto.discountValue);

    if (createDto.maxUsage !== undefined && createDto.maxUsage < 1) {
      throw new BadRequestException("Maksimal penggunaan minimal 1");
    }

    const promoCode = await this.emsDb.promoCode.create({
      data: {
        eventId: createDto.eventId,
        code,
        discountValue: new Prisma.Decimal(createDto.discountValue),
        discountType,
        maxUsage: createDto.maxUsage,
        validFrom,
        validUntil,
      },
      select: PROMO_CODE_SELECT,
    });

    return {
      message: "Kode promo berhasil ditambahkan",
      data: promoCode,
    };
  }

  async findByEventId(userId: string, eventId: string) {
    await this.assertEventOwnership(userId, eventId);

    const promoCodes = await this.emsDb.promoCode.findMany({
      where: { eventId },
      select: PROMO_CODE_SELECT,
      orderBy: { code: "asc" },
    });

    return {
      message: "Berhasil mendapatkan data Promo Code",
      data: promoCodes,
    };
  }

  async update(userId: string, id: string, updateDto: UpdatePromoCodeDto) {
    const existingPromoCode = await this.emsDb.promoCode.findUnique({
      where: { id },
    });

    if (!existingPromoCode) {
      throw new NotFoundException("Kode Promo tidak ditemukan");
    }

    await this.assertEventOwnership(userId, existingPromoCode.eventId);

    const code =
      updateDto.code !== undefined
        ? this.normaliseCode(updateDto.code)
        : existingPromoCode.code;

    const duplicate = await this.emsDb.promoCode.findUnique({
      where: {
        eventId_code: { eventId: existingPromoCode.eventId, code },
      },
    });

    if (duplicate && duplicate.id !== id) {
      throw new BadRequestException(
        "Kode Promo sudah pernah ditambahkan pada event ini",
      );
    }

    const validFrom =
      updateDto.validFrom !== undefined
        ? this.parseDate(updateDto.validFrom)
        : existingPromoCode.validFrom;
    const validUntil =
      updateDto.validUntil !== undefined
        ? this.parseDate(updateDto.validUntil)
        : existingPromoCode.validUntil;
    this.assertValidDateRange(validFrom, validUntil);

    const discountType =
      updateDto.discountType ?? existingPromoCode.discountType;
    const discountValue =
      updateDto.discountValue ?? existingPromoCode.discountValue.toNumber();
    this.assertValidDiscount(discountType, discountValue);

    const maxUsage =
      updateDto.maxUsage !== undefined
        ? updateDto.maxUsage
        : existingPromoCode.maxUsage;

    if (maxUsage !== null && maxUsage < existingPromoCode.usedCount) {
      throw new BadRequestException(
        `Maksimal penggunaan tidak boleh lebih kecil dari jumlah penggunaan saat ini (${existingPromoCode.usedCount})`,
      );
    }

    const updatedPromoCode = await this.emsDb.promoCode.update({
      where: { id },
      data: {
        code,
        discountValue: new Prisma.Decimal(discountValue),
        discountType,
        maxUsage,
        validFrom,
        validUntil,
      },
      select: PROMO_CODE_SELECT,
    });

    return {
      message: "Kode Promo berhasil diperbarui",
      data: updatedPromoCode,
    };
  }

  async checkPromoCode(cekDto: CheckPromoCodeDto) {
    const code = this.normaliseCode(cekDto.code);

    const promoCode = await this.emsDb.promoCode.findUnique({
      where: {
        eventId_code: { eventId: cekDto.eventId, code },
      },
      select: PROMO_CODE_SELECT,
    });

    if (!promoCode) {
      throw new NotFoundException("Kode Promo tidak ditemukan");
    }

    const now = new Date();

    if (promoCode.validFrom && now < promoCode.validFrom) {
      throw new BadRequestException("Kode Promo belum berlaku");
    }

    if (promoCode.validUntil && now >= promoCode.validUntil) {
      throw new BadRequestException("Kode Promo tidak berlaku");
    }

    if (
      promoCode.maxUsage !== null &&
      promoCode.usedCount >= promoCode.maxUsage
    ) {
      throw new BadRequestException("Kode Promo sudah digunakan");
    }

    return {
      message: "Kode Promo berhasil ditemukan",
      data: promoCode,
    };
  }

  async delete(userId: string, id: string) {
    const promoCode = await this.emsDb.promoCode.findUnique({
      where: { id },
    });

    if (!promoCode) {
      throw new NotFoundException("Kode Promo tidak ditemukan");
    }

    await this.assertEventOwnership(userId, promoCode.eventId);

    if (promoCode.usedCount > 0) {
      throw new BadRequestException(
        "Tidak dapat menghapus kode promo yang sudah pernah digunakan",
      );
    }

    await this.emsDb.promoCode.delete({
      where: { id },
    });

    return {
      message: "Kode Promo berhasil dihapus",
    };
  }
}
