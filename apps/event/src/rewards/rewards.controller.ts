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
import { RewardsService } from './rewards.service';
import { CreateRewardDto } from '../dto/create-reward.dto';
import { RequestRewardDto } from '../dto/request-reward.dto';
import { ClaimRewardDto } from '../dto/claim-reward.dto';
import { UpdateRequestStatusDto } from '../dto/update-request-status.dto';
import { PaginationDto } from '@app/common';
import { RewardRequestStatus } from '../schemas/reward-request.schema';
import { Role } from '@app/common';
import { Roles } from '../decorators/roles.decorator';

/**
 * 보상 컨트롤러
 */
@ApiTags('rewards')
@Controller('rewards')
export class RewardsController {
  private readonly logger = new Logger(RewardsController.name);

  constructor(private readonly rewardsService: RewardsService) {}

  /**
   * 보상 생성 (운영자/관리자 전용)
   */
  @Post()
  @ApiOperation({ summary: '보상 생성 (운영자/관리자 전용)' })
  @ApiBearerAuth()
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiResponse({ status: 201, description: '보상이 성공적으로 생성됨' })
  @ApiResponse({ status: 400, description: '잘못된 입력' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async create(@Body() createRewardDto: CreateRewardDto, @Request() req) {
    this.logger.log(`Creating reward: ${createRewardDto.name}`);
    return this.rewardsService.create(createRewardDto, req.user.userId);
  }

  /**
   * 모든 보상 조회 (운영자/관리자/감사자 전용)
   */
  @Get()
  @ApiOperation({ summary: '모든 보상 조회 (운영자/관리자/감사자 전용)' })
  @ApiBearerAuth()
  @Roles(Role.OPERATOR, Role.ADMIN, Role.AUDITOR)
  @ApiResponse({ status: 200, description: '보상 목록' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async findAll(@Query() paginationDto: PaginationDto) {
    this.logger.log('Finding all rewards');
    return this.rewardsService.findAll(paginationDto);
  }

  /**
   * 이벤트별 보상 조회
   */
  @Get('by-event/:eventId')
  @ApiOperation({ summary: '이벤트별 보상 조회' })
  @ApiResponse({ status: 200, description: '보상 목록' })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없음' })
  async findByEventId(@Param('eventId') eventId: string) {
    this.logger.log(`Finding rewards for event: ${eventId}`);
    return this.rewardsService.findByEventId(eventId);
  }

  /**
   * ID로 보상 조회
   */
  @Get(':id')
  @ApiOperation({ summary: 'ID로 보상 조회' })
  @ApiResponse({ status: 200, description: '보상 정보' })
  @ApiResponse({ status: 404, description: '보상을 찾을 수 없음' })
  async findOne(@Param('id') id: string) {
    this.logger.log(`Finding reward by ID: ${id}`);
    return this.rewardsService.findById(id);
  }

  /**
   * 보상 요청
   */
  @Post('request')
  @ApiOperation({ summary: '보상 요청' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: '보상 요청이 생성됨' })
  @ApiResponse({ status: 400, description: '잘못된 입력' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 409, description: '중복 요청' })
  async requestReward(@Body() requestRewardDto: RequestRewardDto, @Request() req) {
    this.logger.log(`User ${req.user.userId} requesting reward`);
    return this.rewardsService.requestReward(requestRewardDto, req.user.userId);
  }

  /**
   * 보상 요청 상태 조회
   */
  @Get('request/:id')
  @ApiOperation({ summary: '보상 요청 상태 조회' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '보상 요청 정보' })
  @ApiResponse({ status: 404, description: '요청을 찾을 수 없음' })
  async getRequestStatus(@Param('id') id: string) {
    this.logger.log(`Getting request status: ${id}`);
    return this.rewardsService.getRequestStatus(id);
  }

  /**
   * 사용자별 보상 요청 조회
   */
  @Get('user/requests')
  @ApiOperation({ summary: '사용자별 보상 요청 조회' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '보상 요청 목록' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getUserRequests(@Query() paginationDto: PaginationDto, @Request() req) {
    this.logger.log(`Getting requests for user: ${req.user.userId}`);
    return this.rewardsService.getUserRequests(req.user.userId, paginationDto);
  }

  /**
   * 사용자별 대기 중인 보상 조회
   */
  @Get('user/pending')
  @ApiOperation({ summary: '사용자별 대기 중인 보상 조회' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '대기 중인 보상 목록' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getPendingRewards(@Request() req) {
    this.logger.log(`Getting pending rewards for user: ${req.user.userId}`);
    return this.rewardsService.getPendingRewards(req.user.userId);
  }

  /**
   * 보상 지급 완료 처리
   */
  @Post('claim/:id')
  @ApiOperation({ summary: '보상 지급 완료 처리' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '보상 지급이 완료됨' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '요청을 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '이미 처리된 요청' })
  async claimReward(
    @Param('id') id: string,
    @Body() claimRewardDto: ClaimRewardDto,
    @Request() req,
  ) {
    this.logger.log(`Claiming reward request: ${id}`);
    return this.rewardsService.claimReward(id, claimRewardDto, req.user.userId);
  }

  /**
   * 모든 보상 요청 조회 (관리자/운영자/감사자 전용)
   */
  @Get('admin/requests')
  @ApiOperation({ summary: '모든 보상 요청 조회 (관리자/운영자/감사자 전용)' })
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.OPERATOR, Role.AUDITOR)
  @ApiResponse({ status: 200, description: '보상 요청 목록' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async getAllRequests(
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: RewardRequestStatus,
  ) {
    this.logger.log('Getting all reward requests');
    return this.rewardsService.getAllRequests(paginationDto, status);
  }

  /**
   * 보상 요청 상태 업데이트 (관리자/운영자 전용)
   */
  @Patch('admin/request/:id')
  @ApiOperation({ summary: '보상 요청 상태 업데이트 (관리자/운영자 전용)' })
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.OPERATOR)
  @ApiResponse({ status: 200, description: '보상 요청 상태가 업데이트됨' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '요청을 찾을 수 없음' })
  async adminUpdateRequestStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateRequestStatusDto,
    @Request() req,
  ) {
    this.logger.log(`Admin updating request status: ${id} to ${updateStatusDto.status}`);
    return this.rewardsService.adminUpdateRequestStatus(
      id,
      updateStatusDto.status,
      updateStatusDto.message,
      req.user.userId,
    );
  }

  /**
   * ID로 보상 조회 (마이크로서비스 내부 통신용)
   */
  @MessagePattern('reward.findById')
  async findById(@Payload() id: string) {
    this.logger.log(`[Microservice] Finding reward by ID: ${id}`);
    return this.rewardsService.findById(id);
  }
}
