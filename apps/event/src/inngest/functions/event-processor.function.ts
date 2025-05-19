import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { InngestClient } from '../inngest.client';
import { EventProcessorFactory } from '../../processors/event-processor.factory';
import { EventLoggerService } from '../../event-logger/event-logger.service';
import { TransactionUtil, EventType } from '@app/common';

/**
 * 이벤트 프로세서 함수
 * Inngest를 통해 이벤트를 처리하는 함수입니다.
 */
@Injectable()
export class EventProcessorFunction {
  private readonly logger = new Logger(EventProcessorFunction.name);

  constructor(
    private readonly inngestClient: InngestClient,
    private readonly eventProcessorFactory: EventProcessorFactory,
    private readonly eventLoggerService: EventLoggerService,
    @InjectConnection() private readonly connection: Connection,
  ) {
    const inngest = this.inngestClient.getClient();

    // 사용자 이벤트 처리 함수 등록
    inngest.createFunction(
      { id: 'process-user-event' },
      { event: 'user/*' },
      async ({ event, step }) => {
        const eventTypePath = event.name.split('/')[1];
        const userId = event.data.userId;

        this.logger.log(`Processing user event: ${eventTypePath} for user ${userId}`);

        // 문자열을 EventType 열거형으로 변환
        const eventType = eventTypePath as EventType;

        // 이벤트 로그 생성
        await step.run('create-event-log', async () => {
          await this.eventLoggerService.createLog(userId, eventType, event.data);
        });

        // 이벤트 프로세서 생성
        const processor = this.eventProcessorFactory.createProcessor(eventType);

        if (!processor) {
          this.logger.warn(`No processor found for event type: ${eventType}`);
          return { success: false, reason: 'No processor found' };
        }

        try {
          // 트랜잭션 내에서 이벤트 처리
          const result = await TransactionUtil.withTransaction(this.connection, async session => {
            return processor.process(userId, event.data, session);
          });

          this.logger.log(`Event processed successfully: ${eventType} for user ${userId}`);
          return { success: true, result };
        } catch (error) {
          this.logger.error(`Failed to process event: ${error.message}`, error.stack);
          return { success: false, error: error.message };
        }
      },
    );
  }
}
