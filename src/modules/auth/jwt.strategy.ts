import { Injectable } from '@nestjs/common';
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
      secretOrKey: config.get<string>('JWT_SECRET') || 'default_secret',
    });
  }

  async validate(payload: any) {
    // payload = { sub, email, tenantId, role }

    const user = await this.usersService.findById(payload.sub);
    if (!user) return null;

    // ===============================
    // 🔥 Guardamos datos en el contexto (multi-tenant real)
    // ===============================
    this.context.set('userId', payload.sub);
    this.context.set('tenantId', payload.tenantId);
    this.context.set('role', payload.role);

    return user; // pasa a CurrentUser()
  }
}
