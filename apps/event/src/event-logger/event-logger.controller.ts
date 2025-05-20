// events-log.controller.ts
import { Controller, Post, Body, Request, Logger } from '@nestjs/common';
import { EventLoggerService } from './event-logger.service';
import { EventType } from '@app/common';

@Controller('events/log')
export class EventLoggerController {
  private readonly logger = new Logger(EventLoggerController.name);

  constructor(private readonly eventLoggerService: EventLoggerService) {}

  @Post()
  async createLog(
    @Body() body: { eventType: EventType; data: Record<string, any> },
    @Request() req: any, // assumes you're using some auth middleware
  ) {
    const userId = req.user?.userId ?? 'test-user-id'; // fallback for local test
    this.logger.log(`Creating log for ${userId}, type: ${body.eventType}`);
    return this.eventLoggerService.createLog(userId, body.eventType, body.data);
  }
}
