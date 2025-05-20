import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Inject,
  // UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '@app/common';

@ApiTags('이벤트 및 보상')
@Controller('events')
@ApiBearerAuth()
export class EventController {
  constructor(@Inject('EVENT_SERVICE') private readonly eventClient: ClientProxy) {}

  /**
   * 모든 이벤트 조회
   * @param query 페이지네이션 및 필터링 옵션
   * @returns 이벤트 목록
   */
  @Get()
  @ApiOperation({ summary: '이벤트 목록 조회', description: '모든 활성 이벤트를 조회합니다.' })
  @ApiResponse({ status: 200, description: '이벤트 목록이 성공적으로 조회되었습니다.' })
  async findAllEvents(@Query() query: any) {
    return await firstValueFrom(this.eventClient.send('find_all_events', query));
  }

  /**
   * 특정 이벤트 조회
   * @param id 이벤트 ID
   * @returns 이벤트 정보
   */
  @Get(':id')
  @ApiOperation({
    summary: '이벤트 상세 조회',
    description: '특정 이벤트의 상세 정보를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '이벤트가 성공적으로 조회되었습니다.' })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없습니다.' })
  async findEventById(@Param('id') id: string) {
    return await firstValueFrom(this.eventClient.send('find_event_by_id', { id }));
  }

  /**
   * 새 이벤트 생성
   * @param createEventDto 이벤트 생성 정보
   * @returns 생성된 이벤트 정보
   */
  @Post()
  @Roles(Role.ADMIN, Role.OPERATOR)
  @ApiOperation({ summary: '이벤트 생성', description: '새로운 이벤트를 생성합니다.' })
  @ApiResponse({ status: 201, description: '이벤트가 성공적으로 생성되었습니다.' })
  @ApiResponse({ status: 400, description: '이벤트 정보가 유효하지 않습니다.' })
  async createEvent(@Body() createEventDto: any) {
    return await firstValueFrom(this.eventClient.send('create_event', createEventDto));
  }

  /**
   * 이벤트 정보 업데이트
   * @param id 이벤트 ID
   * @param updateEventDto 업데이트할 이벤트 정보
   * @returns 업데이트된 이벤트 정보
   */
  @Put(':id')
  @Roles(Role.ADMIN, Role.OPERATOR)
  @ApiOperation({ summary: '이벤트 수정', description: '기존 이벤트의 정보를 수정합니다.' })
  @ApiResponse({ status: 200, description: '이벤트가 성공적으로 수정되었습니다.' })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없습니다.' })
  async updateEvent(@Param('id') id: string, @Body() updateEventDto: any) {
    return await firstValueFrom(this.eventClient.send('update_event', { id, ...updateEventDto }));
  }

  /**
   * 이벤트 삭제
   * @param id 이벤트 ID
   * @returns 삭제 결과
   */
  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '이벤트 삭제', description: '이벤트를 삭제합니다.' })
  @ApiResponse({ status: 200, description: '이벤트가 성공적으로 삭제되었습니다.' })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없습니다.' })
  async deleteEvent(@Param('id') id: string) {
    return await firstValueFrom(this.eventClient.send('delete_event', { id }));
  }

  /**
   * 이벤트 보상 정보 조회
   * @param id 이벤트 ID
   * @returns 보상 목록
   */
  @Get(':id/rewards')
  @ApiOperation({
    summary: '이벤트 보상 조회',
    description: '특정 이벤트의 보상 정보를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '보상 정보가 성공적으로 조회되었습니다.' })
  async getEventRewards(@Param('id') id: string) {
    return await firstValueFrom(this.eventClient.send('get_event_rewards', { eventId: id }));
  }

  /**
   * 이벤트에 새 보상 추가
   * @param id 이벤트 ID
   * @param createRewardDto 보상 생성 정보
   * @returns 생성된 보상 정보
   */
  @Post(':id/rewards')
  @Roles(Role.ADMIN, Role.OPERATOR)
  @ApiOperation({ summary: '보상 생성', description: '이벤트에 새 보상을 추가합니다.' })
  @ApiResponse({ status: 201, description: '보상이 성공적으로 생성되었습니다.' })
  async createReward(@Param('id') id: string, @Body() createRewardDto: any) {
    return await firstValueFrom(
      this.eventClient.send('create_reward', { eventId: id, ...createRewardDto }),
    );
  }

  /**
   * 보상 요청
   * @param eventId 이벤트 ID
   * @param requestRewardDto 보상 요청 정보
   * @returns 보상 요청 결과
   */
  @Post(':id/request-reward')
  @Roles(Role.USER, Role.ADMIN)
  @ApiOperation({ summary: '보상 요청', description: '사용자가 이벤트 보상을 요청합니다.' })
  @ApiResponse({ status: 201, description: '보상 요청이 성공적으로 처리되었습니다.' })
  async requestReward(@Param('id') eventId: string, @Body() requestRewardDto: any) {
    return await firstValueFrom(
      this.eventClient.send('request_reward', { eventId, ...requestRewardDto }),
    );
  }

  /**
   * 사용자의 보상 요청 이력 조회
   * @returns 보상 요청 이력
   */
  @Get('user/reward-requests')
  @Roles(Role.USER, Role.ADMIN)
  @ApiOperation({
    summary: '사용자 보상 요청 이력',
    description: '로그인한 사용자의 보상 요청 이력을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '보상 요청 이력이 성공적으로 조회되었습니다.' })
  async getUserRewardRequests(@Query() query: any) {
    return await firstValueFrom(this.eventClient.send('get_user_reward_requests', query));
  }

  /**
   * 모든 보상 요청 이력 조회 (관리자 및 감사자용)
   * @param query 페이지네이션 및 필터링 옵션
   * @returns 보상 요청 이력
   */
  @Get('admin/reward-requests')
  @Roles(Role.ADMIN, Role.OPERATOR, Role.AUDITOR)
  @ApiOperation({
    summary: '전체 보상 요청 이력',
    description: '모든 사용자의 보상 요청 이력을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '보상 요청 이력이 성공적으로 조회되었습니다.' })
  async getAllRewardRequests(@Query() query: any) {
    return await firstValueFrom(this.eventClient.send('get_all_reward_requests', query));
  }

  /**
   * 보상 요청 승인 (관리자 및 운영자용)
   * @param requestId 보상 요청 ID
   * @returns 승인 결과
   */
  @Put('admin/reward-requests/:requestId/approve')
  @Roles(Role.ADMIN, Role.OPERATOR)
  @ApiOperation({
    summary: '보상 요청 승인',
    description: '사용자의 보상 요청을 승인합니다.',
  })
  @ApiResponse({ status: 200, description: '보상 요청이 성공적으로 승인되었습니다.' })
  async approveRewardRequest(@Param('requestId') requestId: string) {
    return await firstValueFrom(this.eventClient.send('approve_reward_request', { requestId }));
  }

  /**
   * 보상 요청 거부 (관리자 및 운영자용)
   * @param requestId 보상 요청 ID
   * @param rejectDto 거부 사유
   * @returns 거부 결과
   */
  @Put('admin/reward-requests/:requestId/reject')
  @Roles(Role.ADMIN, Role.OPERATOR)
  @ApiOperation({
    summary: '보상 요청 거부',
    description: '사용자의 보상 요청을 거부합니다.',
  })
  @ApiResponse({ status: 200, description: '보상 요청이 성공적으로 거부되었습니다.' })
  async rejectRewardRequest(@Param('requestId') requestId: string, @Body() rejectDto: any) {
    return await firstValueFrom(
      this.eventClient.send('reject_reward_request', { requestId, ...rejectDto }),
    );
  }
}
