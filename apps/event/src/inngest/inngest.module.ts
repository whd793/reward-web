import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InngestClient } from './inngest.client';

/**
 * Inngest 모듈
 */
@Module({
  imports: [ConfigModule],
  providers: [InngestClient],
  exports: [InngestClient],
})
export class InngestModule {}
