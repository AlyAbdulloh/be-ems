import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { OrganizersService } from './organizers.service';
import { ApplyOrganizerDto } from './dto/apply-organizer.dto';
import { UpdateOrganizerDto } from './dto/update-organizer.dto';
import { UpdateOrganizerStatusDto } from './dto/update-organizer-status.dto';
import { QueryOrganizerDto } from './dto/query-organizer.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '@internal/prisma/ems';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Organizers')
@ApiBearerAuth()
@Controller('organizers')
export class OrganizersController {
  constructor(private readonly organizersService: OrganizersService) {}

  @Post('apply')
  @ApiOperation({ summary: 'Apply to become an organizer' })
  @ApiResponse({
    status: 201,
    description: 'Organizer application submitted successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 409,
    description: 'User already has an organizer application or profile',
  })
  async apply(
    @CurrentUser() currentUser: any,
    @Body() applyDto: ApplyOrganizerDto,
  ) {
    return this.organizersService.apply(currentUser.sub, applyDto);
  }

  @Get('me')
  @ApiOperation({ summary: "Get current user's organizer profile" })
  @ApiResponse({ status: 200, description: 'Organizer profile fetched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Organizer profile not found' })
  async getProfile(@CurrentUser() currentUser: any) {
    return this.organizersService.getProfile(currentUser.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: "Update current user's organizer profile" })
  @ApiResponse({ status: 200, description: 'Organizer profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Organizer profile not found' })
  async updateProfile(
    @CurrentUser() currentUser: any,
    @Body() updateDto: UpdateOrganizerDto,
  ) {
    return this.organizersService.updateProfile(currentUser.sub, updateDto);
  }

  @Get()
  @ApiOperation({ summary: 'List organizers with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of organizers' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() query: QueryOrganizerDto) {
    return this.organizersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organizer details by ID' })
  @ApiResponse({ status: 200, description: 'Organizer details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Organizer not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizersService.findOne(id);
  }

  @Roles(RoleName.ADMIN)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update organizer application status (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Organizer status successfully updated',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required)' })
  @ApiResponse({ status: 404, description: 'Organizer not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateOrganizerStatusDto,
  ) {
    return this.organizersService.updateStatus(id, updateStatusDto);
  }
}
