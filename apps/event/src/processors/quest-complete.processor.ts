import { Injectable } from '@nestjs/common';
import { EventType } from '@app/common';
import { BaseEventProcessor } from './event-processor.base';
import { EventLoggerService } from '../event-logger/event-logger.service';
import { QuestCompleteEventData } from '@app/common';

/**
 * 퀘스트 완료 이벤트 프로세서
 */
@Injectable()
export class QuestCompleteProcessor extends BaseEventProcessor {
  constructor(protected readonly eventLoggerService: EventLoggerService) {
    super(eventLoggerService);
  }

  /**
   * 이벤트 유형 가져오기
   *
   * @returns 이벤트 유형
   */
  getEventType(): string {
    return EventType.QUEST_COMPLETE;
  }

  /**
   * 이벤트 처리
   *
   * @param userId 사용자 ID
   * @param eventData 이벤트 데이터
   * @param session MongoDB 세션 (트랜잭션)
   * @returns 처리 결과
   */
  async process(userId: string, eventData: QuestCompleteEventData['data']): Promise<any> {
    this.logger.log(
      `Processing quest complete event for user ${userId}, quest: ${eventData.questId}`,
    );

    try {
      // 완료한 퀘스트 목록 조회
      const completedQuests = await this.getCompletedQuests(userId);

      this.logger.log(
        `User ${userId} has completed ${completedQuests.length} quests, including ${eventData.questId}`,
      );

      return {
        success: true,
        userId,
        eventType: this.getEventType(),
        questId: eventData.questId,
        questName: eventData.questName,
        completionDate: eventData.completionDate,
        totalCompletedQuests: completedQuests.length,
      };
    } catch (error) {
      this.logger.error(`Failed to process quest complete event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 완료한 퀘스트 목록 조회
   *
   * @param userId 사용자 ID
   * @returns 완료한 퀘스트 ID 목록
   */
  private async getCompletedQuests(userId: string): Promise<string[]> {
    const logs = await this.eventLoggerService.getUserEventLogs(userId, EventType.QUEST_COMPLETE);

    return logs.map(log => log.data.questId);
  }
}
