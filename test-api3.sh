#!/bin/bash

# Base configuration
BASE_URL="http://localhost:3000/api"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Nexon Reward System - Complete API Test Suite${NC}"
echo "=================================================="

# =================== AUTHENTICATION ===================
echo -e "\n${YELLOW}🔐 AUTHENTICATION${NC}"

# Register new user
echo "📝 Register new user:"
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "email": "testuser123@example.com",
    "password": "password123"
  }'

echo -e "\n"

# Admin login
echo "🔑 Admin login:"
ADMIN_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' | jq -r .access_token)

curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

echo -e "\n"

# User login
echo "👤 User login:"
USER_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser123", "password": "password123"}' | jq -r .access_token)

curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser123", "password": "password123"}'

echo -e "\n"

# Get current user
echo "ℹ️ Get current user info:"
curl -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

echo -e "\n"

# =================== EVENT MANAGEMENT ===================
echo -e "\n${YELLOW}🎯 EVENT MANAGEMENT${NC}"

# Create event (Admin/Operator)
echo "➕ Create event:"
curl -X POST "$BASE_URL/events" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Festival Event",
    "description": "Complete daily tasks for amazing rewards",
    "eventType": "DAILY_LOGIN",
    "condition": {"consecutiveDays": 5},
    "startDate": "2025-05-22T00:00:00.000Z",
    "endDate": "2025-07-22T23:59:59.999Z",
    "status": "ACTIVE",
    "approvalType": "AUTO"
  }'

echo -e "\n"

# Get all events (Admin/Operator/Auditor)
echo "📋 Get all events:"
curl -X GET "$BASE_URL/events" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

echo -e "\n"

# Get active events (Public)
echo "🔥 Get active events (Public):"
curl -X GET "$BASE_URL/events/active"

echo -e "\n"

# Get event by ID
echo "🔍 Get event by ID:"
EVENT_ID="682ed0a8f5e1c7fc9a524574"  # Replace with actual event ID
curl -X GET "$BASE_URL/events/$EVENT_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

echo -e "\n"

# Update event status
echo "🔄 Update event status:"
curl -X PATCH "$BASE_URL/events/$EVENT_ID/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "ACTIVE"}'

echo -e "\n"

# Check event condition
echo "✅ Check event condition:"
curl -X POST "$BASE_URL/events/$EVENT_ID/check-condition" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

echo -e "\n"

# =================== REWARD MANAGEMENT ===================
echo -e "\n${YELLOW}🎁 REWARD MANAGEMENT${NC}"

# Create reward
echo "➕ Create reward:"
curl -X POST "$BASE_URL/events/rewards" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Gold Package",
    "description": "1000 gold coins + bonus items",
    "type": "CURRENCY",
    "value": 1000,
    "quantity": 1,
    "eventId": "'$EVENT_ID'"
  }'

echo -e "\n"

# Get all rewards
echo "📋 Get all rewards:"
curl -X GET "$BASE_URL/events/rewards" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

echo -e "\n"

# Get rewards by event
echo "🎯 Get rewards by event:"
curl -X GET "$BASE_URL/events/$EVENT_ID/rewards" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

echo -e "\n"

# Get reward by ID
echo "🔍 Get reward by ID:"
REWARD_ID="REWARD_ID_HERE"  # Replace with actual reward ID
curl -X GET "$BASE_URL/events/rewards/$REWARD_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

echo -e "\n"

# Request reward
echo "🙋 Request reward:"
curl -X POST "$BASE_URL/events/rewards/request" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "'$EVENT_ID'",
    "rewardId": "'$REWARD_ID'"
  }'

echo -e "\n"

# Get request status (Note: This endpoint might need to be implemented)
echo "📊 Get request status:"
REQUEST_ID="REQUEST_ID_HERE"  # Replace with actual request ID
curl -X GET "$BASE_URL/events/rewards/request/$REQUEST_ID" \
  -H "Authorization: Bearer $USER_TOKEN"

echo -e "\n"

# Get user requests
echo "📝 Get user requests:"
curl -X GET "$BASE_URL/events/rewards/user/requests" \
  -H "Authorization: Bearer $USER_TOKEN"

echo -e "\n"

# Get user pending rewards
echo "⏳ Get user pending rewards:"
curl -X GET "$BASE_URL/events/rewards/user/pending" \
  -H "Authorization: Bearer $USER_TOKEN"

echo -e "\n"

# Claim reward (Note: This endpoint might need to be implemented)
echo "💰 Claim reward:"
curl -X POST "$BASE_URL/events/rewards/claim/$REQUEST_ID" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

echo -e "\n"

# =================== ADMIN MANAGEMENT ===================
echo -e "\n${YELLOW}⚙️ ADMIN MANAGEMENT${NC}"

# Get all requests
echo "📋 Get all requests (Admin):"
curl -X GET "$BASE_URL/events/rewards/admin/requests" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

echo -e "\n"

# Update request status (Note: This endpoint might need to be implemented)
echo "🔄 Update request status:"
curl -X PATCH "$BASE_URL/events/rewards/admin/request/$REQUEST_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "APPROVED"}'

echo -e "\n"

# =================== ANALYTICS & LOGGING ===================
echo -e "\n${YELLOW}📊 ANALYTICS & LOGGING${NC}"

# Create event log
echo "📝 Create event log:"
curl -X POST "$BASE_URL/events/log" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "DAILY_LOGIN",
    "data": {
      "loginDate": "2025-05-22T12:00:00.000Z",
      "consecutiveDays": 3,
      "deviceInfo": "Mobile App"
    }
  }'

echo -e "\n"

# Get event statistics
echo "📈 Get event statistics:"
curl -X GET "$BASE_URL/events/statistics/events" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

echo -e "\n"

# Get reward statistics
echo "💰 Get reward statistics:"
curl -X GET "$BASE_URL/events/statistics/rewards" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

echo -e "\n"

# =================== HEALTH CHECK ===================
echo -e "\n${YELLOW}🏥 HEALTH CHECK${NC}"

echo "💓 Health check:"
curl -X GET "$BASE_URL/events/health"

echo -e "\n\n${GREEN}✅ All API tests completed!${NC}"