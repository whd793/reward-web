import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * 로깅 미들웨어
 * 게이트웨이 요청 및 응답을 로깅합니다.
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('Gateway');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';

    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');
      const responseTime = Date.now() - startTime;

      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${contentLength}B - ${responseTime}ms - ${ip} ${userAgent}`,
      );
    });

    next();
  }
}
