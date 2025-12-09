import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from './logger.service';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {                     // Implementamos la interfaz NestInterceptor
  constructor(private readonly logger: LoggerService) {}                        // Inyectamos el servicio de logger

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {    // Método interceptador
    // Obtenemos datos del request
    const request = context.switchToHttp().getRequest();                        // Obtenemos el request HTTP
    const { method, url } = request;                                            // Extraemos método y URL

    // Marcamos el inicio
    const start = Date.now();                                                   // Tiempo de inicio
    this.logger.logRequestStart(method, url);                                   // Log al inicio de la request

    // Continuamos con la ejecución normal
    return next.handle().pipe(                                                  // Al completar la request
      tap(() => {                                                               // Usamos tap para ejecutar código al finalizar
        const duration = Date.now() - start;                                    // Calculamos duración
        this.logger.logRequestEnd(method, url, duration);                       // Log al finalizar la request
      }),
    );
  }
}
