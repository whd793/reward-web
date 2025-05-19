// // This script will be run when MongoDB container is created
// // It creates the required users and basic data

// db = db.getSiblingDB('reward-system');

// // Create users collection
// db.createCollection('users');

// // Create default users
// db.users.insertMany([
//   {
//     username: 'admin',
//     email: 'admin@example.com',
//     password: '$2b$10$8jPiAUizVbip.l3PkPSIB.lVsOQcQyJiHFrgQ9H5hsVQdN9YQwSMu', // admin123
//     roles: ['ADMIN'],
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
//   {
//     username: 'operator',
//     email: 'operator@example.com',
//     password: '$2b$10$3BnkAwUJUC9H5.UYk1qQ1OGI35xYQZdbH.TmUvlRCQGIsJHsU33Ce', // operator123
//     roles: ['OPERATOR'],
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
//   {
//     username: 'auditor',
//     email: 'auditor@example.com',
//     password: '$2b$10$lC3wQvVVFj9DwsYrSfvdDeZpkFfGwdHAIUfcnHMdEcXaGRVTRJ5De', // auditor123
//     roles: ['AUDITOR'],
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
//   {
//     username: 'user',
//     email: 'user@example.com',
//     password: '$2b$10$Pz/DBJK91i4IdZLGkGeQJ.d03cNWCG2GnPMYR9oIFhn6RCEcI9R6a', // user123
//     roles: ['USER'],
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
// ]);

// Modified init-mongo.js with bcrypt hashing
db = db.getSiblingDB('reward-system');

// Create users collection
db.createCollection('users');

// Helper function to hash passwords (basic implementation for MongoDB shell)
function hashPassword(password) {
  // Note: This is not actual bcrypt hashing, just a placeholder
  // MongoDB shell doesn't support bcrypt, so we're using hardcoded hashes
  if (password === 'admin123')
    return '$2b$10$8jPiAUizVbip.l3PkPSIB.lVsOQcQyJiHFrgQ9H5hsVQdN9YQwSMu';
  if (password === 'operator123')
    return '$2b$10$3BnkAwUJUC9H5.UYk1qQ1OGI35xYQZdbH.TmUvlRCQGIsJHsU33Ce';
  if (password === 'auditor123')
    return '$2b$10$lC3wQvVVFj9DwsYrSfvdDeZpkFfGwdHAIUfcnHMdEcXaGRVTRJ5De';
  if (password === 'user123') return '$2b$10$Pz/DBJK91i4IdZLGkGeQJ.d03cNWCG2GnPMYR9oIFhn6RCEcI9R6a';
  return password; // Fallback
}

// Create default users with the same hashed passwords as seed-db.js
db.users.insertMany([
  {
    username: 'admin',
    email: 'admin@example.com',
    password: hashPassword('admin123'),
    roles: ['ADMIN'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    username: 'operator',
    email: 'operator@example.com',
    password: hashPassword('operator123'),
    roles: ['OPERATOR'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    username: 'auditor',
    email: 'auditor@example.com',
    password: hashPassword('auditor123'),
    roles: ['AUDITOR'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    username: 'user',
    email: 'user@example.com',
    password: hashPassword('user123'),
    roles: ['USER'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

// Create events collection
db.createCollection('events');

// Create sample events
const eventIds = [];
const events = [
  {
    name: '7일 연속 출석 이벤트',
    description: '7일 연속으로 로그인하면 보상을 받을 수 있습니다.',
    eventType: 'DAILY_LOGIN',
    condition: {
      consecutiveDays: 7,
    },
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    status: 'ACTIVE',
    approvalType: 'AUTO',
    createdBy: 'admin',
  },
  {
    name: '친구 초대 이벤트',
    description: '친구 3명을 초대하고 보상을 받으세요.',
    eventType: 'INVITE_FRIENDS',
    condition: {
      friendCount: 3,
    },
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    status: 'ACTIVE',
    approvalType: 'AUTO',
    createdBy: 'admin',
  },
  {
    name: '퀘스트 완료 이벤트',
    description: '특정 퀘스트를 완료하고 보상을 받으세요.',
    eventType: 'QUEST_COMPLETE',
    condition: {
      questId: 'quest_123',
      questName: '첫 모험 퀘스트',
    },
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    status: 'ACTIVE',
    approvalType: 'MANUAL',
    createdBy: 'admin',
  },
  {
    name: '레벨업 이벤트',
    description: '레벨 10에 도달하면 보상을 받을 수 있습니다.',
    eventType: 'LEVEL_UP',
    condition: {
      targetLevel: 10,
    },
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    status: 'ACTIVE',
    approvalType: 'AUTO',
    createdBy: 'admin',
  },
  {
    name: '프로필 완성 이벤트',
    description: '프로필 정보를 모두 입력하면 보상을 받을 수 있습니다.',
    eventType: 'PROFILE_COMPLETE',
    condition: {
      requiredFields: ['name', 'birthdate', 'address', 'phoneNumber'],
    },
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    status: 'ACTIVE',
    approvalType: 'AUTO',
    createdBy: 'admin',
  },
];

// Insert events and collect their IDs
let result = db.events.insertMany(events);
for (let i = 0; i < events.length; i++) {
  eventIds.push(result.insertedIds[i]);
}

// Create rewards collection
db.createCollection('rewards');

// Create sample rewards
const rewards = [
  {
    name: '골드 500개',
    description: '게임에서 사용 가능한 골드 500개',
    type: 'CURRENCY',
    value: 500,
    quantity: 1,
    eventId: eventIds[0],
    createdBy: 'admin',
  },
  {
    name: '경험치 포션',
    description: '경험치 2배 포션 (24시간)',
    type: 'ITEM',
    value: 1,
    quantity: 1,
    eventId: eventIds[1],
    createdBy: 'admin',
  },
  {
    name: '한정판 아이템',
    description: '퀘스트 완료 기념 한정판 아이템',
    type: 'ITEM',
    value: 1,
    quantity: 1,
    eventId: eventIds[2],
    createdBy: 'admin',
  },
  {
    name: '멤버십 포인트',
    description: '멤버십 포인트 1000점',
    type: 'POINTS',
    value: 1000,
    quantity: 1,
    eventId: eventIds[3],
    createdBy: 'admin',
  },
  {
    name: '게임 아이템 구매 쿠폰',
    description: '아이템 구매 시 사용 가능한 10% 할인 쿠폰',
    type: 'COUPON',
    value: 10,
    quantity: 1,
    eventId: eventIds[4],
    createdBy: 'admin',
  },
];

db.rewards.insertMany(rewards);

// Create event_logs collection
db.createCollection('event_logs');

// Create reward_requests collection
db.createCollection('reward_requests');

print('Database initialization completed!');
