import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import {
  RegistrationStatus,
  EventPricingType,
  DiscountType,
} from "@internal/prisma/ems";

export class TicketAttendeeDto {
  @ApiProperty({
    description: "Nama lengkap peserta tiket",
    example: "Budi Santoso",
  })
  @IsNotEmpty()
  @IsString()
  attendeeName: string;

  @ApiProperty({
    description: "Email peserta tiket",
    example: "budi@gmail.com",
  })
  @IsNotEmpty()
  @IsEmail()
  attendeeEmail: string;
}

export class RegistrationTicketItemDto {
  @ApiProperty({
    description: "ID Ticket Type",
    example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  })
  @IsNotEmpty()
  @IsUUID()
  ticketTypeId: string;

  @ApiProperty({
    description: "Nama lengkap peserta tiket",
    example: "Budi Santoso",
  })
  @IsNotEmpty()
  @IsString()
  attendeeName: string;

  @ApiProperty({
    description: "Email peserta tiket",
    example: "budi@gmail.com",
  })
  @IsNotEmpty()
  @IsEmail()
  attendeeEmail: string;
}

export class OrderItemRegistrationDto {
  @ApiProperty({
    description: "ID Ticket Type",
    example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  })
  @IsNotEmpty()
  @IsUUID()
  ticketTypeId: string;

  @ApiProperty({
    description: "Jumlah tiket yang dipesan",
    example: 2,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    description: "Daftar data peserta untuk tiket ini",
    type: [TicketAttendeeDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TicketAttendeeDto)
  tickets?: TicketAttendeeDto[];
}

export class PromoCodeDataDto {
  @ApiProperty({
    description: "ID Promo Code",
    example: "8f3b2e1a-4c5d-6e7f-8a9b-0c1d2e3f4a5b",
  })
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @ApiProperty({
    description: "Kode promo",
    example: "HEMAT20",
  })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiPropertyOptional({
    description: "Tipe diskon",
    enum: DiscountType,
    example: DiscountType.PERCENTAGE,
  })
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @ApiPropertyOptional({
    description: "Nilai diskon promo",
    example: 20,
  })
  @IsOptional()
  @IsNumber()
  discountValue?: number;
}

export class CreateEventRegistrationDto {
  @ApiProperty({
    description: "ID Event yang ingin didaftarkan",
    example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  })
  @IsNotEmpty()
  @IsUUID()
  eventId: string;

  @ApiPropertyOptional({
    description: "Tipe harga event (FREE / PAID)",
    enum: EventPricingType,
    example: EventPricingType.PAID,
  })
  @IsOptional()
  @IsEnum(EventPricingType)
  pricingType?: EventPricingType;

  @ApiPropertyOptional({
    description: "Objek data promo code yang digunakan",
    type: PromoCodeDataDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PromoCodeDataDto)
  promoCode?: PromoCodeDataDto | null;

  @ApiPropertyOptional({
    description: "Total pembayaran akhir setelah diskon promo",
    example: 120000,
  })
  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @ApiPropertyOptional({
    description: "Item tiket berbayar yang dipesan (kelompok per ticketTypeId)",
    type: [OrderItemRegistrationDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemRegistrationDto)
  items?: OrderItemRegistrationDto[];

  @ApiPropertyOptional({
    description: "Daftar tiket peserta format flat array",
    type: [RegistrationTicketItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegistrationTicketItemDto)
  tickets?: RegistrationTicketItemDto[];

  @ApiPropertyOptional({
    description: "Daftar data peserta untuk event gratis",
    type: [TicketAttendeeDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TicketAttendeeDto)
  attendees?: TicketAttendeeDto[];

  @ApiPropertyOptional({
    description: "Status pendaftaran event",
    enum: RegistrationStatus,
    default: RegistrationStatus.PENDING,
    example: RegistrationStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(RegistrationStatus)
  status?: RegistrationStatus;
}
