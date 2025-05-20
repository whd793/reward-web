import {
  Injectable,
  ConflictException,
  // UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const userObj = user.toObject();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = userObj;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user._id, roles: user.roles };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        roles: user.roles,
      },
    };
  }

  async register(createUserDto: CreateUserDto) {
    // 중복 확인
    const existingUser = await this.usersService.findByUsername(createUserDto.username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const existingEmail = await this.usersService.findByEmail(createUserDto.email);
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.usersService.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const userObj = user.toObject();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = userObj;
    return result;
  }

  async findById(id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const userObj = user.toObject();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = userObj;
    return result;
  }
}
