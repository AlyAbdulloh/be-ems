import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { Prisma } from "@internal/prisma/ems";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("ExceptionsFilter");

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let errors: string[] | null = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
        const resMessage = (exceptionResponse as { message?: unknown }).message;
        if (Array.isArray(resMessage)) {
          message = "Validation failed";
          errors = resMessage.map((item) => String(item));
        } else if (typeof resMessage === "string") {
          message = resMessage;
        }
      } else {
        message =
          typeof exceptionResponse === "string"
            ? exceptionResponse
            : "Request failed";
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case "P2002": {
          status = HttpStatus.CONFLICT;
          const fields = (exception.meta?.target as string[] | undefined) ?? [];
          message =
            fields.length > 0
              ? `Unique constraint failed on fields: ${fields.join(", ")}`
              : "A record with the same value already exists";
          break;
        }
        case "P2025":
          status = HttpStatus.NOT_FOUND;
          message = "Record not found";
          break;
        case "P2003":
          status = HttpStatus.BAD_REQUEST;
          message = "Related record does not exist";
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = "Database request could not be processed";
          break;
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = "Invalid database query";
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} - Error: ${
          exception instanceof Error ? exception.message : "Unknown error"
        }`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${status}: ${message}`,
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
