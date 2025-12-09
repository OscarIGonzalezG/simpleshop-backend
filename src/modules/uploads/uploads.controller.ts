import { Controller, Post, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';

@Controller('uploads')
@UseGuards(JwtAuthGuard) // 🔒 Solo usuarios logueados pueden subir fotos
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file')) // 'file' es el nombre del campo en el form-data
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 2 }), // Max 2MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const result = await this.uploadsService.uploadFile(file);
    return {
      url: result.secure_url, // Esto es lo que guardarás en la BD de productos
      publicId: result.public_id,
    };
  }
}