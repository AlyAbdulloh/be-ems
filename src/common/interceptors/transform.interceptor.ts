import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Response as ExpressResponse } from "express";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface Response<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<Response<T>> {
    const response = context.switchToHttp().getResponse<ExpressResponse>();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data: T): Response<T> => {
        // Paginated response: { message?, data, meta }
        if (isRecord(data) && "data" in data && "meta" in data) {
          return {
            success: true,
            statusCode,
            message:
              typeof data.message === "string"
                ? data.message
                : "Request successful",
            data: data.data as T,
            meta: data.meta,
          };
        }

        let message = "Request successful";
        let responseData: unknown = data;

        if (isRecord(data) && "message" in data) {
          if (typeof data.message === "string") {
            message = data.message;
          }

          const rest = { ...data };
          delete rest.message;
          responseData = Object.keys(rest).length > 0 ? rest : null;
        }

        // Unwrap { data } to avoid double nesting
        if (
          isRecord(responseData) &&
          "data" in responseData &&
          Object.keys(responseData).length === 1
        ) {
          responseData = responseData.data;
        }

        return {
          success: true,
          statusCode,
          message,
          data: responseData as T,
        };
      }),
    );
  }
}
