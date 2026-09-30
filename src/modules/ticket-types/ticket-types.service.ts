import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EmsPrismaService } from '../../prisma/ems-prisma.service';
import { CreateTicketTypeDto, UpdateTicketTypeDto } from './dto/create-ticket-type.dto';
import { OrganizerStatus } from '@internal/prisma/ems';
import { Prisma } from '@internal/prisma/ems';

@Injectable()
export class TicketTypesService {
  constructor(private readonly emsDb: EmsPrismaService) {}

  private async getApprovedOrganizer(userId: string) {
    const organizer = await this.emsDb.organizer.findUnique({
      where: { userId },
    });

    if (!organizer || organizer.status !== OrganizerStatus.APPROVED) {
      throw new ForbiddenException(
        'Hanya organizer terdaftar dan disetujui yang dapat mengelola jenis tiket',
      );
    }

    return organizer;
  }

  private defaultTicketTypeSelect = {
    id: true,
    eventId: true,
    name: true,
    price: true,
    quota: true,
    soldCount: true,
    saleStartDate: true,
    saleEndDate: true,
    createdAt: true,
    updatedAt: true,
  };

  async findByEventId(eventId: string) {
    const ticketTypes = await this.emsDb.ticketType.findMany({
      where: { eventId },
      select: this.defaultTicketTypeSelect,
      orderBy: { price: 'asc' },
    });

    return {
      message: 'Daftar jenis tiket berhasil diambil',
      data: ticketTypes,
    };
  }

  async findOne(id: string) {
    const ticketType = await this.emsDb.ticketType.findUnique({
      where: { id },
      select: this.defaultTicketTypeSelect,
    });

    if (!ticketType) {
      throw new NotFoundException(`Jenis tiket dengan ID ${id} tidak ditemukan`);
    }

    return {
      message: 'Detail jenis tiket berhasil diambil',
      data: ticketType,
    };
  }

  async create(userId: string, createDto: CreateTicketTypeDto) {
    const organizer = await this.getApprovedOrganizer(userId);

    const existingEvent = await this.emsDb.event.findUnique({
      where: { id: createDto.eventId },
    });

    if (!existingEvent) {
      throw new NotFoundException(`Event dengan ID ${createDto.eventId} tidak ditemukan`);
    }

    if (existingEvent.organizerId !== organizer.id) {
      throw new ForbiddenException('Anda hanya dapat menambahkan tiket ke event milik Anda sendiri');
    }

    let saleStartDate: Date | null = null;
    let saleEndDate: Date | null = null;

    if (createDto.saleStartDate) {
      saleStartDate = new Date(createDto.saleStartDate);
    }
    if (createDto.saleEndDate) {
      saleEndDate = new Date(createDto.saleEndDate);
    }

    if (saleStartDate && saleEndDate && saleStartDate >= saleEndDate) {
      throw new BadRequestException('Waktu mulai penjualan tiket harus lebih awal dari waktu berakhir');
    }

    const ticketType = await this.emsDb.ticketType.create({
      data: {
        eventId: createDto.eventId,
        name: createDto.name,
        price: new Prisma.Decimal(createDto.price),
        quota: createDto.quota,
        saleStartDate,
        saleEndDate,
      },
      select: this.defaultTicketTypeSelect,
    });

    return {
      message: 'Jenis tiket berhasil ditambahkan',
      data: ticketType,
    };
  }

  async update(userId: string, id: string, updateDto: UpdateTicketTypeDto) {
    const organizer = await this.getApprovedOrganizer(userId);

    const existingTicketType = await this.emsDb.ticketType.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!existingTicketType) {
      throw new NotFoundException(`Jenis tiket dengan ID ${id} tidak ditemukan`);
    }

    if (existingTicketType.event.organizerId !== organizer.id) {
      throw new ForbiddenException('Anda hanya dapat memperbarui jenis tiket dari event milik Anda');
    }

    const saleStartDate =
      updateDto.saleStartDate !== undefined
        ? updateDto.saleStartDate
          ? new Date(updateDto.saleStartDate)
          : null
        : existingTicketType.saleStartDate;

    const saleEndDate =
      updateDto.saleEndDate !== undefined
        ? updateDto.saleEndDate
          ? new Date(updateDto.saleEndDate)
          : null
        : existingTicketType.saleEndDate;

    if (saleStartDate && saleEndDate && saleStartDate >= saleEndDate) {
      throw new BadRequestException('Waktu mulai penjualan tiket harus lebih awal dari waktu berakhir');
    }

    if (updateDto.quota !== undefined && updateDto.quota < existingTicketType.soldCount) {
      throw new BadRequestException(
        `Kuota tidak boleh lebih kecil dari jumlah tiket yang sudah terjual (${existingTicketType.soldCount})`,
      );
    }

    const updated = await this.emsDb.ticketType.update({
      where: { id },
      data: {
        name: updateDto.name !== undefined ? updateDto.name : existingTicketType.name,
        price:
          updateDto.price !== undefined
            ? new Prisma.Decimal(updateDto.price)
            : existingTicketType.price,
        quota: updateDto.quota !== undefined ? updateDto.quota : existingTicketType.quota,
        saleStartDate,
        saleEndDate,
      },
      select: this.defaultTicketTypeSelect,
    });

    return {
      message: 'Jenis tiket berhasil diperbarui',
      data: updated,
    };
  }

  async remove(userId: string, id: string) {
    const organizer = await this.getApprovedOrganizer(userId);

    const existingTicketType = await this.emsDb.ticketType.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!existingTicketType) {
      throw new NotFoundException(`Jenis tiket dengan ID ${id} tidak ditemukan`);
    }

    if (existingTicketType.event.organizerId !== organizer.id) {
      throw new ForbiddenException('Anda hanya dapat menghapus tiket dari event milik Anda');
    }

    if (existingTicketType.soldCount > 0) {
      throw new BadRequestException(
        'Tidak dapat menghapus jenis tiket yang sudah memiliki penjualan/terjual',
      );
    }

    await this.emsDb.ticketType.delete({
      where: { id },
    });

    return {
      message: 'Jenis tiket berhasil dihapus',
    };
  }
}
