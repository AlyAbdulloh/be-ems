import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsInt,
  Min,
  IsDateString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateTicketTypeDto {
  @ApiProperty({ description: 'ID Event', example: 'uuid-event' })
  @IsNotEmpty()
  @IsUUID()
  eventId: string;

  @ApiProperty({ description: 'Nama Jenis Tiket', example: 'Early Bird / Regular / VIP' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Harga Tiket (0 jika gratis)', example: 150000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiProperty({ description: 'Kuota Tiket', example: 100 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quota: number;

  @ApiPropertyOptional({
    description: 'Tanggal Mulai Penjualan (ISO String)',
    example: '2026-09-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  saleStartDate?: string;

  @ApiPropertyOptional({
    description: 'Tanggal Selesai Penjualan (ISO String)',
    example: '2026-09-20T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  saleEndDate?: string;
}

export class UpdateTicketTypeDto extends PartialType(CreateTicketTypeDto) {}
