#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3000/api"
TIMEOUT=10

# Helper function to make API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local headers=$4
    local description=$5
    
    echo -e "${YELLOW}🔍 Testing: $description${NC}"
    echo -e "${BLUE}   $method $BASE_URL$endpoint${NC}"
    
    # Build curl command
    local curl_cmd="curl -s -w '%{http_code}' --connect-timeout $TIMEOUT -X $method"
    
    if [ -n "$headers" ]; then
        curl_cmd="$curl_cmd -H '$headers'"
    fi
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    curl_cmd="$curl_cmd '$BASE_URL$endpoint'"
    
    # Execute curl command
    local response=$(eval $curl_cmd)
    local status_code="${response: -3}"
    local body="${response%???}"
    
    # Check if response is valid JSON
    if echo "$body" | jq . >/dev/null 2>&1; then
        echo "$body" | jq .
    else
        echo "$body"
    fi
    
    # Status check
    if [[ "$status_code" =~ ^[2-3][0-9][0-9]$ ]]; then
        echo -e "${GREEN}✅ Status: $status_code${NC}\n"
        return 0
    else
        echo -e "${RED}❌ Status: $status_code${NC}\n"
        return 1
    fi
}

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0

run_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if api_call "$@"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
}

echo -e "${PURPLE}🚀 Nexon Reward System - Complete API Test Suite${NC}"
echo -e "${PURPLE}===================================================${NC}\n"

# =================== HEALTH CHECK ===================
echo -e "${CYAN}🏥 HEALTH CHECK TESTS${NC}"
echo -e "${CYAN}===================${NC}\n"

run_test "GET" "/events/health" "" "" "Health Check (Public)"

# =================== AUTHENTICATION TESTS ===================
echo -e "${CYAN}🔐 AUTHENTICATION TESTS${NC}"
echo -e "${CYAN}=======================${NC}\n"

# Register new user
RANDOM_USER="testuser$(date +%s)"
NEW_USER_DATA="{\"username\": \"$RANDOM_USER\", \"email\": \"$RANDOM_USER@example.com\", \"password\": \"password123\"}"

run_test "POST" "/auth/register" "$NEW_USER_DATA" "" "User Registration"

# Login with admin
ADMIN_LOGIN_DATA='{"username": "admin", "password": "admin123"}'
echo -e "${YELLOW}🔑 Getting admin token...${NC}"
ADMIN_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "$ADMIN_LOGIN_DATA" | jq -r .access_token 2>/dev/null)

if [ "$ADMIN_TOKEN" = "null" ] || [ -z "$ADMIN_TOKEN" ]; then
  echo -e "${RED}❌ Failed to get admin token${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Admin token obtained${NC}\n"

# Login with new user
USER_LOGIN_DATA="{\"username\": \"$RANDOM_USER\", \"password\": \"password123\"}"
echo -e "${YELLOW}🔑 Getting user token...${NC}"
USER_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "$USER_LOGIN_DATA" | jq -r .access_token 2>/dev/null)

if [ "$USER_TOKEN" = "null" ] || [ -z "$USER_TOKEN" ]; then
  echo -e "${RED}❌ Failed to get user token${NC}"
  USER_TOKEN=""
fi
echo -e "${GREEN}✅ User token obtained${NC}\n"

run_test "POST" "/auth/login" "$ADMIN_LOGIN_DATA" "" "Admin Login"

# Get current user info
run_test "GET" "/auth/me" "" "Authorization: Bearer $ADMIN_TOKEN" "Get Current User Info"

# =================== EVENT TESTS ===================
echo -e "${CYAN}🎯 EVENT TESTS${NC}"
echo -e "${CYAN}==============${NC}\n"

run_test "GET" "/events/active" "" "" "Get Active Events (Public)"

run_test "GET" "/events" "" "Authorization: Bearer $ADMIN_TOKEN" "Get All Events (Admin Only)"

# Get event ID for further tests
EVENT_ID=$(curl -s -X GET "$BASE_URL/events/active" | jq -r .data[0]._id 2>/dev/null)

if [ "$EVENT_ID" != "null" ] && [ -n "$EVENT_ID" ]; then
    run_test "GET" "/events/$EVENT_ID" "" "" "Get Specific Event by ID"
    
    # Check event condition
    if [ -n "$USER_TOKEN" ]; then
        run_test "POST" "/events/$EVENT_ID/check-condition" "" "Authorization: Bearer $USER_TOKEN" "Check Event Condition"
    fi
else
    echo -e "${YELLOW}⚠️ No events found, skipping event-specific tests${NC}\n"
fi

# Create new event
NEW_EVENT_DATA='{
  "name": "Complete API Test Event",
  "description": "Created during comprehensive API testing",
  "eventType": "DAILY_LOGIN",
  "condition": {"consecutiveDays": 5},
  "startDate": "2025-05-22T00:00:00.000Z",
  "endDate": "2025-07-22T23:59:59.999Z"
}'

run_test "POST" "/events" "$NEW_EVENT_DATA" "Authorization: Bearer $ADMIN_TOKEN" "Create New Event"

# =================== REWARD TESTS ===================
echo -e "${CYAN}🎁 REWARD TESTS${NC}"
echo -e "${CYAN}===============${NC}\n"

run_test "GET" "/events/rewards" "" "Authorization: Bearer $ADMIN_TOKEN" "Get All Rewards (Admin Only)"

if [ "$EVENT_ID" != "null" ] && [ -n "$EVENT_ID" ]; then
    run_test "GET" "/events/$EVENT_ID/rewards" "" "" "Get Rewards for Specific Event"
    
    # Create new reward
    NEW_REWARD_DATA="{
      \"name\": \"Test API Gold Reward\",
      \"description\": \"1000 gold coins for API testing\",
      \"type\": \"CURRENCY\",
      \"value\": 1000,
      \"quantity\": 1,
      \"eventId\": \"$EVENT_ID\"
    }"
    
    run_test "POST" "/events/rewards" "$NEW_REWARD_DATA" "Authorization: Bearer $ADMIN_TOKEN" "Create New Reward"
    
    # Get reward ID for further tests
    REWARD_ID=$(curl -s -X GET "$BASE_URL/events/$EVENT_ID/rewards" | jq -r .[0]._id 2>/dev/null)
    
    if [ "$REWARD_ID" != "null" ] && [ -n "$REWARD_ID" ]; then
        run_test "GET" "/events/rewards/$REWARD_ID" "" "" "Get Specific Reward by ID"
        
        # Request reward
        if [ -n "$USER_TOKEN" ]; then
            REQUEST_REWARD_DATA="{
              \"eventId\": \"$EVENT_ID\",
              \"rewardId\": \"$REWARD_ID\"
            }"
            
            run_test "POST" "/events/rewards/request" "$REQUEST_REWARD_DATA" "Authorization: Bearer $USER_TOKEN" "Request Reward"
        fi
    fi
fi

# =================== USER REWARD MANAGEMENT TESTS ===================
echo -e "${CYAN}👤 USER REWARD MANAGEMENT TESTS${NC}"
echo -e "${CYAN}===============================${NC}\n"

if [ -n "$USER_TOKEN" ]; then
    run_test "GET" "/events/rewards/user/requests" "" "Authorization: Bearer $USER_TOKEN" "Get User Reward Requests"
    
    run_test "GET" "/events/rewards/user/pending" "" "Authorization: Bearer $USER_TOKEN" "Get User Pending Rewards"
fi

# =================== ADMIN MANAGEMENT TESTS ===================
echo -e "${CYAN}⚙️ ADMIN MANAGEMENT TESTS${NC}"
echo -e "${CYAN}=========================${NC}\n"

run_test "GET" "/events/rewards/admin/requests" "" "Authorization: Bearer $ADMIN_TOKEN" "Get All Reward Requests (Admin)"

# =================== EVENT LOGGING TESTS ===================
echo -e "${CYAN}📝 EVENT LOGGING TESTS${NC}"
echo -e "${CYAN}======================${NC}\n"

if [ -n "$USER_TOKEN" ]; then
    LOG_DATA='{
      "eventType": "DAILY_LOGIN",
      "data": {
        "loginDate": "2025-05-22T12:00:00.000Z",
        "consecutiveDays": 2
      }
    }'
    
    run_test "POST" "/events/log" "$LOG_DATA" "Authorization: Bearer $USER_TOKEN" "Create Event Log"
fi

# =================== STATISTICS TESTS ===================
echo -e "${CYAN}📊 STATISTICS TESTS${NC}"
echo -e "${CYAN}===================${NC}\n"

run_test "GET" "/events/statistics/events" "" "Authorization: Bearer $ADMIN_TOKEN" "Get Event Statistics"

run_test "GET" "/events/statistics/rewards" "" "Authorization: Bearer $ADMIN_TOKEN" "Get Reward Statistics"

# =================== ERROR HANDLING TESTS ===================
echo -e "${CYAN}🚨 ERROR HANDLING TESTS${NC}"
echo -e "${CYAN}======================${NC}\n"

run_test "GET" "/events/nonexistent-endpoint" "" "" "404 Not Found Test"

run_test "GET" "/events" "" "" "401 Unauthorized Test"

# =================== FINAL SUMMARY ===================
echo -e "${PURPLE}📈 TEST RESULTS SUMMARY${NC}"
echo -e "${PURPLE}=======================${NC}\n"

FAILED_TESTS=$((TOTAL_TESTS - PASSED_TESTS))
PASS_RATE=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))

echo -e "${BLUE}Total Tests: $TOTAL_TESTS${NC}"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo -e "${YELLOW}Pass Rate: $PASS_RATE%${NC}\n"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! Your API is working perfectly!${NC}"
else
    echo -e "${YELLOW}⚠️ Some tests failed. Please check the output above for details.${NC}"
fi

echo -e "\n${PURPLE}🚀 Complete API Test Suite Finished!${NC}"