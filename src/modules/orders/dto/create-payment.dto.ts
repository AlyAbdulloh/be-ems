import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsString } from "class-validator";

export const PAYMENT_METHODS = [
  "BANK_TRANSFER",
  "VIRTUAL_ACCOUNT",
  "EWALLET",
  "CREDIT_CARD",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export class CreatePaymentDto {
  @ApiProperty({
    description: "Metode pembayaran yang dipilih",
    enum: PAYMENT_METHODS,
    example: "BANK_TRANSFER",
  })
  @IsString()
  @IsNotEmpty({ message: "Metode pembayaran wajib diisi" })
  @IsIn(PAYMENT_METHODS, {
    message: "Metode pembayaran tidak valid",
  })
  paymentMethod: PaymentMethod;
}
