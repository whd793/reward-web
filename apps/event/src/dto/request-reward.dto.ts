import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsMongoId, IsOptional } from 'class-validator';

/**
 * 보상 요청 DTO
 */
export class RequestRewardDto {
  @ApiProperty({
    description: '이벤트 ID',
    example: '5f8f3a7e6b7b1c2a3c4b5a6e',
  })
  @IsMongoId()
  eventId: string;

  @ApiProperty({
    description: '보상 ID',
    example: '5f8f3a7e6b7b1c2a3c4b5a6f',
  })
  @IsMongoId()
  rewardId: string;

  @ApiProperty({
    description: '멱등성 키 (중복 요청 방지용)',
    example: 'abc123-unique-key',
    required: false,
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
