import { IsEmail, IsOptional, IsString, IsEnum, IsBoolean, IsInt, IsDateString, MaxLength, Min } from 'class-validator';
import { TenantPlan } from '../enums/tenant-plan.enum';

export class CreateTenantDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsEmail()
  @MaxLength(150)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  address?: string;

  @IsString()
  @MaxLength(80)
  slug: string;

  @IsString()
  @MaxLength(120)
  businessName: string;

  @IsEnum(TenantPlan)
  plan: TenantPlan;

  @IsOptional()
  @IsDateString()
  expiresAt?: Date;

  @IsInt()
  @Min(1)
  maxUsers: number;

  @IsInt()
  @Min(100)
  maxStorageMB: number;

  @IsOptional()
  metadata?: Record<string, any>;
}
