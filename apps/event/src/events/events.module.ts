import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event, EventSchema } from '../schemas/event.schema';
import { EventLoggerModule } from '../event-logger/event-logger.module';
import { ProcessorsModule } from '../processors/processors.module';
import { InngestModule } from '../inngest/inngest.module';

/**
 * 이벤트 모듈
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]),
    EventLoggerModule,
    ProcessorsModule,
    InngestModule,
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
