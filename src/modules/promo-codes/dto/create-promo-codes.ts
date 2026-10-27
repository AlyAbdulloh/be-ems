import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { DiscountType } from "@internal/prisma/ems";
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsNumber,
  IsUUID,
} from "class-validator";

export class CreatePromoCodeDto {
  @ApiProperty({ description: "ID Event", example: "uuid-event" })
  @IsNotEmpty()
  @IsUUID()
  eventId: string;

  @ApiProperty({
    description: "Code of the promo code",
    example: "CODE123",
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({
    description: "Type of the discount",
    enum: DiscountType,
    default: DiscountType.PERCENTAGE,
  })
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType = DiscountType.PERCENTAGE;

  @ApiProperty({
    description: "Discount value",
    example: 10,
  })
  @IsNotEmpty()
  @IsNumber()
  discountValue: number;

  @ApiPropertyOptional({
    description: "Valid from",
    example: "2026-12-31T23:59:59Z",
  })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({
    description: "Valid until",
    example: "2026-12-31T23:59:59Z",
  })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiProperty({
    description: "Maximum number of uses",
    example: 100,
  })
  @IsNotEmpty()
  @IsNumber()
  maxUsage: number;
}

export class UpdatePromoCodeDto extends PartialType(CreatePromoCodeDto) {}

export class CheckPromoCodeDto {
  @ApiProperty({ description: "Event ID", example: "uuid-event" })
  @IsNotEmpty()
  @IsUUID()
  eventId: string;

  @ApiProperty({ description: "Kode Promo", example: "CODE123" })
  @IsNotEmpty()
  @IsString()
  code: string;
}
