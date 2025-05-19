import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '@app/common';

/**
 * JWT 전략
 * JWT 토큰을 검증하는 Passport 전략입니다.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  /**
   * JWT 페이로드 검증
   *
   * @param payload JWT 페이로드
   * @returns 인증된 사용자 객체
   */
  async validate(payload: JwtPayload) {
    try {
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
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }
}
