import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { EventModule } from './event/event.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from '@app/common';
import { LoggerMiddleware } from '@app/common';
import configuration, { validationSchema } from './config/configuration';

/**
 * 게이트웨이 앱 모듈
 */
@Module({
  imports: [
    // 구성 모듈
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),

    // 마이크로서비스 클라이언트 등록
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('services.auth.host'),
            port: configService.get('services.auth.port'),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'EVENT_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('services.event.host'),
            port: configService.get('services.event.port'),
          },
        }),
        inject: [ConfigService],
      },
    ]),

    // 공통 모듈
    CommonModule,

    // 기능 모듈
    AuthModule,
    EventModule,
  ],
  providers: [
    // 전역 가드 등록
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
