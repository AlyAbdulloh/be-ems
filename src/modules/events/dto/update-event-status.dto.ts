import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { EventStatus } from '@internal/prisma/ems';

export class UpdateEventStatusDto {
  @ApiProperty({
    description: 'Target lifecycle status for the event',
    enum: EventStatus,
    example: EventStatus.PUBLISHED,
  })
  @IsNotEmpty()
  @IsEnum(EventStatus)
  status: EventStatus;
}
