import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsArray,
  IsOptional,
} from 'class-validator';
import { Role } from '@app/common';

/**
 * 사용자 생성 DTO
 * 새 사용자 등록 시 필요한 정보를 정의합니다.
 */
export class CreateUserDto {
  @ApiProperty({
    description: '사용자 아이디',
    example: 'johndoe',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(20)
  username: string;

  @ApiProperty({
    description: '비밀번호',
    example: 'StrongPassword123!',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: '이메일 주소',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: '사용자 역할 (기본값: USER)',
    enum: Role,
    default: [Role.USER],
    isArray: true,
    required: false,
  })
  @IsArray()
  @IsOptional()
  roles?: Role[] = [Role.USER];
}
