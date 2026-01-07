import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RequestContextService } from '../../../core/request-context/request-context.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
    private readonly context: RequestContextService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') || 'default_secret',
    });
  }

  async validate(payload: any) {
    // 1. Buscamos al usuario en la BD en tiempo real
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Token inválido o usuario no encontrado');
    }

    // ==========================================================
    // 🚫 KILL SWITCH: Validaciones de Seguridad
    // ==========================================================

    // 2. Validar si el USUARIO está desactivado
    // Importante: Si 'isActive' es null o undefined, lo tratamos como true (activo) para evitar bloqueos accidentales,
    // a menos que explícitamente sea false.
    if (user.isActive === false) {
      throw new UnauthorizedException('⛔ Tu usuario ha sido desactivado por administración.');
    }

    // 3. Validar si la TIENDA está suspendida
    // EXCEPCIÓN: Si eres SUPER_ADMIN, puedes entrar igual.
    if (user.role !== 'SUPER_ADMIN' && user.tenant && user.tenant.isActive === false) {
      throw new UnauthorizedException('⛔ Tu tienda ha sido suspendida. Contacta a soporte.');
    }

    // ===============================
    // 🔥 Guardamos datos en el contexto
    // ===============================
    this.context.set('userId', payload.sub);
    this.context.set('tenantId', payload.tenantId);
    this.context.set('role', payload.role);
    
    // 👇 ESTA LÍNEA FALTABA: Guardamos el objeto user completo
    // Esto soluciona el error en UsersController (this.context.user)
    this.context.set('user', user);

    return user;
  }
}