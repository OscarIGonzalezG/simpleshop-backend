import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

/**
 * RequestContextService
 * * Versión: Singleton (Sin Scope.REQUEST)
 * Esto permite que servicios globales como LoggerService accedan al contexto
 * sin errores de inicialización.
 */
@Injectable()
export class RequestContextService {
  /**
   * AsyncLocalStorage almacena un valor por cada request
   * El valor será un Map<string, any>
   */
  private readonly storage = new AsyncLocalStorage<Map<string, any>>();

  /**
   * Inicializa un nuevo contexto por request.
   * Este método será llamado por un middleware.
   */
  init(callback: () => void) {
    const store = new Map<string, any>();

    // Creamos el requestId automáticamente
    store.set('requestId', randomUUID());

    // Ejecutamos la request dentro del contexto aislado
    this.storage.run(store, callback);
  }

  /**
   * Obtener el Map interno del contexto.
   * Si no existe, se lanza un error para evitar estados inconsistentes.
   */
  private getStore(): Map<string, any> {
    const store = this.storage.getStore();
    if (!store) {
      throw new Error(
        '❌ RequestContext no está inicializado. Falta aplicar el middleware.',
      );
    }
    return store;
  }

  /**
   * Guarda un valor en el contexto.
   */
  set(key: string, value: any) {
    const store = this.getStore();
    store.set(key, value);
  }

  /**
   * Obtener un valor del contexto.
   */
  get<T = any>(key: string): T | undefined {
    const store = this.getStore();
    return store.get(key);
  }

  /**
   * Getter estándar: requestId
   */
  get requestId(): string {
    return this.get<string>('requestId')!;
  }

  /**
   * Getter estándar: userId
   */
  get userId(): string | undefined {
    return this.get<string>('userId');
  }

  /**
   * Getter estándar: tenantId
   */
  get tenantId(): string | undefined {
    return this.get<string>('tenantId');
  }

  /**
   * Getter estándar: role
   */
  get role(): string | undefined {
    return this.get<string>('role');
  }

  /**
   * 👇 Getter estándar: user (Objeto completo)
   */
  get user(): any | undefined {
    return this.get<any>('user');
  }

  // 👇👇 NUEVOS GETTERS PARA LOGS DE INTELIGENCIA 👇👇

  /**
   * Getter para la IP del cliente (guardada por el middleware)
   */
  get ip(): string | undefined {
    return this.get<string>('ip');
  }

  /**
   * Getter para el User Agent (Navegador/Dispositivo)
   */
  get userAgent(): string | undefined {
    return this.get<string>('userAgent');
  }
}