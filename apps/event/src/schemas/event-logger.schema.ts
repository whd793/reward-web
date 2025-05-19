import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type EventLoggerDocument = EventLogger & Document;

@Schema({
  timestamps: true,
  collection: 'event_logs',
})
export class EventLogger {
  @ApiProperty({ description: '사용자 ID' })
  @Prop({ required: true, index: true })
  userId: string;

  @ApiProperty({ description: '이벤트 유형' })
  @Prop({ required: true, index: true })
  eventType: string;

  @ApiProperty({ description: '이벤트 데이터' })
  @Prop({ type: Object })
  data: Record<string, any>;

  @ApiProperty({ description: '이벤트 발생 시간' })
  @Prop({ required: true, index: true })
  timestamp: Date;
}

export const EventLoggerSchema = SchemaFactory.createForClass(EventLogger);

// 인덱스 추가
EventLoggerSchema.index({ userId: 1, eventType: 1 });
EventLoggerSchema.index({ timestamp: 1 });
