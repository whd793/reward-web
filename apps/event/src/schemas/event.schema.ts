import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * 이벤트 스키마
 * MongoDB에 저장될 이벤트 정보의 스키마를 정의합니다.
 */
@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, type: Date })
  startDate: Date;

  @Prop({ required: true, type: Date })
  endDate: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  requiresApproval: boolean;

  @Prop({ required: true })
  conditionType: string;

  @Prop({ required: true, type: Number })
  conditionValue: number;

  @Prop({ required: true })
  conditionDescription: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export type EventDocument = Event & Document;
export const EventSchema = SchemaFactory.createForClass(Event);
