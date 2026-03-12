import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  UseGuards,
  Query,
  ParseIntPipe,
  Patch,
  ConflictException,
  Logger,
  Body,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { User } from 'src/auth/entities/user.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Order, OrderStatus } from './entities/order.entity';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { GetOrdersDto } from './dto/get-orders.dto';
import { CacheTTL } from '@nestjs/cache-manager';
import { DeliverySpecificationsDto } from './dto/order-delivery-specs.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  private logger = new Logger(OrdersController.name);
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @Req() req: { user: User },
    @Body() deliverySpecs: DeliverySpecificationsDto,
  ): Promise<void> {
    this.logger.verbose(`Placing an order... {userId: ${req.user.id}}`);
    return this.ordersService.create(req.user, deliverySpecs);
  }

  @Get('/all')
  @CacheTTL(60 * 60 * 1000)
  @UseGuards(AdminGuard)
  findAll(@Query() getOrdersDto: GetOrdersDto): Promise<{
    data: Order[];
    metadata: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    this.logger.verbose(`Getting all orders...`);
    return this.ordersService.findAll(getOrdersDto);
  }

  @Get()
  @CacheTTL(60 * 60 * 1000)
  findAllByUser(
    @Req() req: { user: User },
    @Query() paginationOptions: { page: number; limit: number },
  ): Promise<{
    data: Order[];
    metadata: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    this.logger.verbose(
      `Getting all orders for user... {userId: ${req.user.id}}`,
    );
    return this.ordersService.findAllByUser(req.user.id, paginationOptions);
  }

  @Get('/:id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Order> {
    this.logger.verbose(`Getting an order... {orderId: ${id}}`);
    return this.ordersService.findOne(id);
  }

  @UseGuards(AdminGuard)
  @Patch(':id/:status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Param('status') status: OrderStatus,
  ): Promise<Order> {
    this.logger.verbose(
      `Updating order status to ${status}... {orderId: ${id}}`,
    );

    if (!Object.values(OrderStatus).find((s) => s === status)) {
      this.logger.error(
        `Incorrect order status value {orderId: ${id}, status: ${status}}`,
      );
      throw new ConflictException('Неправильне значення статусу замовлення.');
    }

    return this.ordersService.updateStatus(id, status);
  }
}
