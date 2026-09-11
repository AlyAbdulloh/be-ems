import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateOrganizerDto {
  @ApiPropertyOptional({
    description: 'Updated name of the organization',
    example: 'Tech Community Indonesia Updated',
    maxLength: 150,
  })
  @IsOptional()
  @IsString({ message: 'Organization name must be a string' })
  @MaxLength(150, { message: 'Organization name cannot exceed 150 characters' })
  organizationName?: string;

  @ApiPropertyOptional({
    description: 'Updated description of the organization',
    example: 'Updated description of our tech community.',
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;
}
