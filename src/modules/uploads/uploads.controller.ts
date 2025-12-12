import { Controller, Post, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';

@Controller('uploads')
@UseGuards(JwtAuthGuard) // 🔒 Seguridad: Nadie anónimo sube archivos
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // Límite: 2MB (ajusta según tu plan de Cloudinary)
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 2 }), 
          // Tipo: Solo imágenes comunes
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const result = await this.uploadsService.uploadFile(file);
    
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  }
}