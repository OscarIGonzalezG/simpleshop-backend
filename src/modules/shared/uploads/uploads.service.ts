import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm'; // 👈
import { Repository } from 'typeorm'; // 👈
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

import { LoggerService } from '../../../core/logger/logger.service';
import { LogLevel } from '../../../core/logger/enums/log-level.enum';
import { Tenant } from 'src/modules/saas/tenants/entities/tenant.entity';// 👈 Entidad Tenant
import { RequestContextService } from '../../../core/request-context/request-context.service'; // 👈 Contexto

@Injectable()
export class UploadsService {
  constructor(
    private readonly logger: LoggerService,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>, // 👈 Inyección Repo
    private readonly contextService: RequestContextService, // 👈 Inyección Contexto
  ) {}

  async uploadFile(file: Express.Multer.File): Promise<any> {
    // 1. Obtener Tenant Actual
    const tenantId = this.contextService.tenantId;
    if (!tenantId) throw new BadRequestException('No se pudo identificar la tienda.');

    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant) throw new BadRequestException('Tienda no encontrada.');

    // 2. 🛡️ VALIDACIÓN DE LÍMITE (500MB)
    const fileSizeMB = file.size / (1024 * 1024); // Bytes a MB
    const currentUsage = tenant.currentStorageUsedMB || 0; // Prevenir nulls

    this.logger.debug(`Validando espacio: Usado ${currentUsage.toFixed(2)}MB + Nuevo ${fileSizeMB.toFixed(2)}MB vs Max ${tenant.maxStorageMB}MB`);

    if ((currentUsage + fileSizeMB) > tenant.maxStorageMB) {
      const errorMsg = `⛔ Espacio lleno. Tu plan permite ${tenant.maxStorageMB}MB y ya usaste ${currentUsage.toFixed(2)}MB.`;
      this.logger.warn(`Intento de subida fallido por límite de espacio: Tenant ${tenant.slug}`);
      throw new ForbiddenException(errorMsg);
    }

    // 3. Log de inicio (Debug)
    this.logger.debug(`Iniciando subida a Cloudinary: ${file.originalname}`);

    // 4. Subida a Cloudinary
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `tenants/${tenant.slug}`, // 📂 Organización por carpeta de cliente
          resource_type: 'auto',
        },
        async (error, result) => {
          // A. Manejo de Errores
          if (error) {
            this.logger.error(`Fallo Cloudinary: ${error.message}`, JSON.stringify(error), 'UploadsService');
            return reject(new BadRequestException('Error al subir la imagen a la nube.'));
          }

          if (!result) {
            this.logger.error('Fallo Cloudinary: Resultado vacío', undefined, 'UploadsService');
            return reject(new BadRequestException('Error desconocido al procesar la imagen.'));
          }

          // B. ✅ ÉXITO: Actualizar Base de Datos (Incrementar uso)
          try {
            await this.tenantRepo.increment(
              { id: tenantId }, 
              'currentStorageUsedMB', 
              fileSizeMB
            );
            this.logger.debug(`Espacio actualizado para ${tenant.slug}: +${fileSizeMB.toFixed(4)}MB`);
          } catch (dbError) {
            // No bloqueamos la respuesta si falla esto, pero lo logueamos como error crítico
            this.logger.error('Error actualizando contador de almacenamiento', JSON.stringify(dbError));
          }

          // C. Auditoría
          this.logger.audit(
            'FILE_UPLOAD', 
            `Archivo subido: ${file.originalname}`, 
            LogLevel.INFO,
            { 
              url: result.secure_url, 
              public_id: result.public_id, 
              size_bytes: result.bytes,
              new_storage_usage: (currentUsage + fileSizeMB).toFixed(2)
            }
          );

          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
}