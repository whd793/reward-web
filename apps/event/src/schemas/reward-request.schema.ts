import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export enum RewardRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FAILED = 'FAILED',
}

export type RewardRequestDocument = RewardRequest & Document;

@Schema({
  timestamps: true,
  collection: 'reward_requests',
})
export class RewardRequest {
  @ApiProperty({ description: '사용자 ID' })
  @Prop({ required: true, index: true })
  userId: string;

  @ApiProperty({ description: '이벤트 ID' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Event', required: true })
  eventId: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: '보상 ID' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Reward', required: true })
  rewardId: MongooseSchema.Types.ObjectId;

  @ApiProperty({ enum: RewardRequestStatus, description: '요청 상태' })
  @Prop({ type: String, enum: RewardRequestStatus, default: RewardRequestStatus.PENDING })
  status: RewardRequestStatus;

  @ApiProperty({ description: '처리 메시지' })
  @Prop()
  message: string;

  @ApiProperty({ description: '요청 멱등성 키' })
  @Prop({ required: true, unique: true })
  idempotencyKey: string;

  @ApiProperty({ description: '처리 일시' })
  @Prop()
  processedAt: Date;

  @ApiProperty({ description: '처리자 ID' })
  @Prop()
  processedBy: string;
}

export const RewardRequestSchema = SchemaFactory.createForClass(RewardRequest);

// 인덱스 추가
RewardRequestSchema.index({ userId: 1, eventId: 1 });
RewardRequestSchema.index({ status: 1 });
RewardRequestSchema.index({ idempotencyKey: 1 }, { unique: true });
