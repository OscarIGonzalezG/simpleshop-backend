import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import {  Tenant } from '../../../saas/tenants/entities/tenant.entity';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../../iam/users/entities/user.entity';

export enum MovementType {
  IN = 'IN',   // Entrada (Compras, Devoluciones)
  OUT = 'OUT', // Salida (Ventas, Mermas, Consumo interno)
}

@Entity('inventory_movements')
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 🔐 Multi-Tenant
  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  // 📦 Producto Afectado
  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  // 👤 Quién hizo el movimiento
  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  // 📝 Detalles del movimiento
  @Column({
    type: 'enum',
    enum: MovementType,
  })
  type: MovementType;

  @Column({ type: 'int' })
  quantity: number; // Siempre positivo. La lógica definirá si suma o resta.

  @Column({ type: 'text', nullable: true })
  comment?: string; // Ej: "Compra factura #123" o "Merma por rotura"

  // 📅 Cuándo ocurrió
  @CreateDateColumn()
  createdAt: Date;
}