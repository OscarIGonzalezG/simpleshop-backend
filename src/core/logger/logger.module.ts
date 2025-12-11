import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerService } from './logger.service';
import { LoggerInterceptor } from './logger.interceptor';
import { SystemLog } from './entities/system-log.entity';
// Asegúrate de importar el módulo donde está tu RequestContextService. 
// Si RequestContextService está en 'CoreModule', importa CoreModule.
// Si no tiene módulo propio, añádelo a providers aquí o usa Global.
import { RequestContextService } from '../request-context/request-context.service'; 

@Global() // 👈 Importante: Para no tener que importarlo en cada feature
@Module({
  imports: [
    TypeOrmModule.forFeature([SystemLog]), // 👈 Esto habilita la inyección del repositorio
  ],
  providers: [
    LoggerService, 
    LoggerInterceptor,
    RequestContextService // Si no tienes un RequestContextModule, ponlo aquí
  ],
  exports: [LoggerService],
})
export class LoggerModule {}