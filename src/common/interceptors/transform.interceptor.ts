import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: any;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data) => {
        // If data contains meta and data properties, format it for pagination
        if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
          return {
            success: true,
            statusCode,
            message: (data as any).message || 'Request successful',
            data: (data as any).data,
            meta: (data as any).meta,
          };
        }

        const hasMessage = data && typeof data === 'object' && 'message' in data;
        const message = hasMessage ? (data as any).message : 'Request successful';

        let responseData = data;
        if (hasMessage) {
          const { message: _, ...rest } = data as any;
          responseData = Object.keys(rest).length > 0 ? rest : null;
        }

        // If responseData is an object that contains only 'data', unwrap it to avoid double nesting
        if (responseData && typeof responseData === 'object' && 'data' in responseData && Object.keys(responseData).length === 1) {
          responseData = responseData.data;
        }

        return {
          success: true,
          statusCode,
          message,
          data: responseData,
        };
      }),
    );
  }
}
