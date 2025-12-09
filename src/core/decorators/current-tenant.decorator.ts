import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestContextService } from '../request-context/request-context.service';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    // Si viene desde request.user (Passport)
    if (request.user?.tenantId) {
      return request.user.tenantId;
    }

    // Si viene desde RequestContext
    const context: RequestContextService = request.app.get(RequestContextService);
    return context.get('tenantId');
  },
);
