import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

import { RequestContextService } from '../../core/request-context/request-context.service';

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
    // payload = { sub, email, tenantId, role }

    // ⚠️ NOTA: Asegúrate de que 'findById' en UsersService traiga la relación 'tenant'.
    // Si no la trae, cambia esto por una consulta al repositorio directo.
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Token inválido o usuario no encontrado');
    }

    // ==========================================================
    // 🚫 KILL SWITCH: Validaciones de Seguridad
    // ==========================================================

    // 1. Validar si el USUARIO fue baneado/desactivado
    // (Asegúrate de tener la columna 'isActive' en tu entidad User)
    if (user.isActive === false) {
      throw new UnauthorizedException('Tu usuario ha sido desactivado por administración.');
    }

    // 2. Validar si la TIENDA fue suspendida
    // EXCEPCIÓN: Si eres SUPER_ADMIN, puedes entrar igual (para dar soporte)
    if (user.role !== 'SUPER_ADMIN' && user.tenant && user.tenant.isActive === false) {
      throw new UnauthorizedException('Tu tienda ha sido suspendida. Contacta a soporte.');
    }

    // ===============================
    // 🔥 Guardamos datos en el contexto (multi-tenant real)
    // ===============================
    this.context.set('userId', payload.sub);
    this.context.set('tenantId', payload.tenantId);
    this.context.set('role', payload.role);

    return user; // Todo OK, pasa al controlador
  }
}
