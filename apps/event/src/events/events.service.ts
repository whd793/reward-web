import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event, EventDocument, EventStatus } from '../schemas/event.schema';
import { CreateEventDto } from '../dto/create-event.dto';
import { PaginationDto, createPaginatedResponse, PaginatedResponse } from '@app/common';
import { EventLoggerService } from '../event-logger/event-logger.service';
import { EventType } from '@app/common';

/**
 * 이벤트 서비스
 */
@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    private readonly eventLoggerService: EventLoggerService,
  ) {}

  /**
   * 이벤트 생성
   */
  async create(createEventDto: CreateEventDto, userId: string): Promise<EventDocument> {
    this.logger.log(`Creating event: ${createEventDto.name} by user ${userId}`);

    const event = new this.eventModel({
      ...createEventDto,
      createdBy: userId,
    });

    return event.save();
  }

  /**
   * 모든 이벤트 조회 (페이지네이션)
   */
  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponse<EventDocument>> {
    // Provide default values if not provided
    const page = paginationDto?.page || 1;
    const limit = paginationDto?.limit || 10;
    const skip = (page - 1) * limit;

    this.logger.log(`Finding all events with page: ${page}, limit: ${limit}, skip: ${skip}`);

    try {
      const [events, total] = await Promise.all([
        this.eventModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
        this.eventModel.countDocuments().exec(),
      ]);

      this.logger.log(`Found ${events.length} events out of ${total} total`);
      return createPaginatedResponse(events, total, page, limit);
    } catch (error) {
      this.logger.error(`Error finding all events: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 활성 이벤트 조회 (페이지네이션)
   */
  async findActive(paginationDto: PaginationDto): Promise<PaginatedResponse<EventDocument>> {
    const page = paginationDto?.page || 1;
    const limit = paginationDto?.limit || 10;
    const skip = (page - 1) * limit;
    const now = new Date();

    const query = {
      status: EventStatus.ACTIVE,
      startDate: { $lte: now },
      endDate: { $gte: now },
    };

    this.logger.log(`Finding active events with query: ${JSON.stringify(query)}`);

    try {
      const [events, total] = await Promise.all([
        this.eventModel.find(query).sort({ endDate: 1 }).skip(skip).limit(limit).exec(),
        this.eventModel.countDocuments(query).exec(),
      ]);

      this.logger.log(`Found ${events.length} active events out of ${total} total`);
      return createPaginatedResponse(events, total, page, limit);
    } catch (error) {
      this.logger.error(`Error finding active events: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * ID로 이벤트 조회
   */
  async findById(id: string): Promise<EventDocument> {
    const isValidId = Types.ObjectId.isValid(id);

    if (!isValidId) {
      throw new BadRequestException('잘못된 이벤트 ID 형식입니다.');
    }

    const event = await this.eventModel.findById(id).exec();

    if (!event) {
      throw new NotFoundException('이벤트를 찾을 수 없습니다.');
    }

    return event;
  }

  /**
   * 이벤트 유형으로 이벤트 조회
   */
  async findByEventType(eventType: EventType): Promise<EventDocument[]> {
    const now = new Date();

    return this.eventModel
      .find({
        eventType,
        status: EventStatus.ACTIVE,
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
      .exec();
  }

  /**
   * 이벤트 상태 업데이트
   */
  async updateStatus(id: string, status: EventStatus, userId: string): Promise<EventDocument> {
    const event = await this.findById(id);

    this.logger.log(`Updating event status: ${id} to ${status} by user ${userId}`);

    event.status = status;
    return event.save();
  }

  /**
   * 이벤트 조건 충족 여부 확인
   */
  async checkEventCondition(userId: string, event: EventDocument): Promise<boolean> {
    this.logger.log(`Checking event condition for user ${userId}, event: ${event.name}`);

    const { eventType, condition } = event;

    switch (eventType) {
      case EventType.DAILY_LOGIN:
        return this.checkDailyLoginCondition(userId, condition);

      case EventType.INVITE_FRIENDS:
        return this.checkInviteFriendsCondition(userId, condition);

      case EventType.QUEST_COMPLETE:
        return this.checkQuestCompleteCondition(userId, condition);

      case EventType.LEVEL_UP:
        return this.checkLevelUpCondition(userId, condition);

      case EventType.PROFILE_COMPLETE:
        return this.checkProfileCompleteCondition(userId, condition);

      default:
        this.logger.warn(`Unsupported event type: ${eventType}`);
        return false;
    }
  }

  /**
   * 일일 로그인 조건 확인
   */
  private async checkDailyLoginCondition(userId: string, condition: any): Promise<boolean> {
    const consecutiveDays = await this.eventLoggerService.calculateConsecutiveEvents(
      userId,
      EventType.DAILY_LOGIN,
    );

    return consecutiveDays >= condition.consecutiveDays;
  }

  /**
   * 친구 초대 조건 확인
   */
  private async checkInviteFriendsCondition(userId: string, condition: any): Promise<boolean> {
    const logs = await this.eventLoggerService.getUserEventLogs(userId, EventType.INVITE_FRIENDS);

    const invitedFriends = new Set(logs.map(log => log.data.invitedUserId));

    return invitedFriends.size >= condition.friendCount;
  }

  /**
   * 퀘스트 완료 조건 확인
   */
  private async checkQuestCompleteCondition(userId: string, condition: any): Promise<boolean> {
    const logs = await this.eventLoggerService.getUserEventLogs(userId, EventType.QUEST_COMPLETE);

    return logs.some(log => log.data.questId === condition.questId);
  }

  /**
   * 레벨업 조건 확인
   */
  private async checkLevelUpCondition(userId: string, condition: any): Promise<boolean> {
    const logs = await this.eventLoggerService.getUserEventLogs(userId, EventType.LEVEL_UP);

    if (logs.length === 0) {
      return false;
    }

    // 가장 최근 로그에서 현재 레벨 가져오기
    const currentLevel = logs[0].data.newLevel;

    return currentLevel >= condition.targetLevel;
  }

  /**
   * 프로필 완성 조건 확인
   */
  private async checkProfileCompleteCondition(userId: string, condition: any): Promise<boolean> {
    const logs = await this.eventLoggerService.getUserEventLogs(userId, EventType.PROFILE_COMPLETE);

    if (logs.length === 0) {
      return false;
    }

    // 가장 최근 로그에서 완성된 필드 가져오기
    const completedFields = logs[0].data.completedFields || [];

    // 필요한 모든 필드가 완성되었는지 확인
    const requiredFields = condition.requiredFields || [];

    return requiredFields.every(field => completedFields.includes(field));
  }
}
