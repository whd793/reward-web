import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginUserDto } from '../dto/login-user.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserPayload } from '@app/common';

/**
 * 인증 서비스
 * 로그인, 회원가입, 토큰 검증 등의 인증 관련 기능을 처리합니다.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 사용자 인증
   * @param username 사용자명
   * @param password 비밀번호
   * @returns 인증된 사용자 정보
   */
  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findOneByUsername(username);
    if (!user) {
      this.logger.warn(`Authentication failed for non-existent user: ${username}`);
      throw new UnauthorizedException('유효하지 않은 사용자명 또는 비밀번호입니다.');
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      this.logger.warn(`Authentication failed for user: ${username} - invalid password`);
      throw new UnauthorizedException('유효하지 않은 사용자명 또는 비밀번호입니다.');
    }

    // 비밀번호 제외하고 반환
    const result = user.toObject();
    delete result.password;
    return result;
  }

  /**
   * 사용자 로그인
   * @param loginUserDto 로그인 정보
   * @returns JWT 토큰 및 사용자 정보
   */
  async login(loginUserDto: LoginUserDto) {
    const { username, password } = loginUserDto;

    const user = await this.validateUser(username, password);

    const payload: UserPayload = {
      userId: user._id,
      username: user.username,
      email: user.email,
      roles: user.roles,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        userId: user._id,
        username: user.username,
        email: user.email,
        roles: user.roles,
      },
    };
  }

  /**
   * 새 사용자 등록
   * @param createUserDto 사용자 등록 정보
   * @returns 등록된 사용자 정보
   */
  async register(createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /**
   * JWT 토큰 검증
   * @param token JWT 토큰
   * @returns 토큰에서 추출한 사용자 정보
   */
  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);

      const user = await this.usersService.findById(payload.userId);
      if (!user) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }

      return {
        userId: user._id,
        username: user.username,
        email: user.email,
        roles: user.roles,
      };
    } catch (error) {
      this.logger.error(`Token validation error: ${error.message}`, error.stack);
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }
}

// import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
// import * as bcrypt from 'bcrypt';
// import { UsersService } from '../users/users.service';
// import { LoginUserDto } from '../dto/login-user.dto';
// import { CreateUserDto } from '../dto/create-user.dto';
// import { UserPayload } from '@app/common';

// /**
//  * 인증 서비스
//  * 로그인, 회원가입, 토큰 검증 등의 인증 관련 기능을 처리합니다.
//  */
// @Injectable()
// export class AuthService {
//   private readonly logger = new Logger(AuthService.name);

//   constructor(
//     private readonly usersService: UsersService,
//     private readonly jwtService: JwtService,
//   ) {}

//   /**
//    * 사용자 인증
//    * @param username 사용자명
//    * @param password 비밀번호
//    * @returns 인증된 사용자 정보
//    */
//   async validateUser(username: string, password: string): Promise<any> {
//     const user = await this.usersService.findOneByUsername(username);
//     if (!user) {
//       this.logger.warn(`Authentication failed for non-existent user: ${username}`);
//       throw new UnauthorizedException('유효하지 않은 사용자명 또는 비밀번호입니다.');
//     }

//     const isPasswordMatch = await bcrypt.compare(password, user.password);
//     if (!isPasswordMatch) {
//       this.logger.warn(`Authentication failed for user: ${username} - invalid password`);
//       throw new UnauthorizedException('유효하지 않은 사용자명 또는 비밀번호입니다.');
//     }

//     // 비밀번호 제외하고 반환
//     const result = user.toObject();
//     delete result.password;
//     return result;
//   }

//   /**
//    * 사용자 로그인
//    * @param loginUserDto 로그인 정보
//    * @returns JWT 토큰 및 사용자 정보
//    */
//   async login(loginUserDto: LoginUserDto) {
//     const { username, password } = loginUserDto;

//     const user = await this.validateUser(username, password);

//     const payload: UserPayload = {
//       userId: user._id,
//       username: user.username,
//       email: user.email,
//       roles: user.roles,
//     };

//     return {
//       access_token: this.jwtService.sign(payload),
//       user: {
//         userId: user._id,
//         username: user.username,
//         email: user.email,
//         roles: user.roles,
//       },
//     };
//   }

//   /**
//    * 새 사용자 등록
//    * @param createUserDto 사용자 등록 정보
//    * @returns 등록된 사용자 정보
//    */
//   async register(createUserDto: CreateUserDto) {
//     return this.usersService.create(createUserDto);
//   }

//   /**
//    * JWT 토큰 검증
//    * @param token JWT 토큰
//    * @returns 토큰에서 추출한 사용자 정보
//    */
//   async validateToken(token: string) {
//     try {
//       const payload = this.jwtService.verify(token);

//       const user = await this.usersService.findById(payload.userId);
//       if (!user) {
//         throw new UnauthorizedException('유효하지 않은 토큰입니다.');
//       }

//       return {
//         userId: user._id,
//         username: user.username,
//         email: user.email,
//         roles: user.roles,
//       };
//     } catch (error) {
//       this.logger.error(`Token validation error: ${error.message}`, error.stack);
//       throw new UnauthorizedException('유효하지 않은 토큰입니다.');
//     }
//   }
// }
