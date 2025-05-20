// here's my codes and folder

// app/event/src/event/events.controller.ts
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


// app/event/src/event/events.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event, EventDocument, EventStatus } from '../schemas/event.schema';
import { CreateEventDto } from '../dto/create-event.dto';
import { PaginationDto, createPaginatedResponse, PaginatedResponse } from '@app/common';
import { EventLoggerService } from '../event-logger/event-logger.service';
import { EventType } from '@app/common';

/**
 * 이벤트 서비스
 */
@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    private readonly eventLoggerService: EventLoggerService,
  ) {}

  /**
   * 이벤트 생성
   */
  async create(createEventDto: CreateEventDto, userId: string): Promise<EventDocument> {
    this.logger.log(`Creating event: ${createEventDto.name} by user ${userId}`);

    const event = new this.eventModel({
      ...createEventDto,
      createdBy: userId,
    });

    return event.save();
  }

  /**
   * 모든 이벤트 조회 (페이지네이션)
   */
  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponse<EventDocument>> {
    // Provide default values if not provided
    const page = paginationDto?.page || 1;
    const limit = paginationDto?.limit || 10;
    const skip = (page - 1) * limit;

    this.logger.log(`Finding all events with page: ${page}, limit: ${limit}, skip: ${skip}`);

    try {
      const [events, total] = await Promise.all([
        this.eventModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
        this.eventModel.countDocuments().exec(),
      ]);

      this.logger.log(`Found ${events.length} events out of ${total} total`);
      return createPaginatedResponse(events, total, page, limit);
    } catch (error) {
      this.logger.error(`Error finding all events: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 활성 이벤트 조회 (페이지네이션)
   */
  async findActive(paginationDto: PaginationDto): Promise<PaginatedResponse<EventDocument>> {
    const page = paginationDto?.page || 1;
    const limit = paginationDto?.limit || 10;
    const skip = (page - 1) * limit;
    const now = new Date();

    const query = {
      status: EventStatus.ACTIVE,
      startDate: { $lte: now },
      endDate: { $gte: now },
    };

    this.logger.log(`Finding active events with query: ${JSON.stringify(query)}`);

    try {
      const [events, total] = await Promise.all([
        this.eventModel.find(query).sort({ endDate: 1 }).skip(skip).limit(limit).exec(),
        this.eventModel.countDocuments(query).exec(),
      ]);

      this.logger.log(`Found ${events.length} active events out of ${total} total`);
      return createPaginatedResponse(events, total, page, limit);
    } catch (error) {
      this.logger.error(`Error finding active events: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * ID로 이벤트 조회
   */
  async findById(id: string): Promise<EventDocument> {
    const isValidId = Types.ObjectId.isValid(id);

    if (!isValidId) {
      throw new BadRequestException('잘못된 이벤트 ID 형식입니다.');
    }

    const event = await this.eventModel.findById(id).exec();

    if (!event) {
      throw new NotFoundException('이벤트를 찾을 수 없습니다.');
    }

    return event;
  }

  /**
   * 이벤트 유형으로 이벤트 조회
   */
  async findByEventType(eventType: EventType): Promise<EventDocument[]> {
    const now = new Date();

    return this.eventModel
      .find({
        eventType,
        status: EventStatus.ACTIVE,
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
      .exec();
  }

  /**
   * 이벤트 상태 업데이트
   */
  async updateStatus(id: string, status: EventStatus, userId: string): Promise<EventDocument> {
    const event = await this.findById(id);

    this.logger.log(`Updating event status: ${id} to ${status} by user ${userId}`);

    event.status = status;
    return event.save();
  }

  /**
   * 이벤트 조건 충족 여부 확인
   */
  async checkEventCondition(userId: string, event: EventDocument): Promise<boolean> {
    this.logger.log(`Checking event condition for user ${userId}, event: ${event.name}`);

    const { eventType, condition } = event;

    switch (eventType) {
      case EventType.DAILY_LOGIN:
        return this.checkDailyLoginCondition(userId, condition);

      case EventType.INVITE_FRIENDS:
        return this.checkInviteFriendsCondition(userId, condition);

      case EventType.QUEST_COMPLETE:
        return this.checkQuestCompleteCondition(userId, condition);

      case EventType.LEVEL_UP:
        return this.checkLevelUpCondition(userId, condition);

      case EventType.PROFILE_COMPLETE:
        return this.checkProfileCompleteCondition(userId, condition);

      default:
        this.logger.warn(`Unsupported event type: ${eventType}`);
        return false;
    }
  }

  /**
   * 일일 로그인 조건 확인
   */
  private async checkDailyLoginCondition(userId: string, condition: any): Promise<boolean> {
    const consecutiveDays = await this.eventLoggerService.calculateConsecutiveEvents(
      userId,
      EventType.DAILY_LOGIN,
    );

    return consecutiveDays >= condition.consecutiveDays;
  }

  /**
   * 친구 초대 조건 확인
   */
  private async checkInviteFriendsCondition(userId: string, condition: any): Promise<boolean> {
    const logs = await this.eventLoggerService.getUserEventLogs(userId, EventType.INVITE_FRIENDS);

    const invitedFriends = new Set(logs.map(log => log.data.invitedUserId));

    return invitedFriends.size >= condition.friendCount;
  }

  /**
   * 퀘스트 완료 조건 확인
   */
  private async checkQuestCompleteCondition(userId: string, condition: any): Promise<boolean> {
    const logs = await this.eventLoggerService.getUserEventLogs(userId, EventType.QUEST_COMPLETE);

    return logs.some(log => log.data.questId === condition.questId);
  }

  /**
   * 레벨업 조건 확인
   */
  private async checkLevelUpCondition(userId: string, condition: any): Promise<boolean> {
    const logs = await this.eventLoggerService.getUserEventLogs(userId, EventType.LEVEL_UP);

    if (logs.length === 0) {
      return false;
    }

    // 가장 최근 로그에서 현재 레벨 가져오기
    const currentLevel = logs[0].data.newLevel;

    return currentLevel >= condition.targetLevel;
  }

  /**
   * 프로필 완성 조건 확인
   */
  private async checkProfileCompleteCondition(userId: string, condition: any): Promise<boolean> {
    const logs = await this.eventLoggerService.getUserEventLogs(userId, EventType.PROFILE_COMPLETE);

    if (logs.length === 0) {
      return false;
    }

    // 가장 최근 로그에서 완성된 필드 가져오기
    const completedFields = logs[0].data.completedFields || [];

    // 필요한 모든 필드가 완성되었는지 확인
    const requiredFields = condition.requiredFields || [];

    return requiredFields.every(field => completedFields.includes(field));
  }
}


// app/event/src/rewards/rewards.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { Reward, RewardDocument } from '../schemas/reward.schema';
import { CreateRewardDto } from '../dto/create-reward.dto';
import {
  RewardRequest,
  RewardRequestDocument,
  RewardRequestStatus,
} from '../schemas/reward-request.schema';
import { RequestRewardDto } from '../dto/request-reward.dto';
import { ClaimRewardDto } from '../dto/claim-reward.dto';
import { EventsService } from '../events/events.service';
import { InngestClient } from '../inngest/inngest.client';
import {
  PaginationDto,
  createPaginatedResponse,
  PaginatedResponse,
  IdempotencyUtil,
} from '@app/common';

/**
 * 보상 서비스
 */
@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    @InjectModel(Reward.name) private rewardModel: Model<RewardDocument>,
    @InjectModel(RewardRequest.name)
    private rewardRequestModel: Model<RewardRequestDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly eventsService: EventsService,
    private readonly inngestClient: InngestClient,
  ) {}

  /**
   * 보상 생성
   */
  async create(createRewardDto: CreateRewardDto, userId: string): Promise<RewardDocument> {
    this.logger.log(`Creating reward: ${createRewardDto.name} by user ${userId}`);

    // 이벤트 존재 여부 확인
    await this.eventsService.findById(createRewardDto.eventId);

    const reward = new this.rewardModel({
      ...createRewardDto,
      createdBy: userId,
    });

    return reward.save();
  }

  /**
   * 모든 보상 조회 (페이지네이션)
   */
  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponse<RewardDocument>> {
    const page = paginationDto?.page || 1;
    const limit = paginationDto?.limit || 10;
    const skip = (page - 1) * limit;

    try {
      const [rewards, total] = await Promise.all([
        this.rewardModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
        this.rewardModel.countDocuments().exec(),
      ]);

      return createPaginatedResponse(rewards, total, page, limit);
    } catch (error) {
      this.logger.error(`Error finding all rewards: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 이벤트별 보상 조회
   */
  async findByEventId(eventId: string): Promise<RewardDocument[]> {
    return this.rewardModel.find({ eventId }).exec();
  }

  /**
   * ID로 보상 조회
   */
  async findById(id: string): Promise<RewardDocument> {
    const isValidId = Types.ObjectId.isValid(id);

    if (!isValidId) {
      throw new BadRequestException('잘못된 보상 ID 형식입니다.');
    }

    const reward = await this.rewardModel.findById(id).exec();

    if (!reward) {
      throw new NotFoundException('보상을 찾을 수 없습니다.');
    }

    return reward;
  }

  /**
   * 보상 요청
   */
  async requestReward(
    requestRewardDto: RequestRewardDto,
    userId: string,
  ): Promise<RewardRequestDocument> {
    this.logger.log(`User ${userId} requesting reward for event ${requestRewardDto.eventId}`);

    const { eventId, rewardId, idempotencyKey } = requestRewardDto;

    // 이벤트 및 보상 존재 여부 확인
    const reward = await this.findById(rewardId);

    // 보상이 해당 이벤트에 속하는지 확인
    if (reward.eventId.toString() !== eventId) {
      throw new BadRequestException('보상이 해당 이벤트에 속하지 않습니다.');
    }

    // 중복 요청 확인용 멱등성 키 생성
    const requestKey =
      idempotencyKey ||
      IdempotencyUtil.generateKeyFromRequest(userId, 'reward_request', { eventId, rewardId });

    // 중복 요청 확인
    const existingRequest = await this.rewardRequestModel
      .findOne({
        userId,
        eventId,
        rewardId,
        status: { $in: [RewardRequestStatus.PENDING, RewardRequestStatus.APPROVED] },
      })
      .exec();

    if (existingRequest) {
      throw new ConflictException('이미 처리 중이거나 승인된 보상 요청이 있습니다.');
    }

    // 새 보상 요청 생성
    const rewardRequest = new this.rewardRequestModel({
      userId,
      eventId,
      rewardId,
      status: RewardRequestStatus.PENDING,
      idempotencyKey: requestKey,
    });

    // 보상 요청 저장 및 처리 시작
    const savedRequest = await rewardRequest.save();

    // 백그라운드에서 보상 처리
    await this.inngestClient.sendRewardProcessEvent(
      savedRequest._id.toString(),
      userId,
      eventId,
      rewardId,
    );

    return savedRequest;
  }

  /**
   * 보상 요청 상태 조회
   */
  async getRequestStatus(requestId: string): Promise<RewardRequestDocument> {
    const isValidId = Types.ObjectId.isValid(requestId);

    if (!isValidId) {
      throw new BadRequestException('잘못된 요청 ID 형식입니다.');
    }

    const request = await this.rewardRequestModel.findById(requestId).exec();

    if (!request) {
      throw new NotFoundException('보상 요청을 찾을 수 없습니다.');
    }

    return request;
  }

  /**
   * 사용자별 보상 요청 조회 (페이지네이션)
   */
  async getUserRequests(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<RewardRequestDocument>> {
    const page = paginationDto?.page || 1;
    const limit = paginationDto?.limit || 10;
    const skip = (page - 1) * limit;

    try {
      const [requests, total] = await Promise.all([
        this.rewardRequestModel
          .find({ userId })
          .populate('eventId')
          .populate('rewardId')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.rewardRequestModel.countDocuments({ userId }).exec(),
      ]);

      return createPaginatedResponse(requests, total, page, limit);
    } catch (error) {
      this.logger.error(`Error getting user requests: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 사용자별 대기 중인 보상 요청 조회
   */
  async getPendingRewards(userId: string): Promise<RewardRequestDocument[]> {
    return this.rewardRequestModel
      .find({
        userId,
        status: RewardRequestStatus.APPROVED,
        processedAt: { $exists: false },
      })
      .populate('eventId')
      .populate('rewardId')
      .sort({ createdAt: 1 })
      .exec();
  }

  /**
   * 보상 요청 상태 업데이트
   */
  async updateRequestStatus(
    requestId: string,
    status: RewardRequestStatus,
    message?: string,
    session?: any,
  ): Promise<RewardRequestDocument> {
    const isValidId = Types.ObjectId.isValid(requestId);

    if (!isValidId) {
      throw new BadRequestException('잘못된 요청 ID 형식입니다.');
    }

    const options = session ? { session } : {};

    const request = await this.rewardRequestModel.findById(requestId, null, options).exec();

    if (!request) {
      throw new NotFoundException('보상 요청을 찾을 수 없습니다.');
    }

    this.logger.log(`Updating request status: ${requestId} to ${status}`);

    request.status = status;

    if (message) {
      request.message = message;
    }

    if (status === RewardRequestStatus.APPROVED || status === RewardRequestStatus.REJECTED) {
      request.processedAt = new Date();
    }

    return request.save(options);
  }

  /**
   * 보상 지급 완료 처리
   */
  async claimReward(
    requestId: string,
    claimRewardDto: ClaimRewardDto,
    userId: string,
  ): Promise<RewardRequestDocument> {
    const { gameTransactionId, message } = claimRewardDto;

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const request = await this.rewardRequestModel.findById(requestId).session(session).exec();

      if (!request) {
        throw new NotFoundException('보상 요청을 찾을 수 없습니다.');
      }

      // 요청이 APPROVED 상태인지 확인
      if (request.status !== RewardRequestStatus.APPROVED) {
        throw new BadRequestException('승인된 보상 요청만 처리할 수 있습니다.');
      }

      // 이미 처리되었는지 확인
      if (request.processedBy) {
        throw new ConflictException('이미 처리된 보상 요청입니다.');
      }

      this.logger.log(`Claim reward request: ${requestId} by user ${userId}`);

      // 보상 지급 완료 기록
      request.processedBy = userId;
      request.message = message || `게임 트랜잭션 ID: ${gameTransactionId}`;
      request.processedAt = new Date();

      const savedRequest = await request.save({ session });

      await session.commitTransaction();
      return savedRequest;
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Failed to claim reward: ${error.message}`, error.stack);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * 관리자용 보상 요청 상태 업데이트
   */
  async adminUpdateRequestStatus(
    requestId: string,
    status: RewardRequestStatus,
    message: string,
    userId: string,
  ): Promise<RewardRequestDocument> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const request = await this.rewardRequestModel.findById(requestId).session(session).exec();

      if (!request) {
        throw new NotFoundException('보상 요청을 찾을 수 없습니다.');
      }

      this.logger.log(`Admin updating request status: ${requestId} to ${status} by user ${userId}`);

      request.status = status;
      request.message = message || `관리자가 상태를 ${status}(으)로 변경함`;
      request.processedBy = userId;
      request.processedAt = new Date();

      const savedRequest = await request.save({ session });

      await session.commitTransaction();
      return savedRequest;
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Failed to update request status: ${error.message}`, error.stack);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * 모든 보상 요청 조회 (페이지네이션, 관리자용)
   */
  async getAllRequests(
    paginationDto: PaginationDto,
    status?: RewardRequestStatus,
  ): Promise<PaginatedResponse<RewardRequestDocument>> {
    const page = paginationDto?.page || 1;
    const limit = paginationDto?.limit || 10;
    const skip = (page - 1) * limit;

    const query = status ? { status } : {};

    try {
      const [requests, total] = await Promise.all([
        this.rewardRequestModel
          .find(query)
          .populate('eventId')
          .populate('rewardId')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.rewardRequestModel.countDocuments(query).exec(),
      ]);

      return createPaginatedResponse(requests, total, page, limit);
    } catch (error) {
      this.logger.error(`Error getting all requests: ${error.message}`, error.stack);
      throw error;
    }
  }
}



// app/event/src/rewards/rewards.controller.ts
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RewardsService } from './rewards.service';
import { CreateRewardDto } from '../dto/create-reward.dto';
import { RequestRewardDto } from '../dto/request-reward.dto';
import { ClaimRewardDto } from '../dto/claim-reward.dto';
import { UpdateRequestStatusDto } from '../dto/update-request-status.dto';
import { PaginationDto } from '@app/common';
import { RewardRequestStatus } from '../schemas/reward-request.schema';

/**
 * 보상 컨트롤러 (마이크로서비스용)
 */
@Controller()
export class RewardsController {
  private readonly logger = new Logger(RewardsController.name);

  constructor(private readonly rewardsService: RewardsService) {}

  /**
   * 보상 생성 (마이크로서비스 패턴)
   */
  @MessagePattern('reward.create')
  async createReward(@Payload() payload: { dto: CreateRewardDto; userId: string }) {
    this.logger.log(`[Microservice] Creating reward: ${payload.dto.name}`);
    try {
      const result = await this.rewardsService.create(payload.dto, payload.userId);
      this.logger.log(`[Microservice] Reward created successfully: ${result._id}`);
      return result;
    } catch (error) {
      this.logger.error(`[Microservice] Error creating reward: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 모든 보상 조회 (마이크로서비스 패턴)
   */
  @MessagePattern('reward.findAll')
  async findAllRewards(@Payload() paginationDto: PaginationDto) {
    this.logger.log(`[Microservice] Finding all rewards`);
    try {
      const result = await this.rewardsService.findAll(paginationDto);
      this.logger.log(
        `[Microservice] Found ${result.data.length} rewards out of ${result.meta.total} total`,
      );
      return result;
    } catch (error) {
      this.logger.error(`[Microservice] Error finding all rewards: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 이벤트별 보상 조회 (마이크로서비스 패턴)
   */
  @MessagePattern('reward.findByEventId')
  async findRewardsByEventId(@Payload() eventId: string) {
    this.logger.log(`[Microservice] Finding rewards for event: ${eventId}`);
    try {
      const result = await this.rewardsService.findByEventId(eventId);
      this.logger.log(`[Microservice] Found ${result.length} rewards for event`);
      return result;
    } catch (error) {
      this.logger.error(
        `[Microservice] Error finding rewards by event ID: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * ID로 보상 조회 (마이크로서비스 패턴)
   */
  @MessagePattern('reward.findById')
  async findRewardById(@Payload() id: string) {
    this.logger.log(`[Microservice] Finding reward by ID: ${id}`);
    try {
      const result = await this.rewardsService.findById(id);
      this.logger.log(`[Microservice] Found reward: ${result.name}`);
      return result;
    } catch (error) {
      this.logger.error(`[Microservice] Error finding reward by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 보상 요청 (마이크로서비스 패턴)
   */
  @MessagePattern('reward.request')
  async requestReward(@Payload() payload: { dto: RequestRewardDto; userId: string }) {
    this.logger.log(`[Microservice] User ${payload.userId} requesting reward`);
    try {
      const result = await this.rewardsService.requestReward(payload.dto, payload.userId);
      this.logger.log(`[Microservice] Reward request created: ${result._id}`);
      return result;
    } catch (error) {
      this.logger.error(`[Microservice] Error requesting reward: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 사용자별 보상 요청 조회 (마이크로서비스 패턴)
   */
  @MessagePattern('reward.getUserRequests')
  async getUserRewardRequests(@Payload() payload: { dto: PaginationDto; userId: string }) {
    this.logger.log(`[Microservice] Getting requests for user: ${payload.userId}`);
    try {
      const result = await this.rewardsService.getUserRequests(payload.userId, payload.dto);
      this.logger.log(
        `[Microservice] Found ${result.data.length} requests for user out of ${result.meta.total} total`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `[Microservice] Error getting user requests: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 사용자별 대기 중인 보상 조회 (마이크로서비스 패턴)
   */
  @MessagePattern('reward.getPendingRewards')
  async getPendingUserRewards(@Payload() userId: string) {
    this.logger.log(`[Microservice] Getting pending rewards for user: ${userId}`);
    try {
      const result = await this.rewardsService.getPendingRewards(userId);
      this.logger.log(`[Microservice] Found ${result.length} pending rewards for user`);
      return result;
    } catch (error) {
      this.logger.error(
        `[Microservice] Error getting pending rewards: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 보상 지급 완료 처리 (마이크로서비스 패턴)
   */
  @MessagePattern('reward.claim')
  async claimUserReward(@Payload() payload: { id: string; dto: ClaimRewardDto; userId: string }) {
    this.logger.log(`[Microservice] Claiming reward request: ${payload.id}`);
    try {
      const result = await this.rewardsService.claimReward(payload.id, payload.dto, payload.userId);
      this.logger.log(`[Microservice] Reward claimed successfully`);
      return result;
    } catch (error) {
      this.logger.error(`[Microservice] Error claiming reward: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 모든 보상 요청 조회 (마이크로서비스 패턴)
   */
  @MessagePattern('reward.getAllRequests')
  async getAllRewardRequests(
    @Payload() payload: { dto: PaginationDto; status?: RewardRequestStatus },
  ) {
    this.logger.log(`[Microservice] Getting all reward requests`);
    try {
      const result = await this.rewardsService.getAllRequests(payload.dto, payload.status);
      this.logger.log(
        `[Microservice] Found ${result.data.length} total requests out of ${result.meta.total} total`,
      );
      return result;
    } catch (error) {
      this.logger.error(`[Microservice] Error getting all requests: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 보상 요청 상태 업데이트 (마이크로서비스 패턴)
   */
  @MessagePattern('reward.adminUpdateRequestStatus')
  async adminUpdateRewardRequestStatus(
    @Payload() payload: { id: string; dto: UpdateRequestStatusDto; userId: string },
  ) {
    this.logger.log(
      `[Microservice] Admin updating request status: ${payload.id} to ${payload.dto.status}`,
    );
    try {
      const result = await this.rewardsService.adminUpdateRequestStatus(
        payload.id,
        payload.dto.status,
        payload.dto.message,
        payload.userId,
      );
      this.logger.log(`[Microservice] Request status updated successfully`);
      return result;
    } catch (error) {
      this.logger.error(
        `[Microservice] Error admin updating request status: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}


// app/event/src/dto/claim-reward.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

/**
 * 보상 지급 완료 DTO
 */
export class ClaimRewardDto {
  @ApiProperty({
    description: '게임/웹 애플리케이션 내부 트랜잭션 ID',
    example: 'tx_123456789',
  })
  @IsString()
  @IsNotEmpty()
  gameTransactionId: string;

  @ApiProperty({
    description: '지급 메시지',
    example: '보상이 성공적으로 지급되었습니다.',
    required: false,
  })
  @IsOptional()
  @IsString()
  message?: string;
}


// app/event/src/dto/create-event.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDate, IsEnum, IsObject, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { EventStatus, EventApprovalType } from '../schemas/event.schema';
import { EventType } from '@app/common';

/**
 * 이벤트 생성 DTO
 */
export class CreateEventDto {
  @ApiProperty({
    description: '이벤트 이름',
    example: '7일 연속 출석 이벤트',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '이벤트 설명',
    example: '7일 연속으로 로그인하면 보상을 받을 수 있습니다.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: '이벤트 유형',
    enum: EventType,
    example: EventType.DAILY_LOGIN,
  })
  @IsEnum(EventType)
  eventType: EventType;

  @ApiProperty({
    description: '이벤트 조건 (이벤트 유형에 따라 형식이 다름)',
    example: { consecutiveDays: 7 },
  })
  @IsObject()
  condition: Record<string, any>;

  @ApiProperty({
    description: '시작일',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({
    description: '종료일',
    example: '2025-01-31T23:59:59.999Z',
  })
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiProperty({
    description: '이벤트 상태',
    enum: EventStatus,
    default: EventStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus = EventStatus.ACTIVE;

  @ApiProperty({
    description: '승인 유형',
    enum: EventApprovalType,
    default: EventApprovalType.AUTO,
    required: false,
  })
  @IsOptional()
  @IsEnum(EventApprovalType)
  approvalType?: EventApprovalType = EventApprovalType.AUTO;
}


// app/event/src/dto/create-reward.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min, IsEnum, IsMongoId } from 'class-validator';
import { RewardType } from '../schemas/reward.schema';

/**
 * 보상 생성 DTO
 */
export class CreateRewardDto {
  @ApiProperty({
    description: '보상 이름',
    example: '골드 500개',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '보상 설명',
    example: '게임에서 사용 가능한 골드 500개',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: '보상 유형',
    enum: RewardType,
    example: RewardType.CURRENCY,
  })
  @IsEnum(RewardType)
  type: RewardType;

  @ApiProperty({
    description: '보상 값',
    example: 500,
  })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({
    description: '보상 수량',
    example: 1,
  })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: '관련 이벤트 ID',
    example: '5f8f3a7e6b7b1c2a3c4b5a6e',
  })
  @IsMongoId()
  eventId: string;
}

// app/event/src/dto/request-reward.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsMongoId, IsOptional } from 'class-validator';

/**
 * 보상 요청 DTO
 */
export class RequestRewardDto {
  @ApiProperty({
    description: '이벤트 ID',
    example: '5f8f3a7e6b7b1c2a3c4b5a6e',
  })
  @IsMongoId()
  eventId: string;

  @ApiProperty({
    description: '보상 ID',
    example: '5f8f3a7e6b7b1c2a3c4b5a6f',
  })
  @IsMongoId()
  rewardId: string;

  @ApiProperty({
    description: '멱등성 키 (중복 요청 방지용)',
    example: 'abc123-unique-key',
    required: false,
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

// app/event/src/dto/update-request-status.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RewardRequestStatus } from '../schemas/reward-request.schema';

/**
 * 보상 요청 상태 업데이트 DTO
 */
export class UpdateRequestStatusDto {
  @ApiProperty({
    description: '요청 상태',
    enum: RewardRequestStatus,
    example: RewardRequestStatus.APPROVED,
  })
  @IsEnum(RewardRequestStatus)
  @IsNotEmpty()
  status: RewardRequestStatus;

  @ApiProperty({
    description: '상태 변경 메시지',
    example: '관리자 승인',
    required: false,
  })
  @IsOptional()
  @IsString()
  message?: string;
}


// app/gateway/src/event/event.controller.ts

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
 * 이벤트 컨트롤러 (게이트웨이) - 완전한 구현
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

  // =================== EVENT ENDPOINTS ===================

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

  /**
   * ID로 이벤트 조회
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
   * 이벤트 조건 확인
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

  // =================== REWARD ENDPOINTS ===================

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
   * 모든 보상 조회 (운영자/관리자/감사자 전용)
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
   * 이벤트별 보상 조회
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
   * ID로 보상 조회
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

사용자별 보상 요청 조회
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

사용자별 대기 중인 보상 조회
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

모든 보상 요청 조회 (관리자/운영자/감사자 전용)
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

사용자 이벤트 로그 발생
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

이벤트 통계 조회 (관리자/운영자/감사자 전용)
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

보상 통계 조회 (관리자/운영자/감사자 전용)
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

이벤트 서비스 헬스 체크
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
}
