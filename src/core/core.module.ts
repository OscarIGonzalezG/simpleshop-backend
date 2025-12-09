import { Module, MiddlewareConsumer, RequestMethod, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER, APP_GUARD } from '@nestjs/core';

// Filtros globales
import { GlobalExceptionFilter } from './filters/global-exception.filter';

// Request context
import { RequestContextService } from './request-context/request-context.service';
import { RequestContextMiddleware } from './request-context/request-context.middleware';

// Logger
import { LoggerService } from './logger/logger.service';
import { LoggerInterceptor } from './logger/logger.interceptor';

// Guards
//import { RolesGuard } from './guards/roles.guard';

@Module({
  providers: [
    // Servicios
    RequestContextService,
    LoggerService,

    // Interceptor global (solo Logger, ya NO RequestContext)
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor,
    },

    // Filtro global
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
  exports: [RequestContextService, LoggerService],
})

export class CoreModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
