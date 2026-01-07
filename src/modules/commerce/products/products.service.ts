import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from './entities/product.entity';
import { BaseTenantService } from '../../../core/base/base-tenant.service';
import { RequestContextService } from '../../../core/request-context/request-context.service';
import { LoggerService } from '../../../core/logger/logger.service'; // 👈
import { LogLevel } from '../../../core/logger/enums/log-level.enum';

@Injectable()
export class ProductsService extends BaseTenantService<Product> {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    context: RequestContextService,
    private readonly logger: LoggerService, // 👈
  ) {
    super(productRepo, context);
  }

  // --- CRUD con Auditoría ---

  async createForCurrentTenant(data: any): Promise<Product> {
    const product = await super.createForCurrentTenant(data);
    this.logger.audit('PRODUCT_CREATE', `Producto creado: ${product.name} (${product.slug})`);
    return product;
  }

  async updateForCurrentTenant(id: string, data: any): Promise<Product> {
    const product = await super.updateForCurrentTenant(id, data);
    
    // Si cambió el precio, es importante loguearlo
    if (data.price) {
      this.logger.audit('PRODUCT_PRICE_CHANGE', `Precio actualizado en ${product.name}: $${product.price}`);
    } else {
      this.logger.audit('PRODUCT_UPDATE', `Producto actualizado: ${product.name}`);
    }

    return product;
  }

  async removeForCurrentTenant(id: string): Promise<void> {
    const product = await this.findOneForCurrentTenant(id);
    await super.removeForCurrentTenant(id);
    this.logger.audit('PRODUCT_DELETE', `Producto eliminado: ${product.name}`, LogLevel.WARN);
  }

  // --- Métodos Especializados ---

  async findOutofStock() {
    return this.productRepo.find({
      where: {
        tenantId: this.currentTenantId,
        stock: 0
      }
    });
  }

  async findAllForCurrentTenant(): Promise<Product[]> {
    return this.productRepo.find({
      where: { tenantId: this.currentTenantId },
      relations: ['category'], // Incluir categoría
      order: { createdAt: 'DESC' }
    });
  }
}