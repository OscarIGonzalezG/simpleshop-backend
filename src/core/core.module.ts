import { Module, MiddlewareConsumer, NestModule, Global } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';


import { SystemLog } from './logger/entities/system-log.entity';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { RequestContextService } from './request-context/request-context.service';
import { RequestContextMiddleware } from './request-context/request-context.middleware';
import { LoggerModule } from './logger/logger.module';
import { LoggerInterceptor } from './logger/logger.interceptor';

@Global()
@Module({
  imports: [
    LoggerModule,
  ],
  providers: [
    RequestContextService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
  exports: [RequestContextService, LoggerModule],
})
export class CoreModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}