import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventLoggerService } from './event-logger.service';
import { EventLogger, EventLoggerSchema } from '../schemas/event-logger.schema';

/**
 * 이벤트 로거 모듈
 */
@Module({
  imports: [MongooseModule.forFeature([{ name: EventLogger.name, schema: EventLoggerSchema }])],
  providers: [EventLoggerService],
  exports: [EventLoggerService],
})
export class EventLoggerModule {}
