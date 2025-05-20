import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsModule } from './events/events.module';
import { RewardsModule } from './rewards/rewards.module';
import { EventsProcessorModule } from './events-processor/events-processor.module';
import { CommonModule } from '@app/common';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongodb.uri'),
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
      inject: [ConfigService],
    }),
    CommonModule,
    EventsModule,
    RewardsModule,
    EventsProcessorModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
