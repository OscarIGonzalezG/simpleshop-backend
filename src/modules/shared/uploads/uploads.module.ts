import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm'; // 👈 Importar TypeOrm
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { CloudinaryProvider } from './cloudinary.provider';
import { CoreModule } from '../../../core/core.module';
import { Tenant } from 'src/modules/saas/tenants/entities/tenant.entity'; // 👈 Importar Entidad

@Module({
  imports: [
    ConfigModule,
    CoreModule,
    // 👇 VITAL: Permite al UploadsService leer y actualizar la tabla Tenants
    TypeOrmModule.forFeature([Tenant]), 
  ],
  controllers: [UploadsController],
  providers: [
    UploadsService, 
    CloudinaryProvider
  ],
  exports: [UploadsService],
})
export class UploadsModule {}