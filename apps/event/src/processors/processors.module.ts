import { Module } from '@nestjs/common';
import { EventLoggerModule } from '../event-logger/event-logger.module';
import { EventProcessorFactory } from './event-processor.factory';
import { DailyLoginProcessor } from './daily-login.processor';
import { InviteFriendsProcessor } from './invite-friends.processor';
import { QuestCompleteProcessor } from './quest-complete.processor';
import { LevelUpProcessor } from './level-up.processor';
import { ProfileCompleteProcessor } from './profile-complete.processor';

/**
 * 프로세서 모듈
 */
@Module({
  imports: [EventLoggerModule],
  providers: [
    EventProcessorFactory,
    DailyLoginProcessor,
    InviteFriendsProcessor,
    QuestCompleteProcessor,
    LevelUpProcessor,
    ProfileCompleteProcessor,
  ],
  exports: [EventProcessorFactory],
})
export class ProcessorsModule {}
