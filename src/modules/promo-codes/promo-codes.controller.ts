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
  HttpStatus,
} from "@nestjs/common";
import { PromoCodesService } from "./promo-codes.service";
import {
  CheckPromoCodeDto,
  CreatePromoCodeDto,
  UpdatePromoCodeDto,
} from "./dto/create-promo-codes";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiParam,
} from "@nestjs/swagger";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";

@ApiTags("Promo Codes")
@ApiBearerAuth()
@Controller("promo-codes")
export class PromoCodesController {
  constructor(private readonly promoCodesService: PromoCodesService) {}

  @Roles("ORGANIZER")
  @Post()
  @ApiOperation({
    summary: "Create a new promo code (Organizer only)",
    description:
      "Endpoint untuk membuat promo code baru. Membutuhkan role **ORGANIZER**.",
  })
  @ApiResponse({ status: 201, description: "Promo code created successfully" })
  @ApiUnauthorizedResponse({
    description: "Unauthorized - Token tidak ditemukan atau kedaluwarsa",
  })
  @ApiForbiddenResponse({ description: "Forbidden - User bukan ORGANIZER" })
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createDto: CreatePromoCodeDto,
  ) {
    return this.promoCodesService.create(currentUser.sub, createDto);
  }

  @Roles("ORGANIZER")
  @Get("event/:eventId")
  @ApiParam({
    name: "eventId",
    description: "ID of the event",
    type: "string",
    format: "uuid",
    example: "439f0d14-3a5c-4d83-bb37-a1f9e2b1093a",
  })
  @ApiOperation({
    summary: "Get all promo codes for a specific event (Organizer only)",
    description:
      "Endpoint untuk mendapatkan semua promo code untuk event tertentu. Membutuhkan role **ORGANIZER**.",
  })
  @ApiResponse({ status: 200, description: "List of promo codes" })
  @ApiUnauthorizedResponse({
    description: "Unauthorized - Token tidak ditemukan atau kedaluwarsa",
  })
  @ApiForbiddenResponse({ description: "Forbidden - User bukan ORGANIZER" })
  findByEventId(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param("eventId", ParseUUIDPipe) eventId: string,
  ) {
    return this.promoCodesService.findByEventId(currentUser.sub, eventId);
  }

  @Post("check")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Check promo code validity",
    description: "Endpoint untuk mengecek apakah promo code valid.",
  })
  @ApiResponse({ status: 200, description: "Promo code is valid" })
  @ApiUnauthorizedResponse({
    description: "Unauthorized - Token tidak ditemukan atau kedaluwarsa",
  })
  check(@Body() checkDto: CheckPromoCodeDto) {
    return this.promoCodesService.checkPromoCode(checkDto);
  }

  @Roles("ORGANIZER")
  @Patch(":id")
  @ApiOperation({ summary: "Update a promo code (Organizer owner only)" })
  @ApiResponse({ status: 200, description: "Promo code updated successfully" })
  update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdatePromoCodeDto,
  ) {
    return this.promoCodesService.update(currentUser.sub, id, updateDto);
  }

  @Roles("ORGANIZER")
  @Delete(":id")
  @ApiOperation({ summary: "Delete a promo code (Organizer owner only)" })
  @ApiResponse({ status: 200, description: "Promo code deleted successfully" })
  delete(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.promoCodesService.delete(currentUser.sub, id);
  }
}
