import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('blocked_ips')
export class BlockedIp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  ip: string;

  @Column({ nullable: true })
  reason: string;

  @Column({ nullable: true })
  blockedBy: string;

  @CreateDateColumn()
  blockedAt: Date;
}