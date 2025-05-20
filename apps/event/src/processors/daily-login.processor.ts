import { Injectable } from '@nestjs/common';
import { EventType } from '@app/common';
import { BaseEventProcessor } from './event-processor.base';
import { EventLoggerService } from '../event-logger/event-logger.service';
import { DailyLoginEventData } from '@app/common';

/**
 * 일일 로그인 이벤트 프로세서
 */
@Injectable()
export class DailyLoginProcessor extends BaseEventProcessor {
  constructor(protected readonly eventLoggerService: EventLoggerService) {
    super(eventLoggerService);
  }

  /**
   * 이벤트 유형 가져오기
   *
   * @returns 이벤트 유형
   */
  getEventType(): string {
    return EventType.DAILY_LOGIN;
  }

  /**
   * 이벤트 처리
   *
   * @param userId 사용자 ID
   * @param eventData 이벤트 데이터
   * @param session MongoDB 세션 (트랜잭션)
   * @returns 처리 결과
   */
  async process(userId: string, eventData: DailyLoginEventData['data']): Promise<any> {
    this.logger.log(`Processing daily login event for user ${userId}`);

    try {
      // 연속 로그인 일수 계산
      const consecutiveDays = await this.eventLoggerService.calculateConsecutiveEvents(
        userId,
        EventType.DAILY_LOGIN,
      );

      this.logger.log(`User ${userId} has logged in for ${consecutiveDays} consecutive days`);

      return {
        success: true,
        userId,
        eventType: this.getEventType(),
        consecutiveDays,
        loginDate: eventData.loginDate,
      };
    } catch (error) {
      this.logger.error(`Failed to process daily login event: ${error.message}`, error.stack);
      throw error;
    }
  }
}
