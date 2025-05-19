import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';
import { Reward, RewardSchema } from '../schemas/reward.schema';
import { RewardRequest, RewardRequestSchema } from '../schemas/reward-request.schema';
import { EventsModule } from '../events/events.module';
import { InngestModule } from '../inngest/inngest.module';

/**
 * 보상 모듈
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reward.name, schema: RewardSchema },
      { name: RewardRequest.name, schema: RewardRequestSchema },
    ]),
    EventsModule,
    InngestModule,
  ],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}
