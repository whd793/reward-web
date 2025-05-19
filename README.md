# 이벤트/보상 관리 시스템

MSA (Microservices Architecture) 기반의 이벤트/보상 관리 시스템입니다. 게임이나 웹 애플리케이션에서 사용자 행동 기반 보상을 자동화하는 백엔드 서비스입니다.

## 시스템 아키텍처

시스템은 다음과 같은 3개의 마이크로서비스로 구성되어 있습니다:

1. **Gateway 서버**: 모든 API 요청의 진입점으로, 인증 및 권한 검사, 라우팅을 담당합니다.
2. **Auth 서버**: 사용자 관리, 로그인, 역할 관리 및 JWT 발급을 담당합니다.
3. **Event 서버**: 이벤트 생성, 보상 정의, 요청 처리 및 보상 로그를 관리합니다.

## 주요 기능

- 사용자 관리 및 역할 기반 접근 제어 (RBAC)
- 다양한 유형의 이벤트 및 조건 정의
- 자동 또는 수동 승인 보상 시스템
- 보상 지급 조건 자동 확인
- 이벤트 로깅 및 보상 이력 관리
- 확장 가능한 구조로 새로운 이벤트 및 보상 유형 추가 용이

## 기술 스택

- **런타임**: Node.js 18
- **프레임워크**: NestJS
- **데이터베이스**: MongoDB
- **인증**: JWT
- **이벤트 처리**: Inngest
- **컨테이너화**: Docker / Docker Compose
- **언어**: TypeScript

## 시작하기

### 사전 요구사항

- Docker 및 Docker Compose 설치
- Node.js 18.x 이상 (로컬 개발용)
- npm 9.x 이상 (로컬 개발용)

### Docker를 이용한 실행

1. 저장소를 클론합니다:

```bash
git clone https://github.com/yourusername/nexon-reward-system.git
cd nexon-reward-system
```

# 실행 및 개발 가이드

Docker Compose로 서비스를 시작합니다:

```bash
docker-compose up -d
```

이 명령은 게이트웨이, 인증, 이벤트 서비스 및 MongoDB를 시작합니다. 첫 실행 시 필요한 기본 데이터도 자동으로 초기화됩니다.

서비스가 모두 시작되면 다음 URL에서 API 문서에 접근할 수 있습니다:

```
http://localhost:3000/api/docs
```

## 기본 계정

테스트에 사용할 수 있는 기본 계정:

- 관리자: admin / admin123
- 운영자: operator / operator123
- 감사자: auditor / auditor123
- 일반 사용자: user / user123

## 로컬 개발 환경 설정

1. 저장소를 클론합니다:

```bash
git clone https://github.com/yourusername/nexon-reward-system.git
cd nexon-reward-system
```

2. 의존성을 설치합니다:

```bash
npm install
```

3. `.env` 파일을 수정하여 로컬 환경 설정을 구성합니다.

4. MongoDB를 시작합니다(Docker 사용):

```bash
docker-compose up -d mongodb
```

## API 문서

Swagger UI를 통해 API 문서에 접근할 수 있습니다:

- 게이트웨이 API: http://localhost:3000/api/docs

## 게임/웹 애플리케이션의 통합 프로세스

이 접근 방식을 사용하면 게임/웹 애플리케이션에서는 다음과 같은 프로세스로 보상을 처리할 수 있습니다:

1. 주기적으로 또는 사용자 로그인 시 `GET /api/events/rewards/user/pending` API를 호출하여 미처리 보상 확인
2. 미처리 보상이 있으면, 게임/웹 애플리케이션 내에서 해당 보상 유형에 맞게 실제 아이템/포인트 지급
3. 지급이 완료되면 `POST /api/events/rewards/claim/:requestId` API를 호출하여 보상이 처리되었음을 기록

## 이벤트 유형 및 조건 예시

### 지원되는 이벤트 유형

1. **DAILY_LOGIN**: 일일 로그인 이벤트
   - 조건: 연속 로그인 일수
2. **INVITE_FRIENDS**: 친구 초대 이벤트
   - 조건: 초대한 친구 수
3. **QUEST_COMPLETE**: 퀘스트 완료 이벤트
   - 조건: 특정 퀘스트 ID 완료
4. **LEVEL_UP**: 레벨업 이벤트
   - 조건: 특정 레벨 달성
5. **PROFILE_COMPLETE**: 프로필 완성 이벤트
   - 조건: 필수 프로필 필드 작성

### 조건 예시

```json
{
  "eventType": "DAILY_LOGIN",
  "condition": {
    "consecutiveDays": 7
  }
}
```

```json
{
  "eventType": "INVITE_FRIENDS",
  "condition": {
    "friendCount": 3
  }
}
```

## 프로젝트 구조

```
nexon-reward-system/
├── .github/                # GitHub 워크플로우 설정
├── apps/                   # 마이크로서비스 애플리케이션
│   ├── auth/               # 인증 서비스
│   ├── event/              # 이벤트 서비스
│   └── gateway/            # 게이트웨이 서비스
├── docker/                 # Docker 관련 파일
├── docs/                   # 프로젝트 문서
├── libs/                   # 공유 라이브러리
├── scripts/                # 유틸리티 스크립트
├── .env                    # 환경 변수
├── .env.development        # 개발 환경 변수
├── docker-compose.yml      # Docker Compose 설정
└── package.json            # 프로젝트 메타데이터 및 의존성
```

# API 문서

## 인증 API

### 회원가입

```
POST /api/auth/register
```

**요청 본문**

```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**응답 (201 Created)**

```json
{
  "message": "회원가입이 완료되었습니다.",
  "user": {
    "_id": "string",
    "username": "string",
    "email": "string",
    "roles": ["USER"]
  }
}
```

### 로그인

```
POST /api/auth/login
```

**요청 본문**

```json
{
  "username": "string",
  "password": "string"
}
```

**응답 (200 OK)**

```json
{
  "access_token": "string",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "roles": ["string"]
  }
}
```

### 현재 사용자 정보 조회

```
GET /api/auth/me
```

**헤더**

```
Authorization: Bearer {access_token}
```

**응답 (200 OK)**

```json
{
  "_id": "string",
  "username": "string",
  "email": "string",
  "roles": ["string"],
  "createdAt": "string",
  "updatedAt": "string"
}
```

## 이벤트 API

### 모든 이벤트 조회 (관리자/운영자/감사자 전용)

```
GET /api/events
```

**헤더**

```
Authorization: Bearer {access_token}
```

**쿼리 파라미터**

```
page: number (기본값: 1)
limit: number (기본값: 10)
```

**응답 (200 OK)**

```json
{
  "items": [
    {
      "_id": "string",
      "name": "string",
      "description": "string",
      "eventType": "string",
      "condition": {},
      "startDate": "string",
      "endDate": "string",
      "status": "string",
      "approvalType": "string",
      "createdBy": "string",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "meta": {
    "totalItems": 0,
    "itemCount": 0,
    "itemsPerPage": 0,
    "totalPages": 0,
    "currentPage": 0
  }
}
```

### 활성 이벤트 조회

```
GET /api/events/active
```

**쿼리 파라미터**

```
page: number (기본값: 1)
limit: number (기본값: 10)
```

**응답 (200 OK)**

```json
{
  "items": [
    {
      "_id": "string",
      "name": "string",
      "description": "string",
      "eventType": "string",
      "condition": {},
      "startDate": "string",
      "endDate": "string",
      "status": "string",
      "approvalType": "string",
      "createdBy": "string",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "meta": {
    "totalItems": 0,
    "itemCount": 0,
    "itemsPerPage": 0,
    "totalPages": 0,
    "currentPage": 0
  }
}
```

### 이벤트 생성 (관리자/운영자 전용)

```
POST /api/events
```

**헤더**

```
Authorization: Bearer {access_token}
```

**요청 본문**

```json
{
  "name": "string",
  "description": "string",
  "eventType": "string",
  "condition": {},
  "startDate": "string",
  "endDate": "string",
  "status": "string",
  "approvalType": "string"
}
```

**응답 (201 Created)**

```json
{
  "_id": "string",
  "name": "string",
  "description": "string",
  "eventType": "string",
  "condition": {},
  "startDate": "string",
  "endDate": "string",
  "status": "string",
  "approvalType": "string",
  "createdBy": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### ID로 이벤트 조회

```
GET /api/events/{id}
```

**응답 (200 OK)**

```json
{
  "_id": "string",
  "name": "string",
  "description": "string",
  "eventType": "string",
  "condition": {},
  "startDate": "string",
  "endDate": "string",
  "status": "string",
  "approvalType": "string",
  "createdBy": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### 이벤트 상태 업데이트 (관리자/운영자 전용)

```
PATCH /api/events/{id}/status
```

**헤더**

```
Authorization: Bearer {access_token}
```

**요청 본문**

```json
{
  "status": "string"
}
```

**응답 (200 OK)**

```json
{
  "_id": "string",
  "name": "string",
  "description": "string",
  "eventType": "string",
  "condition": {},
  "startDate": "string",
  "endDate": "string",
  "status": "string",
  "approvalType": "string",
  "createdBy": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

## 보상 API

### 보상 생성 (관리자/운영자 전용)

```
POST /api/events/rewards
```

**헤더**

```
Authorization: Bearer {access_token}
```

**요청 본문**

```json
{
  "name": "string",
  "description": "string",
  "type": "string",
  "value": 0,
  "quantity": 0,
  "eventId": "string"
}
```

**응답 (201 Created)**

```json
{
  "_id": "string",
  "name": "string",
  "description": "string",
  "type": "string",
  "value": 0,
  "quantity": 0,
  "eventId": "string",
  "createdBy": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### 이벤트별 보상 조회

```
GET /api/events/{id}/rewards
```

**응답 (200 OK)**

```json
[
  {
    "_id": "string",
    "name": "string",
    "description": "string",
    "type": "string",
    "value": 0,
    "quantity": 0,
    "eventId": "string",
    "createdBy": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
]
```

### 보상 요청

```
POST /api/events/rewards/request
```

**헤더**

```
Authorization: Bearer {access_token}
```

**요청 본문**

```json
{
  "eventId": "string",
  "rewardId": "string",
  "idempotencyKey": "string"
}
```

**응답 (201 Created)**

```json
{
  "_id": "string",
  "userId": "string",
  "eventId": "string",
  "rewardId": "string",
  "status": "PENDING",
  "idempotencyKey": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### 사용자별 보상 요청 조회

```
GET /api/events/rewards/user/requests
```

**헤더**

```
Authorization: Bearer {access_token}
```

**쿼리 파라미터**

```
page: number (기본값: 1)
limit: number (기본값: 10)
```

**응답 (200 OK)**

```json
{
  "items": [
    {
      "_id": "string",
      "userId": "string",
      "eventId": {
        "_id": "string",
        "name": "string",
        "eventType": "string"
      },
      "rewardId": {
        "_id": "string",
        "name": "string",
        "type": "string",
        "value": 0
      },
      "status": "string",
      "idempotencyKey": "string",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "meta": {
    "totalItems": 0,
    "itemCount": 0,
    "itemsPerPage": 0,
    "totalPages": 0,
    "currentPage": 0
  }
}
```

### 사용자별 대기 중인 보상 조회

```
GET /api/events/rewards/user/pending
```

**헤더**

```
Authorization: Bearer {access_token}
```

**응답 (200 OK)**

```json
[
  {
    "_id": "string",
    "userId": "string",
    "eventId": {
      "_id": "string",
      "name": "string",
      "eventType": "string"
    },
    "rewardId": {
      "_id": "string",
      "name": "string",
      "type": "string",
      "value": 0
    },
    "status": "APPROVED",
    "idempotencyKey": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
]
```

### 보상 지급 완료 처리

```
POST /api/events/rewards/claim/{id}
```

**헤더**

```
Authorization: Bearer {access_token}
```

**요청 본문**

```json
{
  "gameTransactionId": "string",
  "message": "string"
}
```

**응답 (200 OK)**

```json
{
  "_id": "string",
  "userId": "string",
  "eventId": "string",
  "rewardId": "string",
  "status": "APPROVED",
  "message": "string",
  "idempotencyKey": "string",
  "processedBy": "string",
  "processedAt": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### 모든 보상 요청 조회 (관리자/운영자/감사자 전용)

```
GET /api/events/rewards/admin/requests
```

**헤더**

```
Authorization: Bearer {access_token}
```

**쿼리 파라미터**

```
page: number (기본값: 1)
limit: number (기본값: 10)
status: string (선택사항)
```

**응답 (200 OK)**

```json
{
  "items": [
    {
      "_id": "string",
      "userId": "string",
      "eventId": {
        "_id": "string",
        "name": "string",
        "eventType": "string"
      },
      "rewardId": {
        "_id": "string",
        "name": "string",
        "type": "string",
        "value": 0
      },
      "status": "string",
      "message": "string",
      "idempotencyKey": "string",
      "processedBy": "string",
      "processedAt": "string",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "meta": {
    "totalItems": 0,
    "itemCount": 0,
    "itemsPerPage": 0,
    "totalPages": 0,
    "currentPage": 0
  }
}
```

### 보상 요청 상태 업데이트 (관리자/운영자 전용)

```
PATCH /api/events/rewards/admin/request/{id}
```

**헤더**

```
Authorization: Bearer {access_token}
```

**요청 본문**

```json
{
  "status": "string",
  "message": "string"
}
```

**응답 (200 OK)**

```json
{
  "_id": "string",
  "userId": "string",
  "eventId": "string",
  "rewardId": "string",
  "status": "string",
  "message": "string",
  "idempotencyKey": "string",
  "processedBy": "string",
  "processedAt": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

## 이벤트 로그 API

### 이벤트 로그 생성

```
POST /api/events/log
```

**헤더**

```
Authorization: Bearer {access_token}
```

**요청 본문**

```json
{
  "eventType": "string",
  "data": {},
  "timestamp": "string"
}
```

**응답 (201 Created)**

```json
{
  "success": true,
  "message": "이벤트 로그가 생성되었습니다"
}
```

### 4. 데이터베이스 (MongoDB)

MongoDB는 모든 서비스의 데이터를 저장합니다:

- 사용자 정보
- 이벤트 정의
- 보상 정의
- 보상 요청
- 이벤트 로그

**주요 컬렉션:**

- users
- events
- rewards
- reward_requests
- event_logs

## 통신 흐름

1. **클라이언트 → 게이트웨이:**

   - REST API를 통한 HTTP 요청

2. **게이트웨이 → 인증 서비스:**

   - TCP 마이크로서비스 프로토콜
   - JWT 토큰 검증 및 사용자 정보 조회

3. **게이트웨이 → 이벤트 서비스:**

   - TCP 마이크로서비스 프로토콜
   - 이벤트 및 보상 관련 요청 처리

4. **이벤트 서비스 내부:**
   - Inngest를 통한 이벤트 처리 파이프라인
   - 비동기 보상 처리

## 확장성 고려사항

- **수평적 확장:** 각 마이크로서비스는 독립적으로 확장 가능
- **이벤트 유형 확장:** 팩토리 및 전략 패턴을 통해 새로운 이벤트 유형 쉽게 추가 가능
- **데이터베이스 확장:** MongoDB 샤딩을 통한 데이터 확장 가능
- **MSA 아키텍처:** 필요에 따라 더 많은 마이크로서비스 추가 가능

## 보안 고려사항

- **인증:** JWT 기반 인증으로 안전한 API 접근
- **권한 부여:** 역할 기반 접근 제어로 리소스 보호
- **데이터 암호화:** 비밀번호는 bcrypt로 해싱하여 저장
- **트랜잭션 보안:** 멱등성 키를 통한 중복 처리 방지
- **요청 검증:** 모든 입력은 class-validator를 통한 검증

# 데이터베이스 스키마

## 개요

이 문서는 이벤트/보상 관리 시스템의 MongoDB 데이터베이스 스키마에 대한 상세 설명을 제공합니다.

## 컬렉션 구조

### 1. users

사용자 정보를 저장하는 컬렉션입니다.

```javascript
{
  _id: ObjectId,          // 자동 생성되는 고유 ID
  username: String,       // 사용자명 (고유)
  email: String,          // 이메일 (고유)
  password: String,       // 해시된 비밀번호
  roles: [String],        // 역할 배열 ['ADMIN', 'OPERATOR', 'AUDITOR', 'USER']
  createdAt: Date,        // 생성 일시
  updatedAt: Date         // 수정 일시
}
```

## 2. events

이벤트 정의를 저장하는 컬렉션입니다.

```javascript
{
  _id: ObjectId,          // 자동 생성되는 고유 ID
  name: String,           // 이벤트 이름
  description: String,    // 이벤트 설명
  eventType: String,      // 이벤트 유형 ('DAILY_LOGIN', 'INVITE_FRIENDS', 등)
  condition: Object,      // 이벤트 조건 (이벤트 유형에 따라 형식이 다름)
  startDate: Date,        // 시작일
  endDate: Date,          // 종료일
  status: String,         // 이벤트 상태 ('ACTIVE', 'INACTIVE')
  approvalType: String,   // 승인 유형 ('AUTO', 'MANUAL')
  createdBy: String,      // 생성자 ID
  createdAt: Date,        // 생성 일시
  updatedAt: Date         // 수정 일시
}
```

**인덱스:**

- `eventType`: 인덱스
- `status`: 인덱스
- `startDate, endDate`: 복합 인덱스

## 3. rewards

보상 정의를 저장하는 컬렉션입니다.

```javascript
{
  _id: ObjectId,          // 자동 생성되는 고유 ID
  name: String,           // 보상 이름
  description: String,    // 보상 설명
  type: String,           // 보상 유형 ('POINTS', 'ITEM', 'COUPON', 'CURRENCY')
  value: Number,          // 보상 값
  quantity: Number,       // 보상 수량
  eventId: ObjectId,      // 관련 이벤트 ID (참조: events._id)
  createdBy: String,      // 생성자 ID
  createdAt: Date,        // 생성 일시
  updatedAt: Date         // 수정 일시
}
```

**인덱스:**

- `type`: 인덱스
- `eventId`: 인덱스

## 4. reward_requests

보상 요청을 저장하는 컬렉션입니다.

```javascript
{
  _id: ObjectId,          // 자동 생성되는 고유 ID
  userId: String,         // 사용자 ID
  eventId: ObjectId,      // 이벤트 ID (참조: events._id)
  rewardId: ObjectId,     // 보상 ID (참조: rewards._id)
  status: String,         // 요청 상태 ('PENDING', 'APPROVED', 'REJECTED', 'FAILED')
  message: String,        // 처리 메시지
  idempotencyKey: String, // 멱등성 키 (중복 요청 방지용)
  processedAt: Date,      // 처리 일시
  processedBy: String,    // 처리자 ID
  createdAt: Date,        // 생성 일시
  updatedAt: Date         // 수정 일시
}
```

**인덱스:**

- `userId, eventId`: 복합 인덱스
- `status`: 인덱스
- `idempotencyKey`: 고유 인덱스

## 5. event_logs

사용자 이벤트 로그를 저장하는 컬렉션입니다.

```javascript
{
  _id: ObjectId,          // 자동 생성되는 고유 ID
  userId: String,         // 사용자 ID
  eventType: String,      // 이벤트 유형
  data: Object,           // 이벤트 데이터
  timestamp: Date,        // 이벤트 발생 시간
  createdAt: Date,        // 생성 일시
  updatedAt: Date         // 수정 일시
}
```

**인덱스:**

- `userId, eventType`: 복합 인덱스
- `timestamp`: 인덱스

## 이벤트 유형별 condition 형식

이벤트 유형에 따라 `events.condition` 필드의 구조가 다릅니다:

### DAILY_LOGIN (일일 로그인)

```javascript
{
  consecutiveDays: Number; // 연속 로그인 필요 일수
}
```

### INVITE_FRIENDS (친구 초대)

```javascript
{
  friendCount: Number; // 초대해야 하는 친구 수
}
```

### QUEST_COMPLETE (퀘스트 완료)

```javascript
{
  questId: String,     // 완료해야 하는 퀘스트 ID
  questName: String    // 퀘스트 이름 (선택사항)
}
```

### LEVEL_UP (레벨업)

```javascript
{
  targetLevel: Number; // 도달해야 하는 레벨
}
```

### PROFILE_COMPLETE (프로필 완성)

```javascript
{
  requiredFields: [String]; // 필수 프로필 필드 목록
}
```

## 이벤트 유형

1. DAILY_LOGIN (일일 로그인)
2. INVITE_FRIENDS (친구 초대)
3. QUEST_COMPLETE (퀘스트 완료)
4. LEVEL_UP (레벨업)
5. PROFILE_COMPLETE (프로필 완성)
6. PURCHASE (구매)
7. ACHIEVEMENT (업적)
8. SOCIAL_SHARE (소셜 공유)
9. CONTENT_CREATE (컨텐츠 제작)
10. SPECIAL_EVENT (특별 이벤트)

## 이벤트 조건 검증 로직

각 이벤트 유형에 따라 다음과 같은 로직으로 조건 충족 여부를 검증합니다:

1. **DAILY_LOGIN**: 연속 로그인 일수가 조건에서 지정한 `consecutiveDays` 이상인지 확인합니다.

2. **INVITE_FRIENDS**: 초대한 친구 수가 조건에서 지정한 `friendCount` 이상인지 확인합니다.

3. **QUEST_COMPLETE**: 사용자가 조건에서 지정한 `questId`에 해당하는 퀘스트를 완료했는지 확인합니다.

4. **LEVEL_UP**: 사용자의 현재 레벨이 조건에서 지정한 `targetLevel` 이상인지 확인합니다.

5. **PROFILE_COMPLETE**: 사용자가 조건에서 지정한 `requiredFields`의 모든 필드를 입력했는지 확인합니다.

6. **PURCHASE**: 구매 금액이 조건에서 지정한 `minAmount` 이상이고, `productCategory`가 지정된 경우 해당 카테고리의 상품인지 확인합니다.

7. **ACHIEVEMENT**: 사용자가 조건에서 지정한 `achievementId`에 해당하는 업적을 달성했는지 확인합니다.

8. **SOCIAL_SHARE**: 사용자가 조건에서 지정한 `platform` 중 하나 이상에 공유했고, `contentType`이 지정된 경우 해당 유형의 콘텐츠인지 확인합니다.

9. **CONTENT_CREATE**: 사용자가 조건에서 지정한 `contentType`의 콘텐츠를 제작했고, `minLength`가 지정된 경우 해당 길이 이상인지 확인합니다.

10. **SPECIAL_EVENT**: 사용자가 조건에서 지정한 `eventCode`에 참여했고, `metadata`가 지정된 경우 관련 조건을 모두 충족하는지 확인합니다.

## 지원되는 보상 유형

현재 시스템은 다음과 같은 보상 유형을 지원합니다:

1. POINTS (포인트)
2. ITEM (아이템)
3. COUPON (쿠폰)
4. CURRENCY (게임 내 화폐)
5. SUBSCRIPTION (구독 혜택)
6. BADGE (뱃지)
7. TITLE (칭호)

각 보상 유형에 대한 세부 내용은 아래와 같습니다.

## 1. POINTS (포인트)

포인트 형태의 보상으로, 주로 누적되는 형태의 리워드입니다.

### 속성

- `value`: 지급할 포인트 양
- `quantity`: 보통 1 (수량보다는 value로 금액 조정)

### 예시

```json
{
  "name": "멤버십 포인트",
  "description": "멤버십 포인트 1000점",
  "type": "POINTS",
  "value": 1000,
  "quantity": 1,
  "eventId": "60a12d5b9f15e83b0c9d1234"
}
```

## 2. ITEM (아이템)

게임이나 서비스 내에서 사용 가능한 아이템 형태의 보상입니다.

### 속성

- `value`: 아이템 ID 또는 값 (게임/웹 애플리케이션에서 해석)
- `quantity`: 지급할 아이템 수량

### 예시

```json
{
  "name": "경험치 포션",
  "description": "경험치 2배 포션 (24시간)",
  "type": "ITEM",
  "value": 1001,
  "quantity": 3,
  "eventId": "60a12d5b9f15e83b0c9d1234"
}
```

## 3. COUPON (쿠폰)

할인이나 특별 혜택을 제공하는 쿠폰 형태의 보상입니다.

### 속성

- `value`: 할인율(%) 또는 쿠폰 ID
- `quantity`: 지급할 쿠폰 수량

### 예시

```json
{
  "name": "게임 아이템 구매 쿠폰",
  "description": "아이템 구매 시 사용 가능한 10% 할인 쿠폰",
  "type": "COUPON",
  "value": 10,
  "quantity": 1,
  "eventId": "60a12d5b9f15e83b0c9d1234"
}
```

## 4. CURRENCY (게임 내 화폐)

게임 내에서 사용되는 화폐 형태의 보상입니다.

### 속성

- `value`: 지급할 화폐 양
- `quantity`: 보통 1 (수량보다는 value로 금액 조정)

### 예시

```json
{
  "name": "골드 500개",
  "description": "게임에서 사용 가능한 골드 500개",
  "type": "CURRENCY",
  "value": 500,
  "quantity": 1,
  "eventId": "60a12d5b9f15e83b0c9d1234"
}
```

## 5. SUBSCRIPTION (구독 혜택)

구독 서비스나 프리미엄 혜택 관련 보상입니다.

### 속성

- `value`: 구독 기간(일) 또는 구독 유형 ID
- `quantity`: 보통 1

### 예시

```json
{
  "name": "프리미엄 멤버십 7일",
  "description": "모든 프리미엄 혜택을 7일간 이용 가능",
  "type": "SUBSCRIPTION",
  "value": 7,
  "quantity": 1,
  "eventId": "60a12d5b9f15e83b0c9d1234"
}
```

## 6. BADGE (뱃지)

프로필이나 사용자 계정에 표시되는 뱃지 형태의 보상입니다.

### 속성

- `value`: 뱃지 ID
- `quantity`: 보통 1

### 예시

```json
{
  "name": "챔피언 뱃지",
  "description": "게임 챔피언십 참가자 뱃지",
  "type": "BADGE",
  "value": 2001,
  "quantity": 1,
  "eventId": "60a12d5b9f15e83b0c9d1234"
}
```

## 7. TITLE (칭호)

사용자 이름 옆에 표시되는 칭호 형태의 보상입니다.

### 속성

- `value`: 칭호 ID
- `quantity`: 보통 1

### 예시

```json
{
  "name": "용사의 칭호",
  "description": "사용자 이름 옆에 '용사' 칭호가 표시됩니다",
  "type": "TITLE",
  "value": 3001,
  "quantity": 1,
  "eventId": "60a12d5b9f15e83b0c9d1234"
}
```
