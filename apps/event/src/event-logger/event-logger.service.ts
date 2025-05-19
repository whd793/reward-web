import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventLogger, EventLoggerDocument } from '../schemas/event-logger.schema';
import { EventType } from '@app/common';

/**
 * 이벤트 로거 서비스
 * 사용자 이벤트를 기록하는 서비스입니다.
 */
@Injectable()
export class EventLoggerService {
  private readonly logger = new Logger(EventLoggerService.name);

  constructor(
    @InjectModel(EventLogger.name)
    private eventLoggerModel: Model<EventLoggerDocument>,
  ) {}

  /**
   * 이벤트 로그 생성
   *
   * @param userId 사용자 ID
   * @param eventType 이벤트 유형
   * @param data 이벤트 데이터
   * @returns 생성된 이벤트 로그
   */
  async createLog(
    userId: string,
    eventType: EventType,
    data: Record<string, any>,
  ): Promise<EventLoggerDocument> {
    this.logger.log(`Creating event log: ${eventType} for user ${userId}`);

    const eventLog = new this.eventLoggerModel({
      userId,
      eventType,
      data,
      timestamp: new Date(),
    });

    return eventLog.save();
  }

  /**
   * 사용자의 이벤트 로그 조회
   *
   * @param userId 사용자 ID
   * @param eventType 이벤트 유형
   * @param startDate 시작 날짜
   * @param endDate 종료 날짜
   * @returns 이벤트 로그 목록
   */
  async getUserEventLogs(
    userId: string,
    eventType?: EventType,
    startDate?: Date,
    endDate?: Date,
  ): Promise<EventLoggerDocument[]> {
    const query: any = { userId };

    if (eventType) {
      query.eventType = eventType;
    }

    if (startDate || endDate) {
      query.timestamp = {};

      if (startDate) {
        query.timestamp.$gte = startDate;
      }

      if (endDate) {
        query.timestamp.$lte = endDate;
      }
    }

    return this.eventLoggerModel.find(query).sort({ timestamp: -1 }).exec();
  }

  /**
   * 사용자의 최근 이벤트 로그 조회
   *
   * @param userId 사용자 ID
   * @param eventType 이벤트 유형
   * @param limit 조회할 로그 수
   * @returns 최근 이벤트 로그 목록
   */
  async getRecentEventLogs(
    userId: string,
    eventType: EventType,
    limit = 10,
  ): Promise<EventLoggerDocument[]> {
    return this.eventLoggerModel
      .find({ userId, eventType })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * 사용자의 이벤트 로그 수 조회
   *
   * @param userId 사용자 ID
   * @param eventType 이벤트 유형
   * @param startDate 시작 날짜
   * @param endDate 종료 날짜
   * @returns 이벤트 로그 수
   */
  async countUserEventLogs(
    userId: string,
    eventType: EventType,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const query: any = { userId, eventType };

    if (startDate || endDate) {
      query.timestamp = {};

      if (startDate) {
        query.timestamp.$gte = startDate;
      }

      if (endDate) {
        query.timestamp.$lte = endDate;
      }
    }

    return this.eventLoggerModel.countDocuments(query).exec();
  }

  /**
   * 연속 발생한 이벤트 수 계산
   * 특정 이벤트가 연속적으로 발생한 횟수를 계산합니다.
   *
   * @param userId 사용자 ID
   * @param eventType 이벤트 유형
   * @param dayGap 연속으로 간주할 최대 일 간격
   * @returns 연속 발생 횟수
   */
  async calculateConsecutiveEvents(
    userId: string,
    eventType: EventType,
    dayGap = 1,
  ): Promise<number> {
    const logs = await this.eventLoggerModel
      .find({ userId, eventType })
      .sort({ timestamp: -1 })
      .exec();

    if (logs.length === 0) {
      return 0;
    }

    let consecutiveCount = 1;
    const msPerDay = 24 * 60 * 60 * 1000;
    const maxGapMs = dayGap * msPerDay;

    for (let i = 0; i < logs.length - 1; i++) {
      const currentLog = logs[i];
      const nextLog = logs[i + 1];

      // 날짜만 비교 (시간은 무시)
      const currentDate = new Date(currentLog.timestamp);
      currentDate.setHours(0, 0, 0, 0);

      const nextDate = new Date(nextLog.timestamp);
      nextDate.setHours(0, 0, 0, 0);

      const diffMs = currentDate.getTime() - nextDate.getTime();

      // 연속으로 간주할 최대 간격 체크
      if (diffMs <= maxGapMs && diffMs > 0) {
        consecutiveCount++;
      } else {
        break;
      }
    }

    return consecutiveCount;
  }
}
