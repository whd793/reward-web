import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { LoginUserDto } from '../dto/login-user.dto';
import { CreateUserDto } from '../dto/create-user.dto';

/**
 * 인증 컨트롤러
 * 인증 관련 메시지 패턴을 처리합니다.
 */
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 사용자 로그인 처리
   * @param loginUserDto 로그인 정보
   * @returns JWT 토큰 및 사용자 정보
   */
  @MessagePattern('login_user')
  async login(@Payload() loginUserDto: LoginUserDto) {
    return await this.authService.login(loginUserDto);
  }

  /**
   * 사용자 등록 처리
   * @param createUserDto 사용자 등록 정보
   * @returns 등록된 사용자 정보
   */
  @MessagePattern('register_user')
  async register(@Payload() createUserDto: CreateUserDto) {
    return await this.authService.register(createUserDto);
  }

  /**
   * JWT 토큰 검증
   * @param payload JWT 토큰
   * @returns 토큰에서 추출한 사용자 정보
   */
  @MessagePattern('validate_token')
  async validateToken(@Payload() payload: { token: string }) {
    return await this.authService.validateToken(payload.token);
  }
}

// import { Controller } from '@nestjs/common';
// import { MessagePattern, Payload } from '@nestjs/microservices';
// import { AuthService } from './auth.service';
// import { LoginUserDto } from '../dto/login-user.dto';
// import { CreateUserDto } from '../dto/create-user.dto';

// /**
//  * 인증 컨트롤러
//  * 인증 관련 메시지 패턴을 처리합니다.
//  */
// @Controller()
// export class AuthController {
//   constructor(private readonly authService: AuthService) {}

//   /**
//    * 사용자 로그인 처리
//    * @param loginUserDto 로그인 정보
//    * @returns JWT 토큰 및 사용자 정보
//    */
//   @MessagePattern('login_user')
//   async login(@Payload() loginUserDto: LoginUserDto) {
//     return await this.authService.login(loginUserDto);
//   }

//   /**
//    * 사용자 등록 처리
//    * @param createUserDto 사용자 등록 정보
//    * @returns 등록된 사용자 정보
//    */
//   @MessagePattern('register_user')
//   async register(@Payload() createUserDto: CreateUserDto) {
//     return await this.authService.register(createUserDto);
//   }

//   /**
//    * JWT 토큰 검증
//    * @param payload JWT 토큰
//    * @returns 토큰에서 추출한 사용자 정보
//    */
//   @MessagePattern('validate_token')
//   async validateToken(@Payload() payload: { token: string }) {
//     return await this.authService.validateToken(payload.token);
//   }
// }
