import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index, JoinColumn, } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  STAFF = 'staff',
}

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

  /**
   * MULTITENANT
   */
  @Index()
  @Column({ type: 'uuid', nullable: true })
  tenantId?: string | null;
  
  @ManyToOne(() => Tenant, (tenant) => tenant.users, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
