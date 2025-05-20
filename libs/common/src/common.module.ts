import { Module, Global } from '@nestjs/common';
import { IdempotencyUtil } from './utils/idempotency.util';

/**
 * 공통 모듈
 * 프로젝트 전체에서 사용되는 공통 기능을 제공합니다.
 */
@Global()
@Module({
  providers: [IdempotencyUtil],
  exports: [IdempotencyUtil],
})
export class CommonModule {}
