import { Controller, Post, Body, Logger, Inject, Get, Request } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { Public } from '../decorators/public.decorator';

/**
 * 인증 컨트롤러 (게이트웨이)
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(@Inject('AUTH_SERVICE') private authClient: ClientProxy) {}

  /**
   * 로그인
   */
  @Public()
  @Post('login')
  @ApiOperation({ summary: '로그인' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async login(@Body() loginUserDto: LoginUserDto) {
    this.logger.log(`Login attempt for user: ${loginUserDto.username}`);

    try {
      return await firstValueFrom(this.authClient.send('auth.login', loginUserDto));
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 회원가입
   */
  @Public()
  @Post('register')
  @ApiOperation({ summary: '회원가입' })
  @ApiResponse({ status: 201, description: '회원가입 성공' })
  @ApiResponse({ status: 400, description: '잘못된 입력' })
  @ApiResponse({ status: 409, description: '중복된 사용자명 또는 이메일' })
  async register(@Body() createUserDto: CreateUserDto) {
    this.logger.log(`Registration attempt for user: ${createUserDto.username}`);

    try {
      return await firstValueFrom(this.authClient.send('auth.register', createUserDto));
    } catch (error) {
      this.logger.error(`Registration failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 현재 사용자 정보 조회
   */
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: '현재 사용자 정보 조회' })
  @ApiResponse({ status: 200, description: '현재 사용자 정보' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getProfile(@Request() req) {
    this.logger.log(`Getting profile for user ID: ${req.user.userId}`);

    try {
      return await firstValueFrom(this.authClient.send('user.findById', req.user.userId));
    } catch (error) {
      this.logger.error(`Get profile failed: ${error.message}`);
      throw error;
    }
  }
}
