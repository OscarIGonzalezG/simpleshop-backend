import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from 'src/modules/iam/users/entities/user.entity';
import { TenantPlan } from '../enums/tenant-plan.enum';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ length: 150, unique: true })
  email: string;

  @Column({ length: 20, nullable: true })
  phone?: string;

  @Column({ length: 250, nullable: true })
  address?: string;

  // SaaS essential
  @Index()
  @Column({ length: 80, unique: true })
  slug: string;

  @Column({ length: 120 })
  businessName: string;

  /**
   * OWNER (userId)
   */
  @Column({ type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  /**
   * PLAN
   */
  @Column({
    type: 'enum',
    enum: TenantPlan,
    default: TenantPlan.FREE,
  })
  plan: TenantPlan;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'int', default: 1 })
  maxUsers: number;

  @Column({ type: 'int', default: 500 })
  maxStorageMB: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Users belonging to this tenant
   */
  @OneToMany(() => User, (user) => user.tenant)
  users: User[];
}
