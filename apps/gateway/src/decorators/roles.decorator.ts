import { SetMetadata } from '@nestjs/common';
import { Role } from '@app/common';

export const ROLES_KEY = 'roles';

/**
 * 역할 데코레이터
 * 컨트롤러나 핸들러에 필요한 역할을 설정합니다.
 * @param roles 필요한 역할 목록
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
