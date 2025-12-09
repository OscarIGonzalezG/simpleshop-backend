import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { InventoryMovement, MovementType } from './entities/inventory-movement.entity';
import { Product } from '../../modules/products/entities/product.entity';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';

import { BaseTenantService } from '../../core/base/base-tenant.service';
import { RequestContextService } from '../../core/request-context/request-context.service';

@Injectable()
export class InventoryService extends BaseTenantService<InventoryMovement> {
  constructor(
    @InjectRepository(InventoryMovement)
    private readonly movementRepo: Repository<InventoryMovement>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource, // 👈 Para transacciones
    context: RequestContextService,
  ) {
    super(movementRepo, context);
  }

  // Sobrescribimos el método create normal con lógica transaccional
  async createMovement(dto: CreateInventoryMovementDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Buscar el producto (Y verificar que sea de este Tenant)
      // Usamos 'queryRunner.manager' para que sea parte de la transacción
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: dto.productId, tenantId: this.currentTenantId },
      });

      if (!product) {
        throw new NotFoundException('Producto no encontrado en tu inventario');
      }

      // 2. Calcular nuevo stock
      let newStock = product.stock;

      if (dto.type === MovementType.IN) {
        newStock += dto.quantity;
      } else {
        // Validación: No permitir stock negativo
        if (product.stock < dto.quantity) {
          throw new BadRequestException(`Stock insuficiente. Tienes ${product.stock} y quieres sacar ${dto.quantity}`);
        }
        newStock -= dto.quantity;
      }

      // 3. Actualizar el producto con el nuevo stock
      product.stock = newStock;
      await queryRunner.manager.save(product);

      // 4. Crear el movimiento de historial
      const movement = queryRunner.manager.create(InventoryMovement, {
        ...dto,
        tenantId: this.currentTenantId, // 🔒 Seguridad Tenant
        userId: this.context.userId,    // 👤 Quién lo hizo
      });
      
      const result = await queryRunner.manager.save(movement);

      // ✅ Si todo sale bien, confirmamos los cambios
      await queryRunner.commitTransaction();
      
      return result;

    } catch (error) {
      // ❌ Si algo falla, deshacemos TODO (incluso el update del producto)
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Liberamos la conexión
      await queryRunner.release();
    }
  }
}