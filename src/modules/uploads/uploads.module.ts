import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { CloudinaryProvider } from './cloudinary.provider';
import { CoreModule } from '../../core/core.module'; // 👈 Importante

@Module({
  imports: [
    ConfigModule,
    CoreModule, // 👈 Para inyectar LoggerService
  ],
  controllers: [UploadsController],
  providers: [
    UploadsService, 
    CloudinaryProvider
  ],
  exports: [UploadsService],
})
export class UploadsModule {}