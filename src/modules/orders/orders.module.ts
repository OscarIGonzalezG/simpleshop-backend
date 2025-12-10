import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrdersAdminController } from './orders-admin.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../../modules/products/entities/product.entity';
import { Tenant } from '../../modules/tenants/entities/tenant.entity';
import { InventoryMovement } from '../../modules/inventory/entities/inventory-movement.entity';
import { CoreModule } from '../../core/core.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Product, Tenant, InventoryMovement]),
    CoreModule,
  ],
  controllers: [OrdersController, OrdersAdminController],
  providers: [OrdersService],
})
export class OrdersModule {}