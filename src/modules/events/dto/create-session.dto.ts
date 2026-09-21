import { IsNotEmpty, IsOptional, IsString, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({ description: 'Judul Sesi Event', example: 'Keynote Speech: Tech Future' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Deskripsi Sesi Event' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Waktu Mulai Sesi (ISO String)', example: '2026-09-25T09:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  startTime: string;

  @ApiProperty({ description: 'Waktu Selesai Sesi (ISO String)', example: '2026-09-25T10:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ description: 'Ruangan atau Track Sesi', example: 'Main Hall / Track A' })
  @IsOptional()
  @IsString()
  roomOrTrack?: string;

  @ApiPropertyOptional({ description: 'Nama Pembicara' })
  @IsOptional()
  @IsString()
  speakerName?: string;

  @ApiPropertyOptional({ description: 'Bio Pembicara' })
  @IsOptional()
  @IsString()
  speakerBio?: string;

  @ApiPropertyOptional({ description: 'Perusahaan/Organisasi Pembicara' })
  @IsOptional()
  @IsString()
  speakerCompany?: string;

  @ApiPropertyOptional({ description: 'ID Speaker jika sudah ada di database' })
  @IsOptional()
  @IsUUID()
  speakerId?: string;
}

export class UpdateSessionDto extends PartialType(CreateSessionDto) {}
