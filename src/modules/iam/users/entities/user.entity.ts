import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index, JoinColumn } from 'typeorm';
import { Tenant } from '../../../saas/tenants/entities/tenant.entity';
// 👇 IMPORTANTE: Importamos el Enum, NO lo definimos aquí
import { UserRole } from '../enums/user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150, unique: true })
  @Index()
  email: string;

  @Column({ length: 120 })
  fullname: string;

  @Column({ length: 255 })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STAFF,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  // 👇 NUEVOS CAMPOS
  @Column({ default: false }) 
  isVerified: boolean; // ¿Confirmó su correo?

  @Column({ type: 'varchar', nullable: true })
  verificationCode: string | null; // El código de 6 dígitos (ej: "123456")

  @Index()
  @Column({ type: 'uuid', nullable: true })
  tenantId?: string | null;
  
  @ManyToOne(() => Tenant, (tenant) => tenant.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}