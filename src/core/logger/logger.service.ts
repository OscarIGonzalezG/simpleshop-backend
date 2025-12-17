import { Injectable, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';

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

  // -------------------------------------------------------------------
  // 2. Canales Híbridos
  // -------------------------------------------------------------------

  log(message: string, context?: string, metadata?: any) {
    console.log(this.formatMessage('INFO', message, context));
    if (metadata) {
      this.audit(context || 'INFO', message, LogLevel.INFO, metadata);
    }
  }

  warn(message: string, context?: string, metadata?: any) {
    console.warn(this.formatMessage('WARN', message, context));
    if (metadata) {
      this.audit(context || 'WARN', message, LogLevel.WARN, metadata);
    }
  }

  debug(message: string, data?: any, context?: string) {
    console.log(this.formatMessage('DEBUG', message, context));
    if (data) console.dir(data, { depth: null, colors: true });
  }

  error(message: string, trace?: string, context?: string, metadata?: any) {
    console.error(this.formatMessage('ERROR', message, context));
    if (trace) console.error(trace);

    const payload = { trace, ...metadata };
    this.audit(context || 'SYSTEM_ERROR', message, LogLevel.ERROR, payload);
  }

  // -------------------------------------------------------------------
  // 3. Canal HTTP
  // -------------------------------------------------------------------
  logRequestStart(method: string, url: string) {
    console.log(this.formatMessage('HTTP', `➡️  Incoming: ${method} ${url}`, 'Router'));
  }

  logRequestEnd(method: string, url: string, durationMs: number, statusCode: number = 200) {
    const icon = statusCode >= 400 ? '❌' : '✅';
    const level = statusCode >= 500 ? 'ERROR' : 'HTTP';
    console.log(this.formatMessage(level, `⬅️  ${icon} ${statusCode} ${method} ${url} +${durationMs}ms`, 'Router'));
  }

  // -------------------------------------------------------------------
  // 4. Canal Auditoría (BD)
  // -------------------------------------------------------------------
  async audit(action: string, message: string, level: LogLevel = LogLevel.INFO, metadata?: any) {
    try {
      let userId: string | undefined;
      let tenantId: string | undefined;
      let ip: string | undefined;
      let userAgentRaw: string | undefined;
      
      try {
          userId = this.context.userId;
          tenantId = this.context.tenantId;
          ip = this.context.ip;
          userAgentRaw = this.context.userAgent;
      } catch (err) {
          // Contexto fallido o no existente
      }

      let userEmail: string | undefined; 
      if (metadata && typeof metadata === 'object') {
        userEmail = metadata.email || metadata.userEmail || undefined;
      }

      // 👇👇 CORRECCIÓN DE TIPOS AQUÍ 👇👇
      // Inicializamos explícitamente como string o undefined (nunca null)
      let country: string | undefined;
      let deviceString: string = 'Unknown';

      // 1. Detección de País
      if (ip && ip !== '::1' && ip !== '127.0.0.1') {
          const geo = geoip.lookup(ip);
          // Si geo existe, asignamos country, si no, se queda undefined
          if (geo) {
            country = geo.country;
          }
      }

      // 2. Detección de Dispositivo
      if (userAgentRaw) {
          const parser = new UAParser(userAgentRaw);
          const result = parser.getResult();
          
          const browser = result.browser.name || 'Unknown Browser';
          const os = result.os.name || 'Unknown OS';
          deviceString = `${browser} on ${os}`;
      }
      // 👆👆 FIN CORRECCIÓN 👆👆

      const newLog = this.logRepo.create({
        level,
        action,
        message,
        userId: userId || undefined,
        tenantId: tenantId || undefined,
        userEmail: userEmail || undefined,
        metadata: metadata || {},
        // TypeORM prefiere undefined sobre null para opcionales
        ip: ip || undefined,
        country: country || undefined, 
        device: deviceString,
        userAgent: userAgentRaw || undefined
      });

      this.logRepo.save(newLog).catch(err => console.error('❌ Error guardando log en BD', err));
      
    } catch (e) {
      console.error('❌ Fallo contexto auditoría', e);
    }
  }

  async security(action: string, message: string, metadata?: any) {
    console.log(this.formatMessage('SECURITY', `${action}: ${message}`, 'Audit'));
    return this.audit(action, message, LogLevel.SECURITY, metadata);
  }
}