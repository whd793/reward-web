import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * HTTP 예외 필터
 * 모든 HTTP 예외를 일관된 형식으로 변환하는 필터입니다.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: exception.message || null,
      details:
        status === HttpStatus.INTERNAL_SERVER_ERROR
          ? '서버 내부 오류가 발생했습니다'
          : exception.getResponse(),
    };

    // 500 에러는 로깅
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`${request.method} ${request.url}`, exception.stack, 'HttpExceptionFilter');
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - Status ${status}`,
        'HttpExceptionFilter',
      );
    }

    response.status(status).json(errorResponse);
  }
}
