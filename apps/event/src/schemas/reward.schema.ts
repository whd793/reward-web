import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

/**
 * 보상 스키마
 * MongoDB에 저장될 보상 정보의 스키마를 정의합니다.
 */
@Schema({ timestamps: true })
export class Reward {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  rewardType: string;

  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  rewardValue: string | number;

  @Prop({ type: Number, default: -1 })
  quantity: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Event', required: true })
  eventId: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export type RewardDocument = Reward & Document;
export const RewardSchema = SchemaFactory.createForClass(Reward);
