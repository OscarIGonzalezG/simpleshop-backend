import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../../modules/products/entities/product.entity';
import { Tenant } from '../../modules/tenants/entities/tenant.entity';
import { InventoryMovement, MovementType } from '../../modules/inventory/entities/inventory-movement.entity';

@Injectable()
export class OrdersService {
  constructor(private readonly dataSource: DataSource) {}

  // 🛒 CREAR ORDEN (Público - Desde el Storefront)
  async createOrder(tenantSlug: string, dto: CreateOrderDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Obtener el Tenant por Slug
      const tenant = await queryRunner.manager.findOne(Tenant, {
        where: { slug: tenantSlug, isActive: true },
      });

      if (!tenant) throw new NotFoundException('Tienda no encontrada');

      let totalAmount = 0;
      const orderItems: OrderItem[] = [];

      // 2. Procesar cada item
      for (const itemDto of dto.items) {
        // Buscar producto (con bloqueo pesimista opcional, aquí simple)
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: itemDto.productId, tenantId: tenant.id, isActive: true },
        });

        if (!product) {
          throw new NotFoundException(`Producto ${itemDto.productId} no encontrado o no disponible`);
        }

        // Validar Stock
        if (product.stock < itemDto.quantity) {
          throw new BadRequestException(`Stock insuficiente para el producto: ${product.name}`);
        }

        // Descontar Stock
        product.stock -= itemDto.quantity;
        await queryRunner.manager.save(product);

        // Registrar Movimiento de Inventario (OUT)
        const movement = queryRunner.manager.create(InventoryMovement, {
          tenantId: tenant.id,
          productId: product.id,
          type: MovementType.OUT,
          quantity: itemDto.quantity,
          comment: `Venta Online - Cliente: ${dto.customerName}`,
        });
        await queryRunner.manager.save(movement);

        // Crear OrderItem
        const orderItem = new OrderItem();
        orderItem.product = product;
        orderItem.quantity = itemDto.quantity;
        orderItem.price = product.price; // Precio congelado
        orderItems.push(orderItem);

        totalAmount += Number(product.price) * itemDto.quantity;
      }

      // 3. Crear la Orden
      const order = queryRunner.manager.create(Order, {
        tenantId: tenant.id,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        total: totalAmount,
        status: OrderStatus.COMPLETED, // O PENDING si integras pagos luego
        items: orderItems,
      });

      const savedOrder = await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();
      return savedOrder;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 🔄 CANCELAR ORDEN (Admin - Desde el Backoffice)
  async cancelOrder(orderId: string, tenantId: string, userId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Buscar la orden con sus items
      const order = await queryRunner.manager.findOne(Order, {
        where: { id: orderId, tenantId },
        relations: ['items', 'items.product'], 
      });

      if (!order) throw new NotFoundException('Orden no encontrada');

      if (order.status === OrderStatus.CANCELLED) {
        throw new BadRequestException('La orden ya está cancelada');
      }

      // 2. Reponer Stock y Registrar Movimientos
      for (const item of order.items) {
        const product = item.product;

        // A. Devolver Stock
        product.stock += item.quantity;
        await queryRunner.manager.save(product);

        // B. Registrar Movimiento (IN)
        const movement = queryRunner.manager.create(InventoryMovement, {
          tenantId,
          productId: product.id,
          type: MovementType.IN, // 👈 Entrada por devolución
          quantity: item.quantity,
          comment: `Cancelación Orden #${order.id.slice(0, 8)}`,
          userId, // El admin que canceló
        });
        await queryRunner.manager.save(movement);
      }

      // 3. Actualizar Estado de la Orden
      order.status = OrderStatus.CANCELLED;
      await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();
      return { message: 'Orden cancelada y stock restaurado', orderId: order.id };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}