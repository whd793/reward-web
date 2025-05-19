import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * 이벤트 모듈 (게이트웨이)
 */
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'EVENT_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('services.event.host'),
            port: configService.get('services.event.port'),
          },
        }),
      },
    ]),
  ],
  controllers: [EventController],
})
export class EventModule {}
