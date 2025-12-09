import { Injectable, Scope } from '@nestjs/common';
import { RequestContextService } from '../request-context/request-context.service';

@Injectable({ scope: Scope.DEFAULT })
export class LoggerService {
  constructor(private readonly context: RequestContextService) {}

  private getRequestId(): string {
    try {
      return this.context.requestId || 'system';
    } catch {
      return 'system';
    }
  }

  private formatMessage(level: string, message: string, context?: string) {
    const reqId = this.getRequestId();
    const timestamp = new Date().toISOString();
    const contextTag = context ? `[${context}]` : '';
    
    // Formato: [TIME] [LEVEL] [REQ_ID] [CONTEXT] Message
    return `${timestamp} ${level.toUpperCase().padEnd(5)} [${reqId}] ${contextTag} ${message}`;
  }

  /**
   * Log nivel INFO (Cosas normales)
   */
  log(message: string, context?: string) {
    console.log(this.formatMessage('INFO', message, context));
  }

  /**
   * Log nivel WARN (Cosas raras pero no errores graves, ej: login fallido)
   */
  warn(message: string, context?: string) {
    console.warn(this.formatMessage('WARN', message, context));
  }

  /**
   * Log nivel ERROR (Excepciones)
   */
  error(message: string, trace?: string, context?: string) {
    console.error(this.formatMessage('ERROR', message, context));
    if (trace) {
      console.error(trace);
    }
  }

  // --- Logs de HTTP (Interceptor) ---

  logRequestStart(method: string, url: string) {
    console.log(this.formatMessage('HTTP', `➡️  Incoming: ${method} ${url}`, 'Router'));
  }

  logRequestEnd(method: string, url: string, durationMs: number) {
    console.log(this.formatMessage('HTTP', `⬅️  Completed: ${method} ${url} +${durationMs}ms`, 'Router'));
  }
}