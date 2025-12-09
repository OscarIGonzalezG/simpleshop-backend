import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { BaseTenantService } from '../../core/base/base-tenant.service'; // Ajusta la ruta si es necesario
import { RequestContextService } from '../../core/request-context/request-context.service'; // Ajusta ruta

@Injectable()
export class ProductsService extends BaseTenantService<Product> {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    context: RequestContextService,
  ) {
    // Pasamos el repo y el contexto al padre (BaseTenantService)
    super(productRepo, context);
  }

  // ¡LISTO! Ya tienes create, findAll, findOne, update y remove
  // funcionando con multi-tenancy automático.
  
  // Si necesitas un método personalizado, lo agregas aquí:
  async findOutofStock() {
    return this.productRepo.find({
      where: {
        tenantId: this.currentTenantId, // Usamos el helper del padre
        stock: 0
      }
    });
  }

  async findAllForCurrentTenant(): Promise<Product[]> {
  return this.productRepo.find({
      where: { tenantId: this.currentTenantId },
      relations: ['category'], // 👈 Agrega esto para ver la categoría anidada
    });
  }
}