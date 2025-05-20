import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

/**
 * 보상 생성 DTO
 * 새 보상 생성 시 필요한 정보를 정의합니다.
 */
export class CreateRewardDto {
  @ApiProperty({
    description: '보상 이름',
    example: '골드 1000',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '보상 설명',
    example: '게임 내 골드 1000개를 제공합니다.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: '보상 유형',
    example: 'GAME_CURRENCY',
  })
  @IsString()
  @IsNotEmpty()
  rewardType: string;

  @ApiProperty({
    description: '보상 값',
    example: '1000',
  })
  @IsNotEmpty()
  rewardValue: string | number;

  @ApiProperty({
    description: '보상 수량 (-1: 무제한)',
    example: 100,
    default: -1,
  })
  @IsNumber()
  @IsOptional()
  quantity?: number = -1;

  // eventId는 요청 URL 파라미터에서 추출하므로 DTO에 포함하지 않음
}
