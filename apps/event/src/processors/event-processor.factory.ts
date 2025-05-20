import { Injectable, Logger } from '@nestjs/common';
import { EventType } from '@app/common';
import { EventProcessor } from './event-processor.interface';
import { DailyLoginProcessor } from './daily-login.processor';
import { InviteFriendsProcessor } from './invite-friends.processor';
import { QuestCompleteProcessor } from './quest-complete.processor';
import { LevelUpProcessor } from './level-up.processor';
import { ProfileCompleteProcessor } from './profile-complete.processor';

/**
 * 이벤트 프로세서 팩토리
 * 이벤트 유형에 따라 적절한 프로세서를 생성합니다.
 */
@Injectable()
export class EventProcessorFactory {
  private readonly logger = new Logger(EventProcessorFactory.name);
  private readonly processors: Map<string, EventProcessor>;

  constructor(
    private readonly dailyLoginProcessor: DailyLoginProcessor,
    private readonly inviteFriendsProcessor: InviteFriendsProcessor,
    private readonly questCompleteProcessor: QuestCompleteProcessor,
    private readonly levelUpProcessor: LevelUpProcessor,
    private readonly profileCompleteProcessor: ProfileCompleteProcessor,
  ) {
    // 프로세서 맵 초기화
    this.processors = new Map<string, EventProcessor>([
      [EventType.DAILY_LOGIN, dailyLoginProcessor],
      [EventType.INVITE_FRIENDS, inviteFriendsProcessor],
      [EventType.QUEST_COMPLETE, questCompleteProcessor],
      [EventType.LEVEL_UP, levelUpProcessor],
      [EventType.PROFILE_COMPLETE, profileCompleteProcessor],
    ]);

    this.logger.log(
      `Registered event processors: ${Array.from(this.processors.keys()).join(', ')}`,
    );
  }

  /**
   * 이벤트 유형에 맞는 프로세서 생성
   *
   * @param eventType 이벤트 유형
   * @returns 이벤트 프로세서
   */
  createProcessor(eventType: string): EventProcessor | null {
    const processor = this.processors.get(eventType);

    if (!processor) {
      this.logger.warn(`No processor found for event type: ${eventType}`);
      return null;
    }

    return processor;
  }
}
