import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDate, IsEnum, IsObject, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { EventStatus, EventApprovalType } from '../schemas/event.schema';
import { EventType } from '@app/common';

/**
 * 이벤트 생성 DTO
 */
export class CreateEventDto {
  @ApiProperty({
    description: '이벤트 이름',
    example: '7일 연속 출석 이벤트',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '이벤트 설명',
    example: '7일 연속으로 로그인하면 보상을 받을 수 있습니다.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: '이벤트 유형',
    enum: EventType,
    example: EventType.DAILY_LOGIN,
  })
  @IsEnum(EventType)
  eventType: EventType;

  @ApiProperty({
    description: '이벤트 조건 (이벤트 유형에 따라 형식이 다름)',
    example: { consecutiveDays: 7 },
  })
  @IsObject()
  condition: Record<string, any>;

  @ApiProperty({
    description: '시작일',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({
    description: '종료일',
    example: '2025-01-31T23:59:59.999Z',
  })
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiProperty({
    description: '이벤트 상태',
    enum: EventStatus,
    default: EventStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus = EventStatus.ACTIVE;

  @ApiProperty({
    description: '승인 유형',
    enum: EventApprovalType,
    default: EventApprovalType.AUTO,
    required: false,
  })
  @IsOptional()
  @IsEnum(EventApprovalType)
  approvalType?: EventApprovalType = EventApprovalType.AUTO;
}
