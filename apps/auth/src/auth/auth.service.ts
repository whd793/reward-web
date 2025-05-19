import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from '@app/common';

/**
 * 인증 서비스
 * 인증 관련 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}
  /**
   * 사용자 검증
   *
   * @param username 사용자명
   * @param password 비밀번호
   * @returns 검증된 사용자 정보
   */
  async validateUser(username: string, password: string) {
    try {
      // 사용자 조회
      const user = await this.usersService.findOneByUsername(username);

      if (!user) {
        this.logger.warn(`Failed login attempt: user ${username} not found`);
        return null;
      }

      // Log for debugging (remove in production)
      this.logger.debug(`Comparing passwords for ${username}`);
      this.logger.debug(`Input password: ${password}`);
      this.logger.debug(`Stored hash: ${user.password}`);

      // 비밀번호 검증 - using compare directly to see exactly what's happening
      try {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        this.logger.debug(`Password comparison result: ${isPasswordValid}`);

        if (!isPasswordValid) {
          this.logger.warn(`Failed login attempt: invalid password for ${username}`);
          return null;
        }

        // 비밀번호 제외한 사용자 정보 반환
        const result = user.toObject();
        delete result.password;

        this.logger.log(`User ${username} successfully authenticated`);
        return result;
      } catch (bcryptError) {
        this.logger.error(`bcrypt error: ${bcryptError.message}`, bcryptError.stack);
        throw bcryptError;
      }
    } catch (error) {
      this.logger.error(`Authentication error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 로그인
   *
   * @param user 사용자 정보
   * @returns 액세스 토큰 및 사용자 정보
   */
  async login(user: any) {
    try {
      // JWT 페이로드 생성
      const payload: JwtPayload = {
        sub: user._id.toString(),
        username: user.username,
        roles: user.roles,
      };

      this.logger.log(`Generating JWT token for user: ${user.username}`);

      // 액세스 토큰 생성 및 반환
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          roles: user.roles,
        },
      };
    } catch (error) {
      this.logger.error(`Login error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 회원가입
   *
   * @param createUserDto 회원가입 정보
   * @returns 생성된 사용자 정보
   */
  async register(createUserDto: CreateUserDto) {
    try {
      const user = await this.usersService.create(createUserDto);
      this.logger.log(`User ${createUserDto.username} registered successfully`);

      return {
        message: '회원가입이 완료되었습니다.',
        user,
      };
    } catch (error) {
      this.logger.error(`Registration failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 토큰 검증 (마이크로서비스 내부 통신용)
   *
   * @param token JWT 토큰
   * @returns 검증된 사용자 정보
   */
  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);

      // 사용자 정보 조회
      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }

      return {
        userId: payload.sub,
        username: payload.username,
        roles: payload.roles,
      };
    } catch (error) {
      this.logger.error(`Token validation failed: ${error.message}`);
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }
}

// import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
// import { UsersService } from '../users/users.service';
// import { CreateUserDto } from '../dto/create-user.dto';
// import * as bcrypt from 'bcrypt';
// import { JwtPayload } from '@app/common';

// /**
//  * 인증 서비스
//  * 인증 관련 비즈니스 로직을 처리합니다.
//  */
// @Injectable()
// export class AuthService {
//   private readonly logger = new Logger(AuthService.name);

//   constructor(
//     private usersService: UsersService,
//     private jwtService: JwtService,
//   ) {}

//   /**
//    * 사용자 검증
//    *
//    * @param username 사용자명
//    * @param password 비밀번호
//    * @returns 검증된 사용자 정보
//    */
//   async validateUser(username: string, password: string) {
//     // 사용자 조회
//     const user = await this.usersService.findOneByUsername(username);

//     if (!user) {
//       this.logger.warn(`Failed login attempt: user ${username} not found`);
//       return null;
//     }

//     // 비밀번호 검증
//     const isPasswordValid = await bcrypt.compare(password, user.password);

//     if (!isPasswordValid) {
//       this.logger.warn(`Failed login attempt: invalid password for ${username}`);
//       return null;
//     }

//     // 비밀번호 제외한 사용자 정보 반환
//     const result = user.toObject();
//     delete result.password;

//     this.logger.log(`User ${username} successfully authenticated`);
//     return result;
//   }

//   /**
//    * 로그인
//    *
//    * @param user 사용자 정보
//    * @returns 액세스 토큰 및 사용자 정보
//    */
//   async login(user: any) {
//     // JWT 페이로드 생성
//     const payload: JwtPayload = {
//       sub: user._id.toString(),
//       username: user.username,
//       roles: user.roles,
//     };

//     this.logger.log(`Generating JWT token for user: ${user.username}`);

//     // 액세스 토큰 생성 및 반환
//     return {
//       access_token: this.jwtService.sign(payload),
//       user: {
//         id: user._id,
//         username: user.username,
//         email: user.email,
//         roles: user.roles,
//       },
//     };
//   }

//   /**
//    * 회원가입
//    *
//    * @param createUserDto 회원가입 정보
//    * @returns 생성된 사용자 정보
//    */
//   async register(createUserDto: CreateUserDto) {
//     try {
//       const user = await this.usersService.create(createUserDto);
//       this.logger.log(`User ${createUserDto.username} registered successfully`);

//       return {
//         message: '회원가입이 완료되었습니다.',
//         user,
//       };
//     } catch (error) {
//       this.logger.error(`Registration failed: ${error.message}`, error.stack);
//       throw error;
//     }
//   }

//   /**
//    * 토큰 검증 (마이크로서비스 내부 통신용)
//    *
//    * @param token JWT 토큰
//    * @returns 검증된 사용자 정보
//    */
//   async validateToken(token: string) {
//     try {
//       const payload = this.jwtService.verify(token);

//       // 사용자 정보 조회
//       const user = await this.usersService.findById(payload.sub);

//       if (!user) {
//         throw new UnauthorizedException('유효하지 않은 토큰입니다.');
//       }

//       return {
//         userId: payload.sub,
//         username: payload.username,
//         roles: payload.roles,
//       };
//     } catch (error) {
//       this.logger.error(`Token validation failed: ${error.message}`);
//       throw new UnauthorizedException('유효하지 않은 토큰입니다.');
//     }
//   }
// }
