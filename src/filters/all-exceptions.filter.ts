import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Default error message
    let errorMessage: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
      ) {
        errorMessage = exceptionResponse.message as string | string[];
      } else {
        errorMessage = exception.message;
      }
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
    }

    // Log the error
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${
        exception instanceof Error ? exception.stack : 'Unknown error'
      }`,
    );

    response.status(status).json({
      data: null,
      statusCode: status,
      message: Array.isArray(errorMessage) ? errorMessage[0] : errorMessage,
      success: false,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
