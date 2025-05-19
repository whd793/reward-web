// apps/auth/src/main.ts
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@app/common';

/**
 * 인증 서비스 메인 함수
 */
async function bootstrap() {
  const logger = new Logger('Auth');

  // Create only a microservice
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: 3001,
    },
  });

  // Global pipes and filters
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

  // Start the microservice
  await app.listen();

  logger.log('🎯 Auth microservice is running on port 3001');
}

bootstrap().catch(err => {
  const logger = new Logger('Auth');
  logger.error(`Failed to start auth service: ${err.message}`, err.stack);
  process.exit(1);
});

// import { NestFactory } from '@nestjs/core';
// import { Transport, MicroserviceOptions } from '@nestjs/microservices';
// import { ValidationPipe, Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import { AppModule } from './app.module';
// import helmet from 'helmet';
// import * as compression from 'compression';
// import { HttpExceptionFilter } from '@app/common';

// /**
//  * 인증 서비스 메인 함수
//  */
// async function bootstrap() {
//   const logger = new Logger('Auth');

//   // NestJS 애플리케이션 생성
//   const app = await NestFactory.create(AppModule);
//   const configService = app.get(ConfigService);

//   // 마이크로서비스 연결 설정
//   app.connectMicroservice<MicroserviceOptions>({
//     transport: Transport.TCP,
//     options: {
//       host: '0.0.0.0',
//       port: configService.get<number>('PORT', 3001),
//     },
//   });

//   // 미들웨어 설정
//   app.use(helmet());
//   app.use(compression());

//   // 전역 파이프 및 필터 설정
//   app.useGlobalPipes(
//     new ValidationPipe({
//       whitelist: true,
//       transform: true,
//       forbidNonWhitelisted: true,
//       transformOptions: {
//         enableImplicitConversion: true,
//       },
//     }),
//   );
//   app.useGlobalFilters(new HttpExceptionFilter());

//   // Swagger API 문서 설정
//   if (process.env.NODE_ENV !== 'production') {
//     const options = new DocumentBuilder()
//       .setTitle('인증 서비스 API')
//       .setDescription('이벤트/보상 시스템의 인증 서비스 API')
//       .setVersion('1.0')
//       .addBearerAuth()
//       .build();

//     const document = SwaggerModule.createDocument(app, options);
//     SwaggerModule.setup('api/docs', app, document);
//   }

//   // 마이크로서비스 시작
//   await app.startAllMicroservices();

//   // HTTP 서버 시작 (로컬 개발용)
//   if (process.env.NODE_ENV !== 'production') {
//     await app.listen(configService.get<number>('PORT', 3001));
//     logger.log(`Auth service is running on: ${await app.getUrl()}`);
//   }

//   logger.log(`Auth microservice is running on port: ${configService.get<number>('PORT', 3001)}`);
// }

// bootstrap().catch(err => {
//   const logger = new Logger('Auth');
//   logger.error(`Failed to start auth service: ${err.message}`, err.stack);
//   process.exit(1);
// });
