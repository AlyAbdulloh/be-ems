import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { EmsPrismaService } from '../../prisma/ems-prisma.service';
import { CreatePromoCodeDto, UpdatePromoCodeDto, CheckPromoCodeDto } from './dto/create-promo-codes';
import { EventPricingType, Prisma } from '@internal/prisma/ems';

@Injectable()
export class PromoCodesService {
    constructor(private readonly emsDb: EmsPrismaService) { }

    async create(createDto: CreatePromoCodeDto) {

        const existingEvent = await this.emsDb.event.findUnique({
            where: { id: createDto.eventId },
        });

        if (!existingEvent) {
            throw new NotFoundException(`Event dengan ID ${createDto.eventId} tidak ditemukan`);
        }

        if (existingEvent.pricingType === EventPricingType.FREE) {
            throw new BadRequestException('Event gratis tidak dapat menambahkan kode promo');
        }

        // cek apakah kode promo sudah ada pada event ini
        const existingPromoCode = await this.emsDb.promoCode.findFirst({
            where: { code: createDto.code, eventId: createDto.eventId },
        });

        if (existingPromoCode) {
            throw new BadRequestException('Kode promo sudah ada pada event ini');
        }

        let validFrom: Date | null = null;
        let validUntil: Date | null = null;

        if (createDto.validFrom) {
            validFrom = new Date(createDto.validFrom);
        }
        if (createDto.validUntil) {
            validUntil = new Date(createDto.validUntil);
        }

        if (validFrom && validUntil && validFrom >= validUntil) {
            throw new BadRequestException('Waktu mulai promo harus lebih awal dari waktu berakhir');
        }

        const promoCode = await this.emsDb.promoCode.create({
            data: {
                eventId: createDto.eventId,
                code: createDto.code,
                discountValue: new Prisma.Decimal(createDto.discountValue),
                discountType: createDto.discountType,
                maxUsage: createDto.maxUsage,
                validFrom,
                validUntil,
            },
        });

        return {
            message: 'Kode promo berhasil ditambahkan',
            data: promoCode,
        };
    }

    async findByEventId(eventId: string) {
        const promoCodes = await this.emsDb.promoCode.findMany({
            where: {
                eventId
            },
            select: {
                id: true,
                code: true,
                discountType: true,
                discountValue: true,
                validFrom: true,
                validUntil: true,
                maxUsage: true,
                usedCount: true,
            }
        });

        return {
            message: 'Berhasil mendapatkan data Promo Code',
            data: promoCodes,
        }
    }

    async update(id: string, updateDto: UpdatePromoCodeDto) {
        // cek apakah kode promo ada
        const existingPromoCode = await this.emsDb.promoCode.findUnique({
            where: { id },
        })

        if (!existingPromoCode) {
            throw new NotFoundException('Kode Promo tidak ditemukan');
        }

        const event = await this.emsDb.event.findUnique({
            where: { id: updateDto.eventId || existingPromoCode.eventId },
        });

        if (event?.pricingType === EventPricingType.FREE) {
            throw new BadRequestException('Event gratis tidak dapat menggunakan kode promo');
        }

        // cek apakah kode promo sudah pernah ditambahkan
        const promoCode = await this.emsDb.promoCode.findFirst({
            where: {
                code: updateDto.code,
                eventId: updateDto.eventId,
                NOT: { id },
            }
        });

        if (promoCode) {
            throw new BadRequestException('Kode Promo sudah pernah ditambahkan pada event ini');
        }

        let validFrom: Date | null = null;
        let validUntil: Date | null = null;

        if (updateDto.validFrom) {
            validFrom = new Date(updateDto.validFrom);
        }
        if (updateDto.validUntil) {
            validUntil = new Date(updateDto.validUntil);
        }

        if (validFrom && validUntil && validFrom >= validUntil) {
            throw new BadRequestException('Waktu mulai promo harus lebih awal dari waktu berakhir');
        }

        const updatedPromoCode = await this.emsDb.promoCode.update({
            where: { id },
            data: {
                code: updateDto.code,
                discountValue: new Prisma.Decimal(updateDto.discountValue),
                discountType: updateDto.discountType,
                maxUsage: updateDto.maxUsage,
                validFrom,
                validUntil,
            },
        });

        return {
            message: 'Kode Promo berhasil diperbarui',
            data: updatedPromoCode,
        };
    }

    async checkkPromoCode(cekDto: CheckPromoCodeDto) {
        let { eventId, code } = cekDto;

        const promoCode = await this.emsDb.promoCode.findFirst({
            where: {
                code,
                eventId,
            },
            select: {
                id: true,
                code: true,
                discountType: true,
                discountValue: true,
                validFrom: true,
                validUntil: true,
                maxUsage: true,
                usedCount: true
            }
        });

        if (!promoCode) {
            throw new NotFoundException('Kode Promo tidak ditemukan');
        }

        if (promoCode.validFrom && promoCode.validUntil && new Date() >= promoCode.validUntil) {
            throw new BadRequestException('Kode Promo tidak berlaku');
        }

        if (promoCode.maxUsage && promoCode.usedCount >= promoCode.maxUsage) {
            throw new BadRequestException('Kode Promo sudah digunakan');
        }

        return {
            message: 'Kode Promo berhasil ditemukan',
            data: promoCode,
        };
    }

    async delete(id: string) {
        // cek kode promo ada atau tidak
        const promoCode = await this.emsDb.promoCode.findUnique({
            where: { id },
        });

        if (!promoCode) {
            throw new NotFoundException('Kode Promo tidak ditemukan');
        }

        await this.emsDb.promoCode.delete({
            where: { id },
        });

        return {
            message: 'Kode Promo berhasil dihapus',
        };
    }
}
