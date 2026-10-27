import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import type { Request } from "express";
import * as fs from "fs";
import { EventsService } from "./events.service";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";
import { QueryEventDto } from "./dto/query-event.dto";
import { UpdateEventStatusDto } from "./dto/update-event-status.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import type { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from "@nestjs/swagger";

interface UploadedFileInfo {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

type DestinationCallback = (error: Error | null, destination: string) => void;
type FilenameCallback = (error: Error | null, filename: string) => void;
type FileFilterCallback = (error: Error | null, acceptFile: boolean) => void;

const bannerMulterOptions = {
  storage: diskStorage({
    destination: (
      _req: Request,
      _file: UploadedFileInfo,
      cb: DestinationCallback,
    ) => {
      const uploadPath = "./uploads/events";
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (_req: Request, file: UploadedFileInfo, cb: FilenameCallback) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname).toLowerCase();
      cb(null, `banner-${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (
    _req: Request,
    file: UploadedFileInfo,
    cb: FileFilterCallback,
  ) => {
    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png"];
    const allowedExtensions = [".jpg", ".jpeg", ".png"];
    const ext = extname(file.originalname).toLowerCase();

    if (
      allowedMimeTypes.includes(file.mimetype) &&
      allowedExtensions.includes(ext)
    ) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException(
          "Format file tidak didukung! Ekstensi yang diperbolehkan: .jpg, .jpeg, atau .png (Maksimal 5MB).",
        ),
        false,
      );
    }
  },
};

@ApiTags("Events")
@ApiBearerAuth()
@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post("upload-banner")
  @UseInterceptors(FileInterceptor("bannerImage", bannerMulterOptions))
  @ApiOperation({
    summary: "Upload event banner image (Max 5MB, JPG/JPEG/PNG)",
  })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 201, description: "Banner uploaded successfully" })
  @ApiResponse({
    status: 400,
    description: "File validation failed or size exceeds 5MB",
  })
  uploadBanner(@UploadedFile() file?: UploadedFileInfo) {
    if (!file) {
      throw new BadRequestException("File banner gambar wajib diunggah");
    }
    const relativeUrl = `/uploads/events/${file.filename}`;
    return {
      message: "Banner berhasil diunggah",
      url: relativeUrl,
      filename: file.filename,
    };
  }

  @Get("check-venue-availability")
  @ApiOperation({
    summary: "Check if a venue is available for a given date/time range",
  })
  async checkVenueAvailability(
    @Query("venueId") venueId: string,
    @Query("startDatetime") startDatetime: string,
    @Query("endDatetime") endDatetime: string,
    @Query("excludeEventId") excludeEventId?: string,
  ) {
    if (!venueId || !startDatetime || !endDatetime) {
      throw new BadRequestException(
        "venueId, startDatetime, and endDatetime are required",
      );
    }

    const start = new Date(startDatetime);
    const end = new Date(endDatetime);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      throw new BadRequestException("Invalid date/time range");
    }

    return this.eventsService.checkVenueAvailabilityPublic(
      venueId,
      start,
      end,
      excludeEventId,
    );
  }

  @Post()
  @ApiOperation({ summary: "Create a new event (Approved Organizers only)" })
  @ApiResponse({ status: 201, description: "Event created successfully" })
  @ApiResponse({
    status: 400,
    description: "Validation failed or invalid dates",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden (Not an approved organizer)",
  })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createDto: CreateEventDto,
  ) {
    return this.eventsService.create(currentUser.sub, createDto);
  }

  @Get("my-events")
  @ApiOperation({ summary: "List logged-in organizer's own events" })
  @ApiResponse({ status: 200, description: "List of organizer events" })
  @ApiResponse({
    status: 403,
    description: "Forbidden (Not an approved organizer)",
  })
  async findMyEvents(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: QueryEventDto,
  ) {
    return this.eventsService.findMyEvents(currentUser.sub, query);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: "Get all public or filtered events" })
  @ApiResponse({ status: 200, description: "List of public events" })
  async findAll(@Query() query: QueryEventDto) {
    return this.eventsService.findAll(query);
  }

  @Public()
  @Get("slug/:slug")
  @ApiOperation({ summary: "Get event details by unique slug" })
  @ApiResponse({ status: 200, description: "Event details" })
  @ApiResponse({ status: 404, description: "Event not found" })
  async findBySlug(@Param("slug") slug: string) {
    return this.eventsService.findBySlug(slug);
  }

  @Public()
  @Get(":id")
  @ApiOperation({ summary: "Get event details by ID" })
  @ApiResponse({ status: 200, description: "Event details" })
  @ApiResponse({ status: 404, description: "Event not found" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update event details (Owner only)" })
  @ApiResponse({ status: 200, description: "Event updated successfully" })
  @ApiResponse({ status: 403, description: "Forbidden (Not owner of event)" })
  @ApiResponse({ status: 404, description: "Event not found" })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateEventDto,
  ) {
    return this.eventsService.update(currentUser.sub, id, updateDto);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Update event lifecycle status (Owner only)" })
  @ApiResponse({
    status: 200,
    description: "Event status updated successfully",
  })
  @ApiResponse({ status: 403, description: "Forbidden (Not owner of event)" })
  @ApiResponse({ status: 404, description: "Event not found" })
  async updateStatus(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateEventStatusDto,
  ) {
    return this.eventsService.updateStatus(
      currentUser.sub,
      id,
      updateStatusDto,
    );
  }
}
