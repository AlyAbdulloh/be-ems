import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";
import { EventPricingType, EventStatus, EventType } from "@internal/prisma/ems";

export class CreateEventDto {
  @ApiProperty({
    description: "Title of the event",
    example: "NestJS & Cloud Architecture Summit 2026",
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    description: "Description of the event",
    example: "Annual conference covering backend scalable microservices.",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: "ID of the event category",
    example: "439f0d14-3a5c-4d83-bb37-a1f9e2b1093a",
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: "ID of the event venue",
    example: "18b2c451-9e7f-4702-8501-18e390c5c490",
  })
  @IsOptional()
  @IsUUID()
  venueId?: string;

  @ApiPropertyOptional({
    description: "URL of the banner image",
    example: "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bannerImage?: string;

  @ApiProperty({
    description: "Event start date and time",
    example: "2026-10-15T09:00:00Z",
  })
  @IsNotEmpty()
  @IsDateString()
  startDatetime: string;

  @ApiProperty({
    description: "Event end date and time",
    example: "2026-10-15T17:00:00Z",
  })
  @IsNotEmpty()
  @IsDateString()
  endDatetime: string;

  @ApiPropertyOptional({
    description: "Initial lifecycle status of the event",
    enum: EventStatus,
    default: EventStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus = EventStatus.DRAFT;

  @ApiPropertyOptional({
    description: "Pricing type of the event (FREE or PAID)",
    enum: EventPricingType,
    default: EventPricingType.FREE,
  })
  @IsOptional()
  @IsEnum(EventPricingType)
  pricingType?: EventPricingType = EventPricingType.FREE;

  @ApiPropertyOptional({
    description: "Type of event (OFFLINE, ONLINE, HYBRID)",
    enum: EventType,
    default: EventType.OFFLINE,
  })
  @IsOptional()
  @IsEnum(EventType)
  eventType?: EventType = EventType.OFFLINE;

  @ApiPropertyOptional({
    description:
      "Meeting URL for ONLINE or HYBRID events (Zoom, Google Meet, etc.)",
    example: "https://meet.google.com/abc-defg-hij",
  })
  @IsOptional()
  @IsString()
  meetingUrl?: string;
}
