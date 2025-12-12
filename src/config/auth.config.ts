// src/config/auth.config.ts

import { registerAs } from '@nestjs/config';

/**
 * 🔐 AUTH CONFIG
 * Configuración de seguridad y JWT.
 */
export default registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET || 'default_secret_CHANGE_ME',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
}));