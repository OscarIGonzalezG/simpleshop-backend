import { ConflictException, Injectable, UnauthorizedException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../users/enums/user-role.enum';
import { LoggerService } from '../../core/logger/logger.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
    private readonly jwtService: JwtService,
    private readonly logger: LoggerService,
  ) {}

  async register(dto: RegisterDto) {
    this.logger.log(`Registro iniciado: ${dto.email} [${dto.businessName}]`);

    // 1. Validaciones
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) throw new ConflictException('El email ya está registrado');

    const existingTenant = await this.tenantsService.findOneBySlug(dto.slug);
    if (existingTenant) throw new ConflictException('El slug ya está en uso');

    // 2. Crear Usuario
    const user = await this.usersService.create({
      email: dto.email,
      fullname: dto.fullname,
      password: dto.password,
    });

    // 3. Crear Tenant
    const tenant = await this.tenantsService.create(
      {
        slug: dto.slug,
        businessName: dto.businessName,
        name: dto.businessName,
        email: dto.email,
        plan: dto.plan,
        maxUsers: 1,
        maxStorageMB: 500,
      },
      user,
    );

    // 4. Vincular
    user.tenantId = tenant.id;
    user.role = UserRole.OWNER;
    await this.usersService.save(user);

    // 📝 Auditoría Registro
    await this.logger.audit(
      'TENANT_REGISTER', 
      `Nueva tienda: ${tenant.slug}`, 
      undefined, 
      { email: user.email, tenantId: tenant.id }
    );

    return this.generateAuthResponse(user, tenant);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    
    // Warn: Login fallido (User not found)
    if (!user) {
      this.logger.warn(`Login fallido (User not found)`, 'AuthService', { email: dto.email });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 🔍 DEBUG: Verificamos qué ve el Backend
    console.log(`🔍 DEBUG LOGIN: Usuario ${user.email} | isActive en BD:`, user.isActive);

    const isValid = await bcrypt.compare(dto.password, user.password);
    
    // Warn: Login fallido (Bad password)
    if (!isValid) {
      this.logger.warn(`Login fallido (Bad pass)`, 'AuthService', { email: dto.email });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // --- KILL SWITCH REFORZADO 🛡️ ---
    // Usamos !user.isActive para atrapar false, null o undefined
    if (!user.isActive) {
      await this.logger.security('AUTH_BLOCKED', 'Login bloqueado (Usuario inactivo)', { email: user.email });
      throw new UnauthorizedException('⛔ Usuario desactivado por administración');
    }

    const tenant = user.tenant;

    // Validación de Tienda
    if (user.role !== UserRole.SUPER_ADMIN && tenant && !tenant.isActive) {
      await this.logger.security('AUTH_BLOCKED', 'Login bloqueado (Tienda inactiva)', { email: user.email, tenant: tenant.slug });
      throw new UnauthorizedException('⛔ Tu tienda está suspendida');
    }

    // ✅ ÉXITO
    await this.logger.security(
      'AUTH_LOGIN', 
      'Sesión iniciada correctamente', 
      { 
        email: user.email, 
        role: user.role, 
        tenantId: tenant?.id || 'N/A' 
      }
    );

    return this.generateAuthResponse(user, tenant);
  }

  // 👇 LÓGICA DE IMPERSONATION (MAGIA PURA)
  async impersonate(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) throw new NotFoundException('Usuario objetivo no encontrado');

    // ⛔ SEGURIDAD: Impedir impersonar a otro Super Admin
    if (user.role === UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('No puedes suplantar a otro Super Administrador');
    }

    // 📝 Auditoría importante
    this.logger.security('AUTH_IMPERSONATE', `Super Admin inició Modo Fantasma como: ${user.email}`);

    return this.generateAuthResponse(user, user.tenant);
  }

  private async generateAuthResponse(user: any, tenant: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: tenant?.id,
      role: user.role,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        role: user.role,
      },
      tenant: tenant ? {
        id: tenant.id,
        slug: tenant.slug,
        businessName: tenant.businessName,
        isActive: tenant.isActive,
        plan: tenant.plan,
      } : null,
    };
  }
}