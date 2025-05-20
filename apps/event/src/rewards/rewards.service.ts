import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reward, RewardDocument } from '../schemas/reward.schema';
import { CreateRewardDto } from '../dto/create-reward.dto';
import { EventsService } from '../events/events.service';

/**
 * 보상 서비스
 * 보상 관련 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    @InjectModel(Reward.name) private rewardModel: Model<RewardDocument>,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * 이벤트별 보상 조회
   * @param eventId 이벤트 ID
   * @returns 보상 목록
   */
  async findByEventId(eventId: string): Promise<RewardDocument[]> {
    if (!Types.ObjectId.isValid(eventId)) {
      throw new BadRequestException('유효하지 않은 이벤트 ID입니다.');
    }

    // 먼저 이벤트가 존재하는지 확인
    await this.eventsService.findById(eventId);

    return this.rewardModel.find({ eventId: new Types.ObjectId(eventId) }).exec();
  }

  /**
   * ID로 보상 조회
   * @param id 보상 ID
   * @returns 보상 정보
   */
  async findById(id: string): Promise<RewardDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('유효하지 않은 보상 ID입니다.');
    }

    const reward = await this.rewardModel.findById(id).exec();
    if (!reward) {
      throw new NotFoundException('보상을 찾을 수 없습니다.');
    }

    return reward;
  }

  /**
   * 새 보상 생성
   * @param eventId 이벤트 ID
   * @param createRewardDto 보상 생성 정보
   * @returns 생성된 보상 정보
   */
  async create(eventId: string, createRewardDto: CreateRewardDto): Promise<RewardDocument> {
    if (!Types.ObjectId.isValid(eventId)) {
      throw new BadRequestException('유효하지 않은 이벤트 ID입니다.');
    }

    // 먼저 이벤트가 존재하는지 확인
    await this.eventsService.findById(eventId);

    const { name, description, rewardType, rewardValue, quantity } = createRewardDto;

    const newReward = new this.rewardModel({
      name,
      description,
      rewardType,
      rewardValue,
      quantity: quantity || -1, // 기본값은 무제한(-1)
      eventId: new Types.ObjectId(eventId),
    });

    try {
      const savedReward = await newReward.save();
      this.logger.log(`Reward ${name} created successfully for event ${eventId}`);
      return savedReward;
    } catch (error) {
      this.logger.error(`Error creating reward: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 보상 정보 업데이트
   * @param id 보상 ID
   * @param updateRewardDto 업데이트할 보상 정보
   * @returns 업데이트된 보상 정보
   */
  async update(id: string, updateRewardDto: Partial<CreateRewardDto>): Promise<RewardDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('유효하지 않은 보상 ID입니다.');
    }

    try {
      const updatedReward = await this.rewardModel
        .findByIdAndUpdate(id, updateRewardDto, { new: true })
        .exec();

      if (!updatedReward) {
        throw new NotFoundException('보상을 찾을 수 없습니다.');
      }

      this.logger.log(`Reward ${id} updated successfully`);
      return updatedReward;
    } catch (error) {
      this.logger.error(`Error updating reward: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 보상 삭제
   * @param id 보상 ID
   * @returns 삭제 결과
   */
  async remove(id: string): Promise<{ deleted: boolean }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('유효하지 않은 보상 ID입니다.');
    }

    try {
      const result = await this.rewardModel.findByIdAndDelete(id).exec();

      if (!result) {
        throw new NotFoundException('보상을 찾을 수 없습니다.');
      }

      this.logger.log(`Reward ${id} deleted successfully`);
      return { deleted: true };
    } catch (error) {
      this.logger.error(`Error deleting reward: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 보상 수량 차감
   * @param id 보상 ID
   * @returns 업데이트된 보상 정보
   */
  async decrementQuantity(id: string): Promise<RewardDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('유효하지 않은 보상 ID입니다.');
    }

    const reward = await this.findById(id);

    // 무제한 수량(-1)이 아니고, 남은 수량이 0이하면 에러
    if (reward.quantity !== -1 && reward.quantity <= 0) {
      throw new BadRequestException('보상 수량이 모두 소진되었습니다.');
    }

    // 무제한 수량(-1)이 아닌 경우에만 수량 차감
    if (reward.quantity !== -1) {
      try {
        const updatedReward = await this.rewardModel
          .findByIdAndUpdate(id, { $inc: { quantity: -1 } }, { new: true })
          .exec();

        this.logger.log(`Reward ${id} quantity decremented to ${updatedReward.quantity}`);
        return updatedReward;
      } catch (error) {
        this.logger.error(`Error decrementing reward quantity: ${error.message}`, error.stack);
        throw error;
      }
    }

    return reward;
  }
}
