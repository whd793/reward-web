import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as compression from 'compression';
import { HttpExceptionFilter } from '@app/common';

/**
 * 게이트웨이 서비스 메인 함수
 */
async function bootstrap() {
  const logger = new Logger('Gateway');

  // NestJS 애플리케이션 생성
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);

  // CORS 설정
  app.enableCors();

  // 미들웨어 설정
  app.use(helmet());
  app.use(compression());

  // 전역 파이프 및 필터 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  // API 경로 접두사 설정
  app.setGlobalPrefix('api');

  // Swagger API 문서 설정
  const options = new DocumentBuilder()
    .setTitle('이벤트/보상 관리 시스템 API')
    .setDescription('이벤트/보상 관리 시스템의 API 문서')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api/docs', app, document);

  // 서버 시작
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  logger.log(`Gateway service is running on: ${await app.getUrl()}`);
}

bootstrap().catch(err => {
  const logger = new Logger('Gateway');
  logger.error(`Failed to start gateway service: ${err.message}`, err.stack);
  process.exit(1);
});
