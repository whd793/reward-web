// events-log.controller.ts
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EventLoggerService } from './event-logger.service';
import { EventType, PaginationDto } from '@app/common';

@Controller()
export class EventLoggerController {
  private readonly logger = new Logger(EventLoggerController.name);

  constructor(private readonly eventLoggerService: EventLoggerService) {}

  /**
   * 이벤트 로그 생성 (마이크로서비스 패턴)
   */
  @MessagePattern('event.log')
  async createEventLog(
    @Payload()
    data: {
      userId: string;
      eventType: EventType;
      data: Record<string, any>;
      timestamp?: Date;
    },
  ) {
    this.logger.log(`[Microservice] Creating event log for user ${data.userId}: ${data.eventType}`);
    try {
      const result = await this.eventLoggerService.createLog(
        data.userId,
        data.eventType,
        data.data,
      );
      this.logger.log(`[Microservice] Event log created successfully: ${result._id}`);
      return {
        success: true,
        message: 'Event log created',
        logId: result._id,
        userId: data.userId,
        eventType: data.eventType,
        timestamp: result.timestamp,
      };
    } catch (error) {
      this.logger.error(`[Microservice] Error creating event log: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 사용자별 이벤트 로그 조회 (마이크로서비스 패턴)
   */
  @MessagePattern('event.getUserLogs')
  async getUserEventLogs(
    @Payload() payload: { userId: string; paginationDto: PaginationDto; eventType?: EventType },
  ) {
    this.logger.log(`[Microservice] Getting logs for user: ${payload.userId}`);
    try {
      const result = await this.eventLoggerService.getUserEventLogsPaginated(
        payload.userId,
        payload.paginationDto,
        payload.eventType,
      );
      this.logger.log(
        `[Microservice] Found ${result.data.length} logs for user out of ${result.meta.total} total`,
      );
      return result;
    } catch (error) {
      this.logger.error(`[Microservice] Error getting user logs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 모든 이벤트 로그 조회 (마이크로서비스 패턴)
   */
  @MessagePattern('event.getAllLogs')
  async getAllEventLogs(
    @Payload() payload: { paginationDto: PaginationDto; eventType?: EventType; userId?: string },
  ) {
    this.logger.log(`[Microservice] Getting all event logs`);
    try {
      const result = await this.eventLoggerService.getAllEventLogsPaginated(
        payload.paginationDto,
        payload.eventType,
        payload.userId,
      );
      this.logger.log(
        `[Microservice] Found ${result.data.length} logs out of ${result.meta.total} total`,
      );
      return result;
    } catch (error) {
      this.logger.error(`[Microservice] Error getting all logs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 사용자 이벤트 로그 조회 (특정 타입)
   */
  @MessagePattern('event.getUserLogsByType')
  async getUserEventLogsByType(
    @Payload() payload: { userId: string; eventType: EventType; limit?: number },
  ) {
    this.logger.log(`[Microservice] Getting ${payload.eventType} logs for user: ${payload.userId}`);
    try {
      const result = await this.eventLoggerService.getUserEventLogsByType(
        payload.userId,
        payload.eventType,
        payload.limit,
      );
      this.logger.log(`[Microservice] Found ${result.length} ${payload.eventType} logs for user`);
      return result;
    } catch (error) {
      this.logger.error(
        `[Microservice] Error getting user logs by type: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}

// import { Controller, Post, Body, Request, Logger } from '@nestjs/common';
// import { EventLoggerService } from './event-logger.service';
// import { EventType } from '@app/common';

// @Controller('events/log')
// export class EventLoggerController {
//   private readonly logger = new Logger(EventLoggerController.name);

//   constructor(private readonly eventLoggerService: EventLoggerService) {}

//   @Post()
//   async createLog(
//     @Body() body: { eventType: EventType; data: Record<string, any> },
//     @Request() req: any, // assumes you're using some auth middleware
//   ) {
//     const userId = req.user?.userId ?? 'test-user-id'; // fallback for local test
//     this.logger.log(`Creating log for ${userId}, type: ${body.eventType}`);
//     return this.eventLoggerService.createLog(userId, body.eventType, body.data);
//   }
// }
