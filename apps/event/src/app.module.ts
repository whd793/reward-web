import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_FILTER } from '@nestjs/core';
import { EventsModule } from './events/events.module';
import { RewardsModule } from './rewards/rewards.module';
import { ProcessorsModule } from './processors/processors.module';
import { EventLoggerModule } from './event-logger/event-logger.module';
import { InngestModule } from './inngest/inngest.module';
import { CommonModule } from '@app/common';
import { HttpExceptionFilter, LoggerMiddleware } from '@app/common';
import configuration, { validationSchema } from './config/configuration';

/**
 * 이벤트 서비스 앱 모듈
 */
@Module({
  imports: [
    // 구성 모듈
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),

    // MongoDB 연결
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
    }),

    // 공통 모듈
    CommonModule,

    // 기능 모듈
    EventsModule,
    RewardsModule,
    ProcessorsModule,
    EventLoggerModule,
    InngestModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
