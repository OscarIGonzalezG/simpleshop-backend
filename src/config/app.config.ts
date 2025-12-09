import { registerAs } from '@nestjs/config';

/**
 * Configuración general de la aplicación
 *
 * Se carga automáticamente por ConfigModule.forRoot()
 * y se puede acceder como:
 *
 * configService.get('app.port')
 * configService.get('app.env')
 */
export default registerAs('app', () => ({
  name: process.env.APP_NAME || 'SimpleShop',
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  // Prefijo global para la API
  apiPrefix: process.env.API_PREFIX || 'api',
}));
