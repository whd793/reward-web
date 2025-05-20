#!/bin/bash

# 테스트용 API 호출 스크립트
BASE_URL="http://localhost:3000/api"
TOKEN=""

# 로그인하여 토큰 가져오기
login() {
  echo "관리자로 로그인 중..."
  local response=$(curl -s -X POST $BASE_URL/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}')
  
  TOKEN=$(echo $response | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
  
  if [ -z "$TOKEN" ]; then
    echo "로그인 실패"
    exit 1
  else
    echo "로그인 성공! 토큰 획득"
  fi
}

# 모든 이벤트 조회
list_events() {
  echo "모든 이벤트 조회 중..."
  curl -s -X GET $BASE_URL/events \
    -H "Authorization: Bearer $TOKEN" | jq
}

# 활성 이벤트 조회
list_active_events() {
  echo "활성 이벤트 조회 중..."
  curl -s -X GET $BASE_URL/events/active | jq
}

# 새 이벤트 생성
create_event() {
  echo "새 이벤트 생성 중..."
  local response=$(curl -s -X POST $BASE_URL/events \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "name": "테스트 이벤트",
      "description": "API 테스트용 이벤트",
      "eventType": "DAILY_LOGIN",
      "condition": {
        "consecutiveDays": 3
      },
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-12-31T23:59:59.999Z"
    }')
  
  echo $response | jq
  EVENT_ID=$(echo $response | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)
  
  if [ -z "$EVENT_ID" ]; then
    echo "이벤트 생성 실패"
  else
    echo "이벤트 생성 성공! ID: $EVENT_ID"
  fi
}

# 이벤트에 대한 보상 생성
create_reward() {
  if [ -z "$EVENT_ID" ]; then
    echo "이벤트 ID가 필요합니다. 먼저 이벤트를 생성하세요."
    return
  fi
  
  echo "보상 생성 중..."
  curl -s -X POST $BASE_URL/events/rewards \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"name\": \"테스트 보상\",
      \"description\": \"API 테스트용 보상\",
      \"type\": \"POINTS\",
      \"value\": 100,
      \"quantity\": 1,
      \"eventId\": \"$EVENT_ID\"
    }" | jq
}

# 사용자 이벤트 로그 생성
create_event_log() {
  echo "이벤트 로그 생성 중..."
  curl -s -X POST $BASE_URL/events/log \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "eventType": "DAILY_LOGIN",
      "data": {
        "loginDate": "2025-05-19T00:00:00.000Z",
        "deviceInfo": "테스트 기기"
      }
    }' | jq
}

# 메인 실행 코드
main() {
  login
  list_events
  list_active_events
  create_event
  create_reward
  create_event_log
  
  echo "API 테스트 완료!"
}

main