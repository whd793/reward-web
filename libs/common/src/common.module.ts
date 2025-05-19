import { Module, Global } from '@nestjs/common';

/**
 * 공통 모듈
 * 모든 서비스에서 공통으로 사용되는 기능을 제공하는 전역 모듈입니다.
 */
@Global()
@Module({
  providers: [],
  exports: [],
})
export class CommonModule {}
