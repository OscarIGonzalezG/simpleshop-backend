export enum LogLevel {
  INFO = 'INFO',       // Eventos normales
  WARN = 'WARN',       // Advertencias
  ERROR = 'ERROR',     // Errores de código o excepciones
  SECURITY = 'SECURITY', // Logins, Baneos, Cambios de contraseña
  AUDIT = 'AUDIT'      // Acciones de negocio (Crear producto, Editar tienda)
}