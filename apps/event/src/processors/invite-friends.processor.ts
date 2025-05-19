import { Injectable } from '@nestjs/common';
import { EventType } from '@app/common';
import { BaseEventProcessor } from './event-processor.base';
import { EventLoggerService } from '../event-logger/event-logger.service';
import { InviteFriendsEventData } from '@app/common';

/**
 * 친구 초대 이벤트 프로세서
 */
@Injectable()
export class InviteFriendsProcessor extends BaseEventProcessor {
  constructor(protected readonly eventLoggerService: EventLoggerService) {
    super(eventLoggerService);
  }

  /**
   * 이벤트 유형 가져오기
   *
   * @returns 이벤트 유형
   */
  getEventType(): string {
    return EventType.INVITE_FRIENDS;
  }

  /**
   * 이벤트 처리
   *
   * @param userId 사용자 ID
   * @param eventData 이벤트 데이터
   * @param session MongoDB 세션 (트랜잭션)
   * @returns 처리 결과
   */
  async process(userId: string, eventData: InviteFriendsEventData['data']): Promise<any> {
    this.logger.log(`Processing invite friends event for user ${userId}`);

    try {
      // 초대한 친구 수 계산
      const logs = await this.eventLoggerService.getUserEventLogs(userId, EventType.INVITE_FRIENDS);

      const invitedFriends = new Set(logs.map(log => log.data.invitedUserId));

      this.logger.log(`User ${userId} has invited ${invitedFriends.size} friends`);

      return {
        success: true,
        userId,
        eventType: this.getEventType(),
        invitedFriendCount: invitedFriends.size,
        latestInvitedFriend: eventData.invitedUserId,
      };
    } catch (error) {
      this.logger.error(`Failed to process invite friends event: ${error.message}`, error.stack);
      throw error;
    }
  }
}
