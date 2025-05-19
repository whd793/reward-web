import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

/**
 * 보상 지급 완료 DTO
 */
export class ClaimRewardDto {
  @ApiProperty({
    description: '게임/웹 애플리케이션 내부 트랜잭션 ID',
    example: 'tx_123456789',
  })
  @IsString()
  @IsNotEmpty()
  gameTransactionId: string;

  @ApiProperty({
    description: '지급 메시지',
    example: '보상이 성공적으로 지급되었습니다.',
    required: false,
  })
  @IsOptional()
  @IsString()
  message?: string;
}
