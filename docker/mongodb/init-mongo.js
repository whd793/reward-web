/**
 * MongoDB 초기화 스크립트
 * 도커 컨테이너 시작 시 데이터베이스를 초기화합니다.
 */

// 데이터베이스 선택
db = db.getSiblingDB('reward-system');

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

// 컬렉션 생성
db.createCollection('users');
db.createCollection('events');
db.createCollection('rewards');
db.createCollection('rewardrequests');

// 사용자 생성
db.users.insertMany([
  {
    username: 'admin',
    password: '$2b$10$x5d5qnTdQFCguSrPDK6MDeRKJbFGfSGw6jCRtBS3nR7mX1bkVBSty', // 'admin123'
    email: 'admin@example.com',
    roles: [Role.ADMIN],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    username: 'operator',
    password: '$2b$10$LMKfM4abHE08/W9qOyoqfeTLMbGx7ydK5NbwAWQEHiXfZnDQjk5Ci', // 'operator123'
    email: 'operator@example.com',
    roles: [Role.OPERATOR],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    username: 'auditor',
    password: '$2b$10$a3b9qXhFE4KpA9XJaWBTXO0xC1Jx0eFUVnkDFJYUjHRnIe5/CSoEO', // 'auditor123'
    email: 'auditor@example.com',
    roles: [Role.AUDITOR],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    username: 'user',
    password: '$2b$10$Wz1wnCQrEvwXm.NaV1IlYeGAgnSBq85yRDCiRZz0nLKJk/KwIGv2K', // 'user123'
    email: 'user@example.com',
    roles: [Role.USER],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

// 이벤트 생성
const events = db.events.insertMany([
  {
    title: '7일 연속 출석 이벤트',
    description: '7일 연속으로 로그인한 사용자에게 보상을 제공합니다.',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    isActive: true,
    requiresApproval: false,
    conditionType: 'DAILY_LOGIN',
    conditionValue: 7,
    conditionDescription: '7일 연속 로그인',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: '친구 초대 이벤트',
    description: '3명의 친구를 초대하면 보상을 받을 수 있습니다.',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    isActive: true,
    requiresApproval: true,
    conditionType: 'INVITE_FRIENDS',
    conditionValue: 3,
    conditionDescription: '3명의 친구 초대',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]).insertedIds;

// 보상 생성
db.rewards.insertMany([
  {
    name: '골드 1000',
    description: '게임 내 골드 1000개를 제공합니다.',
    rewardType: 'GAME_CURRENCY',
    rewardValue: 1000,
    quantity: -1, // 무제한
    eventId: events[0],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: '희귀 아이템 상자',
    description: '희귀 아이템을 포함한 상자를 제공합니다.',
    rewardType: 'ITEM',
    rewardValue: 'rare_item_box',
    quantity: 500, // 제한된 수량
    eventId: events[1],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

print('MongoDB 초기화가 완료되었습니다.');

// // MongoDB 초기화 스크립트
// db = db.getSiblingDB('reward-system');

// // User 컬렉션 생성 및 초기 사용자 추가
// db.createCollection('users');
// db.users.insertMany([
//   {
//     username: 'admin',
//     password: '$2b$10$x5d5qnTdQFCguSrPDK6MDeRKJbFGfSGw6jCRtBS3nR7mX1bkVBSty', // 'admin123'
//     email: 'admin@example.com',
//     roles: ['ADMIN'],
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
//   {
//     username: 'operator',
//     password: '$2b$10$LMKfM4abHE08/W9qOyoqfeTLMbGx7ydK5NbwAWQEHiXfZnDQjk5Ci', // 'operator123'
//     email: 'operator@example.com',
//     roles: ['OPERATOR'],
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
//   {
//     username: 'auditor',
//     password: '$2b$10$a3b9qXhFE4KpA9XJaWBTXO0xC1Jx0eFUVnkDFJYUjHRnIe5/CSoEO', // 'auditor123'
//     email: 'auditor@example.com',
//     roles: ['AUDITOR'],
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
//   {
//     username: 'user',
//     password: '$2b$10$Wz1wnCQrEvwXm.NaV1IlYeGAgnSBq85yRDCiRZz0nLKJk/KwIGv2K', // 'user123'
//     email: 'user@example.com',
//     roles: ['USER'],
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
// ]);

// // Event 컬렉션 생성 및 예시 이벤트 추가
// db.createCollection('events');
// db.events.insertMany([
//   {
//     title: '7일 연속 출석 이벤트',
//     description: '7일 연속으로 로그인한 사용자에게 보상을 제공합니다.',
//     startDate: new Date('2025-01-01'),
//     endDate: new Date('2025-12-31'),
//     isActive: true,
//     requiresApproval: false,
//     conditionType: 'DAILY_LOGIN',
//     conditionValue: 7,
//     conditionDescription: '7일 연속 로그인',
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
//   {
//     title: '친구 초대 이벤트',
//     description: '3명의 친구를 초대하면 보상을 받을 수 있습니다.',
//     startDate: new Date('2025-01-01'),
//     endDate: new Date('2025-12-31'),
//     isActive: true,
//     requiresApproval: true,
//     conditionType: 'INVITE_FRIENDS',
//     conditionValue: 3,
//     conditionDescription: '3명의 친구 초대',
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
//   {
//     title: '프로필 완성 이벤트',
//     description: '프로필을 100% 완성하면 보상을 받을 수 있습니다.',
//     startDate: new Date('2025-01-01'),
//     endDate: new Date('2025-12-31'),
//     isActive: true,
//     requiresApproval: false,
//     conditionType: 'PROFILE_COMPLETE',
//     conditionValue: 100,
//     conditionDescription: '프로필 100% 완성',
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
//   {
//     title: '특별 퀘스트 완료 이벤트',
//     description: '특별 퀘스트를 완료하면 보상을 받을 수 있습니다.',
//     startDate: new Date('2025-01-01'),
//     endDate: new Date('2025-12-31'),
//     isActive: true,
//     requiresApproval: true,
//     conditionType: 'COMPLETE_QUEST',
//     conditionValue: 1,
//     conditionDescription: '특별 퀘스트 완료',
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
//   {
//     title: '레벨 업 이벤트',
//     description: '레벨 10에 도달하면 보상을 받을 수 있습니다.',
//     startDate: new Date('2025-01-01'),
//     endDate: new Date('2025-12-31'),
//     isActive: true,
//     requiresApproval: false,
//     conditionType: 'LEVEL_UP',
//     conditionValue: 10,
//     conditionDescription: '레벨 10 달성',
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
// ]);

// // Reward 컬렉션 생성 및 예시 보상 추가
// db.createCollection('rewards');
// db.rewards.insertMany([
//   {
//     name: '골드 1000',
//     description: '게임 내 골드 1000개를 제공합니다.',
//     rewardType: 'GAME_CURRENCY',
//     rewardValue: 1000,
//     quantity: -1, // 무제한
//     eventId: db.events.findOne({ title: '7일 연속 출석 이벤트' })._id,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
//   {
//     name: '희귀 아이템 상자',
//     description: '희귀 아이템을 포함한 상자를 제공합니다.',
//     rewardType: 'ITEM',
//     rewardValue: 'rare_item_box',
//     quantity: 500, // 제한된 수량
//     eventId: db.events.findOne({ title: '친구 초대 이벤트' })._id,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
//   {
//     name: '프로필 테두리',
//     description: '특별한 프로필 테두리를 제공합니다.',
//     rewardType: 'COSMETIC',
//     rewardValue: 'special_profile_border',
//     quantity: -1, // 무제한
//     eventId: db.events.findOne({ title: '프로필 완성 이벤트' })._id,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
//   {
//     name: '전설 아이템',
//     description: '전설급 아이템을 제공합니다.',
//     rewardType: 'ITEM',
//     rewardValue: 'legendary_item',
//     quantity: 100, // 매우 제한된 수량
//     eventId: db.events.findOne({ title: '특별 퀘스트 완료 이벤트' })._id,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
//   {
//     name: '경험치 부스터',
//     description: '3일간 경험치 획득량이 2배로 증가합니다.',
//     rewardType: 'BUFF',
//     rewardValue: 'exp_booster_3days',
//     quantity: -1, // 무제한
//     eventId: db.events.findOne({ title: '레벨 업 이벤트' })._id,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
// ]);

// // RewardRequest 컬렉션 생성
// db.createCollection('rewardrequests');

// print('Database initialized successfully!');
