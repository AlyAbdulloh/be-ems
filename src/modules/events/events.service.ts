import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { EmsPrismaService } from '../../prisma/ems-prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { UpdateEventStatusDto } from './dto/update-event-status.dto';
import { CreateSessionDto, UpdateSessionDto } from './dto/create-session.dto';
import { EventStatus, OrganizerStatus, Prisma } from '@internal/prisma/ems';

@Injectable()
export class EventsService {
  constructor(private readonly emsDb: EmsPrismaService) {}

  get eventModel() {
    return this.emsDb.event;
  }

  get organizerModel() {
    return this.emsDb.organizer;
  }

  private defaultSelect = {
    id: true,
    organizerId: true,
    venueId: true,
    categoryId: true,
    title: true,
    slug: true,
    description: true,
    bannerImage: true,
    startDatetime: true,
    endDatetime: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    organizer: {
      select: {
        id: true,
        organizationName: true,
        status: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    },
    venue: true,
    category: true,
    sessions: {
      select: {
        id: true,
        eventId: true,
        speakerId: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        roomOrTrack: true,
        speaker: {
          select: {
            id: true,
            name: true,
            bio: true,
            company: true,
            photo: true,
          },
        },
      },
      orderBy: { startTime: 'asc' as const },
    },
  };

  /**
   * Slug generator helper
   */
  private generateSlug(title: string): string {
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    return `${baseSlug}-${randomSuffix}`;
  }

  /**
   * Helper to ensure user is an APPROVED organizer
   */
  private async getApprovedOrganizer(userId: string) {
    const organizer = await this.organizerModel.findUnique({
      where: { userId },
    });

    if (!organizer || organizer.status !== OrganizerStatus.APPROVED) {
      throw new ForbiddenException(
        'Only registered and approved organizers can create or manage events',
      );
    }

    return organizer;
  }

  /**
   * Check venue booking availability for a date/time range
   */
  async checkVenueAvailabilityPublic(
    venueId: string,
    start: Date,
    end: Date,
    excludeEventId?: string,
  ) {
    const where: Prisma.EventWhereInput = {
      venueId,
      status: { not: EventStatus.CANCELLED },
      startDatetime: { lt: end },
      endDatetime: { gt: start },
    };

    if (excludeEventId) {
      where.id = { not: excludeEventId };
    }

    const overlappingEvent = await this.eventModel.findFirst({
      where,
      select: {
        id: true,
        title: true,
        startDatetime: true,
        endDatetime: true,
      },
    });

    if (overlappingEvent) {
      const startStr = overlappingEvent.startDatetime.toLocaleString('id-ID');
      const endStr = overlappingEvent.endDatetime.toLocaleString('id-ID');
      return {
        available: false,
        message: `Venue ini sudah dibooking untuk event "${overlappingEvent.title}" (${startStr} s/d ${endStr}). Silakan pilih venue atau rentang waktu lain.`,
        overlappingEvent,
      };
    }

    return {
      available: true,
      message: 'Venue tersedia untuk rentang waktu tersebut.',
    };
  }

  /**
   * Create a new event
   */
  async create(userId: string, createDto: CreateEventDto) {
    const organizer = await this.getApprovedOrganizer(userId);

    const startDate = new Date(createDto.startDatetime);
    const endDate = new Date(createDto.endDatetime);

    if (startDate >= endDate) {
      throw new BadRequestException(
        'Event start date/time must be earlier than end date/time',
      );
    }

    if (createDto.venueId) {
      const availability = await this.checkVenueAvailabilityPublic(
        createDto.venueId,
        startDate,
        endDate,
      );
      if (!availability.available) {
        throw new ConflictException(availability.message);
      }
    }

    let slug = this.generateSlug(createDto.title);
    let isSlugUnique = false;
    let attempts = 0;

    while (!isSlugUnique && attempts < 5) {
      const existing = await this.eventModel.findUnique({ where: { slug } });
      if (!existing) {
        isSlugUnique = true;
      } else {
        slug = this.generateSlug(createDto.title);
        attempts++;
      }
    }

    const event = await this.eventModel.create({
      data: {
        organizerId: organizer.id,
        categoryId: createDto.categoryId || null,
        venueId: createDto.venueId || null,
        title: createDto.title,
        slug,
        description: createDto.description,
        bannerImage: createDto.bannerImage,
        startDatetime: startDate,
        endDatetime: endDate,
        status: createDto.status || EventStatus.DRAFT,
      },
      select: this.defaultSelect,
    });

    return {
      message: 'Event created successfully',
      data: event,
    };
  }

  /**
   * Find events owned by logged-in organizer
   */
  async findMyEvents(userId: string, query: QueryEventDto) {
    const organizer = await this.getApprovedOrganizer(userId);

    const { page = 1, limit = 10, status, categoryId, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EventWhereInput = {
      organizerId: organizer.id,
    };

    if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.eventModel.count({ where }),
      this.eventModel.findMany({
        where,
        skip,
        take: limit,
        select: this.defaultSelect,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      message: 'Organizer events fetched successfully',
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Find public or all events with pagination
   */
  async findAll(query: QueryEventDto) {
    const { page = 1, limit = 10, status, categoryId, venueId, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EventWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (venueId) {
      where.venueId = venueId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.eventModel.count({ where }),
      this.eventModel.findMany({
        where,
        skip,
        take: limit,
        select: this.defaultSelect,
        orderBy: { startDatetime: 'asc' },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      message: 'Events fetched successfully',
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Find single event by ID
   */
  async findOne(id: string) {
    const event = await this.eventModel.findUnique({
      where: { id },
      select: this.defaultSelect,
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return {
      message: 'Event details fetched successfully',
      data: event,
    };
  }

  /**
   * Find single event by slug
   */
  async findBySlug(slug: string) {
    const event = await this.eventModel.findUnique({
      where: { slug },
      select: this.defaultSelect,
    });

    if (!event) {
      throw new NotFoundException(`Event with slug ${slug} not found`);
    }

    return {
      message: 'Event details fetched successfully',
      data: event,
    };
  }

  /**
   * Update event (Owner check)
   */
  async update(userId: string, id: string, updateDto: UpdateEventDto) {
    const organizer = await this.getApprovedOrganizer(userId);
    const existing = await this.findOne(id);

    if (existing.data.organizerId !== organizer.id) {
      throw new ForbiddenException('You can only modify events you own');
    }

    const dataToUpdate: Prisma.EventUpdateInput = {};

    if (updateDto.title) dataToUpdate.title = updateDto.title;
    if (updateDto.description !== undefined) dataToUpdate.description = updateDto.description;
    if (updateDto.bannerImage !== undefined) dataToUpdate.bannerImage = updateDto.bannerImage;
    if (updateDto.categoryId !== undefined) {
      dataToUpdate.category = updateDto.categoryId
        ? { connect: { id: updateDto.categoryId } }
        : { disconnect: true };
    }
    if (updateDto.venueId !== undefined) {
      dataToUpdate.venue = updateDto.venueId
        ? { connect: { id: updateDto.venueId } }
        : { disconnect: true };
    }
    if (updateDto.status) dataToUpdate.status = updateDto.status;

    const start = new Date(
      updateDto.startDatetime || existing.data.startDatetime,
    );
    const end = new Date(updateDto.endDatetime || existing.data.endDatetime);

    if (start >= end) {
      throw new BadRequestException(
        'Event start date/time must be earlier than end date/time',
      );
    }

    dataToUpdate.startDatetime = start;
    dataToUpdate.endDatetime = end;

    const targetVenueId = updateDto.venueId !== undefined ? updateDto.venueId : existing.data.venueId;
    if (targetVenueId) {
      const availability = await this.checkVenueAvailabilityPublic(
        targetVenueId,
        start,
        end,
        id,
      );
      if (!availability.available) {
        throw new ConflictException(availability.message);
      }
    }

    const updatedEvent = await this.eventModel.update({
      where: { id },
      data: dataToUpdate,
      select: this.defaultSelect,
    });

    return {
      message: 'Event updated successfully',
      data: updatedEvent,
    };
  }

  /**
   * Update event status (DRAFT, PUBLISHED, CANCELLED, COMPLETED)
   */
  async updateStatus(
    userId: string,
    id: string,
    updateStatusDto: UpdateEventStatusDto,
  ) {
    const organizer = await this.getApprovedOrganizer(userId);
    const existing = await this.findOne(id);

    if (existing.data.organizerId !== organizer.id) {
      throw new ForbiddenException('You can only modify events you own');
    }

    const updatedEvent = await this.eventModel.update({
      where: { id },
      data: {
        status: updateStatusDto.status,
      },
      select: this.defaultSelect,
    });

    return {
      message: `Event status successfully updated to ${updateStatusDto.status}`,
      data: updatedEvent,
    };
  }
}
