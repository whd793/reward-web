import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  // UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { Role } from '@app/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

/**
 * 사용자 컨트롤러
 */
@ApiTags('users')
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  /**
   * 새 사용자 생성 (관리자 전용)
   */
  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '새 사용자 생성 (관리자 전용)' })
  @ApiResponse({ status: 201, description: '사용자가 성공적으로 생성됨' })
  @ApiResponse({ status: 400, description: '잘못된 입력' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 409, description: '중복된 사용자명 또는 이메일' })
  async create(@Body() createUserDto: CreateUserDto) {
    this.logger.log(`Creating new user: ${createUserDto.username}`);
    return this.usersService.create(createUserDto);
  }

  /**
   * 현재 사용자 정보 조회
   */
  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '현재 사용자 정보 조회' })
  @ApiResponse({ status: 200, description: '현재 사용자 정보' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getProfile(@Request() req) {
    this.logger.log(`Getting profile for user ID: ${req.user.userId}`);
    return this.usersService.findById(req.user.userId);
  }

  /**
   * 사용자명으로 사용자 정보 조회 (마이크로서비스 내부 통신용)
   */
  @MessagePattern('user.findByUsername')
  async findByUsername(@Payload() username: string) {
    this.logger.log(`[Microservice] Finding user by username: ${username}`);
    return this.usersService.findOneByUsername(username);
  }

  /**
   * 사용자 ID로 사용자 정보 조회 (마이크로서비스 내부 통신용)
   */
  @MessagePattern('user.findById')
  async findById(@Payload() userId: string) {
    this.logger.log(`[Microservice] Finding user by ID: ${userId}`);
    return this.usersService.findById(userId);
  }

  /**
   * 사용자 ID로 사용자 정보 조회 (관리자 전용)
   */
  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '사용자 ID로 사용자 정보 조회 (관리자 전용)' })
  @ApiResponse({ status: 200, description: '사용자 정보' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async getUserById(@Param('id') id: string) {
    this.logger.log(`Getting user by ID: ${id}`);
    return this.usersService.findById(id);
  }
}
