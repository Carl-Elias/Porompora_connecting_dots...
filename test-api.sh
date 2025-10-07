#!/bin/bash

# Family Tree API Test Script
echo "🧪 Testing Porompora Family Tree APIs"
echo "======================================="

# Set base URL
BASE_URL="http://localhost:3001/api"
EMAIL="testuser@example.com"
PASSWORD="password123"

echo "1. Testing Health Check..."
curl -s "$BASE_URL/health"
echo -e "\n"

echo "2. Testing User Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe", 
    "email": "'$EMAIL'",
    "password": "'$PASSWORD'",
    "dateOfBirth": "1990-01-01",
    "gender": "male"
  }')

echo $REGISTER_RESPONSE
echo -e "\n"

echo "3. Testing User Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$EMAIL'",
    "password": "'$PASSWORD'"
  }')

echo $LOGIN_RESPONSE
echo -e "\n"

# Extract token from login response (simplified without jq)
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Token: $TOKEN"
echo -e "\n"

if [ ! -z "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
  echo "4. Testing Add Family Member..."
  MEMBER_RESPONSE=$(curl -s -X POST "$BASE_URL/family/members" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "firstName": "Jane",
      "lastName": "Doe",
      "gender": "female",
      "dateOfBirth": "1995-05-15",
      "birthPlace": "New York, USA",
      "occupation": "Teacher"
    }')
  
  echo $MEMBER_RESPONSE
  echo -e "\n"

  echo "5. Testing Get Family Members..."
  curl -s -X GET "$BASE_URL/family/members" \
    -H "Authorization: Bearer $TOKEN"
  echo -e "\n"

  echo "6. Testing Get Family Tree..."
  curl -s -X GET "$BASE_URL/relationships/tree" \
    -H "Authorization: Bearer $TOKEN"
  echo -e "\n"
else
  echo "❌ Login failed, cannot test authenticated endpoints"
fi

echo "🎉 Test completed!"