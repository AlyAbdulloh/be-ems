import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EmsPrismaService } from '../../prisma/ems-prisma.service';
import { CreateEventCategoryDto } from './dto/create-event-category.dto';
import { UpdateEventCategoryDto } from './dto/update-event-category.dto';

@Injectable()
export class EventCategoriesService {
  constructor(private readonly emsDb: EmsPrismaService) {}

  get categoryModel() {
    return this.emsDb.eventCategory;
  }

  async create(createDto: CreateEventCategoryDto) {
    const existing = await this.categoryModel.findUnique({
      where: { name: createDto.name },
    });

    if (existing) {
      throw new ConflictException(
        `Category with name '${createDto.name}' already exists`,
      );
    }

    const category = await this.categoryModel.create({
      data: {
        name: createDto.name,
      },
    });

    return {
      message: 'Event category created successfully',
      data: category,
    };
  }

  async findAll() {
    const categories = await this.categoryModel.findMany({
      orderBy: { name: 'asc' },
    });

    return {
      message: 'Event categories fetched successfully',
      data: categories,
    };
  }

  async findOne(id: string) {
    const category = await this.categoryModel.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Event category with ID ${id} not found`);
    }

    return {
      message: 'Event category fetched successfully',
      data: category,
    };
  }

  async update(id: string, updateDto: UpdateEventCategoryDto) {
    await this.findOne(id);

    if (updateDto.name) {
      const existing = await this.categoryModel.findUnique({
        where: { name: updateDto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Category with name '${updateDto.name}' already exists`,
        );
      }
    }

    const updatedCategory = await this.categoryModel.update({
      where: { id },
      data: updateDto,
    });

    return {
      message: 'Event category updated successfully',
      data: updatedCategory,
    };
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.categoryModel.delete({
      where: { id },
    });

    return {
      message: 'Event category deleted successfully',
    };
  }
}
