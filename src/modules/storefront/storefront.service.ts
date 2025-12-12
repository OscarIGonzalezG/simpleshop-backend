import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Tenant } from '../tenants/entities/tenant.entity';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { LoggerService } from '../../core/logger/logger.service'; // 👈

@Injectable()
export class StorefrontService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly logger: LoggerService, // 👈
  ) {}

  // 1. Info Tienda
  async getStoreInfo(slug: string) {
    const tenant = await this.tenantRepo.findOne({
      where: { slug, isActive: true },
      select: ['id', 'name', 'businessName', 'slug', 'email', 'phone', 'address'],
    });

    if (!tenant) {
      // Log suave para detectar tráfico basura
      this.logger.warn(`Intento de acceso a tienda inexistente/inactiva: ${slug}`, 'Storefront');
      throw new NotFoundException('Tienda no encontrada');
    }
    return tenant;
  }

  // 2. Productos
  async getProducts(slug: string) {
    const tenant = await this.getStoreInfo(slug);
    return this.productRepo.find({
      where: { tenantId: tenant.id, isActive: true },
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });
  }

  // 3. Categorías
  async getCategories(slug: string) {
    const tenant = await this.getStoreInfo(slug);
    return this.categoryRepo.find({
      where: { tenantId: tenant.id, isActive: true },
    });
  }
  
  // 4. Detalle Producto
  async getProductBySlug(storeSlug: string, productSlug: string) {
    const tenant = await this.getStoreInfo(storeSlug);
    const product = await this.productRepo.findOne({
      where: { tenantId: tenant.id, slug: productSlug, isActive: true },
      relations: ['category'],
    });

    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }
}