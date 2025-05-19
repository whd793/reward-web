import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export enum EventStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum EventApprovalType {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
}

export type EventDocument = Event & Document;

@Schema({
  timestamps: true,
  collection: 'events',
})
export class Event {
  @ApiProperty({ description: '이벤트 이름' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: '이벤트 설명' })
  @Prop({ required: true })
  description: string;

  @ApiProperty({ description: '이벤트 유형' })
  @Prop({ required: true })
  eventType: string;

  @ApiProperty({ description: '이벤트 조건' })
  @Prop({ type: Object, required: true })
  condition: Record<string, any>;

  @ApiProperty({ description: '시작일' })
  @Prop({ required: true })
  startDate: Date;

  @ApiProperty({ description: '종료일' })
  @Prop({ required: true })
  endDate: Date;

  @ApiProperty({ enum: EventStatus, description: '이벤트 상태' })
  @Prop({ type: String, enum: EventStatus, default: EventStatus.ACTIVE })
  status: EventStatus;

  @ApiProperty({ enum: EventApprovalType, description: '승인 유형' })
  @Prop({
    type: String,
    enum: EventApprovalType,
    default: EventApprovalType.AUTO,
  })
  approvalType: EventApprovalType;

  @ApiProperty({ description: '생성자 ID' })
  @Prop({ required: true })
  createdBy: string;
}

export const EventSchema = SchemaFactory.createForClass(Event);

// 인덱스 추가
EventSchema.index({ eventType: 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ startDate: 1, endDate: 1 });
