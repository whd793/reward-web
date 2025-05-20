import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventLoggerService } from './event-logger.service';
import { EventLoggerController } from './event-logger.controller';

import { EventLogger, EventLoggerSchema } from '../schemas/event-logger.schema';

/**
 * 이벤트 로거 모듈
 */
@Module({
  imports: [MongooseModule.forFeature([{ name: EventLogger.name, schema: EventLoggerSchema }])],
  controllers: [EventLoggerController],

  providers: [EventLoggerService],
  exports: [EventLoggerService],
})
export class EventLoggerModule {}
