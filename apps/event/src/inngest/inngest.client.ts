import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Inngest } from 'inngest';
import { EventData } from '@app/common';

/**
 * Inngest 클라이언트
 * 이벤트 처리를 위한 Inngest 클라이언트를 제공합니다.
 */
@Injectable()
export class InngestClient implements OnModuleInit {
  private readonly logger = new Logger(InngestClient.name);
  private inngest: Inngest;

  constructor(private configService: ConfigService) {}

  /**
   * 모듈 초기화 시 호출
   * Inngest 클라이언트를 초기화합니다.
   */
  onModuleInit() {
    const isDevMode = this.configService.get<boolean>('inngest.dev');
    const signingKey = this.configService.get<string>('inngest.signingKey');

    this.logger.log(`Initializing Inngest client in ${isDevMode ? 'dev' : 'production'} mode`);

    this.inngest = new Inngest({
      id: 'reward-system',
      isDev: isDevMode,
      signingKey,
    });
  }

  /**
   * Inngest 클라이언트 인스턴스 가져오기
   *
   * @returns Inngest 클라이언트 인스턴스
   */
  getClient(): Inngest {
    return this.inngest;
  }

  /**
   * 사용자 이벤트 발생
   *
   * @param eventData 이벤트 데이터
   */
  async sendEvent(eventData: EventData): Promise<void> {
    const { userId, eventType, data, timestamp } = eventData;

    this.logger.log(`Sending event to Inngest: ${eventType} for user ${userId}`);

    try {
      await this.inngest.send({
        name: `user/${eventType}`,
        data: {
          userId,
          ...data,
        },
        timestamp: timestamp || new Date(),
      });
    } catch (error) {
      this.logger.error(`Failed to send event to Inngest: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 보상 처리 이벤트 발생
   *
   * @param requestId 보상 요청 ID
   * @param userId 사용자 ID
   * @param eventId 이벤트 ID
   * @param rewardId 보상 ID
   */
  async sendRewardProcessEvent(
    requestId: string,
    userId: string,
    eventId: string,
    rewardId: string,
  ): Promise<void> {
    this.logger.log(`Sending reward process event for request ${requestId}`);

    try {
      await this.inngest.send({
        name: 'reward/process',
        data: {
          requestId,
          userId,
          eventId,
          rewardId,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send reward process event: ${error.message}`, error.stack);
      throw error;
    }
  }
}
