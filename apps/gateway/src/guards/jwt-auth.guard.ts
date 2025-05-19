import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * JWT 인증 가드
 * JWT 토큰을 검증하는 가드입니다.
 */
@Injectable()
export class JwtAuthGuard {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private reflector: Reflector,
    @Inject('AUTH_SERVICE') private authClient: ClientProxy,
  ) {}

  /**
   * 라우트 핸들러에 대한 접근 권한을 결정합니다.
   *
   * @param context 실행 컨텍스트
   * @returns 접근 허용 여부
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // @Public() 데코레이터가 있으면 인증 검사를 건너뜁니다.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('인증 토큰이 필요합니다.');
    }

    try {
      // 인증 서비스를 통해 토큰 검증
      const user = await firstValueFrom(this.authClient.send('auth.validateToken', token));

      // 요청 객체에 사용자 정보 설정
      request.user = user;

      return true;
    } catch (error) {
      this.logger.error(`JWT validation failed: ${error.message}`);
      throw new UnauthorizedException('인증에 실패했습니다.');
    }
  }

  /**
   * 요청 헤더에서 토큰 추출
   *
   * @param request HTTP 요청 객체
   * @returns 추출된 토큰 또는 undefined
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');

    return type === 'Bearer' ? token : undefined;
  }
}
