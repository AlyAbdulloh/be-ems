import { Injectable, NotFoundException } from '@nestjs/common';
import { EmsPrismaService } from '../../prisma/ems-prisma.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { QueryVenueDto } from './dto/query-venue.dto';
import { Prisma } from '@internal/prisma/ems';

@Injectable()
export class VenuesService {
  constructor(private readonly emsDb: EmsPrismaService) {}

  get venueModel() {
    return this.emsDb.venue;
  }

  async create(createDto: CreateVenueDto) {
    const venue = await this.venueModel.create({
      data: {
        name: createDto.name,
        address: createDto.address,
        city: createDto.city,
        capacity: createDto.capacity,
        latitude: createDto.latitude,
        longitude: createDto.longitude,
        type: createDto.type,
        meetingUrl: createDto.meetingUrl,
      },
    });

    return {
      message: 'Venue created successfully',
      data: venue,
    };
  }

  async findAll(query: QueryVenueDto) {
    const { page = 1, limit = 10, city, type, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.VenueWhereInput = {};

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.venueModel.count({ where }),
      this.venueModel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      message: 'Venues fetched successfully',
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findOne(id: string) {
    const venue = await this.venueModel.findUnique({
      where: { id },
    });

    if (!venue) {
      throw new NotFoundException(`Venue with ID ${id} not found`);
    }

    return {
      message: 'Venue fetched successfully',
      data: venue,
    };
  }

  async update(id: string, updateDto: UpdateVenueDto) {
    await this.findOne(id);

    const updatedVenue = await this.venueModel.update({
      where: { id },
      data: updateDto,
    });

    return {
      message: 'Venue updated successfully',
      data: updatedVenue,
    };
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.venueModel.delete({
      where: { id },
    });

    return {
      message: 'Venue deleted successfully',
    };
  }
}
