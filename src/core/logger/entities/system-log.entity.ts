import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { LogLevel } from '../enums/log-level.enum'; // 👈 Importamos desde el archivo separado

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

  // Datos contextuales (Vienen del RequestContext)
  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  tenantId: string;

  @Column({ nullable: true })
  ip: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;
}