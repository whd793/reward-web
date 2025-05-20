import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * 사용자 로그인 DTO
 * 로그인 시 필요한 정보를 정의합니다.
 */
export class LoginUserDto {
  @ApiProperty({
    description: '사용자 아이디',
    example: 'johndoe',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: '비밀번호',
    example: 'StrongPassword123!',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
