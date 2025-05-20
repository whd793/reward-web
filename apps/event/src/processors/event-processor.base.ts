import { Logger } from '@nestjs/common';
import { EventProcessor } from './event-processor.interface';
import { EventLoggerService } from '../event-logger/event-logger.service';

/**
 * 기본 이벤트 프로세서
 * 모든 이벤트 프로세서의 기본 클래스입니다.
 */
export abstract class BaseEventProcessor implements EventProcessor {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(protected readonly eventLoggerService: EventLoggerService) {}

  /**
   * 이벤트 처리 (추상 메서드)
   *
   * @param userId 사용자 ID
   * @param eventData 이벤트 데이터
   * @param session MongoDB 세션 (트랜잭션)
   * @returns 처리 결과
   */
  abstract process(userId: string, eventData: Record<string, any>, session?: any): Promise<any>;

  /**
   * 이벤트 유형 가져오기 (추상 메서드)
   *
   * @returns 이벤트 유형
   */
  abstract getEventType(): string;
}
