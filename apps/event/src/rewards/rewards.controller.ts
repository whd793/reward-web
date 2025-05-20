import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RewardsService } from './rewards.service';
import { CreateRewardDto } from '../dto/create-reward.dto';

/**
 * 보상 컨트롤러
 * 보상 관련 메시지 패턴을 처리합니다.
 */
@Controller()
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  /**
   * 이벤트별 보상 조회
   * @param payload 이벤트 ID
   * @returns 보상 목록
   */
  @MessagePattern('get_event_rewards')
  async getEventRewards(@Payload() payload: { eventId: string }) {
    return await this.rewardsService.findByEventId(payload.eventId);
  }

  /**
   * ID로 보상 조회
   * @param payload 보상 ID
   * @returns 보상 정보
   */
  @MessagePattern('find_reward_by_id')
  async findById(@Payload() payload: { id: string }) {
    return await this.rewardsService.findById(payload.id);
  }

  /**
   * 새 보상 생성
   * @param payload 보상 생성 정보
   * @returns 생성된 보상 정보
   */
  @MessagePattern('create_reward')
  async create(@Payload() payload: { eventId: string } & CreateRewardDto) {
    const { eventId, ...createRewardDto } = payload;
    return await this.rewardsService.create(eventId, createRewardDto);
  }

  /**
   * 보상 정보 업데이트
   * @param payload 업데이트할 보상 정보
   * @returns 업데이트된 보상 정보
   */
  @MessagePattern('update_reward')
  async update(@Payload() payload: { id: string; [key: string]: any }) {
    const { id, ...updateDto } = payload;
    return await this.rewardsService.update(id, updateDto);
  }

  /**
   * 보상 삭제
   * @param payload 보상 ID
   * @returns 삭제 결과
   */
  @MessagePattern('delete_reward')
  async remove(@Payload() payload: { id: string }) {
    return await this.rewardsService.remove(payload.id);
  }

  /**
   * 보상 수량 차감
   * @param payload 보상 ID
   * @returns 업데이트된 보상 정보
   */
  @MessagePattern('decrement_reward_quantity')
  async decrementQuantity(@Payload() payload: { id: string }) {
    return await this.rewardsService.decrementQuantity(payload.id);
  }
}
