import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event, EventDocument } from '../schemas/event.schema';
import { CreateEventDto } from '../dto/create-event.dto';
import { PaginationDto } from '@app/common';

/**
 * 이벤트 서비스
 * 이벤트 관련 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(@InjectModel(Event.name) private eventModel: Model<EventDocument>) {}

  /**
   * 모든 이벤트 조회
   * @param paginationDto 페이지네이션 정보
   * @param filter 필터링 옵션
   * @returns 이벤트 목록
   */
  async findAll(paginationDto: PaginationDto, filter: any = {}) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const total = await this.eventModel.countDocuments(filter);
    const events = await this.eventModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      items: events,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * ID로 이벤트 조회
   * @param id 이벤트 ID
   * @returns 이벤트 정보
   */
  async findById(id: string): Promise<EventDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('유효하지 않은 이벤트 ID입니다.');
    }

    const event = await this.eventModel.findById(id).exec();
    if (!event) {
      throw new NotFoundException('이벤트를 찾을 수 없습니다.');
    }

    return event;
  }

  /**
   * 새 이벤트 생성
   * @param createEventDto 이벤트 생성 정보
   * @returns 생성된 이벤트 정보
   */
  async create(createEventDto: CreateEventDto): Promise<EventDocument> {
    const {
      title,
      description,
      startDate,
      endDate,
      isActive,
      requiresApproval,
      conditionType,
      conditionValue,
      conditionDescription,
    } = createEventDto;

    // 날짜 검증
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      throw new BadRequestException('종료일은 시작일보다 나중이어야 합니다.');
    }

    const newEvent = new this.eventModel({
      title,
      description,
      startDate: start,
      endDate: end,
      isActive: isActive !== undefined ? isActive : true,
      requiresApproval: requiresApproval !== undefined ? requiresApproval : false,
      conditionType,
      conditionValue,
      conditionDescription,
    });

    try {
      const savedEvent = await newEvent.save();
      this.logger.log(`Event ${title} created successfully with ID: ${savedEvent._id}`);
      return savedEvent;
    } catch (error) {
      this.logger.error(`Error creating event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 이벤트 정보 업데이트
   * @param id 이벤트 ID
   * @param updateEventDto 업데이트할 이벤트 정보
   * @returns 업데이트된 이벤트 정보
   */
  async update(id: string, updateEventDto: Partial<CreateEventDto>): Promise<EventDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('유효하지 않은 이벤트 ID입니다.');
    }

    // 먼저 이벤트가 존재하는지 확인
    const existingEvent = await this.findById(id);

    // 날짜 검증 (업데이트하는 경우)
    if (updateEventDto.startDate && updateEventDto.endDate) {
      const start = new Date(updateEventDto.startDate);
      const end = new Date(updateEventDto.endDate);

      if (end <= start) {
        throw new BadRequestException('종료일은 시작일보다 나중이어야 합니다.');
      }
    } else if (updateEventDto.startDate && !updateEventDto.endDate) {
      const start = new Date(updateEventDto.startDate);
      const end = existingEvent.endDate;

      if (end <= start) {
        throw new BadRequestException('종료일은 시작일보다 나중이어야 합니다.');
      }
    } else if (!updateEventDto.startDate && updateEventDto.endDate) {
      const start = existingEvent.startDate;
      const end = new Date(updateEventDto.endDate);

      if (end <= start) {
        throw new BadRequestException('종료일은 시작일보다 나중이어야 합니다.');
      }
    }

    try {
      const updatedEvent = await this.eventModel
        .findByIdAndUpdate(id, updateEventDto, { new: true })
        .exec();

      if (!updatedEvent) {
        throw new NotFoundException('이벤트를 찾을 수 없습니다.');
      }

      this.logger.log(`Event ${id} updated successfully`);
      return updatedEvent;
    } catch (error) {
      this.logger.error(`Error updating event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 이벤트 삭제
   * @param id 이벤트 ID
   * @returns 삭제 결과
   */
  async remove(id: string): Promise<{ deleted: boolean }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('유효하지 않은 이벤트 ID입니다.');
    }

    try {
      const result = await this.eventModel.findByIdAndDelete(id).exec();

      if (!result) {
        throw new NotFoundException('이벤트를 찾을 수 없습니다.');
      }

      this.logger.log(`Event ${id} deleted successfully`);
      return { deleted: true };
    } catch (error) {
      this.logger.error(`Error deleting event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 활성 이벤트 여부 확인
   * @param eventId 이벤트 ID
   * @returns 활성 여부 및 이벤트 정보
   */
  async isEventActive(
    eventId: string,
  ): Promise<{ isActive: boolean; event: EventDocument | null }> {
    try {
      const event = await this.findById(eventId);
      const now = new Date();

      // 이벤트 활성 조건: isActive가 true이고, 현재 날짜가 시작일과 종료일 사이에 있어야 함
      const isActive = event.isActive && now >= event.startDate && now <= event.endDate;

      return { isActive, event };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return { isActive: false, event: null };
      }
      throw error;
    }
  }
}
