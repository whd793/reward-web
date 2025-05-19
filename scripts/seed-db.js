const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const uri =
  process.env.MONGODB_URI ||
  'mongodb+srv://root:root123@cluster0.77urvaw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
// 'mongodb://root:root123@localhost:27017/reward-system?authSource=admin';

async function seed() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('MongoDB에 연결되었습니다');

    const db = client.db('reward-system');

    // 기존 컬렉션 삭제
    await db.collection('users').deleteMany({});
    await db.collection('events').deleteMany({});
    await db.collection('rewards').deleteMany({});
    await db.collection('reward_requests').deleteMany({});
    await db.collection('event_logs').deleteMany({});

    console.log('기존 데이터가 삭제되었습니다');

    // 사용자 생성
    const users = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        roles: ['ADMIN'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: 'operator',
        email: 'operator@example.com',
        password: await bcrypt.hash('operator123', 10),
        roles: ['OPERATOR'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: 'auditor',
        email: 'auditor@example.com',
        password: await bcrypt.hash('auditor123', 10),
        roles: ['AUDITOR'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: 'user',
        email: 'user@example.com',
        password: await bcrypt.hash('user123', 10),
        roles: ['USER'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const { insertedIds: userIds } = await db.collection('users').insertMany(users);
    console.log('기본 사용자가 생성되었습니다');

    // 이벤트 생성
    const now = new Date();
    const oneMonthLater = new Date(now);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    const events = [
      {
        name: '7일 연속 출석 이벤트',
        description: '7일 연속으로 로그인하면 보상을 받을 수 있습니다.',
        eventType: 'DAILY_LOGIN',
        condition: {
          consecutiveDays: 7,
        },
        startDate: now,
        endDate: oneMonthLater,
        status: 'ACTIVE',
        approvalType: 'AUTO',
        createdBy: userIds[0],
        createdAt: now,
        updatedAt: now,
      },
      {
        name: '친구 초대 이벤트',
        description: '친구 3명을 초대하고 보상을 받으세요.',
        eventType: 'INVITE_FRIENDS',
        condition: {
          friendCount: 3,
        },
        startDate: now,
        endDate: oneMonthLater,
        status: 'ACTIVE',
        approvalType: 'AUTO',
        createdBy: userIds[0],
        createdAt: now,
        updatedAt: now,
      },
      {
        name: '퀘스트 완료 이벤트',
        description: '특정 퀘스트를 완료하고 보상을 받으세요.',
        eventType: 'QUEST_COMPLETE',
        condition: {
          questId: 'quest_123',
          questName: '첫 모험 퀘스트',
        },
        startDate: now,
        endDate: oneMonthLater,
        status: 'ACTIVE',
        approvalType: 'MANUAL',
        createdBy: userIds[0],
        createdAt: now,
        updatedAt: now,
      },
      {
        name: '레벨업 이벤트',
        description: '레벨 10에 도달하면 보상을 받을 수 있습니다.',
        eventType: 'LEVEL_UP',
        condition: {
          targetLevel: 10,
        },
        startDate: now,
        endDate: oneMonthLater,
        status: 'ACTIVE',
        approvalType: 'AUTO',
        createdBy: userIds[0],
        createdAt: now,
        updatedAt: now,
      },
      {
        name: '프로필 완성 이벤트',
        description: '프로필 정보를 모두 입력하면 보상을 받을 수 있습니다.',
        eventType: 'PROFILE_COMPLETE',
        condition: {
          requiredFields: ['name', 'birthdate', 'address', 'phoneNumber'],
        },
        startDate: now,
        endDate: oneMonthLater,
        status: 'ACTIVE',
        approvalType: 'AUTO',
        createdBy: userIds[0],
        createdAt: now,
        updatedAt: now,
      },
    ];

    const { insertedIds: eventIds } = await db.collection('events').insertMany(events);
    console.log('기본 이벤트가 생성되었습니다');

    // 보상 생성
    const rewards = [
      {
        name: '골드 500개',
        description: '게임에서 사용 가능한 골드 500개',
        type: 'CURRENCY',
        value: 500,
        quantity: 1,
        eventId: eventIds[0],
        createdBy: userIds[0],
        createdAt: now,
        updatedAt: now,
      },
      {
        name: '경험치 포션',
        description: '경험치 2배 포션 (24시간)',
        type: 'ITEM',
        value: 1,
        quantity: 1,
        eventId: eventIds[1],
        createdBy: userIds[0],
        createdAt: now,
        updatedAt: now,
      },
      {
        name: '한정판 아이템',
        description: '퀘스트 완료 기념 한정판 아이템',
        type: 'ITEM',
        value: 1,
        quantity: 1,
        eventId: eventIds[2],
        createdBy: userIds[0],
        createdAt: now,
        updatedAt: now,
      },
      {
        name: '멤버십 포인트',
        description: '멤버십 포인트 1000점',
        type: 'POINTS',
        value: 1000,
        quantity: 1,
        eventId: eventIds[3],
        createdBy: userIds[0],
        createdAt: now,
        updatedAt: now,
      },
      {
        name: '게임 아이템 구매 쿠폰',
        description: '아이템 구매 시 사용 가능한 10% 할인 쿠폰',
        type: 'COUPON',
        value: 10,
        quantity: 1,
        eventId: eventIds[4],
        createdBy: userIds[0],
        createdAt: now,
        updatedAt: now,
      },
    ];

    const { insertedIds: rewardIds } = await db.collection('rewards').insertMany(rewards);
    console.log('기본 보상이 생성되었습니다');

    // 샘플 이벤트 로그 생성
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const eventLogs = [
      {
        userId: userIds[3],
        eventType: 'DAILY_LOGIN',
        data: {
          loginDate: yesterday,
          deviceInfo: '테스트 기기',
        },
        timestamp: yesterday,
        createdAt: yesterday,
        updatedAt: yesterday,
      },
      {
        userId: userIds[3],
        eventType: 'DAILY_LOGIN',
        data: {
          loginDate: now,
          deviceInfo: '테스트 기기',
        },
        timestamp: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: userIds[3],
        eventType: 'QUEST_COMPLETE',
        data: {
          questId: 'quest_123',
          questName: '첫 모험 퀘스트',
          completionDate: now,
          difficulty: '쉬움',
        },
        timestamp: now,
        createdAt: now,
        updatedAt: now,
      },
    ];

    await db.collection('event_logs').insertMany(eventLogs);
    console.log('샘플 이벤트 로그가 생성되었습니다');

    // 샘플 보상 요청 생성
    const rewardRequests = [
      {
        userId: userIds[3],
        eventId: eventIds[2],
        rewardId: rewardIds[2],
        status: 'PENDING',
        message: '관리자 승인 대기 중',
        idempotencyKey: uuidv4(),
        createdAt: now,
        updatedAt: now,
      },
    ];

    await db.collection('reward_requests').insertMany(rewardRequests);
    console.log('샘플 보상 요청이 생성되었습니다');

    console.log('데이터베이스 시드 작업이 완료되었습니다!');
  } catch (error) {
    console.error('데이터베이스 시드 중 오류가 발생했습니다:', error);
  } finally {
    await client.close();
    console.log('MongoDB 연결이 닫혔습니다');
  }
}

seed().catch(console.error);

// const { MongoClient } = require('mongodb');
// const bcrypt = require('bcrypt');
// const { v4: uuidv4 } = require('uuid');
// require('dotenv').config();

// const uri =
//   process.env.MONGODB_URI ||
//   'mongodb://root:root123@localhost:27017/reward-system?authSource=admin';
// async function seed() {
//   const client = new MongoClient(uri);

//   try {
//     await client.connect();
//     console.log('MongoDB에 연결되었습니다');

//     const db = client.db('reward-system');

//     // 기존 컬렉션 삭제
//     await db.collection('users').deleteMany({});
//     await db.collection('events').deleteMany({});
//     await db.collection('rewards').deleteMany({});
//     await db.collection('reward_requests').deleteMany({});
//     await db.collection('event_logs').deleteMany({});

//     console.log('기존 데이터가 삭제되었습니다');

//     // 사용자 생성
//     const users = [
//       {
//         username: 'admin',
//         email: 'admin@example.com',
//         password: await bcrypt.hash('admin123', 10),
//         roles: ['ADMIN'],
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         username: 'operator',
//         email: 'operator@example.com',
//         password: await bcrypt.hash('operator123', 10),
//         roles: ['OPERATOR'],
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         username: 'auditor',
//         email: 'auditor@example.com',
//         password: await bcrypt.hash('auditor123', 10),
//         roles: ['AUDITOR'],
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         username: 'user',
//         email: 'user@example.com',
//         password: await bcrypt.hash('user123', 10),
//         roles: ['USER'],
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//     ];

//     const { insertedIds: userIds } = await db.collection('users').insertMany(users);
//     console.log('기본 사용자가 생성되었습니다');

//     // 이벤트 생성
//     const now = new Date();
//     const oneMonthLater = new Date(now);
//     oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

//     const events = [
//       {
//         name: '7일 연속 출석 이벤트',
//         description: '7일 연속으로 로그인하면 보상을 받을 수 있습니다.',
//         eventType: 'DAILY_LOGIN',
//         condition: {
//           consecutiveDays: 7,
//         },
//         startDate: now,
//         endDate: oneMonthLater,
//         status: 'ACTIVE',
//         approvalType: 'AUTO',
//         createdBy: userIds[0],
//         createdAt: now,
//         updatedAt: now,
//       },
//       {
//         name: '친구 초대 이벤트',
//         description: '친구 3명을 초대하고 보상을 받으세요.',
//         eventType: 'INVITE_FRIENDS',
//         condition: {
//           friendCount: 3,
//         },
//         startDate: now,
//         endDate: oneMonthLater,
//         status: 'ACTIVE',
//         approvalType: 'AUTO',
//         createdBy: userIds[0],
//         createdAt: now,
//         updatedAt: now,
//       },
//       {
//         name: '퀘스트 완료 이벤트',
//         description: '특정 퀘스트를 완료하고 보상을 받으세요.',
//         eventType: 'QUEST_COMPLETE',
//         condition: {
//           questId: 'quest_123',
//           questName: '첫 모험 퀘스트',
//         },
//         startDate: now,
//         endDate: oneMonthLater,
//         status: 'ACTIVE',
//         approvalType: 'MANUAL',
//         createdBy: userIds[0],
//         createdAt: now,
//         updatedAt: now,
//       },
//       {
//         name: '레벨업 이벤트',
//         description: '레벨 10에 도달하면 보상을 받을 수 있습니다.',
//         eventType: 'LEVEL_UP',
//         condition: {
//           targetLevel: 10,
//         },
//         startDate: now,
//         endDate: oneMonthLater,
//         status: 'ACTIVE',
//         approvalType: 'AUTO',
//         createdBy: userIds[0],
//         createdAt: now,
//         updatedAt: now,
//       },
//       {
//         name: '프로필 완성 이벤트',
//         description: '프로필 정보를 모두 입력하면 보상을 받을 수 있습니다.',
//         eventType: 'PROFILE_COMPLETE',
//         condition: {
//           requiredFields: ['name', 'birthdate', 'address', 'phoneNumber'],
//         },
//         startDate: now,
//         endDate: oneMonthLater,
//         status: 'ACTIVE',
//         approvalType: 'AUTO',
//         createdBy: userIds[0],
//         createdAt: now,
//         updatedAt: now,
//       },
//     ];

//     const { insertedIds: eventIds } = await db.collection('events').insertMany(events);
//     console.log('기본 이벤트가 생성되었습니다');

//     // 보상 생성
//     const rewards = [
//       {
//         name: '골드 500개',
//         description: '게임에서 사용 가능한 골드 500개',
//         type: 'CURRENCY',
//         value: 500,
//         quantity: 1,
//         eventId: eventIds[0],
//         createdBy: userIds[0],
//         createdAt: now,
//         updatedAt: now,
//       },
//       {
//         name: '경험치 포션',
//         description: '경험치 2배 포션 (24시간)',
//         type: 'ITEM',
//         value: 1,
//         quantity: 1,
//         eventId: eventIds[1],
//         createdBy: userIds[0],
//         createdAt: now,
//         updatedAt: now,
//       },
//       {
//         name: '한정판 아이템',
//         description: '퀘스트 완료 기념 한정판 아이템',
//         type: 'ITEM',
//         value: 1,
//         quantity: 1,
//         eventId: eventIds[2],
//         createdBy: userIds[0],
//         createdAt: now,
//         updatedAt: now,
//       },
//       {
//         name: '멤버십 포인트',
//         description: '멤버십 포인트 1000점',
//         type: 'POINTS',
//         value: 1000,
//         quantity: 1,
//         eventId: eventIds[3],
//         createdBy: userIds[0],
//         createdAt: now,
//         updatedAt: now,
//       },
//       {
//         name: '게임 아이템 구매 쿠폰',
//         description: '아이템 구매 시 사용 가능한 10% 할인 쿠폰',
//         type: 'COUPON',
//         value: 10,
//         quantity: 1,
//         eventId: eventIds[4],
//         createdBy: userIds[0],
//         createdAt: now,
//         updatedAt: now,
//       },
//     ];

//     const { insertedIds: rewardIds } = await db.collection('rewards').insertMany(rewards);
//     console.log('기본 보상이 생성되었습니다');

//     // 샘플 이벤트 로그 생성
//     const yesterday = new Date(now);
//     yesterday.setDate(yesterday.getDate() - 1);

//     const eventLogs = [
//       {
//         userId: userIds[3],
//         eventType: 'DAILY_LOGIN',
//         data: {
//           loginDate: yesterday,
//           deviceInfo: '테스트 기기',
//         },
//         timestamp: yesterday,
//         createdAt: yesterday,
//         updatedAt: yesterday,
//       },
//       {
//         userId: userIds[3],
//         eventType: 'DAILY_LOGIN',
//         data: {
//           loginDate: now,
//           deviceInfo: '테스트 기기',
//         },
//         timestamp: now,
//         createdAt: now,
//         updatedAt: now,
//       },
//       {
//         userId: userIds[3],
//         eventType: 'QUEST_COMPLETE',
//         data: {
//           questId: 'quest_123',
//           questName: '첫 모험 퀘스트',
//           completionDate: now,
//           difficulty: '쉬움',
//         },
//         timestamp: now,
//         createdAt: now,
//         updatedAt: now,
//       },
//     ];

//     await db.collection('event_logs').insertMany(eventLogs);
//     console.log('샘플 이벤트 로그가 생성되었습니다');

//     // 샘플 보상 요청 생성
//     const rewardRequests = [
//       {
//         userId: userIds[3],
//         eventId: eventIds[2],
//         rewardId: rewardIds[2],
//         status: 'PENDING',
//         message: '관리자 승인 대기 중',
//         idempotencyKey: uuidv4(),
//         createdAt: now,
//         updatedAt: now,
//       },
//     ];

//     await db.collection('reward_requests').insertMany(rewardRequests);
//     console.log('샘플 보상 요청이 생성되었습니다');

//     console.log('데이터베이스 시드 작업이 완료되었습니다!');
//   } catch (error) {
//     console.error('데이터베이스 시드 중 오류가 발생했습니다:', error);
//   } finally {
//     await client.close();
//     console.log('MongoDB 연결이 닫혔습니다');
//   }
// }

// seed().catch(console.error);
