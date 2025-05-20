import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Auth Service');

  // Create the microservice first
  const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: 3001,
    },
  });

  // Add validation pipe to microservice
  microservice.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Start the microservice
  await microservice.listen();
  logger.log('Auth microservice is listening on port 3001');

  // Create HTTP application (optional, for direct HTTP access)
  const httpApp = await NestFactory.create(AppModule);

  httpApp.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await httpApp.listen(3004);
  logger.log('Auth HTTP server is running on port 3004');
}

bootstrap().catch(err => {
  const logger = new Logger('Auth Service');
  logger.error(`Failed to start auth service: ${err.message}`, err.stack);
  process.exit(1);
});
