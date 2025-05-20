import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { CreateUserDto } from '../dto/create-user.dto';

/**
 * 사용자 컨트롤러
 * 사용자 관련 메시지 패턴을 처리합니다.
 */
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 사용자명으로 사용자 조회
   * @param payload 조회할 사용자명
   * @returns 사용자 정보
   */
  @MessagePattern('find_user_by_username')
  async findByUsername(@Payload() payload: { username: string }) {
    const user = await this.usersService.findOneByUsername(payload.username);
    if (user) {
      const result = user.toObject();
      return result;
    }
    return null;
  }

  /**
   * 새 사용자 생성
   * @param createUserDto 사용자 생성 정보
   * @returns 생성된 사용자 정보
   */
  @MessagePattern('create_user')
  async create(@Payload() createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }

  /**
   * 사용자 ID로 사용자 조회
   * @param payload 조회할 사용자 ID
   * @returns 사용자 정보
   */
  @MessagePattern('find_user_by_id')
  async findById(@Payload() payload: { id: string }) {
    const user = await this.usersService.findById(payload.id);
    if (user) {
      const result = user.toObject();
      delete result.password;
      return result;
    }
    return null;
  }
}
