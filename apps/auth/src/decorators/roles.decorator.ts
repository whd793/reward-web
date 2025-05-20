import { SetMetadata } from '@nestjs/common';
import { Role } from '@app/common';

/**
 * 역할 메타데이터 키
 */
export const ROLES_KEY = 'roles';

/**
 * 역할 데코레이터
 * 라우트에 필요한 역할을 지정합니다.
 *
 * @param roles 필요한 역할 배열
 * @returns 역할 데코레이터
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
