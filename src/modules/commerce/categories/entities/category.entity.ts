import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { Tenant } from '../../../saas/tenants/entities/tenant.entity';
import { Product } from '../../products/entities/product.entity'; // Asegúrate de que la ruta sea correcta

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 🔐 Multi-Tenant Obligatorio
  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  // --- Datos de la Categoría ---

  @Column({ length: 100 })
  name: string;

  @Column({ length: 120 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: true })
  isActive: boolean;

  // --- Relaciones ---

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];

  // --- Timestamps ---

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}