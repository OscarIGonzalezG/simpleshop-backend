import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { BaseTenantController } from '../../core/base/base-tenant.controller';
import { InventoryMovement } from './entities/inventory-movement.entity';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController extends BaseTenantController<InventoryMovement> {
  constructor(private readonly inventoryService: InventoryService) {
    super(inventoryService);
  }

  // Sobrescribimos el POST para usar nuestra lógica especial
  @Post()
  async create(@Body() dto: CreateInventoryMovementDto) {
    return this.inventoryService.createMovement(dto);
  }

  // Heredamos GET (findAll) y GET :id (findOne) automáticamente
  // para ver el historial de movimientos.
}