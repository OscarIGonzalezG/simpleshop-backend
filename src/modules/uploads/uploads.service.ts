import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

import { LoggerService } from '../../core/logger/logger.service';
import { LogLevel } from '../../core/logger/enums/log-level.enum';

@Injectable()
export class UploadsService {
  constructor(private readonly logger: LoggerService) {}

  async uploadFile(file: Express.Multer.File): Promise<any> {
    // 1. Log de inicio (Debug)
    this.logger.debug(`Iniciando subida de archivo: ${file.originalname} (${file.size} bytes)`);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'simpleshop_products',
          resource_type: 'auto',
        },
        (error, result) => {
          // A. Si Cloudinary reporta error explícito
          if (error) {
            this.logger.error(`Fallo subida a Cloudinary: ${error.message}`, JSON.stringify(error), 'UploadsService');
            return reject(new BadRequestException('Error al subir la imagen. Intenta de nuevo.'));
          }

          // B. Validar que result exista (ESTO SOLUCIONA TUS ERRORES DE TYPESCRIPT)
          if (!result) {
            this.logger.error('Fallo subida a Cloudinary: Resultado vacío', undefined, 'UploadsService');
            return reject(new BadRequestException('Error desconocido al procesar la imagen.'));
          }

          // ✅ Éxito: Auditoría (Ahora TypeScript sabe que result NO es undefined)
          this.logger.audit(
            'FILE_UPLOAD', 
            `Archivo subido: ${file.originalname}`, 
            LogLevel.INFO,
            { 
              url: result.secure_url, 
              public_id: result.public_id,
              size: result.bytes 
            }
          );

          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
}