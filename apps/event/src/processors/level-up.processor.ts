import { Injectable } from '@nestjs/common';
import { EventType } from '@app/common';
import { BaseEventProcessor } from './event-processor.base';
import { EventLoggerService } from '../event-logger/event-logger.service';
import { LevelUpEventData } from '@app/common';

/**
 * 레벨업 이벤트 프로세서
 */
@Injectable()
export class LevelUpProcessor extends BaseEventProcessor {
  constructor(protected readonly eventLoggerService: EventLoggerService) {
    super(eventLoggerService);
  }

  /**
   * 이벤트 유형 가져오기
   *
   * @returns 이벤트 유형
   */
  getEventType(): string {
    return EventType.LEVEL_UP;
  }

  /**
   * 이벤트 처리
   *
   * @param userId 사용자 ID
   * @param eventData 이벤트 데이터
   * @param session MongoDB 세션 (트랜잭션)
   * @returns 처리 결과
   */
  async process(userId: string, eventData: LevelUpEventData['data']): Promise<any> {
    this.logger.log(
      `Processing level up event for user ${userId}, new level: ${eventData.newLevel}`,
    );

    try {
      // 현재 레벨과 레벨업 횟수 조회
      const [currentLevel, levelUps] = await this.getUserLevelInfo(userId);

      // 최고 레벨이 이벤트 데이터와 일치하는지 확인
      const isNewLevelMax = currentLevel === eventData.newLevel;

      this.logger.log(
        `User ${userId} is now level ${currentLevel}, with ${levelUps} level ups recorded`,
      );

      return {
        success: true,
        userId,
        eventType: this.getEventType(),
        previousLevel: eventData.previousLevel,
        newLevel: eventData.newLevel,
        isMaxLevel: isNewLevelMax,
        totalLevelUps: levelUps,
      };
    } catch (error) {
      this.logger.error(`Failed to process level up event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 사용자 레벨 정보 조회
   *
   * @param userId 사용자 ID
   * @returns [현재 레벨, 레벨업 횟수]
   */
  private async getUserLevelInfo(userId: string): Promise<[number, number]> {
    const logs = await this.eventLoggerService.getUserEventLogs(userId, EventType.LEVEL_UP);

    if (logs.length === 0) {
      return [1, 0]; // 기본값
    }

    // 가장 최근 로그에서 현재 레벨 가져오기
    const currentLevel = logs[0].data.newLevel;

    // 레벨업 횟수 = 로그 수
    const levelUps = logs.length;

    return [currentLevel, levelUps];
  }
}
