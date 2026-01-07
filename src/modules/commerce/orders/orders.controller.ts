import { Controller, Post, Body, Param } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('storefront/:slug/orders') // 👈 Ruta pública anidada
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Param('slug') slug: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(slug, dto);
  }
}