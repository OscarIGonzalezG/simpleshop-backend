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

  // 👇👇 NUEVAS COLUMNAS (Inteligencia) 👇👇
  @Column({ nullable: true })
  ip: string;

  @Column({ nullable: true, length: 5 }) 
  country: string; // Ej: "CL"

  @Column({ nullable: true }) 
  device: string; // Ej: "Chrome on Windows"

  @Column({ type: 'text', nullable: true })
  userAgent: string; // User Agent crudo
  // 👆👆 FIN NUEVAS COLUMNAS 👆👆

  // Aquí guardaremos el 'payload' (el JSON que causó el error)
  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;
}