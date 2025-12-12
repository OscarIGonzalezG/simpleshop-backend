import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { RequestContextService } from '../request-context/request-context.service';
import { UserRole } from 'src/modules/users/enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly context: RequestContextService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Leer roles requeridos
    const requiredRoles =
      this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    // 2. Obtener request y user (inyectado por JWT Strategy)
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado.');
    }

    // ───────────────────────────────────────────────
    // SI NO HAY @Roles() → solo require JWT, permitir acceso
    // ───────────────────────────────────────────────
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // ───────────────────────────────────────────────
    // Validación multi-tenant: toda ruta con roles requiere tenantId
    // ───────────────────────────────────────────────
    const tenantId = this.context.get('tenantId');
    if (!tenantId) {
      throw new ForbiddenException('No hay tenant asociado a la petición.');
    }

    // ───────────────────────────────────────────────
    // Validación de rol (convertimos a enum por seguridad)
    // ───────────────────────────────────────────────
    const userRole = user.role as UserRole;

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        `No tienes permisos suficientes. Requiere: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
