/**
 * 데이터베이스 시드 스크립트
 * 개발 및 테스트를 위한 초기 데이터를 생성합니다.
 */
const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/reward-system';

// 역할 상수
const Role = {
  USER: 'USER',
  OPERATOR: 'OPERATOR',
  AUDITOR: 'AUDITOR',
  ADMIN: 'ADMIN',
};

// 보상 요청 상태 상수
const RewardRequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
};

// 스키마 정의
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  roles: [{ type: String, enum: Object.values(Role), default: [Role.USER] }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  requiresApproval: { type: Boolean, default: false },
  conditionType: { type: String, required: true },
  conditionValue: { type: Number, required: true },
  conditionDescription: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const rewardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  rewardType: { type: String, required: true },
  rewardValue: { type: mongoose.Schema.Types.Mixed, required: true },
  quantity: { type: Number, default: -1 },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const rewardRequestSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  rewardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reward', required: false },
  status: {
    type: String,
    enum: Object.values(RewardRequestStatus),
    default: RewardRequestStatus.PENDING,
  },
  rejectionReason: { type: String, required: false },
  idempotencyKey: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
});

// 모델 생성
const User = mongoose.model('User', userSchema);
const Event = mongoose.model('Event', eventSchema);
const Reward = mongoose.model('Reward', rewardSchema);
const RewardRequest = mongoose.model('RewardRequest', rewardRequestSchema);

// 데이터베이스 시드 함수
async function seedDatabase() {
  try {
    // MongoDB 연결
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB에 연결되었습니다.');

    // 기존 데이터 삭제
    await Promise.all([
      User.deleteMany({}),
      Event.deleteMany({}),
      Reward.deleteMany({}),
      RewardRequest.deleteMany({}),
    ]);
    console.log('기존 데이터가 삭제되었습니다.');

    // 사용자 생성
    const users = await Promise.all([
      new User({
        username: 'admin',
        password: await bcrypt.hash('admin123', 10),
        email: 'admin@example.com',
        roles: [Role.ADMIN],
      }).save(),
      new User({
        username: 'operator',
        password: await bcrypt.hash('operator123', 10),
        email: 'operator@example.com',
        roles: [Role.OPERATOR],
      }).save(),
      new User({
        username: 'auditor',
        password: await bcrypt.hash('auditor123', 10),
        email: 'auditor@example.com',
        roles: [Role.AUDITOR],
      }).save(),
      new User({
        username: 'user',
        password: await bcrypt.hash('user123', 10),
        email: 'user@example.com',
        roles: [Role.USER],
      }).save(),
    ]);
    console.log('사용자가 생성되었습니다.');

    // 이벤트 생성
    const events = await Promise.all([
      new Event({
        title: '7일 연속 출석 이벤트',
        description: '7일 연속으로 로그인한 사용자에게 보상을 제공합니다.',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        isActive: true,
        requiresApproval: false,
        conditionType: 'DAILY_LOGIN',
        conditionValue: 7,
        conditionDescription: '7일 연속 로그인',
      }).save(),
      new Event({
        title: '친구 초대 이벤트',
        description: '3명의 친구를 초대하면 보상을 받을 수 있습니다.',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        isActive: true,
        requiresApproval: true,
        conditionType: 'INVITE_FRIENDS',
        conditionValue: 3,
        conditionDescription: '3명의 친구 초대',
      }).save(),
      new Event({
        title: '프로필 완성 이벤트',
        description: '프로필을 100% 완성하면 보상을 받을 수 있습니다.',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        isActive: true,
        requiresApproval: false,
        conditionType: 'PROFILE_COMPLETE',
        conditionValue: 100,
        conditionDescription: '프로필 100% 완성',
      }).save(),
      new Event({
        title: '특별 퀘스트 완료 이벤트',
        description: '특별 퀘스트를 완료하면 보상을 받을 수 있습니다.',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        isActive: true,
        requiresApproval: true,
        conditionType: 'COMPLETE_QUEST',
        conditionValue: 1,
        conditionDescription: '특별 퀘스트 완료',
      }).save(),
      new Event({
        title: '레벨 업 이벤트',
        description: '레벨 10에 도달하면 보상을 받을 수 있습니다.',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        isActive: true,
        requiresApproval: false,
        conditionType: 'LEVEL_UP',
        conditionValue: 10,
        conditionDescription: '레벨 10 달성',
      }).save(),
    ]);
    console.log('이벤트가 생성되었습니다.');

    // 보상 생성
    const rewards = await Promise.all([
      new Reward({
        name: '골드 1000',
        description: '게임 내 골드 1000개를 제공합니다.',
        rewardType: 'GAME_CURRENCY',
        rewardValue: 1000,
        quantity: -1, // 무제한
        eventId: events[0]._id,
      }).save(),
      new Reward({
        name: '희귀 아이템 상자',
        description: '희귀 아이템을 포함한 상자를 제공합니다.',
        rewardType: 'ITEM',
        rewardValue: 'rare_item_box',
        quantity: 500, // 제한된 수량
        eventId: events[1]._id,
      }).save(),
      new Reward({
        name: '프로필 테두리',
        description: '특별한 프로필 테두리를 제공합니다.',
        rewardType: 'COSMETIC',
        rewardValue: 'special_profile_border',
        quantity: -1, // 무제한
        eventId: events[2]._id,
      }).save(),
      new Reward({
        name: '전설 아이템',
        description: '전설급 아이템을 제공합니다.',
        rewardType: 'ITEM',
        rewardValue: 'legendary_item',
        quantity: 100, // 매우 제한된 수량
        eventId: events[3]._id,
      }).save(),
      new Reward({
        name: '경험치 부스터',
        description: '3일간 경험치 획득량이 2배로 증가합니다.',
        rewardType: 'BUFF',
        rewardValue: 'exp_booster_3days',
        quantity: -1, // 무제한
        eventId: events[4]._id,
      }).save(),
    ]);
    console.log('보상이 생성되었습니다.');

    // 보상 요청 생성 (예시)
    const rewardRequests = await Promise.all([
      new RewardRequest({
        userId: users[3]._id, // 일반 사용자
        eventId: events[0]._id,
        rewardId: rewards[0]._id,
        status: RewardRequestStatus.COMPLETED,
        idempotencyKey: `user_${users[3]._id}_event_${events[0]._id}_${Date.now()}_1`,
        processedAt: new Date(),
      }).save(),
      new RewardRequest({
        userId: users[3]._id, // 일반 사용자
        eventId: events[1]._id,
        rewardId: rewards[1]._id,
        status: RewardRequestStatus.PENDING,
        idempotencyKey: `user_${users[3]._id}_event_${events[1]._id}_${Date.now()}_2`,
      }).save(),
      new RewardRequest({
        userId: users[3]._id, // 일반 사용자
        eventId: events[2]._id,
        rewardId: rewards[2]._id,
        status: RewardRequestStatus.COMPLETED,
        idempotencyKey: `user_${users[3]._id}_event_${events[2]._id}_${Date.now()}_3`,
        processedAt: new Date(),
      }).save(),
    ]);
    console.log('보상 요청이 생성되었습니다.');

    console.log('데이터베이스 시드가 완료되었습니다.');
  } catch (error) {
    console.error('데이터베이스 시드 중 오류가 발생했습니다:', error);
  } finally {
    // 데이터베이스 연결 종료
    await mongoose.disconnect();
    console.log('MongoDB 연결이 종료되었습니다.');
  }
}

// 스크립트 실행
seedDatabase();
