import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

// DTOs & Entities
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../../modules/products/entities/product.entity';
import { Tenant } from '../../modules/tenants/entities/tenant.entity';
import { InventoryMovement, MovementType } from '../../modules/inventory/entities/inventory-movement.entity';

// Core
import { LoggerService } from '../../core/logger/logger.service'; // 👈 Importar
import { LogLevel } from '../../core/logger/enums/log-level.enum';

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: LoggerService, // 👈 Inyectar
  ) {}

  // 🛒 CREAR ORDEN (Público - Desde el Storefront)
  async createOrder(tenantSlug: string, dto: CreateOrderDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validar Tienda
      const tenant = await queryRunner.manager.findOne(Tenant, {
        where: { slug: tenantSlug, isActive: true },
      });
      if (!tenant) throw new NotFoundException('Tienda no disponible');

      let totalAmount = 0;
      const orderItems: OrderItem[] = [];

      // 2. Procesar Items y Stock
      for (const itemDto of dto.items) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: itemDto.productId, tenantId: tenant.id, isActive: true },
        });

        if (!product) throw new NotFoundException(`Producto ${itemDto.productId} no disponible`);
        
        if (product.stock < itemDto.quantity) {
          throw new BadRequestException(`Stock insuficiente para: ${product.name}`);
        }

        // Descontar Stock
        product.stock -= itemDto.quantity;
        await queryRunner.manager.save(product);

        // Movimiento de Inventario (OUT)
        const movement = queryRunner.manager.create(InventoryMovement, {
          tenantId: tenant.id,
          productId: product.id,
          type: MovementType.OUT,
          quantity: itemDto.quantity,
          comment: `Venta Online - Cliente: ${dto.customerName}`,
        });
        await queryRunner.manager.save(movement);

        // Crear Item de Orden
        const orderItem = new OrderItem();
        orderItem.product = product;
        orderItem.quantity = itemDto.quantity;
        orderItem.price = product.price; // Snapshot del precio
        orderItems.push(orderItem);

        totalAmount += Number(product.price) * itemDto.quantity;
      }

      // 3. Guardar Orden
      const order = queryRunner.manager.create(Order, {
        tenantId: tenant.id,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        total: totalAmount,
        status: OrderStatus.COMPLETED,
        items: orderItems,
      });

      const savedOrder = await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();

      // 📝 AUDITORÍA DE VENTA
      this.logger.audit(
        'ORDER_CREATE', 
        `Venta realizada #${savedOrder.id.slice(0, 8)} - Total: $${totalAmount}`, 
        LogLevel.INFO,
        { tenantId: tenant.id, orderId: savedOrder.id }
      );

      return savedOrder;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error procesando orden: ${error.message}`, error.stack, 'OrdersService');
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 🔄 CANCELAR ORDEN (Admin - Backoffice)
  async cancelOrder(orderId: string, tenantId: string, userId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(Order, {
        where: { id: orderId, tenantId },
        relations: ['items', 'items.product'], 
      });

      if (!order) throw new NotFoundException('Orden no encontrada');
      if (order.status === OrderStatus.CANCELLED) throw new BadRequestException('Orden ya cancelada');

      // Restaurar Stock
      for (const item of order.items) {
        const product = item.product;
        product.stock += item.quantity;
        await queryRunner.manager.save(product);

        // Movimiento IN (Devolución)
        const movement = queryRunner.manager.create(InventoryMovement, {
          tenantId,
          productId: product.id,
          type: MovementType.IN,
          quantity: item.quantity,
          comment: `Cancelación Orden #${order.id.slice(0, 8)}`,
          userId,
        });
        await queryRunner.manager.save(movement);
      }

      order.status = OrderStatus.CANCELLED;
      await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();

      // 📝 AUDITORÍA DE CANCELACIÓN
      this.logger.audit(
        'ORDER_CANCEL', 
        `Orden cancelada #${order.id.slice(0, 8)}. Stock restaurado.`, 
        LogLevel.WARN,
        { tenantId, orderId }
      );

      return { message: 'Orden cancelada y stock restaurado' };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}