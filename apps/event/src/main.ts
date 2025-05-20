import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Event Service');

  // Create a microservice only
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: 3002,
    },
  });

  await app.listen();
  logger.log('Event microservice is running on port 3002');
}
bootstrap();

// import { NestFactory } from '@nestjs/core';
// import { Transport } from '@nestjs/microservices';
// import { Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { AppModule } from './app.module';

// async function bootstrap() {
//   const logger = new Logger('Event Service');
//   const app = await NestFactory.create(AppModule);
//   const configService = app.get(ConfigService);

//   const port = configService.get<number>('port') || 3002;

//   // 마이크로서비스 설정
//   app.connectMicroservice({
//     transport: Transport.TCP,
//     options: {
//       host: '0.0.0.0',
//       port,
//     },
//   });

//   await app.startAllMicroservices();
//   logger.log(`Event microservice is running on port ${port}`);
// }

// bootstrap();

// import { NestFactory } from '@nestjs/core';
// import { Transport } from '@nestjs/microservices';
// import { Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { AppModule } from './app.module';

// async function bootstrap() {
//   const logger = new Logger('Event Service');
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
//   logger.log(`Event microservice is running on port ${port}`);
// }

// bootstrap();
