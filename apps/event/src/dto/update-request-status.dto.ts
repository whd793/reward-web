import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RewardRequestStatus } from '../schemas/reward-request.schema';

/**
 * 보상 요청 상태 업데이트 DTO
 */
export class UpdateRequestStatusDto {
  @ApiProperty({
    description: '요청 상태',
    enum: RewardRequestStatus,
    example: RewardRequestStatus.APPROVED,
  })
  @IsEnum(RewardRequestStatus)
  @IsNotEmpty()
  status: RewardRequestStatus;

  @ApiProperty({
    description: '상태 변경 메시지',
    example: '관리자 승인',
    required: false,
  })
  @IsOptional()
  @IsString()
  message?: string;
}
