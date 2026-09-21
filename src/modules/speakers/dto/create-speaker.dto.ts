import { IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateSpeakerDto {
  @ApiProperty({ description: 'Nama Pembicara / Speaker', example: 'Dr. Budi Santoso' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Bio atau Deskripsi Singkat Pembicara' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'Perusahaan atau Institusi Pembicara', example: 'Tech Corp' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  company?: string;

  @ApiPropertyOptional({ description: 'Foto URL Pembicara' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  photo?: string;
}

export class UpdateSpeakerDto extends PartialType(CreateSpeakerDto) {}
