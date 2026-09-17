import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EmsPrismaService } from '../../prisma/ems-prisma.service';
import { ApplyOrganizerDto } from './dto/apply-organizer.dto';
import { UpdateOrganizerDto } from './dto/update-organizer.dto';
import { UpdateOrganizerStatusDto } from './dto/update-organizer-status.dto';
import { QueryOrganizerDto } from './dto/query-organizer.dto';
import { OrganizerStatus, Prisma } from '@internal/prisma/ems';

@Injectable()
export class OrganizersService {
  constructor(private readonly emsDb: EmsPrismaService) {}

  get organizerModel() {
    return this.emsDb.organizer;
  }

  private defaultSelect = {
    id: true,
    userId: true,
    organizationName: true,
    description: true,
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
  };

  /**
   * User applies to become an organizer
   */
  async apply(userId: string, applyDto: ApplyOrganizerDto) {
    const adminRole = await this.emsDb.userRole.findFirst({
      where: {
        userId,
        role: { name: 'ADMIN' },
      },
    });

    if (adminRole) {
      throw new ForbiddenException('Admins cannot apply to become an organizer');
    }

    const existingOrganizer = await this.organizerModel.findUnique({
      where: { userId },
    });

    if (existingOrganizer) {
      if (existingOrganizer.status === OrganizerStatus.PENDING) {
        throw new ConflictException(
          'You already have a pending organizer registration application',
        );
      }
      if (existingOrganizer.status === OrganizerStatus.APPROVED) {
        throw new ConflictException(
          'You are already registered and approved as an organizer',
        );
      }
      throw new ConflictException(
        `Organizer application exists with status: ${existingOrganizer.status}`,
      );
    }

    const organizer = await this.organizerModel.create({
      data: {
        userId,
        organizationName: applyDto.organizationName,
        description: applyDto.description,
        status: OrganizerStatus.PENDING,
      },
      select: this.defaultSelect,
    });

    return {
      message: 'Organizer application submitted successfully',
      data: organizer,
    };
  }

  /**
   * Get logged-in user's organizer profile
   */
  async getProfile(userId: string) {
    const organizer = await this.organizerModel.findUnique({
      where: { userId },
      select: this.defaultSelect,
    });

    if (!organizer) {
      throw new NotFoundException('Organizer profile not found for this user');
    }

    return {
      message: 'Organizer profile fetched successfully',
      data: organizer,
    };
  }

  /**
   * Update logged-in user's organizer profile
   */
  async updateProfile(userId: string, updateDto: UpdateOrganizerDto) {
    await this.getProfile(userId);

    const dataToUpdate: Prisma.OrganizerUpdateInput = {};
    if (updateDto.organizationName !== undefined) {
      dataToUpdate.organizationName = updateDto.organizationName;
    }
    if (updateDto.description !== undefined) {
      dataToUpdate.description = updateDto.description;
    }

    const updatedOrganizer = await this.organizerModel.update({
      where: { userId },
      data: dataToUpdate,
      select: this.defaultSelect,
    });

    return {
      message: 'Organizer profile updated successfully',
      data: updatedOrganizer,
    };
  }

  /**
   * Find list of organizers with pagination and optional filtering
   */
  async findAll(query: QueryOrganizerDto) {
    const { page = 1, limit = 10, status, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OrganizerWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { organizationName: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, items] = await Promise.all([
      this.organizerModel.count({ where }),
      this.organizerModel.findMany({
        where,
        skip,
        take: limit,
        select: this.defaultSelect,
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      message: 'Organizers fetched successfully',
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
   * Find an organizer by ID
   */
  async findOne(id: string) {
    const organizer = await this.organizerModel.findUnique({
      where: { id },
      select: this.defaultSelect,
    });

    if (!organizer) {
      throw new NotFoundException(`Organizer with ID ${id} not found`);
    }

    return {
      message: 'Organizer fetched successfully',
      data: organizer,
    };
  }

  /**
   * Admin approves, rejects, or suspends an organizer application
   */
  async updateStatus(id: string, updateStatusDto: UpdateOrganizerStatusDto) {
    await this.findOne(id);

    const updatedOrganizer = await this.organizerModel.update({
      where: { id },
      data: {
        status: updateStatusDto.status,
      },
      select: this.defaultSelect,
    });

    return {
      message: `Organizer status successfully updated to ${updateStatusDto.status}`,
      data: updatedOrganizer,
    };
  }
}
