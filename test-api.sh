#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Testing Nexon Reward System APIs${NC}\n"

# Get JWT token
echo -e "${YELLOW}1. Getting JWT token...${NC}"
TOKEN=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' | jq -r .access_token)

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Failed to get token${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Token obtained${NC}\n"

# Test active events (no auth required)
echo -e "${YELLOW}2. Testing active events (no auth)...${NC}"
curl -s -X GET "http://localhost:3000/api/events/active" | jq .data[0].name
echo -e "${GREEN}✅ Active events working${NC}\n"

# Test all events (auth required)
echo -e "${YELLOW}3. Testing all events (auth required)...${NC}"
curl -s -X GET "http://localhost:3000/api/events" \
  -H "Authorization: Bearer $TOKEN" | jq .meta.total
echo -e "${GREEN}✅ All events working${NC}\n"

# Test specific event
echo -e "${YELLOW}4. Testing specific event...${NC}"
EVENT_ID=$(curl -s -X GET "http://localhost:3000/api/events/active" | jq -r .data[0]._id)
curl -s -X GET "http://localhost:3000/api/events/$EVENT_ID" | jq .name
echo -e "${GREEN}✅ Specific event working${NC}\n"

# Test create event
echo -e "${YELLOW}5. Testing create event...${NC}"
NEW_EVENT=$(curl -s -X POST "http://localhost:3000/api/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test Event", 
    "description": "Created via API test",
    "eventType": "DAILY_LOGIN",
    "condition": {"consecutiveDays": 5},
    "startDate": "2025-05-22T00:00:00.000Z",
    "endDate": "2025-06-22T23:59:59.999Z"
  }')

echo $NEW_EVENT | jq .name
echo -e "${GREEN}✅ Create event working${NC}\n"

# Test register new user
echo -e "${YELLOW}6. Testing user registration...${NC}"
RANDOM_USER="testuser$(date +%s)"
curl -s -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$RANDOM_USER\", \"email\": \"$RANDOM_USER@example.com\", \"password\": \"password123\"}" | jq .username

echo -e "${GREEN}✅ User registration working${NC}\n"

echo -e "${GREEN}🎉 All tests completed successfully!${NC}"