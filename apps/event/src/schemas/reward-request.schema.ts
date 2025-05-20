import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

/**
 * 보상 요청 상태 열거형
 */
export enum RewardRequestStatus {
  PENDING = 'PENDING', // 대기 중
  APPROVED = 'APPROVED', // 승인됨
  REJECTED = 'REJECTED', // 거부됨
  COMPLETED = 'COMPLETED', // 완료됨
  FAILED = 'FAILED', // 실패함
}

/**
 * 보상 요청 스키마
 * MongoDB에 저장될 보상 요청 정보의 스키마를 정의합니다.
 */
@Schema({ timestamps: true })
export class RewardRequest {
  @Prop({ required: true })
  userId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Event', required: true })
  eventId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Reward', required: false })
  rewardId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(RewardRequestStatus),
    default: RewardRequestStatus.PENDING,
  })
  status: RewardRequestStatus;

  @Prop({ required: false })
  rejectionReason?: string;

  @Prop({ required: true, unique: true })
  idempotencyKey: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;

  @Prop({ type: Date })
  processedAt?: Date;
}

export type RewardRequestDocument = RewardRequest & Document;
export const RewardRequestSchema = SchemaFactory.createForClass(RewardRequest);
