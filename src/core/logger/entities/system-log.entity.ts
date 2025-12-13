import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { LogLevel } from '../enums/log-level.enum';

@Entity()
export class SystemLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: LogLevel, default: LogLevel.INFO })
  level: LogLevel;

  @Column()
  action: string;      

  @Column({ type: 'text' })
  message: string;

  // Datos contextuales
  @Column({ nullable: true })
  userId: string;

  // 👇 AGREGADO: Necesario para que el Dashboard muestre "admin@admin.cl"
  @Column({ nullable: true })
  userEmail: string;

  @Column({ nullable: true })
  tenantId: string;

  // Aquí guardaremos el 'payload' (el JSON que causó el error)
  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;
}