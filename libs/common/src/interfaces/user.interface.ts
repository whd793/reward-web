import { Role } from '../constants/roles.constant';

/**
 * 사용자 정보 인터페이스
 * JWT 페이로드에 포함될 정보를 정의합니다.
 */
export interface UserPayload {
  userId: string;
  username: string;
  email: string;
  roles: Role[];
}

/**
 * 사용자 인터페이스
 * 사용자 정보의 기본 구조를 정의합니다.
 */
export interface User {
  _id: string;
  username: string;
  email: string;
  password: string;
  roles: Role[];
  createdAt: Date;
  updatedAt: Date;
}
