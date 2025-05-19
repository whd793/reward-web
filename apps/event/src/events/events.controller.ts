import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  Logger,
  // UseGuards,
  Request,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from '../dto/create-event.dto';
import { PaginationDto } from '@app/common';
import { EventStatus } from '../schemas/event.schema';
import { Role } from '@app/common';
import { Roles } from '../decorators/roles.decorator';

/**
 * 이벤트 컨트롤러
 */
@ApiTags('events')
@Controller('events')
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(private readonly eventsService: EventsService) {}

  /**
   * 이벤트 생성 (운영자/관리자 전용)
   */
  @Post()
  @ApiOperation({ summary: '이벤트 생성 (운영자/관리자 전용)' })
  @ApiBearerAuth()
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiResponse({ status: 201, description: '이벤트가 성공적으로 생성됨' })
  @ApiResponse({ status: 400, description: '잘못된 입력' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async create(@Body() createEventDto: CreateEventDto, @Request() req) {
    this.logger.log(`Creating event: ${createEventDto.name}`);
    return this.eventsService.create(createEventDto, req.user.userId);
  }

  /**
   * 모든 이벤트 조회 (운영자/관리자/감사자 전용)
   */
  @Get()
  @ApiOperation({ summary: '모든 이벤트 조회 (운영자/관리자/감사자 전용)' })
  @ApiBearerAuth()
  @Roles(Role.OPERATOR, Role.ADMIN, Role.AUDITOR)
  @ApiResponse({ status: 200, description: '이벤트 목록' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async findAll(@Query() paginationDto: PaginationDto) {
    this.logger.log('Finding all events');
    return this.eventsService.findAll(paginationDto);
  }

  /**
   * 활성 이벤트 조회
   */
  @Get('active')
  @ApiOperation({ summary: '활성 이벤트 조회' })
  @ApiResponse({ status: 200, description: '활성 이벤트 목록' })
  async findActive(@Query() paginationDto: PaginationDto) {
    this.logger.log('Finding active events');
    return this.eventsService.findActive(paginationDto);
  }

  /**
   * ID로 이벤트 조회
   */
  @Get(':id')
  @ApiOperation({ summary: 'ID로 이벤트 조회' })
  @ApiResponse({ status: 200, description: '이벤트 정보' })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없음' })
  async findOne(@Param('id') id: string) {
    this.logger.log(`Finding event by ID: ${id}`);
    return this.eventsService.findById(id);
  }

  /**
   * 이벤트 상태 업데이트 (운영자/관리자 전용)
   */
  @Patch(':id/status')
  @ApiOperation({ summary: '이벤트 상태 업데이트 (운영자/관리자 전용)' })
  @ApiBearerAuth()
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiResponse({ status: 200, description: '이벤트 상태가 업데이트됨' })
  @ApiResponse({ status: 400, description: '잘못된 입력' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없음' })
  async updateStatus(@Param('id') id: string, @Body('status') status: EventStatus, @Request() req) {
    this.logger.log(`Updating event status: ${id} to ${status}`);
    return this.eventsService.updateStatus(id, status, req.user.userId);
  }

  /**
   * ID로 이벤트 조회 (마이크로서비스 내부 통신용)
   */
  @MessagePattern('event.findById')
  async findById(@Payload() id: string) {
    this.logger.log(`[Microservice] Finding event by ID: ${id}`);
    return this.eventsService.findById(id);
  }

  /**
   * 이벤트 조건 확인 (마이크로서비스 내부 통신용)
   */
  @MessagePattern('event.checkCondition')
  async checkCondition(@Payload() data: { userId: string; eventId: string }) {
    this.logger.log(
      `[Microservice] Checking event condition for user ${data.userId}, event: ${data.eventId}`,
    );

    const event = await this.eventsService.findById(data.eventId);
    return this.eventsService.checkEventCondition(data.userId, event);
  }
}
