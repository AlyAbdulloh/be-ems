import { Injectable, NotFoundException } from '@nestjs/common';
import { EmsPrismaService } from '../../prisma/ems-prisma.service';
import { CreateSpeakerDto, UpdateSpeakerDto } from './dto/create-speaker.dto';

@Injectable()
export class SpeakersService {
  constructor(private readonly emsDb: EmsPrismaService) {}

  get speakerModel() {
    return this.emsDb.speaker;
  }

  async findAll(search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    const items = await this.speakerModel.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return {
      message: 'Speakers fetched successfully',
      data: items,
    };
  }

  async findOne(id: string) {
    const speaker = await this.speakerModel.findUnique({
      where: { id },
    });

    if (!speaker) {
      throw new NotFoundException(`Speaker with ID ${id} not found`);
    }

    return {
      message: 'Speaker fetched successfully',
      data: speaker,
    };
  }

  async create(createDto: CreateSpeakerDto) {
    const speaker = await this.speakerModel.create({
      data: createDto,
    });

    return {
      message: 'Speaker created successfully',
      data: speaker,
    };
  }

  async update(id: string, updateDto: UpdateSpeakerDto) {
    await this.findOne(id);

    const updated = await this.speakerModel.update({
      where: { id },
      data: updateDto,
    });

    return {
      message: 'Speaker updated successfully',
      data: updated,
    };
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.speakerModel.delete({
      where: { id },
    });

    return {
      message: 'Speaker deleted successfully',
    };
  }
}
