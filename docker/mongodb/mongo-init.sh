#!/bin/bash
set -e

# MongoDB 초기화 스크립트
# MongoDB 컨테이너가 처음 실행될 때 실행됩니다.

# 관리자 인증
mongo -u $MONGO_INITDB_ROOT_USERNAME -p $MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase admin << EOF
# 데이터베이스 사용
use $MONGO_INITDB_DATABASE

# 인덱스 생성
db.users.createIndex({ username: 1 }, { unique: true })
db.users.createIndex({ email: 1 }, { unique: true })
db.events.createIndex({ eventType: 1 })
db.events.createIndex({ status: 1 })
db.events.createIndex({ startDate: 1, endDate: 1 })
db.rewards.createIndex({ type: 1 })
db.rewards.createIndex({ eventId: 1 })
db.reward_requests.createIndex({ userId: 1, eventId: 1 })
db.reward_requests.createIndex({ status: 1 })
db.reward_requests.createIndex({ idempotencyKey: 1 }, { unique: true })
db.event_logs.createIndex({ userId: 1, eventType: 1 })
db.event_logs.createIndex({ timestamp: 1 })

# 기본 데이터 로드 (init-mongo.js 에서 처리)
print("MongoDB 초기화 완료")
EOF