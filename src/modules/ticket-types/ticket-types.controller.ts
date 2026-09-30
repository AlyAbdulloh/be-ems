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
import { TicketTypesService } from './ticket-types.service';
import { CreateTicketTypeDto, UpdateTicketTypeDto } from './dto/create-ticket-type.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Ticket Types')
@ApiBearerAuth()
@Controller('ticket-types')
export class TicketTypesController {
  constructor(private readonly ticketTypesService: TicketTypesService) {}

  @Get('event/:eventId')
  @ApiOperation({ summary: 'Get all ticket types for a specific event' })
  @ApiResponse({ status: 200, description: 'List of ticket types' })
  async findByEventId(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.ticketTypesService.findByEventId(eventId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket type detail by ID' })
  @ApiResponse({ status: 200, description: 'Ticket type detail' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketTypesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new ticket type for an event (Owner only)' })
  @ApiResponse({ status: 201, description: 'Ticket type created successfully' })
  async create(
    @CurrentUser() currentUser: any,
    @Body() createDto: CreateTicketTypeDto,
  ) {
    return this.ticketTypesService.create(currentUser.sub, createDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a ticket type by ID (Owner only)' })
  @ApiResponse({ status: 200, description: 'Ticket type updated successfully' })
  async update(
    @CurrentUser() currentUser: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateTicketTypeDto,
  ) {
    return this.ticketTypesService.update(currentUser.sub, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a ticket type by ID (Owner only)' })
  @ApiResponse({ status: 200, description: 'Ticket type deleted successfully' })
  async remove(
    @CurrentUser() currentUser: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ticketTypesService.remove(currentUser.sub, id);
  }
}
