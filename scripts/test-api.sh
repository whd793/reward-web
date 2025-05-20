#!/bin/bash

# 이벤트/보상 관리 시스템 API 테스트 스크립트
# 주요 API 엔드포인트를 테스트합니다.

API_URL="http://localhost:3000/api"
ACCESS_TOKEN=""

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수 정의
print_header() {
  echo -e "${BLUE}==== $1 ====${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# 로그인 함수
login() {
  print_header "로그인 테스트"
  
  response=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username": "'$1'", "password": "'$2'"}')
  
  if echo "$response" | grep -q "access_token"; then
    ACCESS_TOKEN=$(echo "$response" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    print_success "로그인 성공: $1"
    echo "Token: $ACCESS_TOKEN"
  else
    print_error "로그인 실패: $1"
    echo "$response"
    exit 1
  fi
}

# 이벤트 목록 조회
get_events() {
  print_header "이벤트 목록 조회"
  
  response=$(curl -s -X GET "$API_URL/events" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  
  if echo "$response" | grep -q "items"; then
    print_success "이벤트 목록 조회 성공"
    echo "$response" | grep -o '"title":"[^"]*' | cut -d'"' -f4
  else
    print_error "이벤트 목록 조회 실패"
    echo "$response"
  fi
}

# 이벤트 상세 조회
get_event_detail() {
  print_header "이벤트 상세 조회: $1"
  
  response=$(curl -s -X GET "$API_URL/events/$1" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  
  if echo "$response" | grep -q "title"; then
    print_success "이벤트 상세 조회 성공"
    echo "$response" | grep -o '"title":"[^"]*' | cut -d'"' -f4
    EVENT_TITLE=$(echo "$response" | grep -o '"title":"[^"]*' | cut -d'"' -f4)
  else
    print_error "이벤트 상세 조회 실패"
    echo "$response"
  fi
}

# 이벤트 보상 조회
get_event_rewards() {
  print_header "이벤트 보상 조회: $1"
  
  response=$(curl -s -X GET "$API_URL/events/$1/rewards" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  
  if echo "$response" | grep -q "rewardType"; then
    print_success "이벤트 보상 조회 성공"
    echo "$response" | grep -o '"name":"[^"]*' | cut -d'"' -f4
  else
    print_error "이벤트 보상 조회 실패"
    echo "$response"
  fi
}

# 보상 요청
request_reward() {
  print_header "보상 요청: $1"
  
  response=$(curl -s -X POST "$API_URL/events/$1/request-reward" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d '{"idempotencyKey": "test-key-'$(date +%s)'"}')
  
  if echo "$response" | grep -q "status"; then
    print_success "보상 요청 성공"
    echo "$response" | grep -o '"status":"[^"]*' | cut -d'"' -f4
    REQUEST_ID=$(echo "$response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  else
    print_error "보상 요청 실패"
    echo "$response"
  fi
}

# 사용자 보상 요청 이력 조회
get_user_reward_requests() {
  print_header "사용자 보상 요청 이력 조회"
  
  response=$(curl -s -X GET "$API_URL/events/user/reward-requests" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  
  if echo "$response" | grep -q "items"; then
    print_success "사용자 보상 요청 이력 조회 성공"
    echo "$response" | grep -o '"status":"[^"]*' | cut -d'"' -f4
  else
    print_error "사용자 보상 요청 이력 조회 실패"
    echo "$response"
  fi
}

# 새 이벤트 생성
create_event() {
  print_header "새 이벤트 생성"
  
  current_date=$(date +%Y-%m-%d)
  end_date=$(date -d "+1 year" +%Y-%m-%d)
  
  response=$(curl -s -X POST "$API_URL/events" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d '{
      "title": "테스트 이벤트",
      "description": "API 테스트를 위한 이벤트입니다.",
      "startDate": "'$current_date'T00:00:00.000Z",
      "endDate": "'$end_date'T23:59:59.000Z",
      "isActive": true,
      "requiresApproval": false,
      "conditionType": "API_TEST",
      "conditionValue": 1,
      "conditionDescription": "API 테스트 조건"
    }')
  
  if echo "$response" | grep -q "title"; then
    print_success "이벤트 생성 성공"
    NEW_EVENT_ID=$(echo "$response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    echo "새 이벤트 ID: $NEW_EVENT_ID"
  else
    print_error "이벤트 생성 실패"
    echo "$response"
  fi
}

# 관리자 이벤트 보상 추가
add_reward() {
  print_header "이벤트에 보상 추가: $1"
  
  response=$(curl -s -X POST "$API_URL/events/$1/rewards" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d '{
     "name": "테스트 보상",
      "description": "API 테스트를 위한 보상입니다.",
      "rewardType": "TEST_REWARD",
      "rewardValue": "test_value",
      "quantity": 100
    }')
  
  if echo "$response" | grep -q "name"; then
    print_success "보상 추가 성공"
    NEW_REWARD_ID=$(echo "$response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    echo "새 보상 ID: $NEW_REWARD_ID"
  else
    print_error "보상 추가 실패"
    echo "$response"
  fi
}

# 모든 보상 요청 이력 조회 (관리자용)
get_all_reward_requests() {
  print_header "모든 보상 요청 이력 조회 (관리자용)"
  
  response=$(curl -s -X GET "$API_URL/events/admin/reward-requests" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  
  if echo "$response" | grep -q "items"; then
    print_success "모든 보상 요청 이력 조회 성공"
    TOTAL_REQUESTS=$(echo "$response" | grep -o '"total":[^,]*' | cut -d':' -f2)
    echo "총 요청 수: $TOTAL_REQUESTS"
  else
    print_error "모든 보상 요청 이력 조회 실패"
    echo "$response"
  fi
}

# 보상 요청 승인 (관리자용)
approve_reward_request() {
  print_header "보상 요청 승인: $1"
  
  response=$(curl -s -X PUT "$API_URL/events/admin/reward-requests/$1/approve" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  
  if echo "$response" | grep -q "COMPLETED"; then
    print_success "보상 요청 승인 성공"
  else
    print_error "보상 요청 승인 실패"
    echo "$response"
  fi
}

# 보상 요청 거부 (관리자용)
reject_reward_request() {
  print_header "보상 요청 거부: $1"
  
  response=$(curl -s -X PUT "$API_URL/events/admin/reward-requests/$1/reject" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d '{"rejectionReason": "테스트를 위한 거부"}')
  
  if echo "$response" | grep -q "REJECTED"; then
    print_success "보상 요청 거부 성공"
  else
    print_error "보상 요청 거부 실패"
    echo "$response"
  fi
}

# 메인 테스트 시나리오
main() {
  print_header "API 테스트 시작"
  
  # 1. 사용자로 로그인
  login "user" "user123"
  
  # 2. 이벤트 목록 조회
  get_events
  
  # 3. 첫 번째 이벤트 상세 조회
  EVENT_ID=$(curl -s -X GET "$API_URL/events" \
    -H "Authorization: Bearer $ACCESS_TOKEN" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  
  if [ -n "$EVENT_ID" ]; then
    get_event_detail "$EVENT_ID"
    
    # 4. 이벤트 보상 조회
    get_event_rewards "$EVENT_ID"
    
    # 5. 보상 요청
    request_reward "$EVENT_ID"
  else
    print_error "이벤트 ID를 찾을 수 없습니다."
  fi
  
  # 6. 사용자 보상 요청 이력 조회
  get_user_reward_requests
  
  # 7. 관리자로 로그인
  login "admin" "admin123"
  
  # 8. 새 이벤트 생성
  create_event
  
  if [ -n "$NEW_EVENT_ID" ]; then
    # 9. 이벤트에 보상 추가
    add_reward "$NEW_EVENT_ID"
  fi
  
  # 10. 모든 보상 요청 이력 조회
  get_all_reward_requests
  
  # 11. 보상 요청 승인/거부 (PENDING 상태의 요청이 있는 경우)
  PENDING_REQUEST_ID=$(curl -s -X GET "$API_URL/events/admin/reward-requests?status=PENDING" \
    -H "Authorization: Bearer $ACCESS_TOKEN" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  
  if [ -n "$PENDING_REQUEST_ID" ]; then
    approve_reward_request "$PENDING_REQUEST_ID"
    
    # 다른 PENDING 요청이 있는지 확인
    ANOTHER_PENDING_REQUEST_ID=$(curl -s -X GET "$API_URL/events/admin/reward-requests?status=PENDING" \
      -H "Authorization: Bearer $ACCESS_TOKEN" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    
    if [ -n "$ANOTHER_PENDING_REQUEST_ID" ]; then
      reject_reward_request "$ANOTHER_PENDING_REQUEST_ID"
    fi
  fi
  
  print_header "API 테스트 완료"
}

# 테스트 실행
main