import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { CreateUserDto } from '../dto/create-user.dto';
import * as bcrypt from 'bcrypt';

/**
 * 사용자 서비스
 * 사용자 관련 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  /**
   * 사용자명으로 사용자 조회
   * @param username 사용자명
   * @returns 사용자 정보
   */
  async findOneByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  /**
   * 이메일로 사용자 조회
   * @param email 이메일
   * @returns 사용자 정보
   */
  async findOneByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  /**
   * 새 사용자 생성
   * @param createUserDto 사용자 생성 정보
   * @returns 생성된 사용자 정보
   */
  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const { username, email, password, roles } = createUserDto;

    // 사용자명 중복 확인
    const existingUserByUsername = await this.findOneByUsername(username);
    if (existingUserByUsername) {
      this.logger.warn(`Username ${username} already exists`);
      throw new ConflictException('이미 존재하는 사용자명입니다.');
    }

    // 이메일 중복 확인
    const existingUserByEmail = await this.findOneByEmail(email);
    if (existingUserByEmail) {
      this.logger.warn(`Email ${email} already exists`);
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 새 사용자 생성
    const newUser = new this.userModel({
      username,
      email,
      password: hashedPassword,
      roles: roles || ['USER'],
    });

    try {
      const savedUser = await newUser.save();
      this.logger.log(`User ${username} created successfully`);

      // 비밀번호 제외하고 반환
      const result = savedUser.toObject();
      delete result.password;
      return result;
    } catch (error) {
      this.logger.error(`Error creating user: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 사용자 ID로 사용자 조회
   * @param userId 사용자 ID
   * @returns 사용자 정보
   */
  async findById(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    return user;
  }
}
