import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EmsPrismaService } from '../../prisma/ems-prisma.service';
import { CreateEventSessionDto, UpdateEventSessionDto } from './dto/create-event-session.dto';
import { OrganizerStatus } from '@internal/prisma/ems';

@Injectable()
export class EventSessionsService {
  constructor(private readonly emsDb: EmsPrismaService) {}

  private async getApprovedOrganizer(userId: string) {
    const organizer = await this.emsDb.organizer.findUnique({
      where: { userId },
    });

    if (!organizer || organizer.status !== OrganizerStatus.APPROVED) {
      throw new ForbiddenException(
        'Only registered and approved organizers can manage event sessions',
      );
    }

    return organizer;
  }

  private defaultSessionSelect = {
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
  };

  async findByEventId(eventId: string) {
    const sessions = await this.emsDb.eventSession.findMany({
      where: { eventId },
      select: this.defaultSessionSelect,
      orderBy: { startTime: 'asc' },
    });

    return {
      message: 'Event sessions fetched successfully',
      data: sessions,
    };
  }

  async findOne(id: string) {
    const session = await this.emsDb.eventSession.findUnique({
      where: { id },
      select: this.defaultSessionSelect,
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    return {
      message: 'Session fetched successfully',
      data: session,
    };
  }

  async create(userId: string, createDto: CreateEventSessionDto) {
    const organizer = await this.getApprovedOrganizer(userId);
    const existingEvent = await this.emsDb.event.findUnique({
      where: { id: createDto.eventId },
    });

    if (!existingEvent) {
      throw new NotFoundException(`Event with ID ${createDto.eventId} not found`);
    }

    if (existingEvent.organizerId !== organizer.id) {
      throw new ForbiddenException('You can only add sessions to events you own');
    }

    const startTime = new Date(createDto.startTime);
    const endTime = new Date(createDto.endTime);

    if (startTime >= endTime) {
      throw new BadRequestException('Session start time must be earlier than end time');
    }

    if (createDto.speakerId) {
      const existingSpeaker = await this.emsDb.speaker.findUnique({
        where: { id: createDto.speakerId },
      });
      if (!existingSpeaker) {
        throw new NotFoundException(`Speaker with ID ${createDto.speakerId} not found`);
      }
    }

    const session = await this.emsDb.eventSession.create({
      data: {
        eventId: createDto.eventId,
        title: createDto.title,
        description: createDto.description || null,
        startTime,
        endTime,
        roomOrTrack: createDto.roomOrTrack || null,
        speakerId: createDto.speakerId || null,
      },
      select: this.defaultSessionSelect,
    });

    return {
      message: 'Sesi event berhasil ditambahkan',
      data: session,
    };
  }

  async update(userId: string, id: string, updateDto: UpdateEventSessionDto) {
    const organizer = await this.getApprovedOrganizer(userId);

    const existingSession = await this.emsDb.eventSession.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!existingSession) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    if (existingSession.event.organizerId !== organizer.id) {
      throw new ForbiddenException('You can only update sessions of events you own');
    }

    const startTime = updateDto.startTime
      ? new Date(updateDto.startTime)
      : existingSession.startTime;
    const endTime = updateDto.endTime
      ? new Date(updateDto.endTime)
      : existingSession.endTime;

    if (startTime >= endTime) {
      throw new BadRequestException('Session start time must be earlier than end time');
    }

    if (updateDto.speakerId) {
      const existingSpeaker = await this.emsDb.speaker.findUnique({
        where: { id: updateDto.speakerId },
      });
      if (!existingSpeaker) {
        throw new NotFoundException(`Speaker with ID ${updateDto.speakerId} not found`);
      }
    }

    const updatedSession = await this.emsDb.eventSession.update({
      where: { id },
      data: {
        title: updateDto.title !== undefined ? updateDto.title : existingSession.title,
        description: updateDto.description !== undefined ? updateDto.description : existingSession.description,
        startTime,
        endTime,
        roomOrTrack: updateDto.roomOrTrack !== undefined ? updateDto.roomOrTrack : existingSession.roomOrTrack,
        speakerId: updateDto.speakerId !== undefined ? updateDto.speakerId : existingSession.speakerId,
      },
      select: this.defaultSessionSelect,
    });

    return {
      message: 'Sesi event berhasil diperbarui',
      data: updatedSession,
    };
  }

  async remove(userId: string, id: string) {
    const organizer = await this.getApprovedOrganizer(userId);

    const existingSession = await this.emsDb.eventSession.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!existingSession) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    if (existingSession.event.organizerId !== organizer.id) {
      throw new ForbiddenException('You can only delete sessions of events you own');
    }

    await this.emsDb.eventSession.delete({
      where: { id },
    });

    return {
      message: 'Sesi event berhasil dihapus',
    };
  }
}
