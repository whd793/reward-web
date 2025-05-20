import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min, IsEnum, IsMongoId } from 'class-validator';
import { RewardType } from '../schemas/reward.schema';

/**
 * 보상 생성 DTO
 */
export class CreateRewardDto {
  @ApiProperty({
    description: '보상 이름',
    example: '골드 500개',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '보상 설명',
    example: '게임에서 사용 가능한 골드 500개',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: '보상 유형',
    enum: RewardType,
    example: RewardType.CURRENCY,
  })
  @IsEnum(RewardType)
  type: RewardType;

  @ApiProperty({
    description: '보상 값',
    example: 500,
  })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({
    description: '보상 수량',
    example: 1,
  })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: '관련 이벤트 ID',
    example: '5f8f3a7e6b7b1c2a3c4b5a6e',
  })
  @IsMongoId()
  eventId: string;
}
