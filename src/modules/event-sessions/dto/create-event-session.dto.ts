import { IsNotEmpty, IsOptional, IsString, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateEventSessionDto {
  @ApiProperty({ description: 'ID Event', example: 'uuid-event' })
  @IsNotEmpty()
  @IsUUID()
  eventId: string;

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

  @ApiPropertyOptional({ description: 'ID Speaker dari Master Data Speaker' })
  @IsOptional()
  @IsUUID()
  speakerId?: string;
}

export class UpdateEventSessionDto extends PartialType(CreateEventSessionDto) {}
