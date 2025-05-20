import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Event Service');

  try {
    // Create the microservice application
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: 3002,
      },
    });

    // Add global validation pipe
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

    // Start the microservice
    await app.listen();
    logger.log('Event microservice is listening on port 3002');
  } catch (error) {
    logger.error(`Failed to start event service: ${error.message}`, error.stack);
    process.exit(1);
  }
}

bootstrap();
