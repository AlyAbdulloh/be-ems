import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@internal/prisma/ems';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resMessage = (exceptionResponse as any).message;
        if (Array.isArray(resMessage)) {
          message = 'Validation failed';
          errors = resMessage;
        } else {
          message = resMessage || message;
        }
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Prisma error mapping
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          const fields = (exception.meta?.target as string[]) || [];
          message = `Unique constraint failed on fields: ${fields.join(', ')}`;
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Record not found';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = `Database error: ${exception.message}`;
          break;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log the error stack for debugging if it's a 500 error
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} - Error: ${message}`,
        exception instanceof Error ? exception.stack : '',
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - Warning: ${message}`,
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
