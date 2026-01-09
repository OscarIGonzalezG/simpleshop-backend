import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Tenant } from '../../../saas/tenants/entities/tenant.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity('products')
// 👇 REGLA DE ORO SAAS: Unicidad Compuesta
// El SKU 'ZAP-001' puede existir muchas veces en la tabla, PERO solo una vez por tenantId.
@Index(['tenantId', 'sku'], { unique: true }) 
@Index(['tenantId', 'slug'], { unique: true })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // -----------------------------------------------------
  // 🏢 TENANCY (Dueño del dato)
  // -----------------------------------------------------
  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  // -----------------------------------------------------
  // 📦 DATOS DE BODEGA (Logística)
  // -----------------------------------------------------

  @Column({ length: 150 })
  name: string;

  // SKU (Stock Keeping Unit): Código interno de barra/referencia
  // Vital para que el dueño encuentre el producto rápido.
  @Column({ length: 50 }) 
  sku: string;

  // Slug para la URL pública: simpleshop.com/tienda/zapatillas-nike
  @Column({ length: 180 }) 
  slug: string;

  // Stock "Cacheado":
  // Aunque usemos InventoryModule para el historial,
  // necesitamos leer este número rápido sin sumar miles de registros cada vez.
  @Column({ type: 'int', default: 0 })
  stock: number;

  // -----------------------------------------------------
  // 💰 PRECIOS & RENTABILIDAD
  // -----------------------------------------------------

  // Precio de Venta (Público)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  // Precio de Costo (Privado): Para calcular ganancia (Profit = Price - Cost)
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  costPrice?: number;

  // Precio de Comparación (Opcional): El clásico "Antes $100" (Oferta)
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  compareAtPrice?: number;

  // -----------------------------------------------------
  // 🖼️ MEDIA & CONTENIDO
  // -----------------------------------------------------

  @Column({ type: 'text', nullable: true })
  description?: string;

  // Array de URLs: Postgres soporta arrays nativos. ¡Mucho mejor que una tabla extra!
  // Guardaremos: ['url_foto_1.jpg', 'url_foto_2.jpg']
  @Column('text', { array: true, default: {} })
  images: string[];

  // -----------------------------------------------------
  // ⚙️ CONFIGURACIÓN
  // -----------------------------------------------------

  @Column({ default: true })
  isActive: boolean; // Si es false, no se muestra en la tienda pública

  // Categoría
  @Column({ type: 'uuid', nullable: true })
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.products, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;
  
  // -----------------------------------------------------
  // ⏰ TIMESTAMPS
  // -----------------------------------------------------

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}