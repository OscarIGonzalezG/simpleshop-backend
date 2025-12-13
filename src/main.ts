import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

// 👇 IMPORTACIONES NECESARIAS PARA EL FILTRO
import { GlobalExceptionFilter } from './core/filters/global-exception.filter';
import { LoggerService } from './core/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // 1. Configuración de Prefijo
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api';
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['/health', '/'], 
  });

  // 2. Pipes Globales (Validación)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 3. CORS
  app.enableCors({
    origin: 'http://localhost:4200',
    credentials: true,
  });

  // 👇 4. REGISTRO DEL FILTRO DE EXCEPCIONES (NUEVO)
  // Obtenemos la instancia del LoggerService para pasársela al filtro
  const logger = app.get(LoggerService);
  const dataSource = app.get(DataSource);

  // 5. Iniciar Servidor
  const port = configService.get<number>('app.port') || 3000;
  await app.listen(port);

  console.log(`🚀 SimpleShop API running on: http://localhost:${port}/${apiPrefix}`);
}
bootstrap();