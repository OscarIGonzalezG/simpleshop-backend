import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContextService } from './request-context.service';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly context: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    /**
     * 🔥 Inicializamos AsyncLocalStorage ANTES de que NestJS
     * ejecute Guards, Strategies o Interceptors.
     */
    this.context.init(() => next());
  }
}
