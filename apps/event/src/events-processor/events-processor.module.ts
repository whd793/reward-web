import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsProcessorService } from './events-processor.service';
import { RewardRequest, RewardRequestSchema } from '../schemas/reward-request.schema';
import { EventsModule } from '../events/events.module';
import { RewardsModule } from '../rewards/rewards.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: RewardRequest.name, schema: RewardRequestSchema }]),
    EventsModule,
    RewardsModule,
  ],
  providers: [EventsProcessorService],
  exports: [EventsProcessorService],
})
export class EventsProcessorModule {}
