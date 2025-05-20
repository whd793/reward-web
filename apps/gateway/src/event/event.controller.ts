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
  HttpException,
  HttpStatus,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, catchError, timeout, of } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@app/common';
import { Roles } from '../decorators/roles.decorator';
import { Public } from '../decorators/public.decorator';

/**
 * 이벤트 컨트롤러 (게이트웨이) - 완전한 구현 - 올바른 라우트 순서
 */
@ApiTags('events')
@Controller('events')
export class EventController implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventController.name);
  private isConnected = false;

  constructor(@Inject('EVENT_SERVICE') private eventClient: ClientProxy) {}

  async onModuleInit() {
    try {
      this.logger.log('Attempting to connect to Event Service...');
      await this.eventClient.connect();
      this.isConnected = true;
      this.logger.log('Successfully connected to Event Service');
    } catch (error) {
      this.logger.error('Failed to connect to Event Service on init:', error);
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    try {
      await this.eventClient.close();
      this.logger.log('Disconnected from Event Service');
    } catch (error) {
      this.logger.error('Error closing Event Service connection:', error);
    }
  }

  private async ensureConnection() {
    if (!this.isConnected) {
      try {
        this.logger.log('Attempting to reconnect to Event Service...');
        await this.eventClient.connect();
        this.isConnected = true;
        this.logger.log('Successfully reconnected to Event Service');
      } catch (error) {
        this.logger.error('Failed to reconnect to Event Service:', error);
        throw new HttpException(
          'Unable to connect to Event Service',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
    }
  }

  // =================== EVENT ENDPOINTS (SPECIFIC ROUTES FIRST) ===================

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
    await this.ensureConnection();

    try {
      const result = await firstValueFrom(
        this.eventClient
          .send('event.create', {
            dto: createEventDto,
            userId: req.user.userId,
          })
          .pipe(
            timeout(15000),
            catchError(error => {
              this.logger.error('Microservice error creating event:', error);
              throw new HttpException(
                `Failed to create event: ${error.message || 'Unknown error'}`,
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );

      this.logger.log(`Event created successfully: ${result._id}`);
      return result;
    } catch (error) {
      this.logger.error('Gateway error creating event:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to create event', HttpStatus.INTERNAL_SERVER_ERROR);
    }
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
    await this.ensureConnection();

    try {
      const result = await firstValueFrom(
        this.eventClient.send('event.findAll', paginationDto || {}).pipe(
          timeout(15000),
          catchError(error => {
            this.logger.error('Microservice error finding all events:', error);
            throw new HttpException(
              `Failed to find events: ${error.message || 'Unknown error'}`,
              error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }),
        ),
      );

      this.logger.log(
        `Successfully retrieved ${result?.data?.length || 0} events out of ${result?.meta?.total || 0} total`,
      );
      return result;
    } catch (error) {
      this.logger.error('Gateway error finding all events:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve events from service',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 활성 이벤트 조회 (인증 불필요)
   */
  @Public()
  @Get('active')
  @ApiOperation({ summary: '활성 이벤트 조회' })
  @ApiResponse({ status: 200, description: '활성 이벤트 목록' })
  async findActive(@Query() paginationDto: any) {
    this.logger.log('Finding active events');
    await this.ensureConnection();

    try {
      const result = await firstValueFrom(
        this.eventClient.send('event.findActive', paginationDto || {}).pipe(
          timeout(15000),
          catchError(error => {
            this.logger.error('Microservice error finding active events:', error);
            throw new HttpException(
              `Failed to find active events: ${error.message || 'Unknown error'}`,
              error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }),
        ),
      );

      this.logger.log(`Successfully retrieved ${result?.data?.length || 0} active events`);
      return result;
    } catch (error) {
      this.logger.error('Gateway error finding active events:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve active events from service',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // =================== REWARD ENDPOINTS (SPECIFIC ROUTES FIRST) ===================

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
    await this.ensureConnection();

    try {
      const result = await firstValueFrom(
        this.eventClient
          .send('reward.create', {
            dto: createRewardDto,
            userId: req.user.userId,
          })
          .pipe(
            timeout(15000),
            catchError(error => {
              this.logger.error('Microservice error creating reward:', error);
              throw new HttpException(
                `Failed to create reward: ${error.message || 'Unknown error'}`,
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );

      this.logger.log(`Reward created successfully: ${result._id}`);
      return result;
    } catch (error) {
      this.logger.error('Gateway error creating reward:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to create reward', HttpStatus.INTERNAL_SERVER_ERROR);
    }
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
    await this.ensureConnection();
    try {
      const result = await firstValueFrom(
        this.eventClient
          .send('reward.request', {
            dto: requestRewardDto,
            userId: req.user.userId,
          })
          .pipe(
            timeout(15000),
            catchError(error => {
              this.logger.error('Microservice error requesting reward:', error);
              throw new HttpException(
                `Failed to request reward: ${error.message || 'Unknown error'}`,
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );

      this.logger.log(`Reward request created: ${result._id}`);
      return result;
    } catch (error) {
      this.logger.error('Gateway error requesting reward:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to request reward', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 보상 수령
   */
  @Post('rewards/claim/:requestId')
  @ApiOperation({ summary: '보상 수령' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '보상이 성공적으로 수령됨' })
  async claimReward(@Param('requestId') requestId: string, @Request() req) {
    this.logger.log(`User ${req.user.userId} claiming reward: ${requestId}`);
    await this.ensureConnection();

    try {
      const result = await firstValueFrom(
        this.eventClient
          .send('reward.claim', {
            requestId,
            userId: req.user.userId,
          })
          .pipe(
            timeout(15000),
            catchError(error => {
              this.logger.error('Microservice error claiming reward:', error);
              throw new HttpException(
                `Failed to claim reward: ${error.message || 'Unknown error'}`,
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );

      this.logger.log(`Reward claimed successfully: ${requestId}`);
      return result;
    } catch (error) {
      this.logger.error('Gateway error claiming reward:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to claim reward', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 모든 보상 조회 (운영자/관리자/감사자 전용) - MOVED UP
   */
  @Get('rewards')
  @ApiOperation({ summary: '모든 보상 조회 (운영자/관리자/감사자 전용)' })
  @ApiBearerAuth()
  @Roles(Role.OPERATOR, Role.ADMIN, Role.AUDITOR)
  @ApiResponse({ status: 200, description: '보상 목록' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async findAllRewards(@Query() paginationDto: any) {
    this.logger.log('Finding all rewards');
    await this.ensureConnection();

    try {
      const result = await firstValueFrom(
        this.eventClient.send('reward.findAll', paginationDto || {}).pipe(
          timeout(15000),
          catchError(error => {
            this.logger.error('Microservice error finding all rewards:', error);
            throw new HttpException(
              `Failed to find rewards: ${error.message || 'Unknown error'}`,
              error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }),
        ),
      );

      this.logger.log(`Successfully retrieved ${result?.data?.length || 0} rewards`);
      return result;
    } catch (error) {
      this.logger.error('Gateway error finding all rewards:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve rewards from service',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 사용자별 보상 요청 조회 - MOVED UP
   */
  @Get('rewards/user/requests')
  @ApiOperation({ summary: '사용자별 보상 요청 조회' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '보상 요청 목록' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getUserRequests(@Query() paginationDto: any, @Request() req) {
    this.logger.log(`Getting requests for user: ${req.user.userId}`);
    await this.ensureConnection();

    try {
      const result = await firstValueFrom(
        this.eventClient
          .send('reward.getUserRequests', {
            dto: paginationDto,
            userId: req.user.userId,
          })
          .pipe(
            timeout(15000),
            catchError(error => {
              this.logger.error('Microservice error getting user requests:', error);
              throw new HttpException(
                `Failed to get user requests: ${error.message || 'Unknown error'}`,
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );

      this.logger.log(`Found ${result?.data?.length || 0} requests for user`);
      return result;
    } catch (error) {
      this.logger.error('Gateway error getting user requests:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to get user requests', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 사용자별 대기 중인 보상 조회 - MOVED UP
   */
  @Get('rewards/user/pending')
  @ApiOperation({ summary: '사용자별 대기 중인 보상 조회' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '대기 중인 보상 목록' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getPendingRewards(@Request() req) {
    this.logger.log(`Getting pending rewards for user: ${req.user.userId}`);
    await this.ensureConnection();

    try {
      const result = await firstValueFrom(
        this.eventClient.send('reward.getPendingRewards', req.user.userId).pipe(
          timeout(15000),
          catchError(error => {
            this.logger.error('Microservice error getting pending rewards:', error);
            throw new HttpException(
              `Failed to get pending rewards: ${error.message || 'Unknown error'}`,
              error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }),
        ),
      );

      this.logger.log(`Found ${result?.length || 0} pending rewards for user`);
      return result;
    } catch (error) {
      this.logger.error('Gateway error getting pending rewards:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to get pending rewards', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 모든 보상 요청 조회 (관리자/운영자/감사자 전용) - MOVED UP
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
    await this.ensureConnection();

    try {
      const result = await firstValueFrom(
        this.eventClient
          .send('reward.getAllRequests', {
            dto: paginationDto,
            status,
          })
          .pipe(
            timeout(15000),
            catchError(error => {
              this.logger.error('Microservice error getting all requests:', error);
              throw new HttpException(
                `Failed to get all requests: ${error.message || 'Unknown error'}`,
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );

      this.logger.log(`Found ${result?.data?.length || 0} total requests`);
      return result;
    } catch (error) {
      this.logger.error('Gateway error getting all requests:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to get all requests', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 보상 요청 상태 조회 - MOVED UP
   */
  @Get('rewards/request/:requestId')
  @ApiOperation({ summary: '보상 요청 상태 조회' })
  @ApiBearerAuth()
  async getRequestStatus(@Param('requestId') requestId: string, @Request() req) {
    this.logger.log(`Getting request status: ${requestId}`);
    await this.ensureConnection();

    try {
      const result = await firstValueFrom(
        this.eventClient
          .send('reward.getRequestStatus', {
            requestId,
            userId: req.user.userId,
          })
          .pipe(
            timeout(15000),
            catchError(error => {
              this.logger.error('Microservice error getting request status:', error);
              throw new HttpException(
                `Failed to get request status: ${error.message || 'Unknown error'}`,
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );

      return result;
    } catch (error) {
      this.logger.error('Gateway error getting request status:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to get request status', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 관리자 요청 상태 업데이트 - MOVED UP
   */
  @Patch('rewards/admin/request/:requestId')
  @ApiOperation({ summary: '보상 요청 상태 업데이트 (관리자)' })
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.OPERATOR)
  @ApiResponse({ status: 200, description: '요청 상태가 업데이트됨' })
  async updateRequestStatus(
    @Param('requestId') requestId: string,
    @Body() updateDto: { status: string; reason?: string },
    @Request() req,
  ) {
    this.logger.log(
      `Admin ${req.user.userId} updating request ${requestId} to ${updateDto.status}`,
    );
    await this.ensureConnection();

    try {
      const result = await firstValueFrom(
        this.eventClient
          .send('reward.updateRequestStatus', {
            requestId,
            status: updateDto.status,
            reason: updateDto.reason,
            adminId: req.user.userId,
          })
          .pipe(
            timeout(15000),
            catchError(error => {
              this.logger.error('Microservice error updating request status:', error);
              throw new HttpException(
                `Failed to update request status: ${error.message || 'Unknown error'}`,
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );

      this.logger.log(`Request status updated successfully`);
      return result;
    } catch (error) {
      this.logger.error('Gateway error updating request status:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to update request status', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * ID로 보상 조회 - MOVED UP
   */
  @Get('rewards/:rewardId')
  @ApiOperation({ summary: 'ID로 보상 조회' })
  @ApiResponse({ status: 200, description: '보상 정보' })
  @ApiResponse({ status: 404, description: '보상을 찾을 수 없음' })
  async findRewardById(@Param('rewardId') rewardId: string) {
    this.logger.log(`Finding reward by ID: ${rewardId}`);
    await this.ensureConnection();

    try {
      const result = await firstValueFrom(
        this.eventClient.send('reward.findById', rewardId).pipe(
          timeout(15000),
          catchError(error => {
            this.logger.error('Microservice error finding reward by ID:', error);
            throw new HttpException(
              `Failed to find reward: ${error.message || 'Unknown error'}`,
              error.status || HttpStatus.NOT_FOUND,
            );
          }),
        ),
      );

      this.logger.log(`Successfully found reward: ${result.name}`);
      return result;
    } catch (error) {
      this.logger.error('Gateway error finding reward by ID:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to find reward', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // =================== OTHER SPECIFIC ROUTES (MOVED UP) ===================

  /**
   * 사용자 이벤트 로그 발생 - MOVED UP
   */
  @Post('log')
  @ApiOperation({ summary: '사용자 이벤트 로그 발생' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '이벤트 로그가 생성됨' })
  @ApiResponse({ status: 400, description: '잘못된 입력' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async createEventLog(@Body() eventLogDto: any, @Request() req) {
    this.logger.log(`Creating event log for user ${req.user.userId}: ${eventLogDto.eventType}`);
    await this.ensureConnection();

    try {
      const result = await firstValueFrom(
        this.eventClient
          .send('event.log', {
            userId: req.user.userId,
            eventType: eventLogDto.eventType,
            data: eventLogDto.data,
            timestamp: eventLogDto.timestamp || new Date(),
          })
          .pipe(
            timeout(15000),
            catchError(error => {
              this.logger.error('Microservice error creating event log:', error);
              throw new HttpException(
                `Failed to create event log: ${error.message || 'Unknown error'}`,
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );

      this.logger.log(`Event log created successfully`);
      return result;
    } catch (error) {
      this.logger.error('Gateway error creating event log:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to create event log', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 이벤트 통계 조회 (관리자/운영자/감사자 전용) - MOVED UP
   */
  @Get('statistics/events')
  @ApiOperation({ summary: '이벤트 통계 조회 (관리자/운영자/감사자 전용)' })
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.OPERATOR, Role.AUDITOR)
  @ApiResponse({ status: 200, description: '이벤트 통계' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async getEventStatistics(@Query() query: any) {
    this.logger.log('Getting event statistics');
    await this.ensureConnection();

    try {
      const [allEvents, activeEvents] = await Promise.all([
        firstValueFrom(
          this.eventClient.send('event.findAll', { page: 1, limit: 1 }).pipe(
            timeout(15000),
            catchError(() => of({ data: [], meta: { total: 0 } })),
          ),
        ),
        firstValueFrom(
          this.eventClient.send('event.findActive', { page: 1, limit: 1 }).pipe(
            timeout(15000),
            catchError(() => of({ data: [], meta: { total: 0 } })),
          ),
        ),
      ]);

      const statistics = {
        totalEvents: allEvents.meta?.total || 0,
        activeEvents: activeEvents.meta?.total || 0,
        inactiveEvents: (allEvents.meta?.total || 0) - (activeEvents.meta?.total || 0),
        timestamp: new Date(),
      };

      this.logger.log(`Event statistics retrieved: ${JSON.stringify(statistics)}`);
      return statistics;
    } catch (error) {
      this.logger.error('Gateway error getting event statistics:', error);
      throw new HttpException('Failed to get event statistics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 보상 통계 조회 (관리자/운영자/감사자 전용) - MOVED UP
   */
  @Get('statistics/rewards')
  @ApiOperation({ summary: '보상 통계 조회 (관리자/운영자/감사자 전용)' })
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.OPERATOR, Role.AUDITOR)
  @ApiResponse({ status: 200, description: '보상 통계' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async getRewardStatistics(@Query() query: any) {
    this.logger.log('Getting reward statistics');
    await this.ensureConnection();

    try {
      const [allRewards, allRequests] = await Promise.all([
        firstValueFrom(
          this.eventClient.send('reward.findAll', { page: 1, limit: 1 }).pipe(
            timeout(15000),
            catchError(() => of({ data: [], meta: { total: 0 } })),
          ),
        ),
        firstValueFrom(
          this.eventClient
            .send('reward.getAllRequests', {
              dto: { page: 1, limit: 1 },
            })
            .pipe(
              timeout(15000),
              catchError(() => of({ data: [], meta: { total: 0 } })),
            ),
        ),
      ]);

      const statistics = {
        totalRewards: allRewards.meta?.total || 0,
        totalRequests: allRequests.meta?.total || 0,
        timestamp: new Date(),
      };

      this.logger.log(`Reward statistics retrieved: ${JSON.stringify(statistics)}`);
      return statistics;
    } catch (error) {
      this.logger.error('Gateway error getting reward statistics:', error);
      throw new HttpException('Failed to get reward statistics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 이벤트 서비스 헬스 체크 - MOVED UP
   */
  @Public()
  @Get('health')
  @ApiOperation({ summary: '이벤트 서비스 헬스 체크' })
  @ApiResponse({ status: 200, description: '서비스 상태' })
  async healthCheck() {
    this.logger.log('Performing health check');

    try {
      await this.ensureConnection();

      const healthStatus = {
        status: 'healthy',
        timestamp: new Date(),
        service: 'event-gateway',
        eventServiceConnected: this.isConnected,
        version: '1.0.0',
      };

      return healthStatus;
    } catch (error) {
      this.logger.error('Health check failed:', error);

      const healthStatus = {
        status: 'unhealthy',
        timestamp: new Date(),
        service: 'event-gateway',
        eventServiceConnected: false,
        error: error.message,
        version: '1.0.0',
      };

      throw new HttpException(healthStatus, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  /**
   * 사용자별 이벤트 로그 조회
   */
  @Get('logs/user')
  @ApiOperation({ summary: '사용자별 이벤트 로그 조회' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '사용자 이벤트 로그 목록' })
  async getUserEventLogs(
    @Query() paginationDto: any,
    @Query('eventType') eventType?: string,
    @Request() req?: any,
  ) {
    this.logger.log(`Getting event logs for user: ${req.user.userId}`);
    await this.ensureConnection();

    try {
      const result = await firstValueFrom(
        this.eventClient
          .send('event.getUserLogs', {
            userId: req.user.userId,
            paginationDto: paginationDto || {},
            eventType,
          })
          .pipe(
            timeout(15000),
            catchError(error => {
              this.logger.error('Microservice error getting user logs:', error);
              throw new HttpException(
                `Failed to get user logs: ${error.message || 'Unknown error'}`,
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );

      this.logger.log(`Found ${result?.data?.length || 0} logs for user`);
      return result;
    } catch (error) {
      this.logger.error('Gateway error getting user logs:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to get user logs', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 모든 이벤트 로그 조회 (관리자 전용)
   */
  @Get('logs')
  @ApiOperation({ summary: '모든 이벤트 로그 조회 (관리자 전용)' })
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.OPERATOR, Role.AUDITOR)
  @ApiResponse({ status: 200, description: '모든 이벤트 로그 목록' })
  async getAllEventLogs(
    @Query() paginationDto: any,
    @Query('eventType') eventType?: string,
    @Query('userId') userId?: string,
  ) {
    this.logger.log('Getting all event logs');
    await this.ensureConnection();

    try {
      const result = await firstValueFrom(
        this.eventClient
          .send('event.getAllLogs', {
            paginationDto: paginationDto || {},
            eventType,
            userId,
          })
          .pipe(
            timeout(15000),
            catchError(error => {
              this.logger.error('Microservice error getting all logs:', error);
              throw new HttpException(
                `Failed to get all logs: ${error.message || 'Unknown error'}`,
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );

      this.logger.log(`Found ${result?.data?.length || 0} total logs`);
      return result;
    } catch (error) {
      this.logger.error('Gateway error getting all logs:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to get all logs', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // =================== PARAMETERIZED ROUTES (MOVED TO END) ===================

  /**
   * 이벤트 조건 확인 - SPECIFIC PATTERN, KEEP HERE
   */
  @Post(':eventId/check-condition')
  @ApiOperation({ summary: '이벤트 조건 확인' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '이벤트 조건 확인 결과' })
  @ApiResponse({ status: 400, description: '잘못된 입력' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없음' })
  async checkEventCondition(@Param('eventId') eventId: string, @Request() req) {
    this.logger.log(`Checking event condition for user ${req.user.userId}, event: ${eventId}`);
    await this.ensureConnection();

    try {
      const result = await firstValueFrom(
        this.eventClient
          .send('event.checkCondition', {
            userId: req.user.userId,
            eventId: eventId,
          })
          .pipe(
            timeout(15000),
            catchError(error => {
              this.logger.error('Microservice error checking event condition:', error);
              throw new HttpException(
                `Failed to check event condition: ${error.message || 'Unknown error'}`,
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );

      this.logger.log(`Event condition check result: ${result}`);
      return { eventId, userId: req.user.userId, conditionMet: result };
    } catch (error) {
      this.logger.error('Gateway error checking event condition:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to check event condition', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 이벤트 상태 업데이트 (운영자/관리자 전용) - SPECIFIC PATTERN, KEEP HERE
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
    await this.ensureConnection();

    try {
      const result = await firstValueFrom(
        this.eventClient
          .send('event.updateStatus', {
            id,
            status,
            userId: req.user.userId,
          })
          .pipe(
            timeout(15000),
            catchError(error => {
              this.logger.error('Microservice error updating event status:', error);
              throw new HttpException(
                `Failed to update event status: ${error.message || 'Unknown error'}`,
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );

      this.logger.log(`Event status updated successfully`);
      return result;
    } catch (error) {
      this.logger.error('Gateway error updating event status:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to update event status', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 이벤트 상태 조회
   */
  @Get(':id/status')
  @ApiOperation({ summary: '이벤트 상태 조회' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '이벤트 상태 정보' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없음' })
  async getEventStatus(@Param('id') id: string) {
    this.logger.log(`Getting event status for ID: ${id}`);
    await this.ensureConnection();

    try {
      // Get the full event and return just the status info
      const result = await firstValueFrom(
        this.eventClient.send('event.findById', id).pipe(
          timeout(15000),
          catchError(error => {
            this.logger.error('Microservice error getting event status:', error);
            throw new HttpException(
              `Failed to get event status: ${error.message || 'Unknown error'}`,
              error.status || HttpStatus.NOT_FOUND,
            );
          }),
        ),
      );

      const statusInfo = {
        eventId: result._id,
        name: result.name,
        status: result.status,
        startDate: result.startDate,
        endDate: result.endDate,
        updatedAt: result.updatedAt,
      };

      this.logger.log(`Successfully retrieved event status: ${result.status}`);
      return statusInfo;
    } catch (error) {
      this.logger.error('Gateway error getting event status:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to get event status', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 이벤트별 보상 조회 - MOVED TO END (before most general :id route)
   */
  @Get(':id/rewards')
  @ApiOperation({ summary: '이벤트별 보상 조회' })
  @ApiResponse({ status: 200, description: '보상 목록' })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없음' })
  async findRewardsByEventId(@Param('id') id: string) {
    this.logger.log(`Finding rewards for event: ${id}`);
    await this.ensureConnection();

    try {
      const result = await firstValueFrom(
        this.eventClient.send('reward.findByEventId', id).pipe(
          timeout(15000),
          catchError(error => {
            this.logger.error('Microservice error finding rewards by event ID:', error);
            throw new HttpException(
              `Failed to find rewards: ${error.message || 'Unknown error'}`,
              error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }),
        ),
      );

      this.logger.log(`Found ${result?.length || 0} rewards for event ${id}`);
      return result;
    } catch (error) {
      this.logger.error('Gateway error finding rewards by event ID:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to find rewards', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * ID로 이벤트 조회 - MOVED TO VERY END (most general parameterized route)
   */
  @Get(':id')
  @ApiOperation({ summary: 'ID로 이벤트 조회' })
  @ApiResponse({ status: 200, description: '이벤트 정보' })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없음' })
  async findOne(@Param('id') id: string) {
    this.logger.log(`Finding event by ID: ${id}`);
    await this.ensureConnection();

    try {
      const result = await firstValueFrom(
        this.eventClient.send('event.findById', id).pipe(
          timeout(15000),
          catchError(error => {
            this.logger.error('Microservice error finding event by ID:', error);
            throw new HttpException(
              `Failed to find event: ${error.message || 'Unknown error'}`,
              error.status || HttpStatus.NOT_FOUND,
            );
          }),
        ),
      );

      this.logger.log(`Successfully found event: ${result.name}`);
      return result;
    } catch (error) {
      this.logger.error('Gateway error finding event by ID:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to find event', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
