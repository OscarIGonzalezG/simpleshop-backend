import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // Si es un HttpException, usamos su status. Si no, 500.
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Mensaje seguro para el cliente
    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Convertimos siempre la excepción a string para evitar errores em TS
    const errorString =
        exception instanceof Error
        ? exception.stack || exception.message
        : JSON.stringify(exception);

    // Log profesional
    this.logger.error(
      `❌ ERROR ${request.method} ${request.url}`,
      errorString,
    );

    // Respuesta estándar para el cliente
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: message,
    });
  }
}
