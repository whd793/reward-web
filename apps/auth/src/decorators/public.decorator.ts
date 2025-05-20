import { SetMetadata } from '@nestjs/common';

/**
 * 공개 라우트 메타데이터 키
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * 공개 라우트 데코레이터
 * 인증 없이 접근 가능한 라우트를 표시합니다.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
