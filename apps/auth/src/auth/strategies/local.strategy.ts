import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

/**
 * 로컬 전략
 * 아이디/비밀번호 인증을 처리하는 Passport 전략입니다.
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  /**
   * 사용자 이름과 비밀번호 검증
   *
   * @param username 사용자명
   * @param password 비밀번호
   * @returns 인증된 사용자 객체
   */
  async validate(username: string, password: string) {
    const user = await this.authService.validateUser(username, password);

    if (!user) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    return user;
  }
}
