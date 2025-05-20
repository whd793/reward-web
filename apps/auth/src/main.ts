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
// import { Transport } from '@nestjs/microservices';
// import { Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { AppModule } from './app.module';

// async function bootstrap() {
//   const logger = new Logger('Auth Service');
//   const app = await NestFactory.create(AppModule);
//   const configService = app.get(ConfigService);

//   const port = configService.get<number>('port') || 3001;

//   // 마이크로서비스 설정
//   app.connectMicroservice({
//     transport: Transport.TCP,
//     options: {
//       host: '0.0.0.0',
//       port,
//     },
//   });

//   await app.startAllMicroservices();
//   logger.log(`Auth microservice is running on port ${port}`);
// }

// bootstrap();

// import { NestFactory } from '@nestjs/core';
// import { Transport } from '@nestjs/microservices';
// import { Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { AppModule } from './app.module';

// async function bootstrap() {
//   const logger = new Logger('Auth Service');
//   const app = await NestFactory.create(AppModule);
//   const configService = app.get(ConfigService);

//   const port = configService.get<number>('port');

//   // 마이크로서비스 설정
//   app.connectMicroservice({
//     transport: Transport.TCP,
//     options: {
//       host: '0.0.0.0',
//       port,
//     },
//   });

//   await app.startAllMicroservices();
//   logger.log(`Auth microservice is running on port ${port}`);
// }

// bootstrap();
