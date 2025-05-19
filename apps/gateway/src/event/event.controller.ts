import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  Logger,
  Inject,
  Request,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@app/common';
import { Roles } from '../decorators/roles.decorator';

/**
 * 이벤트 컨트롤러 (게이트웨이)
 */
@ApiTags('events')
@Controller('events')
export class EventController {
  private readonly logger = new Logger(EventController.name);

  constructor(@Inject('EVENT_SERVICE') private eventClient: ClientProxy) {}

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
  async create(@Body() createEventDto: any, @Request() req) {
    this.logger.log(`Creating event: ${createEventDto.name}`);

    return firstValueFrom(
      this.eventClient.send('event.create', {
        dto: createEventDto,
        userId: req.user.userId,
      }),
    );
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
  async findAll(@Query() paginationDto: any) {
    this.logger.log('Finding all events');

    return firstValueFrom(this.eventClient.send('event.findAll', paginationDto));
  }

  /**
   * 활성 이벤트 조회
   */
  @Get('active')
  @ApiOperation({ summary: '활성 이벤트 조회' })
  @ApiResponse({ status: 200, description: '활성 이벤트 목록' })
  async findActive(@Query() paginationDto: any) {
    this.logger.log('Finding active events');

    return firstValueFrom(this.eventClient.send('event.findActive', paginationDto));
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

    return firstValueFrom(this.eventClient.send('event.findById', id));
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
  async updateStatus(@Param('id') id: string, @Body('status') status: string, @Request() req) {
    this.logger.log(`Updating event status: ${id} to ${status}`);

    return firstValueFrom(
      this.eventClient.send('event.updateStatus', {
        id,
        status,
        userId: req.user.userId,
      }),
    );
  }

  /**
   * 보상 생성 (운영자/관리자 전용)
   */
  @Post('rewards')
  @ApiOperation({ summary: '보상 생성 (운영자/관리자 전용)' })
  @ApiBearerAuth()
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiResponse({ status: 201, description: '보상이 성공적으로 생성됨' })
  @ApiResponse({ status: 400, description: '잘못된 입력' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async createReward(@Body() createRewardDto: any, @Request() req) {
    this.logger.log(`Creating reward: ${createRewardDto.name}`);

    return firstValueFrom(
      this.eventClient.send('reward.create', {
        dto: createRewardDto,
        userId: req.user.userId,
      }),
    );
  }

  /**
   * 이벤트별 보상 조회
   */
  @Get(':id/rewards')
  @ApiOperation({ summary: '이벤트별 보상 조회' })
  @ApiResponse({ status: 200, description: '보상 목록' })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없음' })
  async findRewardsByEventId(@Param('id') id: string) {
    this.logger.log(`Finding rewards for event: ${id}`);

    return firstValueFrom(this.eventClient.send('reward.findByEventId', id));
  }

  /**
   * 보상 요청
   */
  @Post('rewards/request')
  @ApiOperation({ summary: '보상 요청' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: '보상 요청이 생성됨' })
  @ApiResponse({ status: 400, description: '잘못된 입력' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 409, description: '중복 요청' })
  async requestReward(@Body() requestRewardDto: any, @Request() req) {
    this.logger.log(`User ${req.user.userId} requesting reward`);

    return firstValueFrom(
      this.eventClient.send('reward.request', {
        dto: requestRewardDto,
        userId: req.user.userId,
      }),
    );
  }

  /**
   * 사용자별 보상 요청 조회
   */
  @Get('rewards/user/requests')
  @ApiOperation({ summary: '사용자별 보상 요청 조회' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '보상 요청 목록' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getUserRequests(@Query() paginationDto: any, @Request() req) {
    this.logger.log(`Getting requests for user: ${req.user.userId}`);

    return firstValueFrom(
      this.eventClient.send('reward.getUserRequests', {
        dto: paginationDto,
        userId: req.user.userId,
      }),
    );
  }

  /**
   * 사용자별 대기 중인 보상 조회
   */
  @Get('rewards/user/pending')
  @ApiOperation({ summary: '사용자별 대기 중인 보상 조회' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '대기 중인 보상 목록' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getPendingRewards(@Request() req) {
    this.logger.log(`Getting pending rewards for user: ${req.user.userId}`);

    return firstValueFrom(this.eventClient.send('reward.getPendingRewards', req.user.userId));
  }

  /**
   * 보상 지급 완료 처리
   */
  @Post('rewards/claim/:id')
  @ApiOperation({ summary: '보상 지급 완료 처리' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '보상 지급이 완료됨' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '요청을 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '이미 처리된 요청' })
  async claimReward(@Param('id') id: string, @Body() claimRewardDto: any, @Request() req) {
    this.logger.log(`Claiming reward request: ${id}`);

    return firstValueFrom(
      this.eventClient.send('reward.claim', {
        id,
        dto: claimRewardDto,
        userId: req.user.userId,
      }),
    );
  }

  /**
   * 모든 보상 요청 조회 (관리자/운영자/감사자 전용)
   */
  @Get('rewards/admin/requests')
  @ApiOperation({ summary: '모든 보상 요청 조회 (관리자/운영자/감사자 전용)' })
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.OPERATOR, Role.AUDITOR)
  @ApiResponse({ status: 200, description: '보상 요청 목록' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async getAllRequests(@Query() paginationDto: any, @Query('status') status?: string) {
    this.logger.log('Getting all reward requests');

    return firstValueFrom(
      this.eventClient.send('reward.getAllRequests', {
        dto: paginationDto,
        status,
      }),
    );
  }

  /**
   * 보상 요청 상태 업데이트 (관리자/운영자 전용)
   */
  @Patch('rewards/admin/request/:id')
  @ApiOperation({ summary: '보상 요청 상태 업데이트 (관리자/운영자 전용)' })
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.OPERATOR)
  @ApiResponse({ status: 200, description: '보상 요청 상태가 업데이트됨' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '요청을 찾을 수 없음' })
  async adminUpdateRequestStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: any,
    @Request() req,
  ) {
    this.logger.log(`Admin updating request status: ${id} to ${updateStatusDto.status}`);

    return firstValueFrom(
      this.eventClient.send('reward.adminUpdateRequestStatus', {
        id,
        dto: updateStatusDto,
        userId: req.user.userId,
      }),
    );
  }

  /**
   * 사용자 이벤트 로그 발생
   */
  @Post('log')
  @ApiOperation({ summary: '사용자 이벤트 로그 발생' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '이벤트 로그가 생성됨' })
  @ApiResponse({ status: 400, description: '잘못된 입력' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async createEventLog(@Body() eventLogDto: any, @Request() req) {
    this.logger.log(`Creating event log for user ${req.user.userId}: ${eventLogDto.eventType}`);

    return firstValueFrom(
      this.eventClient.send('event.log', {
        userId: req.user.userId,
        eventType: eventLogDto.eventType,
        data: eventLogDto.data,
        timestamp: eventLogDto.timestamp || new Date(),
      }),
    );
  }
}
