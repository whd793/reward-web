import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

/**
 * 보상 요청 DTO
 * 보상 요청 시 필요한 정보를 정의합니다.
 */
export class RequestRewardDto {
  @ApiProperty({
    description: '요청 멱등성 키',
    required: false,
  })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  @ApiProperty({
    description: '보상 ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsUUID()
  rewardId?: string;

  // userId는 요청의 인증 정보에서 추출하므로 DTO에 포함하지 않음
  // eventId는 요청 URL 파라미터에서 추출하므로 DTO에 포함하지 않음
}
