Let me continue with the implementation of the events-processor service:

### apps/event/src/events-processor/events-processor.service.ts (continued)

```typescript
  /**
   * 새 보상 요청 생성
   * @param userId 사용자 ID
   * @param eventId 이벤트 ID
   * @param rewardId 보상 ID (선택적)
   * @param status 요청 상태
   * @param rejectionReason 거부 사유 (선택적)
   * @param idempotencyKey 멱등성 키
   * @returns 생성된 요청
   */
  private async createRewardRequest(
    userId: string,
    eventId: string,
    rewardId?: string,
    status: RewardRequestStatus = RewardRequestStatus.PENDING,
    rejectionReason?: string,
    idempotencyKey?: string,
  ): Promise<RewardRequestDocument> {
    const key = idempotencyKey ||
      this.idempotencyUtil.generateIdempotencyKey(userId, 'reward_request', eventId);

    const requestData: any = {
      userId,
      eventId: new Types.ObjectId(eventId),
      status,
      idempotencyKey: key,
    };

    if (rewardId) {
      requestData.rewardId = new Types.ObjectId(rewardId);
    }

    if (rejectionReason) {
      requestData.rejectionReason = rejectionReason;
    }

    if (status === RewardRequestStatus.COMPLETED ||
        status === RewardRequestStatus.REJECTED ||
        status === RewardRequestStatus.FAILED) {
      requestData.processedAt = new Date();
    }

    const newRequest = new this.rewardRequestModel(requestData);
    return await newRequest.save();
  }

  /**
   * 특정 ID의 보상 요청 조회
   * @param requestId 보상 요청 ID
   * @returns 보상 요청 정보
   */
  async getRewardRequestById(requestId: string): Promise<RewardRequestDocument> {
    if (!Types.ObjectId.isValid(requestId)) {
      throw new Error('유효하지 않은 요청 ID입니다.');
    }

    const request = await this.rewardRequestModel
      .findById(requestId)
      .populate('eventId', 'title description')
      .populate('rewardId', 'name description rewardType rewardValue')
      .exec();

    if (!request) {
      throw new Error('보상 요청을 찾을 수 없습니다.');
    }

    return request;
  }
}
```

### apps/event/src/events-processor/events-processor.module.ts

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsProcessorService } from './events-processor.service';
import { RewardRequest, RewardRequestSchema } from '../schemas/reward-request.schema';
import { EventsModule } from '../events/events.module';
import { RewardsModule } from '../rewards/rewards.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: RewardRequest.name, schema: RewardRequestSchema }]),
    EventsModule,
    RewardsModule,
  ],
  providers: [EventsProcessorService],
  exports: [EventsProcessorService],
})
export class EventsProcessorModule {}
```

### apps/event/src/app.module.ts

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsModule } from './events/events.module';
import { RewardsModule } from './rewards/rewards.module';
import { EventsProcessorModule } from './events-processor/events-processor.module';
import { CommonModule } from '@app/common';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongodb.uri'),
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
      inject: [ConfigService],
    }),
    CommonModule,
    EventsModule,
    RewardsModule,
    EventsProcessorModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

### apps/event/src/main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Event Service');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('port');

  // 마이크로서비스 설정
  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port,
    },
  });

  await app.startAllMicroservices();
  logger.log(`Event microservice is running on port ${port}`);
}

bootstrap();
```

Let's create the seed script to pre-populate the database:

### scripts/seed-db.js

```javascript
/**
 * 데이터베이스 시드 스크립트
 * 개발 및 테스트를 위한 초기 데이터를 생성합니다.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
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
```

Now, let's create GitHub workflows for CI/CD:

### .github/workflows/ci.yml

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:6.0
        ports:
          - 27017:27017
        env:
          MONGO_INITDB_ROOT_USERNAME: admin
          MONGO_INITDB_ROOT_PASSWORD: password
          MONGO_INITDB_DATABASE: reward-system

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint check
        run: npm run lint

      - name: Run tests
        run: npm run test
        env:
          MONGODB_URI: mongodb://admin:password@localhost:27017/reward-system?authSource=admin
          JWT_SECRET: test-jwt-secret
          JWT_EXPIRATION: 3600s

      - name: Build application
        run: npm run build

  docker-build:
    runs-on: ubuntu-latest
    needs: build-and-test
    if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop')

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Build Gateway image
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./docker/gateway/Dockerfile
          push: false
          tags: reward-system-gateway:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build Auth image
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./docker/auth/Dockerfile
          push: false
          tags: reward-system-auth:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build Event image
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./docker/event/Dockerfile
          push: false
          tags: reward-system-event:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

Now let's create the README.md file:

### README.md

````markdown
# 이벤트/보상 관리 시스템

사용자 이벤트 및 보상을 관리하기 위한 확장 가능한 백엔드 시스템입니다. NestJS, Microservices Architecture (MSA), MongoDB를 사용하여 구현되었습니다.

## 프로젝트 개요

이 시스템은 다양한 조건 기반의 이벤트(예: 연속 로그인, 친구 초대, 퀘스트 완료 등)를 생성하고 관리할 수 있으며, 이벤트 조건을 충족한 사용자에게 보상을 자동 또는 수동으로 지급할 수 있는 기능을 제공합니다.

### 주요 기능

- **사용자 인증 및 권한 관리**: JWT 기반 인증, 역할 기반 접근 제어(RBAC)
- **이벤트 관리**: 조건 기반 이벤트 생성, 수정, 삭제 및 조회
- **보상 관리**: 이벤트별 보상 정의, 수량 관리
- **보상 요청 처리**: 자동 지급 또는 운영자 승인 기반 보상 처리
- **이력 관리**: 모든 보상 요청 및 처리 이력 관리

### 기술 스택

- **런타임**: Node.js 18
- **프레임워크**: NestJS (최신 버전)
- **데이터베이스**: MongoDB
- **인증**: JWT
- **배포**: Docker + docker-compose
- **언어**: TypeScript

## 시스템 아키텍처

시스템은 3개의 독립적인 마이크로서비스로 구성됩니다:

1. **Gateway 서버**: 모든 API 요청의 진입점, 인증 및 라우팅 처리
2. **Auth 서버**: 사용자 관리, 로그인, 역할 및 JWT 발급 담당
3. **Event 서버**: 이벤트 생성, 보상 정의, 요청 처리 및 보상 로그 관리

각 서비스는 독립적으로 배포 및 확장이 가능하며, 마이크로서비스 간 통신은 TCP 프로토콜을 사용합니다.

## 설치 및 실행 방법

### 사전 요구사항

- Node.js 18 이상
- Docker 및 Docker Compose
- MongoDB (로컬 개발용, Docker Compose로도 제공됨)

### 로컬 개발 환경 설정

1. 저장소 클론

```bash
git clone https://github.com/yourusername/reward-system.git
cd reward-system
```
````

2. 의존성 설치

```bash
npm install
```

3. 환경 변수 설정 (`.env` 파일 생성 또는 시스템 환경 변수 설정)

```
# 공통 설정
NODE_ENV=development

# Gateway 서비스 설정
PORT=3000
AUTH_SERVICE_HOST=localhost
AUTH_SERVICE_PORT=3001
EVENT_SERVICE_HOST=localhost
EVENT_SERVICE_PORT=3002
JWT_SECRET=your-jwt-secret
JWT_EXPIRATION=3600s

# Auth 서비스 설정
MONGODB_URI=mongodb://admin:password@localhost:27017/reward-system?authSource=admin

# Event 서비스 설정
INNGEST_SIGNING_KEY=test-signing-key
EVENT_PROCESSING_ENABLED=true
```

4. 개발 모드로 실행

각 서비스를 별도의 터미널에서 실행:

```bash
# Gateway 서비스
npm run start:dev gateway

# Auth 서비스
npm run start:dev auth

# Event 서비스
npm run start:dev event
```

### Docker를 사용한 실행

1. Docker Compose로 전체 스택 실행

```bash
docker-compose up -d
```

이 명령어는 MongoDB, Gateway, Auth, Event 서비스를 모두 실행합니다.

2. 서비스 상태 확인

```bash
docker-compose ps
```

3. 로그 확인

```bash
docker-compose logs -f [service_name]
```

예: `docker-compose logs -f gateway`

4. 서비스 중단

```bash
docker-compose down
```

### 초기 데이터 생성

개발 및 테스트를 위한 초기 데이터(이벤트, 보상, 사용자)를 생성하려면:

```bash
npm run seed
```

## API 엔드포인트

시스템의 모든 API는 게이트웨이 서버 (`http://localhost:3000/api`)를 통해 접근할 수 있습니다.

API 문서는 Swagger를 통해 제공됩니다: `http://localhost:3000/api/docs`

### 주요 엔드포인트

#### 인증

- `POST /api/auth/register` - 새 사용자 등록
- `POST /api/auth/login` - 사용자 로그인

#### 이벤트

- `GET /api/events` - 모든 이벤트 조회
- `GET /api/events/:id` - 특정 이벤트 상세 조회
- `POST /api/events` - 새 이벤트 생성 (ADMIN, OPERATOR)
- `PUT /api/events/:id` - 이벤트 수정 (ADMIN, OPERATOR)
- `DELETE /api/events/:id` - 이벤트 삭제 (ADMIN)

#### 보상

- `GET /api/events/:id/rewards` - 이벤트 보상 조회
- `POST /api/events/:id/rewards` - 이벤트에 보상 추가 (ADMIN, OPERATOR)
- `POST /api/events/:id/request-reward` - 보상 요청 (USER, ADMIN)
- `GET /api/events/user/reward-requests` - 사용자 보상 요청 이력 조회
- `GET /api/events/admin/reward-requests` - 모든 보상 요청 이력 조회 (ADMIN, OPERATOR, AUDITOR)
- `PUT /api/events/admin/reward-requests/:requestId/approve` - 보상 요청 승인 (ADMIN, OPERATOR)
- `PUT /api/events/admin/reward-requests/:requestId/reject` - 보상 요청 거부 (ADMIN, OPERATOR)

## 사용자 역할

시스템은 다음 역할을 지원합니다:

- **USER**: 보상 요청만 가능
- **OPERATOR**: 이벤트 및 보상 관리, 승인 가능
- **AUDITOR**: 이벤트 및 보상 이력 조회만 가능
- **ADMIN**: 모든 기능 접근 가능

## 개발 가이드

### 프로젝트 구조

프로젝트는 NestJS 모노레포 구조를 따릅니다:

- `apps/` - 각 마이크로서비스 애플리케이션
  - `gateway/` - API 게이트웨이
  - `auth/` - 인증 서비스
  - `event/` - 이벤트 및 보상 서비스
- `libs/` - 공유 라이브러리
  - `common/` - 공통 유틸리티, 상수, 인터페이스
  - `testing/` - 테스트 헬퍼 및 목(mock)
- `docker/` - Docker 관련 파일
- `docs/` - 문서
- `scripts/` - 유틸리티 스크립트

### 코드 컨벤션

- **명명 규칙**:
  - 파일명: 케밥 케이스 (kebab-case)
  - 클래스명: 파스칼 케이스 (PascalCase)
  - 변수/함수명: 카멜 케이스 (camelCase)
  - 상수: 대문자 스네이크 케이스 (UPPER_SNAKE_CASE)
- **코드 포맷팅**: Prettier 사용
- **린팅**: ESLint 사용
- **문서화**: JSDoc 스타일 주석
- **테스트**: Jest로 단위 테스트 및 E2E 테스트

### Git 브랜치 전략

- `main`: 프로덕션 코드
- `develop`: 개발 중인 코드
- `feature/*`: 새 기능 개발
- `bugfix/*`: 버그 수정
- `hotfix/*`: 긴급 수정사항

### 커밋 메시지 컨벤션

```
<type>: <subject>

<body>
```

**타입**:

- `feat`: 새 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 스타일 변경 (로직 변경 없음)
- `refactor`: 리팩토링
- `test`: 테스트 코드 추가/수정
- `chore`: 빌드 프로세스, 도구 변경 등

Let me continue with the README.md file:

## 확장성 및 성능

### 확장성 고려사항

- **서비스 확장**: 각 마이크로서비스는 독립적으로 확장 가능
- **데이터베이스 확장**: MongoDB 샤딩 또는 PostgreSQL 마이그레이션 지원
- **이벤트 조건 추가**: 새로운 이벤트 타입 및 조건을 쉽게 추가할 수 있는 유연한 설계
- **보상 타입 확장**: 다양한 보상 타입을 지원하는 유연한 스키마

### 성능 최적화

- **캐싱**: 자주 조회되는 데이터에 대한 캐싱 적용
- **인덱싱**: 주요 쿼리 필드에 인덱스 생성
- **비동기 처리**: 보상 처리 및 이벤트 처리에 비동기 패턴 적용
- **멱등성 처리**: 중복 요청에 대한 멱등성 보장

## 보안 고려사항

- **인증**: JWT 기반 토큰 인증
- **인가**: 역할 기반 접근 제어(RBAC)
- **요청 검증**: 모든 입력 데이터에 대한 유효성 검증
- **보안 헤더**: Helmet을 사용한 보안 헤더 설정
- **비밀번호 보호**: 비밀번호 해싱(bcrypt)

## 테스트

### 테스트 실행

```bash
# 모든 테스트 실행
npm run test

# 특정 서비스 테스트 실행
npm run test gateway
npm run test auth
npm run test event

# 커버리지 리포트 생성
npm run test:cov
```

### 테스트 범위

- **단위 테스트**: 개별 서비스 및 컴포넌트 테스트
- **통합 테스트**: 서비스 간 통합 테스트
- **E2E 테스트**: API 엔드포인트 및 전체 시스템 테스트

## 모니터링 및 로깅

- **로깅**: 각 서비스에서 구조화된 로그 생성
- **추적**: 요청 추적을 위한 상관관계 ID 사용
- **오류 처리**: 전역 예외 필터를 통한 일관된 오류 응답

## 트러블슈팅

### 일반적인 문제

1. **서비스 연결 오류**

   - 마이크로서비스 호스트/포트 설정 확인
   - 각 서비스가 실행 중인지 확인

2. **인증 오류**

   - JWT 시크릿이 모든 서비스에서 동일한지 확인
   - 토큰 만료 시간 확인

3. **데이터베이스 연결 오류**
   - MongoDB 연결 문자열 확인
   - MongoDB 서버 실행 중인지 확인

### 로그 확인

개발 모드에서 각 서비스의 로그를 확인하여 문제를 진단할 수 있습니다. Docker 환경에서는 다음 명령어로 로그를 확인합니다:

```bash
docker-compose logs -f [service_name]
```

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 기여 방법

1. 이슈를 생성하거나 기존 이슈에 참여합니다.
2. 개발 브랜치에서 작업합니다.
3. 테스트를 추가하고 모든 테스트가 통과하는지 확인합니다.
4. 풀 리퀘스트를 제출합니다.

## 연락처

문의 사항이 있으시면 [email@example.com](mailto:email@example.com)로 연락해 주세요.

---

이 프로젝트는 대형 기업 백엔드 팀에서 실제 사용되는 패턴과 아키텍처를 적용한 생산 수준의 애플리케이션입니다.

````

Let's create some additional documentation files for the project:

### docs/API.md
```markdown
# API 문서

이 문서는 이벤트/보상 관리 시스템의 API 엔드포인트를 설명합니다. 모든 API는 게이트웨이 서버(`http://localhost:3000/api`)를 통해 접근할 수 있습니다.

상세한 API 문서는 실행 중인 서비스에서 Swagger UI를 통해 확인할 수 있습니다: `http://localhost:3000/api/docs`

## 목차

- [인증 API](#인증-api)
- [이벤트 API](#이벤트-api)
- [보상 API](#보상-api)
- [보상 요청 API](#보상-요청-api)

## 공통 헤더

인증이 필요한 모든 요청에는 다음 헤더가 포함되어야 합니다:

````

Authorization: Bearer <jwt_token>

````

## 응답 형식

모든 API 응답은 다음과 같은 일관된 형식을 따릅니다:

### 성공 응답

```json
{
  "statusCode": 200,
  "data": { ... } // 응답 데이터
}
````

### 오류 응답

```json
{
  "statusCode": 400, // 오류 코드
  "message": "오류 메시지",
  "error": "오류 유형"
}
```

## 인증 API

### 사용자 등록

새 사용자를 등록합니다.

**URL**: `/api/auth/register`
**Method**: `POST`
**인증 필요**: 아니오

**요청 본문**:

```json
{
  "username": "johndoe",
  "password": "StrongPassword123!",
  "email": "john.doe@example.com",
  "roles": ["USER"] // 선택적, 기본값: ["USER"]
}
```

**응답**: 생성된 사용자 정보 (비밀번호 제외)

```json
{
  "statusCode": 201,
  "data": {
    "userId": "60d21b4667d0d8992e610c85",
    "username": "johndoe",
    "email": "john.doe@example.com",
    "roles": ["USER"],
    "createdAt": "2025-01-15T12:00:00.000Z",
    "updatedAt": "2025-01-15T12:00:00.000Z"
  }
}
```

### 사용자 로그인

사용자 인증 및 JWT 토큰 발급.

**URL**: `/api/auth/login`
**Method**: `POST`
**인증 필요**: 아니오

**요청 본문**:

```json
{
  "username": "johndoe",
  "password": "StrongPassword123!"
}
```

**응답**: JWT 토큰 및 사용자 정보

```json
{
  "statusCode": 200,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "60d21b4667d0d8992e610c85",
      "username": "johndoe",
      "email": "john.doe@example.com",
      "roles": ["USER"]
    }
  }
}
```

## 이벤트 API

### 모든 이벤트 조회

활성 이벤트 목록을 조회합니다.

**URL**: `/api/events`
**Method**: `GET`
**인증 필요**: 선택적

**쿼리 파라미터**:

- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 10)
- `isActive`: 활성 이벤트만 필터링 (선택적)

**응답**: 페이지네이션된 이벤트 목록

```json
{
  "statusCode": 200,
  "data": {
    "items": [
      {
        "id": "60d21b4667d0d8992e610c85",
        "title": "7일 연속 출석 이벤트",
        "description": "7일 연속으로 로그인한 사용자에게 보상을 제공합니다.",
        "startDate": "2025-01-01T00:00:00.000Z",
        "endDate": "2025-12-31T23:59:59.000Z",
        "isActive": true,
        "requiresApproval": false,
        "conditionType": "DAILY_LOGIN",
        "conditionValue": 7,
        "conditionDescription": "7일 연속 로그인",
        "createdAt": "2025-01-15T12:00:00.000Z",
        "updatedAt": "2025-01-15T12:00:00.000Z"
      }
      // 추가 이벤트...
    ],
    "meta": {
      "total": 20,
      "page": 1,
      "limit": 10,
      "pages": 2
    }
  }
}
```

### 특정 이벤트 조회

ID로 특정 이벤트의 상세 정보를 조회합니다.

**URL**: `/api/events/:id`
**Method**: `GET`
**인증 필요**: 선택적

**응답**: 이벤트 상세 정보

```json
{
  "statusCode": 200,
  "data": {
    "id": "60d21b4667d0d8992e610c85",
    "title": "7일 연속 출석 이벤트",
    "description": "7일 연속으로 로그인한 사용자에게 보상을 제공합니다.",
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-12-31T23:59:59.000Z",
    "isActive": true,
    "requiresApproval": false,
    "conditionType": "DAILY_LOGIN",
    "conditionValue": 7,
    "conditionDescription": "7일 연속 로그인",
    "createdAt": "2025-01-15T12:00:00.000Z",
    "updatedAt": "2025-01-15T12:00:00.000Z"
  }
}
```

### 새 이벤트 생성

새 이벤트를 생성합니다 (관리자 또는 운영자 권한 필요).

**URL**: `/api/events`
**Method**: `POST`
**인증 필요**: 예 (ADMIN 또는 OPERATOR 역할)

**요청 본문**:

```json
{
  "title": "신규 이벤트",
  "description": "신규 이벤트 설명",
  "startDate": "2025-02-01T00:00:00.000Z",
  "endDate": "2025-02-28T23:59:59.000Z",
  "isActive": true,
  "requiresApproval": false,
  "conditionType": "INVITE_FRIENDS",
  "conditionValue": 5,
  "conditionDescription": "5명의 친구 초대"
}
```

**응답**: 생성된 이벤트 정보

```json
{
  "statusCode": 201,
  "data": {
    "id": "60d21b4667d0d8992e610c86",
    "title": "신규 이벤트",
    "description": "신규 이벤트 설명",
    "startDate": "2025-02-01T00:00:00.000Z",
    "endDate": "2025-02-28T23:59:59.000Z",
    "isActive": true,
    "requiresApproval": false,
    "conditionType": "INVITE_FRIENDS",
    "conditionValue": 5,
    "conditionDescription": "5명의 친구 초대",
    "createdAt": "2025-01-15T12:00:00.000Z",
    "updatedAt": "2025-01-15T12:00:00.000Z"
  }
}
```

### 이벤트 수정

기존 이벤트를 수정합니다 (관리자 또는 운영자 권한 필요).

**URL**: `/api/events/:id`
**Method**: `PUT`
**인증 필요**: 예 (ADMIN 또는 OPERATOR 역할)

**요청 본문**:

```json
{
  "title": "수정된 이벤트 제목",
  "description": "수정된 이벤트 설명",
  "isActive": false
}
```

**응답**: 수정된 이벤트 정보

```json
{
  "statusCode": 200,
  "data": {
    "id": "60d21b4667d0d8992e610c85",
    "title": "수정된 이벤트 제목",
    "description": "수정된 이벤트 설명",
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-12-31T23:59:59.000Z",
    "isActive": false,
    "requiresApproval": false,
    "conditionType": "DAILY_LOGIN",
    "conditionValue": 7,
    "conditionDescription": "7일 연속 로그인",
    "createdAt": "2025-01-15T12:00:00.000Z",
    "updatedAt": "2025-01-15T12:30:00.000Z"
  }
}
```

### 이벤트 삭제

이벤트를 삭제합니다 (관리자 권한 필요).

**URL**: `/api/events/:id`
**Method**: `DELETE`
**인증 필요**: 예 (ADMIN 역할)

**응답**: 삭제 결과

```json
{
  "statusCode": 200,
  "data": {
    "deleted": true
  }
}
```

## 보상 API

### 이벤트 보상 조회

특정 이벤트에 연결된 보상 목록을 조회합니다.

**URL**: `/api/events/:id/rewards`
**Method**: `GET`
**인증 필요**: 선택적

**응답**: 이벤트에 연결된 보상 목록

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "60d21b4667d0d8992e610c87",
      "name": "골드 1000",
      "description": "게임 내 골드 1000개를 제공합니다.",
      "rewardType": "GAME_CURRENCY",
      "rewardValue": 1000,
      "quantity": -1,
      "eventId": "60d21b4667d0d8992e610c85",
      "createdAt": "2025-01-15T12:00:00.000Z",
      "updatedAt": "2025-01-15T12:00:00.000Z"
    }
    // 추가 보상...
  ]
}
```

### 이벤트에 보상 추가

이벤트에 새 보상을 추가합니다 (관리자 또는 운영자 권한 필요).

**URL**: `/api/events/:id/rewards`
**Method**: `POST`
**인증 필요**: 예 (ADMIN 또는 OPERATOR 역할)

**요청 본문**:

```json
{
  "name": "경험치 부스터",
  "description": "3일간 경험치 획득량이 2배로 증가합니다.",
  "rewardType": "BUFF",
  "rewardValue": "exp_booster_3days",
  "quantity": 200
}
```

**응답**: 생성된 보상 정보

```json
{
  "statusCode": 201,
  "data": {
    "id": "60d21b4667d0d8992e610c88",
    "name": "경험치 부스터",
    "description": "3일간 경험치 획득량이 2배로 증가합니다.",
    "rewardType": "BUFF",
    "rewardValue": "exp_booster_3days",
    "quantity": 200,
    "eventId": "60d21b4667d0d8992e610c85",
    "createdAt": "2025-01-15T12:00:00.000Z",
    "updatedAt": "2025-01-15T12:00:00.000Z"
  }
}
```

## 보상 요청 API

### 보상 요청

특정 이벤트의 보상을 요청합니다 (사용자 권한 필요).

**URL**: `/api/events/:id/request-reward`
**Method**: `POST`
**인증 필요**: 예 (USER 역할)

**요청 본문**:

```json
{
  "idempotencyKey": "unique-request-key-123",
  "rewardId": "60d21b4667d0d8992e610c87" // 선택적
}
```

**응답**: 보상 요청 결과

```json
{
  "statusCode": 201,
  "data": {
    "id": "60d21b4667d0d8992e610c89",
    "userId": "60d21b4667d0d8992e610c85",
    "eventId": "60d21b4667d0d8992e610c85",
    "rewardId": "60d21b4667d0d8992e610c87",
    "status": "COMPLETED", // 또는 PENDING, REJECTED, FAILED
    "idempotencyKey": "unique-request-key-123",
    "createdAt": "2025-01-15T12:00:00.000Z",
    "updatedAt": "2025-01-15T12:00:00.000Z",
    "processedAt": "2025-01-15T12:00:00.000Z"
  }
}
```

### 사용자 보상 요청 이력 조회

로그인한 사용자의 보상 요청 이력을 조회합니다.

**URL**: `/api/events/user/reward-requests`
**Method**: `GET`
**인증 필요**: 예 (USER 역할)

**쿼리 파라미터**:

- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 10)

**응답**: 페이지네이션된 보상 요청 이력

```json
{
  "statusCode": 200,
  "data": {
    "items": [
      {
        "id": "60d21b4667d0d8992e610c89",
        "userId": "60d21b4667d0d8992e610c85",
        "eventId": {
          "id": "60d21b4667d0d8992e610c85",
          "title": "7일 연속 출석 이벤트",
          "description": "7일 연속으로 로그인한 사용자에게 보상을 제공합니다."
        },
        "rewardId": {
          "id": "60d21b4667d0d8992e610c87",
          "name": "골드 1000",
          "description": "게임 내 골드 1000개를 제공합니다.",
          "rewardType": "GAME_CURRENCY",
          "rewardValue": 1000
        },
        "status": "COMPLETED",
        "idempotencyKey": "unique-request-key-123",
        "createdAt": "2025-01-15T12:00:00.000Z",
        "updatedAt": "2025-01-15T12:00:00.000Z",
        "processedAt": "2025-01-15T12:00:00.000Z"
      }
      // 추가 요청...
    ],
    "meta": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

### 모든 보상 요청 이력 조회 (관리자용)

모든 사용자의 보상 요청 이력을 조회합니다 (관리자, 운영자 또는 감사자 권한 필요).

**URL**: `/api/events/admin/reward-requests`
**Method**: `GET`
**인증 필요**: 예 (ADMIN, OPERATOR 또는 AUDITOR 역할)

**쿼리 파라미터**:

- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 10)
- `status`: 상태별 필터링 (선택적)
- `eventId`: 이벤트별 필터링 (선택적)
- `userId`: 사용자별 필터링 (선택적)

**응답**: 페이지네이션된 보상 요청 이력

```json
{
  "statusCode": 200,
  "data": {
    "items": [
      // 보상 요청 목록...
    ],
    "meta": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "pages": 10
    }
  }
}
```

### 보상 요청 승인 (관리자용)

대기 중인 보상 요청을 승인합니다 (관리자 또는 운영자 권한 필요).

**URL**: `/api/events/admin/reward-requests/:requestId/approve`
**Method**: `PUT`
**인증 필요**: 예 (ADMIN 또는 OPERATOR 역할)

**응답**: 업데이트된 보상 요청 정보

```json
{
  "statusCode": 200,
  "data": {
    "id": "60d21b4667d0d8992e610c89",
    "userId": "60d21b4667d0d8992e610c85",
    "eventId": "60d21b4667d0d8992e610c85",
    "rewardId": "60d21b4667d0d8992e610c87",
    "status": "COMPLETED",
    "idempotencyKey": "unique-request-key-123",
    "createdAt": "2025-01-15T12:00:00.000Z",
    "updatedAt": "2025-01-15T12:30:00.000Z",
    "processedAt": "2025-01-15T12:30:00.000Z"
  }
}
```

### 보상 요청 거부 (관리자용)

대기 중인 보상 요청을 거부합니다 (관리자 또는 운영자 권한 필요).

**URL**: `/api/events/admin/reward-requests/:requestId/reject`
**Method**: `PUT`
**인증 필요**: 예 (ADMIN 또는 OPERATOR 역할)

**요청 본문**:

```json
{
  "rejectionReason": "조건을 충족하지 않았습니다."
}
```

**응답**: 업데이트된 보상 요청 정보

```json
{
  "statusCode": 200,
  "data": {
    "id": "60d21b4667d0d8992e610c89",
    "userId": "60d21b4667d0d8992e610c85",
    "eventId": "60d21b4667d0d8992e610c85",
    "rewardId": "60d21b4667d0d8992e610c87",
    "status": "REJECTED",
    "rejectionReason": "조건을 충족하지 않았습니다.",
    "idempotencyKey": "unique-request-key-123",
    "createdAt": "2025-01-15T12:00:00.000Z",
    "updatedAt": "2025-01-15T12:30:00.000Z",
    "processedAt": "2025-01-15T12:30:00.000Z"
  }
}
```

````

### docs/DATABASE.md
```markdown
# 데이터베이스 설계

이 문서는 이벤트/보상 관리 시스템의 데이터베이스 설계를 설명합니다.

## 개요

시스템은 MongoDB를 사용하여 데이터를 저장합니다. 주요 컬렉션은 다음과 같습니다:

1. **Users**: 사용자 정보
2. **Events**: 이벤트 정보
3. **Rewards**: 보상 정보
4. **RewardRequests**: 보상 요청 이력

## ER 다이어그램

````

+-------------+ +--------------+ +-------------+
| Users | | Events | | Rewards |
+-------------+ +--------------+ +-------------+
| \_id | | \_id | | \_id |
| username | | title | | name |
| password | | description | | description |
| email | | startDate | | rewardType |
| roles | | endDate | | rewardValue |
| createdAt | | isActive | | quantity |
| updatedAt | | requiresAp.. | | eventId |
+-------------+ | conditionT.. | | createdAt |
| conditionV.. | | updatedAt |
| conditionD.. | +-------------+
| createdAt | |
| updatedAt | |
+--------------+ |
| |
| |
v v
+---------------------------+
| RewardRequests |
+---------------------------+
| \_id |
| userId |
| eventId |
| rewardId |
| status |
| rejectionReason |
| idempotencyKey |
| createdAt |
| updatedAt |
| processedAt |
+---------------------------+

```

## 스키마 상세 설명

### Users 컬렉션

사용자 정보를 저장합니다.

| 필드 | 타입 | 설명 |
|------|------|------|
| _id | ObjectId | 고유 식별자 |
| username | String | 사용자명 (고유) |
| password | String | 해시된 비밀번호 |
| email | String | 이메일 주소 (고유) |
| roles | Array<String> | 사용자 역할 목록 (USER, OPERATOR, AUDITOR, ADMIN) |
| createdAt | Date | 생성 일시 |
| updatedAt | Date | 수정 일시 |

### Events 컬렉션

이벤트 정보를 저장합니다.

| 필드 | 타입 | 설명 |
|------|------|------|
| _id | ObjectId | 고유 식별자 |
| title | String | 이벤트 제목 |
| description | String | 이벤트 설명 |
| startDate | Date | 이벤트 시작일 |
| endDate | Date | 이벤트 종료일 |
| isActive | Boolean | 이벤트 활성화 여부 |
| requiresApproval | Boolean | 보상 요청 시 운영자 승인 필요 여부 |
| conditionType | String | 이벤트 조건 유형 (DAILY_LOGIN, INVITE_FRIENDS 등) |
| conditionValue | Number | 이벤트 조건 값 |
| conditionDescription | String | 이벤트 조건 설명 |
| createdAt | Date | 생성 일시 |
| updatedAt | Date | 수정 일시 |

### Rewards 컬렉션

보상 정보를 저장합니다.

| 필드 | 타입 | 설명 |
|------|------|------|
| _id | ObjectId | 고유 식별자 |
| name | String | 보상 이름 |
| description | String | 보상 설명 |
| rewardType | String | 보상 유형 (GAME_CURRENCY, ITEM, COSMETIC, BUFF 등) |
| rewardValue | Mixed | 보상 값 (문자열 또는 숫자) |
| quantity | Number | 보상 수량 (-1: 무제한) |
| eventId | ObjectId | 연결된 이벤트 ID |
| create
```
