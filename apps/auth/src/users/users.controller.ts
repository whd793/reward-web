import { Controller, Get, Param, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';

/**
 * 사용자 컨트롤러
 */
@ApiTags('users')
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  /**
   * 사용자명으로 사용자 조회
   */
  @Get('username/:username')
  @ApiOperation({ summary: '사용자명으로 사용자 조회' })
  @ApiResponse({ status: 200, description: '사용자 정보' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async findByUsername(@Param('username') username: string) {
    this.logger.log(`Finding user by username: ${username}`);
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      return null;
    }

    // Remove password from response
    const userObj = user.toObject();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = userObj;
    return userWithoutPassword;
  }

  /**
   * ID로 사용자 조회
   */
  @Get(':id')
  @ApiOperation({ summary: 'ID로 사용자 조회' })
  @ApiResponse({ status: 200, description: '사용자 정보' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async findById(@Param('id') id: string) {
    this.logger.log(`Finding user by ID: ${id}`);
    const user = await this.usersService.findById(id);
    if (!user) {
      return null;
    }

    // Remove password from response
    const userObj = user.toObject();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = userObj;
    return userWithoutPassword;
  }

  // ================ MICROSERVICE MESSAGE PATTERNS ================

  /**
   * 사용자명으로 사용자 조회 (마이크로서비스 패턴)
   */
  @MessagePattern('user.findByUsername')
  async findUserByUsername(@Payload() username: string) {
    this.logger.log(`[Microservice] Finding user by username: ${username}`);
    try {
      const user = await this.usersService.findByUsername(username);
      if (!user) {
        return null;
      }

      // Remove password from response
      const userObj = user.toObject();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = userObj;
      return userWithoutPassword;
    } catch (error) {
      this.logger.error(`[Microservice] Error finding user by username: ${error.message}`);
      throw error;
    }
  }

  /**
   * ID로 사용자 조회 (마이크로서비스 패턴)
   */
  @MessagePattern('user.findById')
  async findUserById(@Payload() id: string) {
    this.logger.log(`[Microservice] Finding user by ID: ${id}`);
    try {
      const user = await this.usersService.findById(id);
      if (!user) {
        throw new Error('User not found');
      }

      // Remove password from response
      const userObj = user.toObject();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = userObj;
      return userWithoutPassword;
    } catch (error) {
      this.logger.error(`[Microservice] Error finding user by ID: ${error.message}`);
      throw error;
    }
  }
}
