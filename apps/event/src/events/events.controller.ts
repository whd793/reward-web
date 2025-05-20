import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EventsService } from './events.service';
import { CreateEventDto } from '../dto/create-event.dto';

/**
 * 이벤트 컨트롤러
 * 이벤트 관련 메시지 패턴을 처리합니다.
 */
@Controller()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * 모든 이벤트 조회
   * @param payload 조회 옵션
   * @returns 이벤트 목록
   */
  @MessagePattern('find_all_events')
  async findAll(@Payload() payload: any) {
    const { page, limit, ...filter } = payload || {};
    return await this.eventsService.findAll({ page, limit }, filter);
  }

  /**
   * ID로 이벤트 조회
   * @param payload 이벤트 ID
   * @returns 이벤트 정보
   */
  @MessagePattern('find_event_by_id')
  async findById(@Payload() payload: { id: string }) {
    return await this.eventsService.findById(payload.id);
  }

  /**
   * 새 이벤트 생성
   * @param payload 이벤트 생성 정보
   * @returns 생성된 이벤트 정보
   */
  @MessagePattern('create_event')
  async create(@Payload() payload: CreateEventDto) {
    return await this.eventsService.create(payload);
  }

  /**
   * 이벤트 정보 업데이트
   * @param payload 업데이트할 이벤트 정보
   * @returns 업데이트된 이벤트 정보
   */
  @MessagePattern('update_event')
  async update(@Payload() payload: { id: string; [key: string]: any }) {
    const { id, ...updateDto } = payload;
    return await this.eventsService.update(id, updateDto);
  }

  /**
   * 이벤트 삭제
   * @param payload 이벤트 ID
   * @returns 삭제 결과
   */
  @MessagePattern('delete_event')
  async remove(@Payload() payload: { id: string }) {
    return await this.eventsService.remove(payload.id);
  }

  /**
   * 이벤트 활성 여부 확인
   * @param payload 이벤트 ID
   * @returns 활성 여부
   */
  @MessagePattern('is_event_active')
  async isEventActive(@Payload() payload: { eventId: string }) {
    return await this.eventsService.isEventActive(payload.eventId);
  }
}
