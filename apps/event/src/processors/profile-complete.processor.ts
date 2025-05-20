import { Injectable } from '@nestjs/common';
import { EventType } from '@app/common';
import { BaseEventProcessor } from './event-processor.base';
import { EventLoggerService } from '../event-logger/event-logger.service';
import { ProfileCompleteEventData } from '@app/common';

/**
 * 프로필 완성 이벤트 프로세서
 */
@Injectable()
export class ProfileCompleteProcessor extends BaseEventProcessor {
  constructor(protected readonly eventLoggerService: EventLoggerService) {
    super(eventLoggerService);
  }

  /**
   * 이벤트 유형 가져오기
   *
   * @returns 이벤트 유형
   */
  getEventType(): string {
    return EventType.PROFILE_COMPLETE;
  }

  /**
   * 이벤트 처리
   *
   * @param userId 사용자 ID
   * @param eventData 이벤트 데이터
   * @param session MongoDB 세션 (트랜잭션)
   * @returns 처리 결과
   */
  async process(userId: string, eventData: ProfileCompleteEventData['data']): Promise<any> {
    this.logger.log(`Processing profile complete event for user ${userId}`);

    try {
      // 완료된 프로필 필드 확인
      const completedFields = eventData.completedFields || [];

      this.logger.log(
        `User ${userId} has completed ${completedFields.length} profile fields: ${completedFields.join(', ')}`,
      );

      return {
        success: true,
        userId,
        eventType: this.getEventType(),
        completedFields,
        completionDate: eventData.completionDate,
        isComplete: completedFields.length > 0,
      };
    } catch (error) {
      this.logger.error(`Failed to process profile complete event: ${error.message}`, error.stack);
      throw error;
    }
  }
}
