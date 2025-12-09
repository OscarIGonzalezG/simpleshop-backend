import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { Product } from '../../modules/products/entities/product.entity'; // 👈 Importante
import { CoreModule } from '../../core/core.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InventoryMovement, Product]), // 👈 Registramos ambos
    CoreModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}