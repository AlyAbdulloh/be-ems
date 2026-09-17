import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { VenueType } from '@internal/prisma/ems';

export class CreateVenueDto {
  @ApiProperty({
    description: 'Name of the venue or location',
    example: 'Jakarta International Expo',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({
    description: 'Street address of the venue',
    example: 'Gedung Pusat Niaga Area JIEXPO Kemayoran',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'City of the venue',
    example: 'Jakarta Pusat',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'Maximum capacity of attendees',
    example: 5000,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({
    description: 'Latitude coordinate',
    example: -6.1481,
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinate',
    example: 106.8437,
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Venue type (OFFLINE, ONLINE, HYBRID)',
    enum: VenueType,
    default: VenueType.OFFLINE,
  })
  @IsOptional()
  @IsEnum(VenueType)
  type?: VenueType;

  @ApiPropertyOptional({
    description: 'Online meeting URL for ONLINE or HYBRID events',
    example: 'https://zoom.us/j/1234567890',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  meetingUrl?: string;
}
