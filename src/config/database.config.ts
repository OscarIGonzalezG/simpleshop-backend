import { registerAs } from '@nestjs/config';

/**
 * Configuración de la base de datos
 *
 * Se accede con:
 *  configService.get('database.host')
 *  configService.get('database.port')
 */
export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'postgres',

  // Opciones avanzadas
  logging: process.env.DB_LOGGING === 'true',   // default: false
  synchronize:
    process.env.DB_SYNC === 'true' ||
    process.env.NODE_ENV === 'development',     // sincroniza solo en dev
}));

