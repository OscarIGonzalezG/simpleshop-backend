import { IsEmail, IsString, MinLength, MaxLength, IsEnum } from 'class-validator';
import { TenantPlan } from '../../tenants/enums/tenant-plan.enum';

export class RegisterDto {
  // ---------- USER ----------
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MaxLength(120)
  fullname: string;

  // ---------- TENANT ----------
  @IsString()
  @MaxLength(80)
  slug: string;

  @IsString()
  @MaxLength(120)
  businessName: string;

  @IsEnum(TenantPlan)
  plan: TenantPlan;
}
