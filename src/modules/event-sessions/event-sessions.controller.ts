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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EventSessionsService } from './event-sessions.service';
import { CreateEventSessionDto, UpdateEventSessionDto } from './dto/create-event-session.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Event Sessions')
@ApiBearerAuth()
@Controller('event-sessions')
export class EventSessionsController {
  constructor(private readonly eventSessionsService: EventSessionsService) {}

  @Get('event/:eventId')
  @ApiOperation({ summary: 'Get all sessions for a specific event' })
  @ApiResponse({ status: 200, description: 'List of event sessions' })
  async findByEventId(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.eventSessionsService.findByEventId(eventId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event session detail by ID' })
  @ApiResponse({ status: 200, description: 'Event session detail' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventSessionsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new session for an event (Owner only)' })
  @ApiResponse({ status: 201, description: 'Event session created successfully' })
  async create(
    @CurrentUser() currentUser: any,
    @Body() createDto: CreateEventSessionDto,
  ) {
    return this.eventSessionsService.create(currentUser.sub, createDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an event session by ID (Owner only)' })
  @ApiResponse({ status: 200, description: 'Event session updated successfully' })
  async update(
    @CurrentUser() currentUser: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateEventSessionDto,
  ) {
    return this.eventSessionsService.update(currentUser.sub, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an event session by ID (Owner only)' })
  @ApiResponse({ status: 200, description: 'Event session deleted successfully' })
  async remove(
    @CurrentUser() currentUser: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.eventSessionsService.remove(currentUser.sub, id);
  }
}
