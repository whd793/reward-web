import { Controller, HttpException, HttpStatus, Logger } from '@nestjs/common';
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

  // /**
  //  * 보상 지급 완료 처리 (마이크로서비스 패턴)
  //  */
  // @MessagePattern('reward.claim')
  // async claimUserReward(@Payload() payload: { id: string; dto: ClaimRewardDto; userId: string }) {
  //   this.logger.log(`[Microservice] Claiming reward request: ${payload.id}`);
  //   try {
  //     const result = await this.rewardsService.claimReward(payload.id, payload.dto, payload.userId);
  //     this.logger.log(`[Microservice] Reward claimed successfully`);
  //     return result;
  //   } catch (error) {
  //     this.logger.error(`[Microservice] Error claiming reward: ${error.message}`, error.stack);
  //     throw error;
  //   }
  // }

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

  // 추가 api .

  /**
   * 보상 요청 상태 조회 (마이크로서비스 패턴)
   */
  @MessagePattern('reward.getRequestStatus')
  async getRequestStatus(@Payload() data: { requestId: string; userId: string }) {
    this.logger.log(`[Microservice] Getting request status: ${data.requestId}`);
    try {
      const result = await this.rewardsService.getRequestStatus(data.requestId);
      // Verify user has access to this request
      if (result.userId.toString() !== data.userId) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }
      this.logger.log(`[Microservice] Request status retrieved successfully`);
      return result;
    } catch (error) {
      this.logger.error(
        `[Microservice] Error getting request status: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 보상 수령 (마이크로서비스 패턴) - Updated
   */
  @MessagePattern('reward.claim')
  async claimUserReward(@Payload() payload: { requestId: string; userId: string }) {
    this.logger.log(`[Microservice] User ${payload.userId} claiming reward: ${payload.requestId}`);
    try {
      // Create a default claim DTO
      const claimDto = {
        gameTransactionId: `tx_${Date.now()}_${payload.requestId}`,
        message: 'Reward claimed via API',
      };

      const result = await this.rewardsService.claimReward(
        payload.requestId,
        claimDto,
        payload.userId,
      );
      this.logger.log(`[Microservice] Reward claimed successfully`);
      return result;
    } catch (error) {
      this.logger.error(`[Microservice] Error claiming reward: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 관리자 요청 상태 업데이트 (마이크로서비스 패턴)
   */
  @MessagePattern('reward.updateRequestStatus')
  async updateRequestStatus(
    @Payload() payload: { requestId: string; status: string; reason?: string; adminId: string },
  ) {
    this.logger.log(
      `[Microservice] Admin ${payload.adminId} updating request ${payload.requestId} to ${payload.status}`,
    );
    try {
      const result = await this.rewardsService.adminUpdateRequestStatus(
        payload.requestId,
        payload.status as RewardRequestStatus,
        payload.reason || `Status updated to ${payload.status} by admin`,
        payload.adminId,
      );
      this.logger.log(`[Microservice] Request status updated successfully`);
      return result;
    } catch (error) {
      this.logger.error(
        `[Microservice] Error updating request status: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
