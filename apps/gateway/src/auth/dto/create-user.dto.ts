import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  IsArray,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Role } from '@app/common';

/**
 * 사용자 생성 DTO
 */
export class CreateUserDto {
  @ApiProperty({
    description: '사용자명',
    example: 'user123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @ApiProperty({
    description: '이메일',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: '비밀번호',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: '역할 (관리자만 지정 가능)',
    enum: Role,
    isArray: true,
    required: false,
    example: [Role.USER],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  roles?: Role[];
}
