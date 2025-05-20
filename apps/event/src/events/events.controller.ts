import { Controller, Logger, OnModuleInit } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EventsService } from './events.service';
import { CreateEventDto } from '../dto/create-event.dto';
import { PaginationDto } from '@app/common';
import { EventStatus } from '../schemas/event.schema';

/**
 * 이벤트 컨트롤러 (마이크로서비스용)
 */
@Controller()
export class EventsController implements OnModuleInit {
  private readonly logger = new Logger(EventsController.name);

  constructor(private readonly eventsService: EventsService) {}

  onModuleInit() {
    this.logger.log('EventsController initialized with message patterns');
    this.logger.log(
      'Available message patterns: event.create, event.findAll, event.findActive, event.findById, event.updateStatus, event.checkCondition, event.log',
    );
  }

  /**
   * 이벤트 생성 (마이크로서비스 패턴)
   */
  @MessagePattern('event.create')
  async createEvent(@Payload() payload: { dto: CreateEventDto; userId: string }) {
    this.logger.log(`[Microservice] Creating event: ${payload.dto.name}`);
    try {
      const result = await this.eventsService.create(payload.dto, payload.userId);
      this.logger.log(`[Microservice] Event created successfully: ${result._id}`);
      return result;
    } catch (error) {
      this.logger.error(`[Microservice] Error creating event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 모든 이벤트 조회 (마이크로서비스 패턴)
   */
  @MessagePattern('event.findAll')
  async findAllEvents(@Payload() paginationDto: PaginationDto) {
    this.logger.log(
      `[Microservice] Received findAll request with payload: ${JSON.stringify(paginationDto)}`,
    );
    try {
      const result = await this.eventsService.findAll(paginationDto);
      this.logger.log(
        `[Microservice] Found ${result.data.length} events out of ${result.meta.total} total`,
      );
      return result;
    } catch (error) {
      this.logger.error(`[Microservice] Error finding all events: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 활성 이벤트 조회 (마이크로서비스 패턴)
   */
  @MessagePattern('event.findActive')
  async findActiveEvents(@Payload() paginationDto: PaginationDto) {
    this.logger.log(
      `[Microservice] Received findActive request with payload: ${JSON.stringify(paginationDto)}`,
    );
    try {
      const result = await this.eventsService.findActive(paginationDto);
      this.logger.log(
        `[Microservice] Found ${result.data.length} active events out of ${result.meta.total} total`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `[Microservice] Error finding active events: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * ID로 이벤트 조회 (마이크로서비스 패턴)
   */
  @MessagePattern('event.findById')
  async findEventById(@Payload() id: string) {
    this.logger.log(`[Microservice] Finding event by ID: ${id}`);
    try {
      const result = await this.eventsService.findById(id);
      this.logger.log(`[Microservice] Found event: ${result.name}`);
      return result;
    } catch (error) {
      this.logger.error(`[Microservice] Error finding event by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 이벤트 상태 업데이트 (마이크로서비스 패턴)
   */
  @MessagePattern('event.updateStatus')
  async updateEventStatus(@Payload() payload: { id: string; status: EventStatus; userId: string }) {
    this.logger.log(`[Microservice] Updating event status: ${payload.id} to ${payload.status}`);
    try {
      const result = await this.eventsService.updateStatus(
        payload.id,
        payload.status,
        payload.userId,
      );
      this.logger.log(`[Microservice] Event status updated successfully`);
      return result;
    } catch (error) {
      this.logger.error(
        `[Microservice] Error updating event status: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 이벤트 조건 확인 (마이크로서비스 패턴)
   */
  @MessagePattern('event.checkCondition')
  async checkEventCondition(@Payload() data: { userId: string; eventId: string }) {
    this.logger.log(
      `[Microservice] Checking event condition for user ${data.userId}, event: ${data.eventId}`,
    );
    try {
      const event = await this.eventsService.findById(data.eventId);
      const result = await this.eventsService.checkEventCondition(data.userId, event);
      this.logger.log(`[Microservice] Event condition check result: ${result}`);
      return result;
    } catch (error) {
      this.logger.error(
        `[Microservice] Error checking event condition: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 이벤트 로그 생성 (마이크로서비스 패턴)
   */
  @MessagePattern('event.log')
  async createEventLog(
    @Payload() data: { userId: string; eventType: string; data: any; timestamp: Date },
  ) {
    this.logger.log(`[Microservice] Creating event log for user ${data.userId}: ${data.eventType}`);
    try {
      // Simple implementation for now
      const result = {
        success: true,
        message: 'Event log created',
        userId: data.userId,
        eventType: data.eventType,
        timestamp: data.timestamp || new Date(),
      };
      this.logger.log(`[Microservice] Event log created successfully`);
      return result;
    } catch (error) {
      this.logger.error(`[Microservice] Error creating event log: ${error.message}`, error.stack);
      throw error;
    }
  }
}
