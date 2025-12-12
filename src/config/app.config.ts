// src/config/app.config.ts

import { registerAs } from '@nestjs/config';

/**
 * 🌍 APP CONFIG
 * Configuración general de la instancia del servidor.
 */
export default registerAs('app', () => ({
  name: process.env.APP_NAME || 'SimpleShop',
  env: process.env.NODE_ENV || 'development',
  // Aseguramos que el puerto sea siempre un número
  port: parseInt(process.env.PORT || '3000', 10),
  
  // Prefijo global (ej: localhost:3000/api)
  apiPrefix: process.env.API_PREFIX || 'api',
  
  // URL del frontend (útil para CORS)
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
}));