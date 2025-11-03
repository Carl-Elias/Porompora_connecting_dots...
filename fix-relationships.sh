#!/bin/bash

# Porompora - Fix Existing Tier 1 Relationships
# This script will automatically infer missing Tier 1 relationships:
# - Sibling → Parent (if siblings share a parent, both should have that parent)
# - Parent → Grandparent (if someone is a parent, their parents are grandparents)
# - Child → Grandchild (reciprocal of parent → grandparent)

BASE_URL="http://localhost:3001/api"

echo "🔧 Fixing existing Tier 1 relationships in Porompora..."
echo "========================================================="
echo "This will process ALL sibling, parent, and child relationships"
echo "and automatically infer missing grandparent relationships."
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

# Now call the fix endpoint
echo "Step 2: Processing all Tier 1 relationships..."
echo "This may take a moment depending on family tree size..."
FIX_RESPONSE=$(curl -s -X POST "$BASE_URL/relationships/fix-sibling-relationships" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "$FIX_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$FIX_RESPONSE"

echo ""
echo "✅ Done! Please refresh your family tree to see the updated relationships."
echo ""
echo "📊 Summary of processed relationships should be shown above."
