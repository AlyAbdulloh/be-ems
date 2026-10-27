import { ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { CreateEventRegistrationDto } from "./create-event-registration.dto";
import { IsEnum, IsOptional } from "class-validator";
import { RegistrationStatus } from "@internal/prisma/ems";

export class UpdateEventRegistrationDto extends PartialType(
  CreateEventRegistrationDto,
) {
  @ApiPropertyOptional({
    description: "Status pendaftaran event terbaru",
    enum: RegistrationStatus,
    example: RegistrationStatus.CONFIRMED,
  })
  @IsOptional()
  @IsEnum(RegistrationStatus)
  status?: RegistrationStatus;
}
