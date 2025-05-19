import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { InngestClient } from '../inngest.client';
import { RewardsService } from '../../rewards/rewards.service';
import { EventsService } from '../../events/events.service';
import { TransactionUtil } from '@app/common';
import { RewardRequestStatus } from '../../schemas/reward-request.schema';
import { EventDocument } from '../../schemas/event.schema';
import { RewardDocument } from '../../schemas/reward.schema';

/**
 * 보상 프로세서 함수
 * Inngest를 통해 보상을 처리하는 함수입니다.
 */
@Injectable()
export class RewardProcessorFunction {
  private readonly logger = new Logger(RewardProcessorFunction.name);

  constructor(
    private readonly inngestClient: InngestClient,
    private readonly rewardsService: RewardsService,
    private readonly eventsService: EventsService,
    @InjectConnection() private readonly connection: Connection,
  ) {
    const inngest = this.inngestClient.getClient();

    // 보상 처리 함수 등록
    inngest.createFunction(
      { id: 'process-reward-request' },
      { event: 'reward/process' },
      async ({ event, step }) => {
        const { requestId, userId, eventId, rewardId } = event.data;

        this.logger.log(`Processing reward request: ${requestId}`);

        try {
          // 이벤트 및 보상 정보 조회
          const eventAndReward = await step.run('fetch-event-reward', async () => {
            const eventData = await this.eventsService.findById(eventId);
            const rewardData = await this.rewardsService.findById(rewardId);
            return { event: eventData, reward: rewardData };
          });

          // 명시적으로 타입 지정
          const eventDoc: EventDocument = eventAndReward.event as EventDocument;
          // We'll use the reward later if needed
          const rewardDoc: RewardDocument = eventAndReward.reward as RewardDocument;

          // 트랜잭션 내에서 보상 처리
          const result = await TransactionUtil.withTransaction(this.connection, async session => {
            // 조건 충족 여부 확인
            const isEligible = await step.run('check-eligibility', async () => {
              return this.eventsService.checkEventCondition(userId, eventDoc);
            });

            if (!isEligible) {
              // 조건 미충족 시 요청 거부
              await this.rewardsService.updateRequestStatus(
                requestId,
                RewardRequestStatus.REJECTED,
                '이벤트 조건을 충족하지 않았습니다.',
                session,
              );
              return { success: false, reason: 'Conditions not met' };
            }

            // 이벤트 승인 유형 확인
            if (eventDoc.approvalType === 'AUTO') {
              // 자동 승인
              await this.rewardsService.updateRequestStatus(
                requestId,
                RewardRequestStatus.APPROVED,
                '자동 승인되었습니다.',
                session,
              );
              return {
                success: true,
                autoApproved: true,
                // Include reward details for logging/debugging
                reward: {
                  name: rewardDoc.name,
                  type: rewardDoc.type,
                  value: rewardDoc.value,
                },
              };
            } else {
              // 수동 승인 대기
              return {
                success: true,
                autoApproved: false,
                pendingApproval: true,
                // Include reward details for logging/debugging
                reward: {
                  name: rewardDoc.name,
                  type: rewardDoc.type,
                },
              };
            }
          });

          this.logger.log(
            `Reward request processed: ${requestId}, result: ${JSON.stringify(result)}`,
          );
          return result;
        } catch (error) {
          this.logger.error(`Failed to process reward request: ${error.message}`, error.stack);

          // 오류 발생 시 요청 실패 처리
          await this.rewardsService.updateRequestStatus(
            requestId,
            RewardRequestStatus.FAILED,
            `처리 중 오류 발생: ${error.message}`,
          );

          return { success: false, error: error.message };
        }
      },
    );
  }
}
