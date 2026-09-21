import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SpeakersService } from './speakers.service';
import { CreateSpeakerDto, UpdateSpeakerDto } from './dto/create-speaker.dto';

@ApiTags('Speakers')
@ApiBearerAuth()
@Controller('speakers')
export class SpeakersController {
  constructor(private readonly speakersService: SpeakersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all master speakers' })
  @ApiResponse({ status: 200, description: 'List of speakers' })
  async findAll(@Query('search') search?: string) {
    return this.speakersService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get speaker detail by ID' })
  @ApiResponse({ status: 200, description: 'Speaker details' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.speakersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new speaker' })
  @ApiResponse({ status: 201, description: 'Speaker created successfully' })
  async create(@Body() createDto: CreateSpeakerDto) {
    return this.speakersService.create(createDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update speaker by ID' })
  @ApiResponse({ status: 200, description: 'Speaker updated successfully' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateSpeakerDto,
  ) {
    return this.speakersService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete speaker by ID' })
  @ApiResponse({ status: 200, description: 'Speaker deleted successfully' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.speakersService.remove(id);
  }
}
