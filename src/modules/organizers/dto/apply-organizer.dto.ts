import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ApplyOrganizerDto {
  @ApiProperty({
    description: 'Name of the organization',
    example: 'Tech Community Indonesia',
    maxLength: 150,
  })
  @IsNotEmpty({ message: 'Organization name is required' })
  @IsString({ message: 'Organization name must be a string' })
  @MaxLength(150, { message: 'Organization name cannot exceed 150 characters' })
  organizationName: string;

  @ApiPropertyOptional({
    description: 'Description or bio of the organization',
    example: 'A community dedicated to technology meetups and conferences.',
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;
}
