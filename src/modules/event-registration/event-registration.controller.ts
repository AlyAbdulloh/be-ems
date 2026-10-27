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
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { RoleName } from "@internal/prisma/ems";
import { EventRegistrationService } from "./event-registration.service";
import {
  CreateEventRegistrationDto,
  UpdateEventRegistrationDto,
  QueryEventRegistrationDto,
} from "./dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";

@ApiTags("Event Registrations")
@ApiBearerAuth()
@Controller("event-registrations")
export class EventRegistrationController {
  constructor(
    private readonly eventRegistrationService: EventRegistrationService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Register current user for an event" })
  @ApiResponse({
    status: 201,
    description: "Successfully registered for event",
  })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createDto: CreateEventRegistrationDto,
  ) {
    return this.eventRegistrationService.create(currentUser.sub, createDto);
  }

  @Roles(RoleName.ADMIN)
  @Get()
  @ApiOperation({ summary: "List all event registrations (Admin only)" })
  @ApiResponse({ status: 200, description: "List of registrations" })
  async findAll(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: QueryEventRegistrationDto,
  ) {
    return this.eventRegistrationService.findAll(currentUser, query);
  }

  @Get("my")
  @ApiOperation({
    summary: "Get all event registrations for the logged in user",
  })
  @ApiResponse({ status: 200, description: "List of user registrations" })
  async findMyRegistrations(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: QueryEventRegistrationDto,
  ) {
    return this.eventRegistrationService.findMyRegistrations(
      currentUser,
      query,
    );
  }

  @Get("event/:eventId")
  @ApiOperation({ summary: "Get all registrations for a specific event" })
  @ApiResponse({ status: 200, description: "List of event registrations" })
  async findByEventId(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param("eventId", ParseUUIDPipe) eventId: string,
    @Query() query: QueryEventRegistrationDto,
  ) {
    return this.eventRegistrationService.findByEventId(
      currentUser,
      eventId,
      query,
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get event registration detail by ID" })
  @ApiResponse({ status: 200, description: "Event registration detail" })
  async findOne(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.eventRegistrationService.findOne(currentUser, id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update event registration status by ID" })
  @ApiResponse({
    status: 200,
    description: "Event registration updated successfully",
  })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateEventRegistrationDto,
  ) {
    return this.eventRegistrationService.update(currentUser, id, updateDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Cancel/Delete event registration by ID" })
  @ApiResponse({
    status: 200,
    description: "Event registration cancelled successfully",
  })
  async remove(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.eventRegistrationService.remove(currentUser, id);
  }
}
