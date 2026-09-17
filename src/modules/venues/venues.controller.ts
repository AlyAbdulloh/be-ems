import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { VenuesService } from './venues.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { QueryVenueDto } from './dto/query-venue.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '@internal/prisma/ems';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Venues')
@ApiBearerAuth()
@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Roles(RoleName.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new venue (Admin only)' })
  @ApiResponse({ status: 201, description: 'Venue created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required)' })
  async create(@Body() createDto: CreateVenueDto) {
    return this.venuesService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'List venues with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of venues' })
  async findAll(@Query() query: QueryVenueDto) {
    return this.venuesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get venue details by ID' })
  @ApiResponse({ status: 200, description: 'Venue details' })
  @ApiResponse({ status: 404, description: 'Venue not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.venuesService.findOne(id);
  }

  @Roles(RoleName.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update venue details (Admin only)' })
  @ApiResponse({ status: 200, description: 'Venue updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required)' })
  @ApiResponse({ status: 404, description: 'Venue not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateVenueDto,
  ) {
    return this.venuesService.update(id, updateDto);
  }

  @Roles(RoleName.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a venue (Admin only)' })
  @ApiResponse({ status: 200, description: 'Venue deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required)' })
  @ApiResponse({ status: 404, description: 'Venue not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.venuesService.remove(id);
  }
}

