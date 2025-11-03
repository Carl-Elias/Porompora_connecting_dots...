#!/bin/bash

# Porompora - Test Tier 2 Suggestions
# This script tests the Tier 2 relationship suggestion system

BASE_URL="http://localhost:3001/api"

echo "🧪 Testing Tier 2 Relationship Suggestions"
echo "=========================================="
echo ""

# First, login to get a token
echo "Step 1: Logging in..."
echo "Enter your email:"
read EMAIL

echo "Enter your password:"
read -s PASSWORD
echo ""

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Login failed. Please check your credentials."
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful!"
echo ""

# Get all pending suggestions
echo "Step 2: Fetching all pending suggestions..."
echo ""
SUGGESTIONS=$(curl -s -X GET "$BASE_URL/suggestions" \
  -H "Authorization: Bearer $TOKEN")

echo "📋 All Pending Suggestions:"
echo "$SUGGESTIONS" | python3 -m json.tool 2>/dev/null || echo "$SUGGESTIONS"
echo ""

# Get suggestions by tier
echo "Step 3: Fetching suggestions by tier..."
echo ""
BY_TIER=$(curl -s -X GET "$BASE_URL/suggestions/by-tier" \
  -H "Authorization: Bearer $TOKEN")

echo "📊 Suggestions by Tier:"
echo "$BY_TIER" | python3 -m json.tool 2>/dev/null || echo "$BY_TIER"
echo ""

# Get statistics
echo "Step 4: Fetching suggestion statistics..."
echo ""
STATS=$(curl -s -X GET "$BASE_URL/suggestions/stats/summary" \
  -H "Authorization: Bearer $TOKEN")

echo "📈 Statistics:"
echo "$STATS" | python3 -m json.tool 2>/dev/null || echo "$STATS"
echo ""

echo "✅ Done! If you see suggestions above, Tier 2 is working!"
echo ""
echo "💡 To accept a suggestion, use:"
echo "   curl -X POST -H \"Authorization: Bearer \$TOKEN\" \\"
echo "     $BASE_URL/suggestions/<suggestion-id>/accept"
echo ""
echo "💡 To dismiss a suggestion, use:"
echo "   curl -X POST -H \"Authorization: Bearer \$TOKEN\" \\"
echo "     $BASE_URL/suggestions/<suggestion-id>/dismiss"
