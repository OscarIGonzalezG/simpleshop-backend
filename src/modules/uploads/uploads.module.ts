import { Module } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { CloudinaryProvider } from './cloudinary.provider';
import { ConfigModule } from '@nestjs/config'; // Necesario para leer .env

@Module({
  imports: [ConfigModule],
  controllers: [UploadsController],
  providers: [UploadsService, CloudinaryProvider],
  exports: [UploadsService],
})
export class UploadsModule {}