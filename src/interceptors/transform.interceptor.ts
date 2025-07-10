import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
  statusCode: number;
  message: string;
  success: boolean;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data) => {
        // If the response already contains data in a nested structure
        // Extract it to avoid double nesting
        const responseData =
          data && typeof data === 'object' && 'data' in data
            ? { ...data }
            : { data };

        return {
          ...responseData,
          statusCode,
          message: responseData.message,
          success:
            responseData.success !== undefined ? responseData.success : true,
        };
      }),
    );
  }
}
