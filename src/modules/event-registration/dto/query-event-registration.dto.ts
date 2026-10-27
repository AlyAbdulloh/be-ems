import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from "class-validator";
import { Type } from "class-transformer";
import { RegistrationStatus } from "@internal/prisma/ems";

export class QueryEventRegistrationDto {
  @ApiPropertyOptional({
    description: "Filter berdasarkan Event ID",
    example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  })
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @ApiPropertyOptional({
    description: "Filter berdasarkan Status Pendaftaran",
    enum: RegistrationStatus,
    example: RegistrationStatus.CONFIRMED,
  })
  @IsOptional()
  @IsEnum(RegistrationStatus)
  status?: RegistrationStatus;

  @ApiPropertyOptional({
    description: "Nomor halaman (page)",
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Jumlah data per halaman (limit)",
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
