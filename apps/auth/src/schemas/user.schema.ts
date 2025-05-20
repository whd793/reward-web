import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@app/common';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User {
  @ApiProperty({ description: '사용자명' })
  @Prop({ required: true, unique: true })
  username: string;

  @ApiProperty({ description: '이메일' })
  @Prop({ required: true, unique: true })
  email: string;

  @ApiProperty({ description: '비밀번호' })
  @Prop({ required: true })
  password: string;

  @ApiProperty({ enum: Role, isArray: true, description: '역할' })
  @Prop({ type: [String], enum: Role, default: [Role.USER] })
  roles: Role[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// 인덱스 추가
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });
