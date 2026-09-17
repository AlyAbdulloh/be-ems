import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { EventCategoriesService } from './event-categories.service';
import { CreateEventCategoryDto } from './dto/create-event-category.dto';
import { UpdateEventCategoryDto } from './dto/update-event-category.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '@internal/prisma/ems';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Event Categories')
@ApiBearerAuth()
@Controller('event-categories')
export class EventCategoriesController {
  constructor(
    private readonly eventCategoriesService: EventCategoriesService,
  ) {}

  @Roles(RoleName.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new event category (Admin only)' })
  @ApiResponse({ status: 201, description: 'Event category created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required)' })
  @ApiResponse({ status: 409, description: 'Category name already exists' })
  async create(@Body() createDto: CreateEventCategoryDto) {
    return this.eventCategoriesService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all event categories' })
  @ApiResponse({ status: 200, description: 'List of event categories' })
  async findAll() {
    return this.eventCategoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event category by ID' })
  @ApiResponse({ status: 200, description: 'Event category details' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventCategoriesService.findOne(id);
  }

  @Roles(RoleName.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update event category (Admin only)' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required)' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateEventCategoryDto,
  ) {
    return this.eventCategoriesService.update(id, updateDto);
  }

  @Roles(RoleName.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete event category (Admin only)' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required)' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventCategoriesService.remove(id);
  }
}

