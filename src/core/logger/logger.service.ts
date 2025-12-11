import { Injectable, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Servicios y Entidades
import { RequestContextService } from '../request-context/request-context.service';
import { SystemLog } from './entities/system-log.entity';
import { LogLevel } from './enums/log-level.enum';

/**
 * LOGGER SERVICE
 * * Servicio centralizado para el registro de eventos.
 * Funciona en Scope.DEFAULT (Singleton) para eficiencia, pero accede
 * al contexto de la request (Scope.REQUEST) a través de RequestContextService.
 */
@Injectable({ scope: Scope.DEFAULT })
export class LoggerService {
  constructor(
    // 1. Inyectamos el contexto para saber QUIÉN está haciendo la petición
    private readonly context: RequestContextService,
    
    // 2. Inyectamos el Repositorio para guardar en Base de Datos
    @InjectRepository(SystemLog)
    private readonly logRepo: Repository<SystemLog>,
  ) {}

  // ===========================================================================
  // 🛠️ MÉTODOS PRIVADOS (Helpers de Formato)
  // ===========================================================================

  /**
   * Obtiene el ID único de la petición actual.
   * Útil para rastrear todos los logs de una misma llamada HTTP.
   */
  private getRequestId(): string {
    try {
      return this.context.requestId || 'system';
    } catch {
      return 'system'; // Fallback si se llama fuera de una petición HTTP (ej: cronjobs)
    }
  }

  /**
   * Da formato bonito para la consola:
   * [FECHA] [NIVEL] [REQ_ID] [CONTEXTO] Mensaje
   */
  private formatMessage(level: string, message: string, context?: string) {
    const reqId = this.getRequestId();
    const timestamp = new Date().toISOString();
    const contextTag = context ? `[${context}]` : '';
    
    return `${timestamp} ${level.toUpperCase().padEnd(5)} [${reqId}] ${contextTag} ${message}`;
  }

  // ===========================================================================
  // 📢 LOGS DE CONSOLA (Efímeros / Depuración)
  // ===========================================================================
  
  /**
   * Nivel INFO: Para trazabilidad normal (ej: "Iniciando servicio...").
   * NO se guarda en base de datos para no llenarla de basura.
   */
  log(message: string, context?: string) {
    console.log(this.formatMessage('INFO', message, context));
  }

  /**
   * Nivel WARN: Cosas que no son errores pero requieren atención.
   * (Solo consola).
   */
  warn(message: string, context?: string) {
    console.warn(this.formatMessage('WARN', message, context));
  }

  // ===========================================================================
  // 💾 LOGS DE AUDITORÍA (Persistentes en BD)
  // ===========================================================================

  /**
   * MÉTODO PRINCIPAL DE AUDITORÍA
   * Guarda un evento en la base de datos y lo imprime en consola.
   * * @param action - Código corto de la acción (ej: 'PRODUCT_CREATE')
   * @param message - Descripción legible para humanos
   * @param level - Nivel de importancia (INFO, SECURITY, ERROR)
   * @param metadata - Objeto JSON con datos extra (ej: { productId: '...' })
   */
  async audit(action: string, message: string, level: LogLevel = LogLevel.INFO, metadata?: any) {
    // 1. Primero imprimimos en consola para verlo en vivo
    console.log(this.formatMessage(level, `${action}: ${message}`, 'Audit'));

    try {
      // 2. Extraemos los datos del contexto "mágicamente" ✨
      // No hace falta pasarlos como parámetros, el RequestContext ya los tiene.
      const userId = this.context.userId;
      const tenantId = this.context.tenantId;
      const role = this.context.role;

      // 3. Preparamos la entidad
      const newLog = this.logRepo.create({
        level,
        action,
        message,
        userId,     // Se guarda NULL si no hay usuario logueado
        tenantId,   // Se guarda NULL si no hay tenant
        metadata: {
          ...metadata,
          roleSnapshot: role // Guardamos qué rol tenía el usuario en ese momento
        }
      });

      // 4. Guardamos en BD (Fire & Forget)
      // Usamos .catch para que si falla la BD, NO se rompa la petición del usuario.
      this.logRepo.save(newLog).catch(err => {
        console.error('❌ Error crítico: No se pudo guardar el log en BD', err);
      });
      
    } catch (e) {
      // Catch por si falla el acceso al contexto
      console.error('❌ Fallo al intentar auditar evento', e);
    }
  }

  /**
   * ATAJO: Eventos de Seguridad 🛡️
   * Úsalo para Logins, Logout, Baneos, Kill Switch.
   * Fuerza el nivel SECURITY.
   */
  async security(action: string, message: string, metadata?: any) {
    return this.audit(action, message, LogLevel.SECURITY, metadata);
  }

  /**
   * ATAJO: Errores del Sistema 💥
   * Guarda el stack trace en la BD para que puedas depurar luego.
   */
  error(message: string, trace?: string, context?: string) {
    // 1. Consola (Importante ver el trace aquí)
    console.error(this.formatMessage('ERROR', message, context));
    if (trace) console.error(trace);

    // 2. Base de Datos
    this.audit('SYSTEM_ERROR', message, LogLevel.ERROR, { 
      trace, 
      context 
    });
  }

  // ===========================================================================
  // 🌐 LOGS HTTP (Para el Interceptor)
  // ===========================================================================
  
  /**
   * Se llama cuando entra una petición HTTP.
   * Solo consola para no saturar la BD (salvo que quieras auditar tráfico).
   */
  logRequestStart(method: string, url: string) {
    console.log(this.formatMessage('HTTP', `➡️  Incoming: ${method} ${url}`, 'Router'));
  }

  /**
   * Se llama cuando termina una petición HTTP.
   */
  logRequestEnd(method: string, url: string, durationMs: number) {
    console.log(this.formatMessage('HTTP', `⬅️  Completed: ${method} ${url} +${durationMs}ms`, 'Router'));
  }
}