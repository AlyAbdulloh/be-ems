import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus
} from '@nestjs/common';
import { PromoCodesService } from './promo-codes.service';
import { CheckPromoCodeDto, CreatePromoCodeDto, UpdatePromoCodeDto } from './dto/create-promo-codes';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiParam } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Promo Codes')
@ApiBearerAuth()
@Controller('promo-codes')
export class PromoCodesController {
    constructor(private readonly promoCodesService: PromoCodesService) { }

    @Roles('ORGANIZER')
    @Post()
    @ApiOperation({
        summary: 'Create a new promo code (Organizer only)',
        description: 'Endpoint untuk membuat promo code baru. Membutuhkan role **ORGANIZER**.'
    })
    @ApiResponse({ status: 201, description: 'Promo code created successfully' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Token tidak ditemukan atau kedaluwarsa' })
    @ApiForbiddenResponse({ description: 'Forbidden - User bukan ORGANIZER' })
    create(@Body() createDto: CreatePromoCodeDto) {
        return this.promoCodesService.create(createDto);
    }

    @Get('event/:eventId')
    @ApiParam({
        name: 'eventId',
        description: 'ID of the event',
        type: 'string',
        format: 'uuid',
        example: '439f0d14-3a5c-4d83-bb37-a1f9e2b1093a',
    })
    @ApiOperation({
        summary: 'Get all promo codes for a specific event (Organizer only)',
        description: 'Endpoint untuk mendapatkan semua promo code untuk event tertentu. Membutuhkan role **ORGANIZER**.'
    })
    @ApiResponse({ status: 200, description: 'List of promo codes' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Token tidak ditemukan atau kedaluwarsa' })
    @ApiForbiddenResponse({ description: 'Forbidden - User bukan ORGANIZER' })
    findByEventId(@Param('eventId', ParseUUIDPipe) eventId: string) {
        return this.promoCodesService.findByEventId(eventId);
    }

    @Post('check')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Check promo code validity',
        description: 'Endpoint untuk mengecek apakah promo code valid.'
    })
    @ApiResponse({ status: 200, description: 'Promo code is valid' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Token tidak ditemukan atau kedaluwarsa' })
    @ApiForbiddenResponse({ description: 'Forbidden - User bukan ORGANIZER' })
    check(@Body() checkDto: CheckPromoCodeDto) {
        return this.promoCodesService.checkkPromoCode(checkDto);
    }

    @Patch(':id')
    update(@Param('id', ParseUUIDPipe) id: string, @Body() updateDto: UpdatePromoCodeDto) {
        return this.promoCodesService.update(id, updateDto);
    }

    @Delete(':id')
    delete(@Param('id', ParseUUIDPipe) id: string) {
        return this.promoCodesService.delete(id);
    }
}