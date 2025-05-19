// apps/auth/src/auth/auth.controller.ts
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';
import { UsersService } from '../users/users.service';

/**
 * 인증 마이크로서비스 컨트롤러
 */
@ApiTags('auth')
@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService, // Make sure this is injected
  ) {}

  /**
   * 로그인 (마이크로서비스 내부 통신용)
   */
  @MessagePattern('auth.login')
  async login(@Payload() loginUserDto: LoginUserDto) {
    this.logger.log(`[Microservice] Login attempt for user: ${loginUserDto.username}`);

    try {
      // First validate the user
      const user = await this.authService.validateUser(
        loginUserDto.username,
        loginUserDto.password,
      );

      // If validation fails, return an error
      if (!user) {
        this.logger.warn(`[Microservice] Invalid credentials for user: ${loginUserDto.username}`);
        return { error: true, message: '아이디 또는 비밀번호가 올바르지 않습니다.' };
      }

      // If validation passes, generate token with the validated user
      return this.authService.login(user);
    } catch (error) {
      this.logger.error(`[Microservice] Login error: ${error.message}`, error.stack);
      return { error: true, message: error.message };
    }
  }

  /**
   * 회원가입 (마이크로서비스 내부 통신용)
   */
  @MessagePattern('auth.register')
  async register(@Payload() createUserDto: CreateUserDto) {
    this.logger.log(`[Microservice] Registration attempt for user: ${createUserDto.username}`);
    try {
      return this.authService.register(createUserDto);
    } catch (error) {
      this.logger.error(`[Microservice] Registration error: ${error.message}`, error.stack);
      return { error: true, message: error.message };
    }
  }

  /**
   * 토큰 검증 (마이크로서비스 내부 통신용)
   */
  @MessagePattern('auth.validateToken')
  async validateToken(@Payload() token: string) {
    this.logger.log('[Microservice] Token validation request');
    try {
      return this.authService.validateToken(token);
    } catch (error) {
      this.logger.error(`[Microservice] Token validation error: ${error.message}`, error.stack);
      return { error: true, message: '유효하지 않은 토큰입니다.' };
    }
  }

  /**
   * 사용자 ID로 사용자 조회 (마이크로서비스 내부 통신용)
   */
  @MessagePattern('user.findById')
  async findById(@Payload() userId: string) {
    this.logger.log(`[Microservice] Finding user by ID: ${userId}`);
    try {
      const user = await this.usersService.findById(userId);
      if (!user) {
        return { error: true, message: '사용자를 찾을 수 없습니다.' };
      }

      // Remove password before returning
      const result = user.toObject();
      delete result.password;
      return result;
    } catch (error) {
      this.logger.error(`[Microservice] Find user error: ${error.message}`, error.stack);
      return { error: true, message: error.message };
    }
  }
}
