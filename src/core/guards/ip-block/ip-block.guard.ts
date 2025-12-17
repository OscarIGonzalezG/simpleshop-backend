import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SecurityService } from '../../../modules/security/security.service';
import * as requestIp from 'request-ip';

@Injectable()
export class IpBlockGuard implements CanActivate {
  constructor(private readonly securityService: SecurityService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const clientIp = requestIp.getClientIp(req);

    if (clientIp && this.securityService.isBlocked(clientIp)) {
      throw new ForbiddenException(`⛔ Tu IP (${clientIp}) ha sido bloqueada por seguridad.`);
    }

    return true;
  }
}