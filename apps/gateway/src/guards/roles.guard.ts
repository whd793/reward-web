import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '@app/common';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  /**
   * 요청한 사용자가 필요한 역할을 가지고 있는지 확인합니다.
   * @param context 실행 컨텍스트
   * @returns 권한 확인 결과
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 역할 요구사항이 없으면 통과
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // 사용자 정보가 없으면 실패
    if (!user) {
      this.logger.warn('User object not found in request');
      return false;
    }

    // 역할 확인
    const hasRequiredRole = requiredRoles.some(role => user.roles?.includes(role));

    if (!hasRequiredRole) {
      this.logger.warn(
        `Role check failed: User has ${user.roles} but needs one of ${requiredRoles}`,
      );
      throw new ForbiddenException('이 작업을 수행할 권한이 없습니다.');
    }

    return true;
  }
}
