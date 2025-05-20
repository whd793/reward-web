import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Reward, RewardSchema } from '../schemas/reward.schema';
import { RewardsService } from './rewards.service';
import { RewardsController } from './rewards.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Reward.name, schema: RewardSchema }]), EventsModule],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}
