import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContextService } from './request-context.service';
import * as requestIp from 'request-ip';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly context: RequestContextService) {}

use(req: Request, res: Response, next: NextFunction) {
    // 1. Obtener datos crudos
    const clientIp = requestIp.getClientIp(req) || '';
    const userAgent = req.headers['user-agent'] || '';

    /**
     * 🔥 Inicializamos AsyncLocalStorage
     */
    this.context.init(() => {
        // 👇 ESTO ES LO NUEVO:
        // Una vez dentro del contexto, guardamos los datos inmediatamente
        this.context.set('ip', clientIp);
        this.context.set('userAgent', userAgent);

        next();
    });
  }
}
