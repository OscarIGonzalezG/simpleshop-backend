import { Injectable, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Dependencias
import { RequestContextService } from '../request-context/request-context.service';
import { SystemLog } from './entities/system-log.entity';
import { LogLevel } from './enums/log-level.enum';

@Injectable({ scope: Scope.DEFAULT })
export class LoggerService {
  constructor(
    private readonly context: RequestContextService,
    @InjectRepository(SystemLog)
    private readonly logRepo: Repository<SystemLog>,
  ) {}

  // 1. Helpers Privados
  private getRequestId(): string {
    try {
      return this.context.requestId || 'SYSTEM';
    } catch {
      return 'SYSTEM';
    }
  }

  private formatMessage(level: string, message: string, context?: string) {
    const timestamp = new Date().toISOString();
    const reqId = this.getRequestId();
    const contextTag = context ? `[${context}]` : '[System]';
    return `${timestamp} ${level.padEnd(7)} [${reqId}] ${contextTag} ${message}`;
  }

  // 2. Canales Básicos (Consola)
  log(message: string, context?: string) {
    console.log(this.formatMessage('INFO', message, context));
  }

  warn(message: string, context?: string) {
    console.warn(this.formatMessage('WARN', message, context));
  }

  debug(message: string, data?: any, context?: string) {
    console.log(this.formatMessage('DEBUG', message, context));
    if (data) console.dir(data, { depth: null, colors: true });
  }

  // 3. Canal HTTP (Interceptor)
  logRequestStart(method: string, url: string) {
    console.log(this.formatMessage('HTTP', `➡️  Incoming: ${method} ${url}`, 'Router'));
  }

  logRequestEnd(method: string, url: string, durationMs: number, statusCode: number = 200) {
    const icon = statusCode >= 400 ? '❌' : '✅';
    const level = statusCode >= 500 ? 'ERROR' : 'HTTP';
    console.log(this.formatMessage(level, `⬅️  ${icon} ${statusCode} ${method} ${url} +${durationMs}ms`, 'Router'));
  }

  // 4. Canal Auditoría (BD) - ¡AQUÍ ESTÁ LO QUE TE FALTA!
  async audit(action: string, message: string, level: LogLevel = LogLevel.INFO, metadata?: any) {
    console.log(this.formatMessage(level, `${action}: ${message}`, 'Audit'));

    try {
      const userId = this.context.userId;
      const tenantId = this.context.tenantId;

      const newLog = this.logRepo.create({
        level,
        action,
        message,
        userId,
        tenantId,
        metadata: metadata || {},
      });

      // Fire & Forget (No await)
      this.logRepo.save(newLog).catch(err => console.error('❌ Error guardando log', err));
      
    } catch (e) {
      console.error('❌ Fallo contexto auditoría', e);
    }
  }

  async security(action: string, message: string, metadata?: any) {
    return this.audit(action, message, LogLevel.SECURITY, metadata);
  }

  error(message: string, trace?: string, context?: string) {
    console.error(this.formatMessage('ERROR', message, context));
    if (trace) console.error(trace);
    this.audit('SYSTEM_ERROR', message, LogLevel.ERROR, { trace, context });
  }
}