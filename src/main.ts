import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api';
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['/health', '/'], 
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: 'http://localhost:4200',
    credentials: true,
  });

  const port = configService.get<number>('app.port') || 3000;

  await app.listen(port);

  console.log(`🚀 SimpleShop API running on: http://localhost:${port}/${apiPrefix}`);
}
bootstrap();
