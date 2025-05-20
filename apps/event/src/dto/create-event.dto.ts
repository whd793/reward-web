import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

/**
 * 이벤트 생성 DTO
 * 새 이벤트 생성 시 필요한 정보를 정의합니다.
 */
export class CreateEventDto {
  @ApiProperty({
    description: '이벤트 제목',
    example: '7일 연속 출석 이벤트',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: '이벤트 설명',
    example: '7일 연속으로 로그인하면 보상을 지급합니다.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: '이벤트 시작일',
    example: '2025-01-01T00:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    description: '이벤트 종료일',
    example: '2025-12-31T23:59:59Z',
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({
    description: '이벤트 활성화 여부',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiProperty({
    description: '운영자 승인 필요 여부',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  requiresApproval?: boolean = false;

  @ApiProperty({
    description: '이벤트 조건 타입',
    example: 'DAILY_LOGIN',
  })
  @IsString()
  @IsNotEmpty()
  conditionType: string;

  @ApiProperty({
    description: '이벤트 조건 값',
    example: 7,
  })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  conditionValue: number;

  @ApiProperty({
    description: '이벤트 조건 설명',
    example: '7일 연속 로그인',
  })
  @IsString()
  @IsNotEmpty()
  conditionDescription: string;
}
