import { TenantPlan } from '../enums/tenant-plan.enum';

export class TenantResponseDto {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  plan: TenantPlan;
  expiresAt?: Date;
  maxUsers: number;
  maxStorageMB: number;
  metadata?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
