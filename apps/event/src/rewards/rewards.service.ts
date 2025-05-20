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

  // /**
  //  * 보상 요청
  //  */
  // async requestReward(
  //   requestRewardDto: RequestRewardDto,
  //   userId: string,
  // ): Promise<RewardRequestDocument> {
  //   this.logger.log(`User ${userId} requesting reward for event ${requestRewardDto.eventId}`);

  //   const { eventId, rewardId, idempotencyKey } = requestRewardDto;

  //   // 이벤트 및 보상 존재 여부 확인
  //   const reward = await this.findById(rewardId);

  //   // 보상이 해당 이벤트에 속하는지 확인
  //   if (reward.eventId.toString() !== eventId) {
  //     throw new BadRequestException('보상이 해당 이벤트에 속하지 않습니다.');
  //   }

  //   // 중복 요청 확인용 멱등성 키 생성
  //   const requestKey =
  //     idempotencyKey ||
  //     IdempotencyUtil.generateKeyFromRequest(userId, 'reward_request', { eventId, rewardId });

  //   // 중복 요청 확인
  //   const existingRequest = await this.rewardRequestModel
  //     .findOne({
  //       userId,
  //       eventId,
  //       rewardId,
  //       status: { $in: [RewardRequestStatus.PENDING, RewardRequestStatus.APPROVED] },
  //     })
  //     .exec();

  //   if (existingRequest) {
  //     throw new ConflictException('이미 처리 중이거나 승인된 보상 요청이 있습니다.');
  //   }

  //   // 새 보상 요청 생성
  //   const rewardRequest = new this.rewardRequestModel({
  //     userId,
  //     eventId,
  //     rewardId,
  //     status: RewardRequestStatus.PENDING,
  //     idempotencyKey: requestKey,
  //   });

  //   // 보상 요청 저장 및 처리 시작
  //   const savedRequest = await rewardRequest.save();

  //   // 백그라운드에서 보상 처리
  //   await this.inngestClient.sendRewardProcessEvent(
  //     savedRequest._id.toString(),
  //     userId,
  //     eventId,
  //     rewardId,
  //   );

  //   return savedRequest;
  // }

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

    // 보상 요청 저장
    const savedRequest = await rewardRequest.save();

    // 백그라운드에서 보상 처리 (실패해도 요청은 성공으로 처리)
    try {
      await this.inngestClient.sendRewardProcessEvent(
        savedRequest._id.toString(),
        userId,
        eventId,
        rewardId,
      );
      this.logger.log(`Background processing initiated for request: ${savedRequest._id}`);
    } catch (error) {
      this.logger.warn(`Failed to initiate background processing: ${error.message}`);
      // 백그라운드 처리 실패는 요청 자체를 실패시키지 않음
    }

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
