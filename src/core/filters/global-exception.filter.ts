import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { InjectDataSource } from '@nestjs/typeorm'; // 👈 Necesario para guardar
import { DataSource } from 'typeorm';             // 👈 Necesario para guardar
import { SystemLog } from '../logger/entities/system-log.entity'; // 👈 Tu ruta correcta
import { LogLevel } from '../logger/enums/log-level.enum'; // Asegúrate que esta ruta al enum sea correcta

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: LoggerService,
    @InjectDataSource() private readonly dataSource: DataSource // 👈 Inyección de BD
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // 1. Determinar Status Code
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // 2. Extraer Mensaje Limpio
    const res: any = exception instanceof HttpException ? exception.getResponse() : null;
    let message = 'Internal server error';

    if (typeof res === 'object' && res?.message) {
      message = Array.isArray(res.message) ? res.message.join(', ') : res.message;
    } else if (typeof res === 'string') {
      message = res;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // 3. CAPTURA Y SANITIZACIÓN DEL PAYLOAD
    const rawBody = request.body || {};
    const body = { ...rawBody }; 

    // Ocultamos datos sensibles
    if (body.password) body.password = '********';
    if (body.token) body.token = '********';
    if (body.creditCard) body.creditCard = '****-****-****-****';
    if (body.cvv) body.cvv = '***';

    // 4. LOGGING EN CONSOLA (Lo que ya tenías)
    const errorContext = `GlobalFilter`;
    const trace = exception instanceof Error ? exception.stack : undefined;
    const metaDataString = JSON.stringify(body); 

    if (status >= 500) {
      this.logger.error(
        `💥 SYSTEM ERROR [${status}] ${request.method} ${request.url} -> ${message} | Body: ${metaDataString}`,
        trace,
        errorContext
      );
    } else {
      this.logger.warn(
        `⚠️ CLIENT ERROR [${status}] ${request.method} ${request.url} -> ${message} | Body: ${metaDataString}`,
        errorContext
      );
    }

    // 🔴 5. GUARDAR EN BASE DE DATOS (NUEVO)
    this.saveLogToDb(status, message, request, body);

    // 6. RESPUESTA AL FRONTEND
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
      payload: body     // Enviamos payload para visualización inmediata en frontend
    });
  }

  // 👇 MÉTODO AUXILIAR PARA INSERTAR EN BD
  private async saveLogToDb(status: number, message: string, request: any, payload: any) {
    try {
      const logRepo = this.dataSource.getRepository(SystemLog);
      
      // Determinamos el nivel del log basado en el status HTTP
      // Asumiendo que LogLevel tiene claves WARN y ERROR
      const level = status >= 500 ? LogLevel.ERROR : LogLevel.WARN;
      
      // Detectamos si es un intento de login para poner una acción clara
      let action = 'EXCEPTION';
      if (request.url.includes('/auth/login')) action = 'AUTH_LOGIN_FAIL';
      else if (status === 404) action = 'HTTP_404';
      else if (status === 403) action = 'ACCESS_DENIED';

      // Intentamos obtener el email (útil si falló el login y no hay user en request)
      const userEmail = request.user?.email || payload.email || null;

      const newLog = logRepo.create({
        level: level,
        action: action,
        message: `[${status}] ${message}`,
        userEmail: userEmail,
        userId: request.user?.id || null, // Si el usuario estaba logueado
        tenantId: request.user?.tenantId || null,
        metadata: payload // Guardamos el body sanitizado en metadata
      });

      await logRepo.save(newLog);
    } catch (e) {
      // Usamos console.error simple para no crear un bucle infinito de logs si falla la BD
      console.error('Error guardando log de excepción en BD:', e);
    }
  }
}