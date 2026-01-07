import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // 👈 Importar
import { PlatformService } from './platform.service';
import { PlatformController } from './platform.controller';
import { SystemLog } from 'src/core/logger/entities/system-log.entity'; // 👈 Importar entidad

@Module({
  imports: [
    TypeOrmModule.forFeature([SystemLog]), // 👈 Registramos la entidad para usarla en el servicio
  ],
  controllers: [PlatformController],
  providers: [PlatformService],
})
export class PlatformModule {}