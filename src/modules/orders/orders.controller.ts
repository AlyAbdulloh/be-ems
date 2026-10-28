import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { OrdersService } from "./orders.service";
import { QueryOrderDto } from "./dto/query-order.dto";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";

@ApiTags("Orders")
@ApiBearerAuth()
@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get("my")
  @ApiOperation({ summary: "Get all orders for the logged in user" })
  @ApiResponse({ status: 200, description: "List of user orders" })
  async findMyOrders(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: QueryOrderDto,
  ) {
    return this.ordersService.findMyOrders(currentUser, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get order detail by ID" })
  @ApiResponse({ status: 200, description: "Order detail" })
  async findOne(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.ordersService.findOne(currentUser, id);
  }

  @Post(":id/pay")
  @ApiOperation({ summary: "Process payment for an order" })
  @ApiResponse({ status: 201, description: "Payment processed successfully" })
  async pay(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.ordersService.pay(currentUser, id, dto);
  }
}
