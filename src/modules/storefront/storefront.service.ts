import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';

@Injectable()
export class StorefrontService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  // 1. Buscar la información de la tienda (Para el Header/Branding)
  async getStoreInfo(slug: string) {
    const tenant = await this.tenantRepo.findOne({
      where: { slug, isActive: true },
      select: ['id', 'name', 'businessName', 'slug', 'email', 'phone', 'address'], // ⚠️ NO devolver datos sensibles
    });

    if (!tenant) throw new NotFoundException('Tienda no encontrada');
    return tenant;
  }

  // 2. Buscar productos de esa tienda
  async getProducts(slug: string) {
    // Primero obtenemos el tenant para saber su ID
    const tenant = await this.getStoreInfo(slug);

    return this.productRepo.find({
      where: { 
        tenantId: tenant.id, 
        isActive: true, // Solo mostrar productos activos
        // stock: MoreThan(0) // Opcional: Si quieres ocultar sin stock
      },
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });
  }

  // 3. Buscar categorías de esa tienda (Para el menú de filtros)
  async getCategories(slug: string) {
    const tenant = await this.getStoreInfo(slug);
    
    return this.categoryRepo.find({
      where: { tenantId: tenant.id, isActive: true },
    });
  }
  
  // 4. Buscar un producto específico (Detalle de producto)
  async getProductBySlug(storeSlug: string, productSlug: string) {
    const tenant = await this.getStoreInfo(storeSlug);

    const product = await this.productRepo.findOne({
      where: { 
        tenantId: tenant.id, 
        slug: productSlug,
        isActive: true 
      },
      relations: ['category'],
    });

    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }
}