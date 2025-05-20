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

# 🔐 인증 API (Authentication APIs)

- `POST   /api/auth/login`  
  사용자 로그인
- `POST   /api/auth/register`  
  사용자 회원가입
- `GET    /api/auth/me`  
  현재 사용자 정보 조회

# 🎯 이벤트 관리 API (Event Management APIs)

- `POST   /api/events`  
  이벤트 생성 (관리자/운영자)
- `GET    /api/events`  
  모든 이벤트 조회 (관리자/운영자/감사자)
- `GET    /api/events/active`  
  활성 이벤트 조회 (공개용)
- `GET    /api/events/:id`  
  이벤트 ID로 조회
- `GET    /api/events/:id/status`  
  이벤트 상태 조회
- `PATCH  /api/events/:id/status`  
  이벤트 상태 수정 (관리자/운영자)
- `POST   /api/events/:eventId/check-condition`  
  이벤트 조건 확인
- `GET    /api/events/:id/rewards`  
  이벤트 ID로 보상 목록 조회

# 🎁 보상 관리 API (Reward Management APIs)

- `POST   /api/events/rewards`  
  보상 생성 (관리자/운영자)
- `GET    /api/events/rewards`  
  모든 보상 조회 (관리자/운영자/감사자)
- `GET    /api/events/rewards/:rewardId`  
  보상 ID로 조회
- `POST   /api/events/rewards/request`  
  보상 요청
- `GET    /api/events/rewards/request/:requestId`  
  보상 요청 상태 조회
- `POST   /api/events/rewards/claim/:requestId`  
  보상 수령

# 👤 사용자 보상 API (User Reward Management APIs)

- `GET    /api/events/rewards/user/requests`  
  사용자 보상 요청 목록 조회
- `GET    /api/events/rewards/user/pending`  
  사용자 미수령 보상 조회

# ⚙️ 관리자 API (Admin Management APIs)

- `GET    /api/events/rewards/admin/requests`  
  전체 보상 요청 조회 (관리자/운영자/감사자)
- `PATCH  /api/events/rewards/admin/request/:requestId`  
  보상 요청 상태 변경 (관리자/운영자)

# 📝 이벤트 로그 API (Event Logging APIs)

- `POST   /api/events/log`  
  이벤트 로그 생성
- `GET    /api/events/logs/user`  
  사용자 이벤트 로그 조회
- `GET    /api/events/logs`  
  전체 이벤트 로그 조회 (관리자/운영자/감사자)

# 📊 분석 및 통계 API (Analytics & Statistics APIs)

- `GET    /api/events/statistics/events`  
  이벤트 통계 조회 (관리자/운영자/감사자)
- `GET    /api/events/statistics/rewards`  
  보상 통계 조회 (관리자/운영자/감사자)

# 🏥 시스템 상태 API (Health & System APIs)

- `GET    /api/events/health`  
  헬스 체크 (공개용)

# API 테스트 가이드 (한국어)

## ** 초기설정**

```bash
# Get admin token (most common token needed)
ADMIN_TOKEN=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' | jq -r .access_token)

echo "Admin Token: $ADMIN_TOKEN"
```

---

# ** Authentication APIs**

## **1. POST /api/auth/register**

```bash
# Create a new user
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser'$(date +%s)'",
    "email": "testuser'$(date +%s)'@example.com",
    "password": "password123"
  }'

# Expected: 201 with user object
```

## **2. POST /api/auth/login**

```bash
# Login with admin
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# Login with regular user
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'

# Expected: 201 with access_token and user info
```

## **3. GET /api/auth/me**

```bash
# Get current user info
curl -X GET "http://localhost:3000/api/auth/me" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: 200 with user profile
```

---

# ** Event Management APIs**

## **4. POST /api/events**

```bash
# Create new event (Admin/Operator only)
curl -X POST "http://localhost:3000/api/events" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test Event '$(date +%s)'",
    "description": "Event created via API testing",
    "eventType": "DAILY_LOGIN",
    "condition": {"consecutiveDays": 3},
    "startDate": "2025-05-22T00:00:00.000Z",
    "endDate": "2025-07-22T23:59:59.999Z",
    "status": "ACTIVE",
    "approvalType": "AUTO"
  }'

# Expected: 201 with event object
```

## **5. GET /api/events**

```bash
# Get all events (Admin/Operator/Auditor only)
curl -X GET "http://localhost:3000/api/events" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# With pagination
curl -X GET "http://localhost:3000/api/events?page=1&limit=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: 200 with paginated events
```

## **6. GET /api/events/active**

```bash
# Get active events (Public - no auth needed)
curl -X GET "http://localhost:3000/api/events/active"

# With pagination
curl -X GET "http://localhost:3000/api/events/active?page=1&limit=3"

# Expected: 200 with active events
```

## **7. GET /api/events/:id**

```bash
# Get specific event by ID (get ID from active events first)
EVENT_ID=$(curl -s -X GET "http://localhost:3000/api/events/active" | jq -r '.data[0]._id')

curl -X GET "http://localhost:3000/api/events/$EVENT_ID"

# Expected: 200 with event details
```

## **8. GET /api/events/:id/status**

```bash
# Get event status
curl -X GET "http://localhost:3000/api/events/$EVENT_ID/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: 200 with status info
```

## **9. PATCH /api/events/:id/status**

```bash
# Update event status (Admin/Operator only)
curl -X PATCH "http://localhost:3000/api/events/$EVENT_ID/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "ACTIVE"}'

# Test changing to INACTIVE
curl -X PATCH "http://localhost:3000/api/events/$EVENT_ID/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "INACTIVE"}'

# Expected: 200 with updated event
```

## **10. POST /api/events/:eventId/check-condition**

```bash
# Check if user meets event condition
curl -X POST "http://localhost:3000/api/events/$EVENT_ID/check-condition" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: 200 with condition check result
```

## **11. GET /api/events/:id/rewards**

```bash
# Get rewards for specific event
curl -X GET "http://localhost:3000/api/events/$EVENT_ID/rewards" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: 200 with rewards array
```

---

# ** Reward Management APIs**

## **12. POST /api/events/rewards**

```bash
# Create new reward (Admin/Operator only)
curl -X POST "http://localhost:3000/api/events/rewards" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test Gold Reward",
    "description": "1000 gold coins for API testing",
    "type": "CURRENCY",
    "value": 1000,
    "quantity": 1,
    "eventId": "'$EVENT_ID'"
  }'

# Expected: 201 with reward object
# Save the reward ID for later tests
```

## **13. GET /api/events/rewards**

```bash
# Get all rewards (Admin/Operator/Auditor only)
curl -X GET "http://localhost:3000/api/events/rewards" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# With pagination
curl -X GET "http://localhost:3000/api/events/rewards?page=1&limit=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: 200 with paginated rewards
```

## **14. GET /api/events/rewards/:rewardId**

```bash
# Get specific reward by ID (get ID from rewards list first)
REWARD_ID=$(curl -s -X GET "http://localhost:3000/api/events/rewards" -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.data[0]._id')

curl -X GET "http://localhost:3000/api/events/rewards/$REWARD_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: 200 with reward details
```

## **15. POST /api/events/rewards/request**

```bash
# Request a reward
curl -X POST "http://localhost:3000/api/events/rewards/request" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "'$EVENT_ID'",
    "rewardId": "'$REWARD_ID'"
  }'

# Test duplicate request (should fail with 409)
curl -X POST "http://localhost:3000/api/events/rewards/request" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "'$EVENT_ID'",
    "rewardId": "'$REWARD_ID'"
  }'

# Expected: 201 first time, 409 second time
```

## **16. GET /api/events/rewards/request/:requestId**

```bash
# Get reward request status (get request ID from previous step)
REQUEST_ID="REPLACE_WITH_ACTUAL_REQUEST_ID"

curl -X GET "http://localhost:3000/api/events/rewards/request/$REQUEST_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: 200 with request details
```

## **17. POST /api/events/rewards/claim/:requestId**

```bash
# Claim a reward
curl -X POST "http://localhost:3000/api/events/rewards/claim/$REQUEST_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gameTransactionId": "tx_'$(date +%s)'",
    "message": "Reward claimed via API test"
  }'

# Expected: 200 with claim confirmation
```

---

# ** User Reward Management APIs**

## **18. GET /api/events/rewards/user/requests**

```bash
# Get user's reward requests
curl -X GET "http://localhost:3000/api/events/rewards/user/requests" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# With pagination and filters
curl -X GET "http://localhost:3000/api/events/rewards/user/requests?page=1&limit=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: 200 with user's requests
```

## **19. GET /api/events/rewards/user/pending**

```bash
# Get user's pending rewards
curl -X GET "http://localhost:3000/api/events/rewards/user/pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: 200 with pending rewards
```

---

# ** Admin Management APIs**

## **20. GET /api/events/rewards/admin/requests**

```bash
# Get all reward requests (Admin/Operator/Auditor only)
curl -X GET "http://localhost:3000/api/events/rewards/admin/requests" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Filter by status
curl -X GET "http://localhost:3000/api/events/rewards/admin/requests?status=PENDING" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# With pagination
curl -X GET "http://localhost:3000/api/events/rewards/admin/requests?page=1&limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: 200 with all requests
```

## **21. PATCH /api/events/rewards/admin/request/:requestId**

```bash
# Update request status (Admin/Operator only)
curl -X PATCH "http://localhost:3000/api/events/rewards/admin/request/$REQUEST_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "reason": "Request approved via API test"
  }'

# Test rejection
curl -X PATCH "http://localhost:3000/api/events/rewards/admin/request/$REQUEST_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "REJECTED",
    "reason": "Does not meet criteria"
  }'

# Expected: 200 with updated request
```

---

# ** Event Logging APIs**

## **22. POST /api/events/log**

```bash
# Create daily login log
curl -X POST "http://localhost:3000/api/events/log" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "DAILY_LOGIN",
    "data": {
      "loginDate": "2025-05-22T12:00:00.000Z",
      "consecutiveDays": 3,
      "deviceInfo": "API Test"
    }
  }'

# Create quest completion log
curl -X POST "http://localhost:3000/api/events/log" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "QUEST_COMPLETE",
    "data": {
      "questId": "quest_api_test",
      "questName": "API Testing Quest",
      "experience": 200,
      "completedAt": "2025-05-22T12:00:00.000Z"
    }
  }'

# Create level up log
curl -X POST "http://localhost:3000/api/events/log" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "LEVEL_UP",
    "data": {
      "oldLevel": 9,
      "newLevel": 10,
      "experience": 5000,
      "levelUpAt": "2025-05-22T12:00:00.000Z"
    }
  }'

# Expected: 200 with success confirmation
```

## **23. GET /api/events/logs/user**

```bash
# Get user's event logs
curl -X GET "http://localhost:3000/api/events/logs/user" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# With pagination
curl -X GET "http://localhost:3000/api/events/logs/user?page=1&limit=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Filter by event type
curl -X GET "http://localhost:3000/api/events/logs/user?eventType=DAILY_LOGIN" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

curl -X GET "http://localhost:3000/api/events/logs/user?eventType=QUEST_COMPLETE" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: 200 with paginated logs
```

## **24. GET /api/events/logs**

```bash
# Get all event logs (Admin/Operator/Auditor only)
curl -X GET "http://localhost:3000/api/events/logs" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Filter by event type
curl -X GET "http://localhost:3000/api/events/logs?eventType=LEVEL_UP" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Filter by user ID
USER_ID="682ed0a8f5e1c7fc9a524570"  # Replace with actual user ID
curl -X GET "http://localhost:3000/api/events/logs?userId=$USER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Multiple filters with pagination
curl -X GET "http://localhost:3000/api/events/logs?eventType=DAILY_LOGIN&page=1&limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: 200 with filtered logs
```

---

# ** Analytics & Statistics APIs**

## **25. GET /api/events/statistics/events**

```bash
# Get event statistics (Admin/Operator/Auditor only)
curl -X GET "http://localhost:3000/api/events/statistics/events" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: 200 with event counts and stats
```

## **26. GET /api/events/statistics/rewards**

```bash
# Get reward statistics (Admin/Operator/Auditor only)
curl -X GET "http://localhost:3000/api/events/statistics/rewards" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: 200 with reward stats
```

---

# ** Health & System APIs**

## **27. GET /api/events/health**

```bash
# Health check (Public - no auth needed)
curl -X GET "http://localhost:3000/api/events/health"

# Expected: 200 with health status
```

---

## 기본 계정

테스트에 사용할 수 있는 기본 계정:

- 관리자: admin / admin123
- 운영자: operator / operator123
- 감사자: auditor / auditor123
- 일반 사용자: user / user123

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

다음은 Nexon 보상 시스템의 **이벤트 로그 API**를 `README.md`에 설명하는 한국어 버전입니다:

---

## 📝 이벤트 로그 API

**이벤트 로그 API**는 Nexon 보상 시스템을 위한 중앙 집중형 로깅 엔드포인트입니다.
외부 게임 클라이언트나 웹 애플리케이션에서 **일일 로그인, 퀘스트 완료, 레벨업, 친구 초대, 프로필 완료** 등의 사용자 이벤트를 서버에 기록하여 **보상 처리 및 활동 추적**을 가능하게 합니다.

---

### 📌 목적

이 API는 **게임 클라이언트 또는 웹 사이트 등 외부 플랫폼**에서 발생하는 유저 활동을 Nexon 서버로 전송하여,
보상 지급, 통계 분석, 유저 진행 상황 저장 등에 활용됩니다.

---

### 🔐 인증

모든 요청에는 유효한 `Bearer` 토큰이 필요합니다.

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

---

### 📤 엔드포인트

```
POST /api/events/log
```

---

### 📦 요청 형식

요청 바디는 다음 형식을 따라야 합니다:

- `eventType`: (string) 이벤트 종류 (예: `DAILY_LOGIN`, `QUEST_COMPLETE` 등)
- `data`: (object) 이벤트에 필요한 상세 데이터

---

### 📚 지원되는 이벤트 유형 및 예시

```bash
# Get JWT token first
TOKEN=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' | jq -r .access_token)
```

#### ✅ 일일 로그인 (DAILY_LOGIN)

```bash
curl -X POST http://localhost:3000/api/events/log \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "DAILY_LOGIN",
    "data": {
      "loginDate": "2025-05-22T12:00:00.000Z",
      "consecutiveDays": 3,
      "deviceInfo": "Mobile App"
    }
  }'
```

#### 🗺️ 퀘스트 완료 (QUEST_COMPLETE)

```bash
curl -X POST http://localhost:3000/api/events/log \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "QUEST_COMPLETE",
    "data": {
      "questId": "quest_123",
      "questName": "First Adventure Quest",
      "completedAt": "2025-05-22T12:00:00.000Z",
      "experience": 100
    }
  }'
```

#### 🚀 레벨업 (LEVEL_UP)

```bash
curl -X POST http://localhost:3000/api/events/log \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "LEVEL_UP",
    "data": {
      "oldLevel": 9,
      "newLevel": 10,
      "experience": 5000,
      "levelUpAt": "2025-05-22T12:00:00.000Z"
    }
  }'
```

#### 👥 친구 초대 (INVITE_FRIENDS)

```bash
curl -X POST http://localhost:3000/api/events/log \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "INVITE_FRIENDS",
    "data": {
      "invitedUserId": "user_456",
      "invitedUsername": "friend123",
      "invitedAt": "2025-05-22T12:00:00.000Z"
    }
  }'
```

#### 👤 프로필 완료 (PROFILE_COMPLETE)

```bash
curl -X POST http://localhost:3000/api/events/log \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "PROFILE_COMPLETE",
    "data": {
      "completedFields": ["name", "birthdate", "address", "phoneNumber"],
      "completedAt": "2025-05-22T12:00:00.000Z"
    }
  }'
```

다음은 요청하신 내용을 한국어로 번역하고 `.md` 마크다운 형식으로 구성한 문서입니다. `ADMIN_TOKEN`은 모두 `TOKEN`으로 변경되었습니다.

---

# 📘 이벤트 로깅 API 테스트 가이드

## 1. 이벤트 로그 생성 (다양한 유형)

### 🔑 토큰 발급

````bash
TOKEN=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' | jq -r .access_token)


### 🟦 일일 로그인 이벤트

```bash
curl -X POST "http://localhost:3000/api/events/log" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "DAILY_LOGIN",
    "data": {
      "loginDate": "2025-05-22T08:00:00.000Z",
      "consecutiveDays": 1,
      "deviceInfo": "Web Browser",
      "ipAddress": "192.168.1.100"
    }
  }'
````

### 🟩 퀘스트 완료 이벤트

```bash
curl -X POST "http://localhost:3000/api/events/log" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "QUEST_COMPLETE",
    "data": {
      "questId": "quest_001",
      "questName": "First Adventure",
      "experience": 150,
      "completedAt": "2025-05-22T09:30:00.000Z"
    }
  }'
```

### 🟨 레벨 업 이벤트

```bash
curl -X POST "http://localhost:3000/api/events/log" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "LEVEL_UP",
    "data": {
      "oldLevel": 4,
      "newLevel": 5,
      "experience": 2500,
      "skillPoints": 3,
      "levelUpAt": "2025-05-22T10:15:00.000Z"
    }
  }'
```

### 🟥 친구 초대 이벤트

```bash
curl -X POST "http://localhost:3000/api/events/log" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "INVITE_FRIENDS",
    "data": {
      "invitedUserId": "user_12345",
      "invitedUsername": "friend_alice",
      "inviteMethod": "email",
      "invitedAt": "2025-05-22T11:00:00.000Z"
    }
  }'
```

### 🟪 프로필 완성 이벤트

```bash
curl -X POST "http://localhost:3000/api/events/log" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "PROFILE_COMPLETE",
    "data": {
      "completedFields": ["name", "birthdate", "address", "phoneNumber"],
      "profileCompleteness": 100,
      "completedAt": "2025-05-22T12:00:00.000Z"
    }
  }'
```

---

## 2. 사용자 이벤트 로그 조회

### 🔍 기본 조회

```bash
curl -X GET "http://localhost:3000/api/events/logs/user" \
  -H "Authorization: Bearer $TOKEN"
```

### 📄 페이지네이션 적용

```bash
curl -X GET "http://localhost:3000/api/events/logs/user?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

### 🔎 이벤트 유형별 필터링

```bash
curl -X GET "http://localhost:3000/api/events/logs/user?eventType=DAILY_LOGIN" \
  -H "Authorization: Bearer $TOKEN"
```

```bash
curl -X GET "http://localhost:3000/api/events/logs/user?eventType=QUEST_COMPLETE" \
  -H "Authorization: Bearer $TOKEN"
```

```bash
curl -X GET "http://localhost:3000/api/events/logs/user?eventType=LEVEL_UP" \
  -H "Authorization: Bearer $TOKEN"
```

### 📌 필터 + 페이지네이션 조합

```bash
curl -X GET "http://localhost:3000/api/events/logs/user?eventType=DAILY_LOGIN&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 3. 관리자: 전체 이벤트 로그 조회

### 🧑‍💼 관리자 토큰 발급

```bash
TOKEN=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' | jq -r .access_token)
```

### 📋 전체 이벤트 로그 조회

```bash
curl -X GET "http://localhost:3000/api/events/logs" \
  -H "Authorization: Bearer $TOKEN"
```

### 📄 페이지네이션 적용

```bash
curl -X GET "http://localhost:3000/api/events/logs?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

### 🎯 이벤트 유형별 필터링

```bash
curl -X GET "http://localhost:3000/api/events/logs?eventType=DAILY_LOGIN" \
  -H "Authorization: Bearer $TOKEN"
```

```bash
curl -X GET "http://localhost:3000/api/events/logs?eventType=QUEST_COMPLETE" \
  -H "Authorization: Bearer $TOKEN"
```

### 🙍 특정 사용자 필터링

```bash
USER_ID="682ed0a8f5e1c7fc9a524570"

curl -X GET "http://localhost:3000/api/events/logs?userId=$USER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### 🧩 복합 필터링

```bash
curl -X GET "http://localhost:3000/api/events/logs?eventType=LEVEL_UP&userId=$USER_ID&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```
