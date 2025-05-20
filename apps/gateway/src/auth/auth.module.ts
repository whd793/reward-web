import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * 인증 모듈 (게이트웨이)
 */
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('services.auth.host'),
            port: configService.get('services.auth.port'),
          },
        }),
      },
    ]),
  ],
  controllers: [AuthController],
})
export class AuthModule {}
