import { Role } from '../constants/roles.constant';

/**
 * 사용자 인터페이스
 * 시스템에서 사용되는 사용자 정보의 구조를 정의합니다.
 */
export interface User {
  _id?: string;
  username: string;
  email: string;
  password?: string;
  roles: Role[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * JWT 페이로드 인터페이스
 * 토큰에 포함되는 정보를 정의합니다.
 */
export interface JwtPayload {
  sub: string;
  username: string;
  roles: Role[];
}
