import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '@app/common';

/**
 * 역할 가드
 * 사용자의 역할을 검증하는 가드입니다.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * 라우트 핸들러에 대한 접근 권한을 결정합니다.
   *
   * @param context 실행 컨텍스트
   * @returns 접근 허용 여부
   */
  canActivate(context: ExecutionContext): boolean {
    // 필요한 역할 가져오기
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 역할이 지정되지 않았으면 접근 허용
    if (!requiredRoles) {
      return true;
    }

    // 사용자 정보 가져오기
    const { user } = context.switchToHttp().getRequest();

    // 사용자가 없으면 접근 거부
    if (!user) {
      throw new ForbiddenException('권한이 없습니다.');
    }

    // 사용자가 필요한 역할 중 하나라도 가지고 있으면 접근 허용
    return requiredRoles.some(role => user.roles?.includes(role));
  }
}
