#!/bin/bash

# Test Automatic Sibling Relationship Inference
echo "🧪 Testing Automatic Parent Inference for Siblings"
echo "=================================================="
echo ""

BASE_URL="http://localhost:3001/api"

# Login
echo "Step 1: Logging in as Hasan..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hasan@gmail.com",
    "password": "hasan123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Login failed. Please check credentials."
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful!"
echo ""

# Get all family members to find IDs
echo "Step 2: Getting family members..."
MEMBERS_RESPONSE=$(curl -s -X GET "$BASE_URL/family/members" \
  -H "Authorization: Bearer $TOKEN")

echo "Family members:"
echo "$MEMBERS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$MEMBERS_RESPONSE"
echo ""

# You'll need to manually add the person IDs here after seeing the response
echo "📝 To test the automatic inference:"
echo "1. Note the IDs of two people who should be siblings (e.g., Kona and someone new)"
echo "2. Make sure one of them already has Hasan as parent"
echo "3. Then create a sibling relationship between them"
echo ""
echo "4. Check if the other person automatically gets Hasan as parent!"
echo ""
echo "Use this command template:"
echo 'curl -X POST "'$BASE_URL'/relationships" \'
echo '  -H "Content-Type: application/json" \'
echo '  -H "Authorization: Bearer '$TOKEN'" \'
echo '  -d '"'"'{'
echo '    "person1Id": "PERSON1_ID_HERE",'
echo '    "person2Id": "PERSON2_ID_HERE",'
echo '    "relationshipType": "sibling"'
echo '  }'"'"
echo ""
echo "Token for manual testing: $TOKEN"
