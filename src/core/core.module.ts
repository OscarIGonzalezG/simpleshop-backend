import { Module, MiddlewareConsumer, RequestMethod, NestModule, Global } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER, APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm'; // 👈 Importar TypeOrmModule

// Entidades
import { SystemLog } from './logger/entities/system-log.entity'; // 👈 Importar la entidad SystemLog

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

@Global() // 👈 RECOMENDACIÓN: Agrega @Global() para no tener que importar CoreModule en cada feature
@Module({
  imports: [
    // 👇 ESTO FALTABA: Habilitar la inyección del repositorio SystemLog en este módulo
    TypeOrmModule.forFeature([SystemLog]), 
  ],
  providers: [
    // Servicios
    RequestContextService,
    LoggerService,

    // Interceptor global (Logger HTTP)
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
  exports: [
    RequestContextService, 
    LoggerService,
    TypeOrmModule // Opcional: exportar TypeOrm si otros servicios del core lo necesitaran
  ],
})
export class CoreModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}