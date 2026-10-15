import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { EventPricingType, EventStatus, VenueType } from '@internal/prisma/ems';

export class QueryEventDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: EventStatus })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({ enum: EventPricingType, description: 'Filter by pricing type (FREE or PAID)' })
  @IsOptional()
  @IsEnum(EventPricingType)
  pricingType?: EventPricingType;

  @ApiPropertyOptional({ enum: VenueType, description: 'Filter by venue mode (OFFLINE, ONLINE, HYBRID)' })
  @IsOptional()
  @IsEnum(VenueType)
  venueType?: VenueType;

  @ApiPropertyOptional({ description: 'Filter by city / location' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by venue ID' })
  @IsOptional()
  @IsUUID()
  venueId?: string;

  @ApiPropertyOptional({ description: 'Search title or description' })
  @IsOptional()
  @IsString()
  search?: string;
}
