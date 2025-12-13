import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerService } from './logger.service';
import { LoggerInterceptor } from './logger.interceptor';
import { SystemLog } from './entities/system-log.entity';


@Global() // 👈 Importante: Para no tener que importarlo en cada feature
@Module({
  imports: [
    TypeOrmModule.forFeature([SystemLog]), // 👈 Esto habilita la inyección del repositorio
  ],
  providers: [
    LoggerService, 
    LoggerInterceptor,
  ],
  exports: [LoggerService, LoggerInterceptor],
})
export class LoggerModule {}