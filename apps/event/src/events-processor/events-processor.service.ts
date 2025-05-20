import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventsService } from '../events/events.service';
import { RewardsService } from '../rewards/rewards.service';
import {
  RewardRequest,
  RewardRequestDocument,
  RewardRequestStatus,
} from '../schemas/reward-request.schema';
import { RequestRewardDto } from '../dto/request-reward.dto';
import { IdempotencyUtil } from '@app/common';

/**
 * 이벤트 프로세서 서비스
 * 이벤트 관련 처리 및 보상 요청 처리를 담당합니다.
 */
@Injectable()
export class EventsProcessorService {
  private readonly logger = new Logger(EventsProcessorService.name);

  constructor(
    @InjectModel(RewardRequest.name) private rewardRequestModel: Model<RewardRequestDocument>,
    private readonly eventsService: EventsService,
    private readonly rewardsService: RewardsService,
    private readonly idempotencyUtil: IdempotencyUtil,
  ) {}

  /**
   * 보상 요청 처리
   * @param userId 사용자 ID
   * @param eventId 이벤트 ID
   * @param requestDto 보상 요청 정보
   * @returns 처리 결과
   */
  async processRewardRequest(
    userId: string,
    eventId: string,
    requestDto: RequestRewardDto,
  ): Promise<RewardRequestDocument> {
    // 이벤트 활성화 여부 확인
    const { isActive, event } = await this.eventsService.isEventActive(eventId);
    if (!isActive || !event) {
      this.logger.warn(`Event ${eventId} is not active or not found`);
      return this.createRewardRequest(
        userId,
        eventId,
        requestDto.rewardId,
        RewardRequestStatus.REJECTED,
        '이벤트가 활성화되지 않았거나 존재하지 않습니다.',
        requestDto.idempotencyKey,
      );
    }

    // 멱등성 키 생성 (제공되지 않은 경우)
    const idempotencyKey =
      requestDto.idempotencyKey ||
      this.idempotencyUtil.generateIdempotencyKey(userId, 'reward_request', eventId);

    // 중복 요청 확인
    const existingRequest = await this.rewardRequestModel.findOne({ idempotencyKey }).exec();
    if (existingRequest) {
      this.logger.log(`Duplicate request detected with key ${idempotencyKey}`);
      return existingRequest;
    }

    let rewardId = requestDto.rewardId;

    // 보상 ID가 제공되지 않은 경우, 이벤트에 연결된 첫 번째 보상 사용
    if (!rewardId) {
      const rewards = await this.rewardsService.findByEventId(eventId);
      if (rewards.length === 0) {
        this.logger.warn(`No rewards found for event ${eventId}`);
        return this.createRewardRequest(
          userId,
          eventId,
          undefined,
          RewardRequestStatus.REJECTED,
          '이벤트에 연결된 보상이 없습니다.',
          idempotencyKey,
        );
      }
      rewardId = rewards[0]._id.toString();
    }

    // 보상 유효성 확인
    try {
      const reward = await this.rewardsService.findById(rewardId);

      // 보상 수량 확인
      if (reward.quantity !== -1 && reward.quantity <= 0) {
        this.logger.warn(`Reward ${rewardId} is out of stock`);
        return this.createRewardRequest(
          userId,
          eventId,
          rewardId,
          RewardRequestStatus.REJECTED,
          '보상 수량이 모두 소진되었습니다.',
          idempotencyKey,
        );
      }
    } catch (error) {
      this.logger.error(`Error validating reward: ${error.message}`, error.stack);
      return this.createRewardRequest(
        userId,
        eventId,
        rewardId,
        RewardRequestStatus.REJECTED,
        '보상을 찾을 수 없거나 유효하지 않습니다.',
        idempotencyKey,
      );
    }

    // 이벤트가 승인이 필요한 경우
    if (event.requiresApproval) {
      this.logger.log(
        `Creating pending reward request for event ${eventId} that requires approval`,
      );
      return this.createRewardRequest(
        userId,
        eventId,
        rewardId,
        RewardRequestStatus.PENDING,
        undefined,
        idempotencyKey,
      );
    }

    // 자동 승인인 경우 보상 즉시 지급
    try {
      // 보상 수량 차감
      await this.rewardsService.decrementQuantity(rewardId);

      // 성공적으로 처리된 요청 생성
      const request = await this.createRewardRequest(
        userId,
        eventId,
        rewardId,
        RewardRequestStatus.COMPLETED,
        undefined,
        idempotencyKey,
      );

      this.logger.log(`Reward request completed successfully for user ${userId}, event ${eventId}`);
      return request;
    } catch (error) {
      this.logger.error(`Error processing reward: ${error.message}`, error.stack);

      // 처리 중 오류가 발생한 경우
      return this.createRewardRequest(
        userId,
        eventId,
        rewardId,
        RewardRequestStatus.FAILED,
        `보상 처리 중 오류가 발생했습니다: ${error.message}`,
        idempotencyKey,
      );
    }
  }

  /**
   * 사용자별 보상 요청 이력 조회
   * @param userId 사용자 ID
   * @param paginationOptions 페이지네이션 옵션
   * @returns 보상 요청 이력
   */
  async getUserRewardRequests(userId: string, paginationOptions: any = {}) {
    const { page = 1, limit = 10 } = paginationOptions;
    const skip = (page - 1) * limit;

    const total = await this.rewardRequestModel.countDocuments({ userId });
    const requests = await this.rewardRequestModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('eventId', 'title description')
      .populate('rewardId', 'name description rewardType rewardValue')
      .exec();

    return {
      items: requests,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 모든 보상 요청 이력 조회 (관리자용)
   * @param options 필터링 및 페이지네이션 옵션
   * @returns 보상 요청 이력
   */
  async getAllRewardRequests(options: any = {}) {
    const { page = 1, limit = 10, status, eventId, userId } = options;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (eventId) {
      filter.eventId = new Types.ObjectId(eventId);
    }

    if (userId) {
      filter.userId = userId;
    }

    const total = await this.rewardRequestModel.countDocuments(filter);
    const requests = await this.rewardRequestModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('eventId', 'title description')
      .populate('rewardId', 'name description rewardType rewardValue')
      .exec();

    return {
      items: requests,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 보상 요청 승인 (관리자용)
   * @param requestId 보상 요청 ID
   * @returns 승인 결과
   */
  async approveRewardRequest(requestId: string): Promise<RewardRequestDocument> {
    if (!Types.ObjectId.isValid(requestId)) {
      throw new Error('유효하지 않은 요청 ID입니다.');
    }

    const request = await this.rewardRequestModel.findById(requestId).exec();
    if (!request) {
      throw new Error('보상 요청을 찾을 수 없습니다.');
    }

    if (request.status !== RewardRequestStatus.PENDING) {
      throw new Error(`현재 상태(${request.status})에서는 승인할 수 없습니다.`);
    }

    try {
      // 보상 수량 차감
      if (request.rewardId) {
        await this.rewardsService.decrementQuantity(request.rewardId.toString());
      }

      // 요청 상태 업데이트
      request.status = RewardRequestStatus.COMPLETED;
      request.processedAt = new Date();
      await request.save();

      this.logger.log(`Reward request ${requestId} approved successfully`);
      return request;
    } catch (error) {
      this.logger.error(`Error approving reward request: ${error.message}`, error.stack);

      // 오류 발생 시 실패 상태로 변경
      request.status = RewardRequestStatus.FAILED;
      request.rejectionReason = `승인 처리 중 오류가 발생했습니다: ${error.message}`;
      request.processedAt = new Date();
      await request.save();

      throw error;
    }
  }

  /**
   * 보상 요청 거부 (관리자용)
   * @param requestId 보상 요청 ID
   * @param reason 거부 사유
   * @returns 거부 결과
   */
  async rejectRewardRequest(requestId: string, reason: string): Promise<RewardRequestDocument> {
    if (!Types.ObjectId.isValid(requestId)) {
      throw new Error('유효하지 않은 요청 ID입니다.');
    }

    const request = await this.rewardRequestModel.findById(requestId).exec();
    if (!request) {
      throw new Error('보상 요청을 찾을 수 없습니다.');
    }

    if (request.status !== RewardRequestStatus.PENDING) {
      throw new Error(`현재 상태(${request.status})에서는 거부할 수 없습니다.`);
    }

    // 요청 상태 업데이트
    request.status = RewardRequestStatus.REJECTED;
    request.rejectionReason = reason || '운영자에 의해 거부되었습니다.';
    request.processedAt = new Date();
    await request.save();

    this.logger.log(`Reward request ${requestId} rejected`);
    return request;
  }

  /**
   * 새 보상 요청 생성
   * @param userId 사용자 ID
   * @param eventId 이벤트 ID
   * @param rewardId 보상 ID (선택적)
   * @param status 요청 상태
   * @param rejectionReason 거부 사유 (선택적)
   * @param idempotencyKey 멱등성 키
   * @returns 생성된 요청
   */
  private async createRewardRequest(
    userId: string,
    eventId: string,
    rewardId?: string,
    status: RewardRequestStatus = RewardRequestStatus.PENDING,
    rejectionReason?: string,
    idempotencyKey?: string,
  ): Promise<RewardRequestDocument> {
    const key =
      idempotencyKey ||
      this.idempotencyUtil.generateIdempotencyKey(userId, 'reward_request', eventId);

    const requestData: any = {
      userId,
      eventId: new Types.ObjectId(eventId),
      status,
      idempotencyKey: key,
    };

    if (rewardId) {
      requestData.rewardId = new Types.ObjectId(rewardId);
    }

    if (rejectionReason) {
      requestData.rejectionReason = rejectionReason;
    }

    if (
      status === RewardRequestStatus.COMPLETED ||
      status === RewardRequestStatus.REJECTED ||
      status === RewardRequestStatus.FAILED
    ) {
      requestData.processedAt = new Date();
    }

    const newRequest = new this.rewardRequestModel(requestData);
    return await newRequest.save();
  }

  /**
   * 특정 ID의 보상 요청 조회
   * @param requestId 보상 요청 ID
   * @returns 보상 요청 정보
   */
  async getRewardRequestById(requestId: string): Promise<RewardRequestDocument> {
    if (!Types.ObjectId.isValid(requestId)) {
      throw new Error('유효하지 않은 요청 ID입니다.');
    }

    const request = await this.rewardRequestModel
      .findById(requestId)
      .populate('eventId', 'title description')
      .populate('rewardId', 'name description rewardType rewardValue')
      .exec();

    if (!request) {
      throw new Error('보상 요청을 찾을 수 없습니다.');
    }

    return request;
  }
}
