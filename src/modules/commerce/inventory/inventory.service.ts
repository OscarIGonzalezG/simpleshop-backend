import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { InventoryMovement, MovementType } from './entities/inventory-movement.entity';
import { Product } from '../products/entities/product.entity';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';

import { BaseTenantService } from '../../../core/base/base-tenant.service';
import { RequestContextService } from '../../../core/request-context/request-context.service';
import { LoggerService } from '../../../core/logger/logger.service'; // 👈
import { LogLevel } from '../../../core/logger/enums/log-level.enum';

@Injectable()
export class InventoryService extends BaseTenantService<InventoryMovement> {
  constructor(
    @InjectRepository(InventoryMovement)
    private readonly movementRepo: Repository<InventoryMovement>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
    context: RequestContextService,
    private readonly logger: LoggerService, // 👈
  ) {
    super(movementRepo, context);
  }

  async createMovement(dto: CreateInventoryMovementDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Buscar producto (Bloqueo pesimista opcional aquí, por ahora simple)
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: dto.productId, tenantId: this.currentTenantId },
      });

      if (!product) {
        throw new NotFoundException('Producto no encontrado en tu inventario');
      }

      // 2. Calcular nuevo stock
      const previousStock = product.stock;
      let newStock = previousStock;

      if (dto.type === MovementType.IN) {
        newStock += dto.quantity;
      } else {
        if (product.stock < dto.quantity) {
          throw new BadRequestException(`Stock insuficiente. Tienes ${product.stock} y quieres sacar ${dto.quantity}`);
        }
        newStock -= dto.quantity;
      }

      // 3. Guardar cambios en Producto
      product.stock = newStock;
      await queryRunner.manager.save(product);

      // 4. Guardar Historial
      const movement = queryRunner.manager.create(InventoryMovement, {
        ...dto,
        tenantId: this.currentTenantId,
        userId: this.context.userId,
      });
      const result = await queryRunner.manager.save(movement);

      await queryRunner.commitTransaction();

      // 📝 AUDITORÍA (Fuera de la transacción para no fallar si el log falla)
      this.logger.audit(
        'INVENTORY_MOVE', 
        `${dto.type === 'IN' ? 'Entrada' : 'Salida'} de ${dto.quantity} un. en ${product.name} (Stock: ${previousStock} -> ${newStock})`,
        LogLevel.INFO,
        { productId: product.id, reason: dto.comment }
      );

      return result;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error en movimiento de inventario: ${error.message}`, error.stack, 'InventoryService');
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}