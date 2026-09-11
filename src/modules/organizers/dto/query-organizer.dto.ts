import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { OrganizerStatus } from '@internal/prisma/ems';

export class QueryOrganizerDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by organizer verification status',
    enum: OrganizerStatus,
  })
  @IsOptional()
  @IsEnum(OrganizerStatus)
  status?: OrganizerStatus;

  @ApiPropertyOptional({
    description: 'Search string for organization name',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
