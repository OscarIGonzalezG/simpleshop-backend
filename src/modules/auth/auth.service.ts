import { ConflictException, Injectable, UnauthorizedException, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer'; // 👈 IMPORTADO
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
    private readonly mailService: MailerService, // 👈 INYECTADO
  ) {}

// 1. REGISTER
  async register(dto: RegisterDto) {
    this.logger.log(`Registro iniciado: ${dto.email} [${dto.businessName}]`);

    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) throw new ConflictException('El email ya está registrado');

    const existingTenant = await this.tenantsService.findOneBySlug(dto.slug);
    if (existingTenant) throw new ConflictException('El slug ya está en uso');

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await this.usersService.create({
      email: dto.email,
      fullname: dto.fullname,
      password: dto.password,
    });

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

    user.tenantId = tenant.id;
    user.role = UserRole.OWNER;
    user.verificationCode = code;
    user.isVerified = false;
    
    await this.usersService.save(user);

    await this.logger.audit(
      'TENANT_REGISTER', 
      `Nueva tienda: ${tenant.slug}`, 
      undefined, 
      { email: user.email, tenantId: tenant.id }
    );

    try {
      await this.mailService.sendMail({
        to: user.email,
        subject: '🔐 Verifica tu cuenta en SimpleShop',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h1>¡Bienvenido a SimpleShop!</h1>
            <p>Hola <strong>${user.fullname}</strong>,</p>
            <p>Para activar tu cuenta, ingresa el siguiente código de verificación:</p>
            <h2 style="color: #4F46E5; font-size: 32px; letter-spacing: 5px;">${code}</h2>
            <p>Si no solicitaste este código, ignora este correo.</p>
          </div>
        `,
      });
      this.logger.log(`📧 Correo de verificación enviado a ${user.email}`);
    } catch (error) {
      this.logger.error('❌ Error enviando correo de verificación', error);
    }

    return {
      message: 'Usuario creado correctamente.',
      requiresVerification: true,
      email: user.email
    };
  }

  // 2. RESEND CODE (Con corrección de Zona Horaria y Cooldown de 30s)
  async resendCode(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.isVerified) throw new BadRequestException('Esta cuenta ya está verificada');

    // --- ⏳ LÓGICA DE COOLDOWN INTELIGENTE ---
    const lastUpdate = user.updatedAt ? new Date(user.updatedAt).getTime() : 0;
    const now = new Date().getTime();
    
    // Calculamos diferencia
    let timeDiff = now - lastUpdate;

    // PARCHE DE ZONA HORARIA: Si es negativo (futuro), asumimos que se puede enviar.
    if (timeDiff < 0) timeDiff = 1000000; 

    const cooldownTime = 30 * 1000; // 30 SEGUNDOS

    if (timeDiff < cooldownTime) {
      const remainingSeconds = Math.ceil((cooldownTime - timeDiff) / 1000);
      throw new BadRequestException(`Por favor espera ${remainingSeconds} segundos antes de solicitar otro código.`);
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();

    user.verificationCode = newCode;
    user.updatedAt = new Date(); 
    user.createdAt = new Date(); // Reinicia la vida ante el Cron Job
    
    await this.usersService.save(user);

    try {
        await this.mailService.sendMail({
          to: user.email,
          subject: '🔄 Nuevo código de verificación - SimpleShop',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h1>Solicitud de nuevo código</h1>
              <p>Hola <strong>${user.fullname}</strong>,</p>
              <p>Aquí tienes tu nuevo código:</p>
              <h2 style="color: #4F46E5; font-size: 32px; letter-spacing: 5px;">${newCode}</h2>
            </div>
          `,
        });
        this.logger.log(`📧 [REENVÍO] Correo enviado a ${user.email}`);
    } catch (error) {
        this.logger.error('❌ Error reenviando correo', error);
        throw new BadRequestException('No se pudo enviar el correo.');
    }

    return { message: 'Código reenviado correctamente' };
  }

  // 3. VERIFY EMAIL (Esto soluciona el error TS2339)
  async verifyEmail(dto: { email: string, code: string }) {
    const user = await this.usersService.findByEmail(dto.email);
    
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (user.isVerified) {
      throw new BadRequestException('Esta cuenta ya ha sido verificada anteriormente.');
    }

    if (user.verificationCode !== dto.code) {
      this.logger.warn(`Intento fallido de verificación para ${dto.email}`, 'AuthService');
      throw new UnauthorizedException('Código de verificación incorrecto');
    }

    user.isVerified = true;
    user.verificationCode = null as any; 
    await this.usersService.save(user);

    // 👇👇 AGREGA ESTE LOG AQUÍ 👇👇
    this.logger.log(`✅ Cuenta verificada exitosamente: ${user.email}`);
    
    // (Opcional) Si usas auditoría también:
    this.logger.audit('AUTH_VERIFY', 'Cuenta verificada exitosamente', undefined, { email: user.email });

    const tenant = user.tenant; 
    return this.generateAuthResponse(user, tenant);
  }

  // 4. LOGIN (Corregido para redirección)
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    
    if (!user) {
      this.logger.warn(`Login fallido (User not found)`, 'AuthService', { email: dto.email });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isValid = await bcrypt.compare(dto.password, user.password);
    
    if (!isValid) {
      this.logger.warn(`Login fallido (Bad pass)`, 'AuthService', { email: dto.email });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // --- 🛡️ AQUÍ ESTÁ EL CAMBIO CLAVE ---
    if (!user.isVerified) {
      this.logger.warn(`Login bloqueado (No verificado)`, 'AuthService', { email: dto.email });
      
      // CAMBIO IMPORTANTE: Usamos 'code' en lugar de 'error'
      throw new UnauthorizedException({
        message: 'Debes verificar tu correo electrónico antes de iniciar sesión.',
        code: 'ACCOUNT_NOT_VERIFIED', // 👈 ESTO ARREGLA LA REDIRECCIÓN
        email: user.email 
      });
    }

    if (!user.isActive) {
      await this.logger.security('AUTH_BLOCKED', 'Login bloqueado (Usuario inactivo)', { email: user.email });
      throw new UnauthorizedException('⛔ Usuario desactivado por administración');
    }

    const tenant = user.tenant;

    if (user.role !== UserRole.SUPER_ADMIN && tenant && !tenant.isActive) {
      await this.logger.security('AUTH_BLOCKED', 'Login bloqueado (Tienda inactiva)', { email: user.email, tenant: tenant.slug });
      throw new UnauthorizedException('⛔ Tu tienda está suspendida');
    }

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

  // 5. IMPERSONATE
  async impersonate(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) throw new NotFoundException('Usuario objetivo no encontrado');

    if (user.role === UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('No puedes suplantar a otro Super Administrador');
    }

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