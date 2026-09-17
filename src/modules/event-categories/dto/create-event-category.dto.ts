import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateEventCategoryDto {
  @ApiProperty({
    description: 'Name of the event category',
    example: 'Music & Concerts',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;
}
