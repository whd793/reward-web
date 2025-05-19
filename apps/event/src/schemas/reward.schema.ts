import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export enum RewardType {
  POINTS = 'POINTS',
  ITEM = 'ITEM',
  COUPON = 'COUPON',
  CURRENCY = 'CURRENCY',
}

export type RewardDocument = Reward & Document;

@Schema({
  timestamps: true,
  collection: 'rewards',
})
export class Reward {
  @ApiProperty({ description: '보상 이름' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: '보상 설명' })
  @Prop({ required: true })
  description: string;

  @ApiProperty({ enum: RewardType, description: '보상 유형' })
  @Prop({ type: String, enum: RewardType, required: true })
  type: RewardType;

  @ApiProperty({ description: '보상 값' })
  @Prop({ required: true })
  value: number;

  @ApiProperty({ description: '보상 수량' })
  @Prop({ required: true, default: 1 })
  quantity: number;

  @ApiProperty({ description: '관련 이벤트 ID' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Event', required: true })
  eventId: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: '생성자 ID' })
  @Prop({ required: true })
  createdBy: string;
}

export const RewardSchema = SchemaFactory.createForClass(Reward);

// 인덱스 추가
RewardSchema.index({ type: 1 });
RewardSchema.index({ eventId: 1 });
