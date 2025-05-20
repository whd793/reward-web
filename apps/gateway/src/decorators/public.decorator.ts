import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Public 데코레이터
 * 인증이 필요하지 않은 public 엔드포인트를 표시합니다.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
