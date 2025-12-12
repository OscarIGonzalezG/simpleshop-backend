// src/config/database.config.ts
import { registerAs } from '@nestjs/config';

/**
 * 🗄️ DATABASE CONFIG
 * Configuración de conexión a PostgreSQL con TypeORM.
 */
export default registerAs('database', () => ({
  type: 'postgres', // 👈 Es bueno ser explícito
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'simpleshop_db',

  // ☁️ Configuración SSL (Requerido para producción en AWS/Render/Neon)
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,

  // 📜 Logging de SQL
  logging: process.env.DB_LOGGING === 'true',

  // ⚠️ SYNCHRONIZE:
  // - TRUE: TypeORM crea/modifica tablas automáticamente (Peligroso en Prod)
  // - FALSE: Debes usar migraciones (Seguro en Prod)
  // Lógica: Solo activo si DB_SYNC es 'true' explícitamente, o si estamos en dev.
  synchronize: 
    process.env.DB_SYNC === 'true' || 
    process.env.NODE_ENV === 'development',
    
  // Cargar entidades automáticamente (útil para no importarlas una a una en el módulo)
  autoLoadEntities: true,
}));