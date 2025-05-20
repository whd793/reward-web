import { Controller, Post, Body, Logger, Request, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';
import { LocalAuthGuard } from '../guards/local-auth.guard';

/**
 * 인증 컨트롤러
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * 회원가입
   */
  @Post('register')
  @ApiOperation({ summary: '회원가입' })
  @ApiResponse({ status: 201, description: '회원가입 성공' })
  @ApiResponse({ status: 400, description: '잘못된 입력' })
  @ApiResponse({ status: 409, description: '중복된 사용자명 또는 이메일' })
  async register(@Body() createUserDto: CreateUserDto) {
    this.logger.log(`Registration attempt for user: ${createUserDto.username}`);
    return this.authService.register(createUserDto);
  }

  /**
   * 로그인
   */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: '로그인' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async login(@Request() req) {
    this.logger.log(`Login success for user: ${req.user.username}`);
    return this.authService.login(req.user);
  }

  // ================ MICROSERVICE MESSAGE PATTERNS ================

  /**
   * 회원가입 (마이크로서비스 패턴)
   */
  @MessagePattern('auth.register')
  async registerUser(@Payload() createUserDto: CreateUserDto) {
    this.logger.log(`[Microservice] Registration attempt for user: ${createUserDto.username}`);
    return this.authService.register(createUserDto);
  }

  /**
   * 로그인 (마이크로서비스 패턴)
   */
  @MessagePattern('auth.login')
  async loginUser(@Payload() loginUserDto: LoginUserDto) {
    this.logger.log(`[Microservice] Login attempt for user: ${loginUserDto.username}`);
    const user = await this.authService.validateUser(loginUserDto.username, loginUserDto.password);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    return this.authService.login(user);
  }

  /**
   * 사용자 조회 (마이크로서비스 패턴)
   */
  @MessagePattern('user.findById')
  async findUserById(@Payload() userId: string) {
    this.logger.log(`[Microservice] Finding user by ID: ${userId}`);
    return this.authService.findById(userId);
  }
}
