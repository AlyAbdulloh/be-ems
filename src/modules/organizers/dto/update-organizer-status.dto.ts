import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrganizerStatus } from '@internal/prisma/ems';

export class UpdateOrganizerStatusDto {
  @ApiProperty({
    description: 'Status of the organizer application/profile',
    enum: OrganizerStatus,
    example: OrganizerStatus.APPROVED,
  })
  @IsNotEmpty({ message: 'Status is required' })
  @IsEnum(OrganizerStatus, {
    message: `Status must be one of: ${Object.values(OrganizerStatus).join(', ')}`,
  })
  status: OrganizerStatus;
}
