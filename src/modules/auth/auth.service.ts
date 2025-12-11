import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../users/entities/user.entity';
import { LoggerService } from '../../core/logger/logger.service'; // ✅ 1. Importar Logger

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
    private readonly jwtService: JwtService,
    private readonly logger: LoggerService,
  ) {}

  // =============================
  //           REGISTER
  // =============================
  async register(dto: RegisterDto) {
    // 📝 Log de inicio
    this.logger.log(`Intento de registro: ${dto.email} (Empresa: ${dto.businessName})`, 'AuthService');

    // 1. Validar email ya existe
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      this.logger.warn(`Fallo registro: Email ${dto.email} ya existe`, 'AuthService');
      throw new ConflictException('El email ya está registrado');
    }

    // 2. Validar slug ya existe
    const existingTenant = await this.tenantsService.findOneBySlug(dto.slug);
    if (existingTenant) {
      this.logger.warn(`Fallo registro: Slug ${dto.slug} ya existe`, 'AuthService');
      throw new ConflictException('El slug ya está en uso');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // ================================================
    // Crear usuario OWNER sin tenantId
    // ================================================
    const user = await this.usersService.create({
      email: dto.email,
      fullname: dto.fullname,
      password: dto.password,
    });

    // ================================================
    // Crear el tenant y asignar OWNER
    // ================================================
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

    // ================================================
    // Actualizar usuario con el tenantId real
    // ================================================
    user.tenantId = tenant.id;
    user.role = UserRole.OWNER;
    await this.usersService.save(user);

    // 📝 Log de éxito
    this.logger.log(`✅ Nuevo Tenant creado: ${tenant.slug} por usuario ${user.email}`, 'AuthService');

    // ================================================
    // Crear token JWT
    // ================================================
    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      tenantId: tenant.id,
      role: user.role,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        role: user.role,
      },
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        businessName: tenant.businessName,
        plan: tenant.plan,
      },
    };
  }

  // =============================
  //            LOGIN
  // =============================
  async login(dto: LoginDto) {
    // ⚠️ IMPORTANTE: Asegúrate que findByEmail traiga la relación 'tenant'
    const user = await this.usersService.findByEmail(dto.email);
    
    if (!user) {
      this.logger.warn(`⚠️ Login fallido (Usuario no existe): ${dto.email}`, 'AuthService');
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isValid = await bcrypt.compare(dto.password, user.password);
    
    if (!isValid) {
      this.logger.warn(`⚠️ Login fallido (Password incorrecto): ${dto.email}`, 'AuthService');
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // ==========================================================
    // 🚫 KILL SWITCH: Validaciones de Estado (NUEVO)
    // ==========================================================

    // 1. Validar Usuario Activo
    if (user.isActive === false) {
      this.logger.warn(`⛔ Acceso denegado (Usuario inactivo): ${user.email}`, 'AuthService');
      throw new UnauthorizedException('Tu usuario ha sido desactivado. No puedes ingresar.');
    }

    const tenant = user.tenant;

      // 👇 AGREGA ESTO TEMPORALMENTE
    console.log('🔍 DEBUG LOGIN:');
    console.log('User Role:', user.role);
    console.log('Tenant ID:', tenant?.id);
    console.log('Tenant IsActive:', tenant?.isActive);
    console.log('Condición de Bloqueo:', user.role !== 'SUPER_ADMIN' && tenant && tenant.isActive === false);
    // 👆 -----------------------

    // 2. Validar Tienda Activa (Excepto Super Admin)
    if (user.role !== UserRole.SUPER_ADMIN && tenant && tenant.isActive === false) {
      this.logger.warn(`⛔ Acceso denegado (Tienda suspendida): ${user.email} [Tenant: ${tenant.slug}]`, 'AuthService');
      throw new UnauthorizedException('Tu tienda está suspendida. Contacta a soporte.');
    }

    // ==========================================================

    this.logger.log(`🔑 Usuario logueado: ${user.email} [Tenant: ${tenant?.slug || 'Sin Tenant'}]`, 'AuthService');

    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      tenantId: tenant?.id,
      role: user.role,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        role: user.role,
      },
      tenant: tenant
        ? {
            id: tenant.id,
            slug: tenant.slug,
            businessName: tenant.businessName,
            isActive: tenant.isActive // Opcional: devolver estado
          }
        : null,
    };
  }
}