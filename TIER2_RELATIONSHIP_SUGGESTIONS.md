# Tier 2 Relationship Suggestions - Implementation Documentation

## Overview

Porompora's Tier 2 system automatically **detects** potential uncle/aunt and niece/nephew relationships but **requires user confirmation** before creating them. This strikes a balance between automation and user control.

## What is Tier 2?

Tier 2 includes relationships that are highly probable but should have user confirmation:

### 🔔 Uncle/Aunt (Parent's Sibling)

**Rule:** If P is your parent, and U is P's sibling, then U is probably your uncle/aunt.

**Example:**

- Hasan is Rahim's parent
- Kona is Hasan's sibling
- 💡 **System suggests:** "Kona might be Rahim's aunt. Add this relationship?"
- ✅ User confirms or dismisses

### 🔔 Niece/Nephew (Sibling's Child)

**Rule:** If S is your sibling, and C is S's child, then C is probably your niece/nephew.

**Example:**

- Rahim and Kona are siblings
- Kabul is Kona's child
- 💡 **System suggests:** "Kabul might be Rahim's nephew. Add this relationship?"
- ✅ User confirms or dismisses

## Key Differences from Tier 1

| Feature           | Tier 1                              | Tier 2                                 |
| ----------------- | ----------------------------------- | -------------------------------------- |
| **Automation**    | Fully automatic                     | Requires confirmation                  |
| **Relationships** | Parent, Child, Sibling, Grandparent | Uncle, Aunt, Niece, Nephew             |
| **User Action**   | None needed                         | Must accept or dismiss                 |
| **Storage**       | Direct in Relationship model        | Stored as RelationshipSuggestion first |
| **Reversibility** | Manual deletion only                | Can be dismissed before creation       |

## Database Schema

### RelationshipSuggestion Model

```javascript
{
  person1: ObjectId,           // First person
  person2: ObjectId,           // Second person
  relationshipType: String,    // "uncle", "aunt", "nephew", "niece"
  tier: Number,                // 2 or 3
  reason: String,              // Explanation of why suggested
  triggerRelationships: [ObjectId], // Relationships that led to this suggestion
  status: String,              // "pending", "accepted", "dismissed"
  suggestedTo: ObjectId,       // User who receives the suggestion
  respondedAt: Date,           // When user responded
  createdRelationship: ObjectId, // If accepted, the created relationship
  createdAt: Date,
  updatedAt: Date
}
```

## How It Works

### Detection Flow

```
User adds relationship (e.g., sibling)
         ↓
Tier 1 auto-creates (parent, grandparent)
         ↓
Tier 2 detection starts
         ↓
    ┌────────┴────────┐
    ↓                 ↓
Find potential    Check existing
relationships     relationships
    ↓                 ↓
    └────────┬────────┘
             ↓
Create RelationshipSuggestion
         ↓
Store with status="pending"
         ↓
✅ Done (waiting for user)
```

### User Interaction Flow

```
User opens notifications/suggestions
         ↓
GET /api/suggestions
         ↓
Display list of pending suggestions
         ↓
User clicks "Accept" or "Dismiss"
         ↓
POST /api/suggestions/:id/accept
  or
POST /api/suggestions/:id/dismiss
         ↓
If accepted:
  - Create Relationship
  - Mark suggestion as "accepted"
  - Link to created relationship
         ↓
If dismissed:
  - Mark suggestion as "dismissed"
  - No relationship created
         ↓
✅ Done
```

## API Endpoints

### Get All Pending Suggestions

```http
GET /api/suggestions
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "_id": "...",
        "person1": { "firstName": "Kona", ... },
        "person2": { "firstName": "Kabul", ... },
        "relationshipType": "aunt",
        "tier": 2,
        "reason": "Kona is sibling of Rahim, who is parent of Kabul",
        "status": "pending",
        "createdAt": "..."
      }
    ],
    "count": 5
  }
}
```

### Get Suggestions by Tier

```http
GET /api/suggestions/by-tier
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "tier2": {
      "suggestions": [...],
      "count": 3
    },
    "tier3": {
      "suggestions": [...],
      "count": 2
    },
    "totalCount": 5
  }
}
```

### Accept a Suggestion

```http
POST /api/suggestions/:suggestionId/accept
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Suggestion accepted and relationship created",
  "data": {
    "relationship": { ... },
    "suggestion": { "status": "accepted", ... }
  }
}
```

### Dismiss a Suggestion

```http
POST /api/suggestions/:suggestionId/dismiss
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Suggestion dismissed",
  "data": {
    "suggestion": { "status": "dismissed", ... }
  }
}
```

### Bulk Accept

```http
POST /api/suggestions/bulk/accept
Authorization: Bearer <token>
Content-Type: application/json

{
  "suggestionIds": ["id1", "id2", "id3"]
}

Response:
{
  "success": true,
  "message": "Accepted 2 suggestions, 1 failed",
  "data": {
    "accepted": [
      { "suggestionId": "id1", "relationshipId": "..." },
      { "suggestionId": "id2", "relationshipId": "..." }
    ],
    "failed": [
      { "suggestionId": "id3", "reason": "Not found" }
    ]
  }
}
```

### Get Statistics

```http
GET /api/suggestions/stats/summary
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "tier2": {
      "pending": 5,
      "accepted": 12,
      "dismissed": 3
    },
    "tier3": {
      "pending": 2,
      "accepted": 8,
      "dismissed": 1
    }
  }
}
```

## Detection Logic

### When Sibling Relationship is Created

```javascript
// Example: Rahim and Kona become siblings
// Rahim has children: Kabul, Sami
// Kona has children: Rubayat

Suggestions created:
1. Kona (aunt) ↔ Kabul (nephew)
2. Kona (aunt) ↔ Sami (nephew)
3. Rahim (uncle) ↔ Rubayat (nephew)
```

### When Parent Relationship is Created

```javascript
// Example: Hasan added as Rahim's parent
// Hasan has siblings: Kona, Sami
// Rahim has children: Kabul

Suggestions created:
1. Kona (aunt) ↔ Rahim (nephew)
2. Sami (uncle) ↔ Rahim (nephew)
3. Kabul (nephew) ↔ Kona (aunt)
4. Kabul (nephew) ↔ Sami (uncle)
```

## Implementation Files

### Backend

1. **Model:** `/server/models/RelationshipSuggestion.js`

   - Database schema
   - `accept()` method - creates relationship
   - `dismiss()` method - marks as dismissed

2. **Controller:** `/server/controllers/relationshipController.js`

   - `detectAndSuggestTier2Relationships()` - Main detection
   - `suggestUncleAuntRelationships()` - Sibling → uncle/aunt
   - `suggestUncleAuntFromParentSiblings()` - Parent's sibling → uncle/aunt
   - `suggestNieceNephewRelationships()` - Child → niece/nephew
   - `createSuggestion()` - Helper to create suggestions

3. **Connection Model:** `/server/models/ConnectionRequest.js`

   - `detectAndSuggestTier2RelationshipsForConnection()` - Same logic for connection requests
   - Helper functions for connection-based suggestions

4. **Routes:** `/server/routes/suggestions.js`

   - All API endpoints for managing suggestions

5. **Server:** `/server/index.js`
   - Route registration: `app.use("/api/suggestions", ...)`

### Frontend (To Be Implemented)

Recommended UI components:

1. **Notification Badge**

   - Show count of pending Tier 2 suggestions
   - Red badge on navigation/header

2. **Suggestions Panel**

   - List of all pending suggestions
   - Group by Tier 2 and Tier 3
   - Accept/Dismiss buttons

3. **Suggestion Card**

   ```
   ┌────────────────────────────────────┐
   │ 💡 New Relationship Suggestion     │
   ├────────────────────────────────────┤
   │ Kona Khatun                        │
   │ might be aunt of                   │
   │ Kabul Kawsar                       │
   │                                    │
   │ Reason: Kona is sibling of Rahim, │
   │ who is parent of Kabul             │
   │                                    │
   │  [✓ Accept]  [✗ Dismiss]          │
   └────────────────────────────────────┘
   ```

4. **Bulk Actions**
   - "Accept All" button
   - "Dismiss All" button
   - Checkboxes for selective bulk actions

## Console Logs

The system provides detailed logging:

```
🔔 Checking for Tier 2 suggestions: sibling between Rahim and Kona
💡 Created Tier 2 suggestion: Kona (aunt) ↔ Kabul (nephew)
💡 Created Tier 2 suggestion: Rahim (uncle) ↔ Rubayat (niece)
✅ Tier 2 suggestion check completed
```

## Testing

### Test Case 1: Sibling → Uncle/Aunt

**Setup:**

1. Hasan has two children: Rahim, Kona
2. Rahim has a child: Kabul

**Action:**

- Add Kona as Rahim's sibling (if not already)

**Expected:**

- Tier 1: Hasan automatically becomes Kona's parent ✅
- Tier 2: System suggests Kona as Kabul's aunt 💡
- Check: `GET /api/suggestions` should show 1 pending suggestion

**Verify:**

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/suggestions
```

### Test Case 2: Accept Suggestion

**Action:**

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/suggestions/<suggestionId>/accept
```

**Expected:**

- Suggestion status changes to "accepted"
- New relationship created: Kona ↔ Kabul (aunt-nephew)
- Visible in family tree

### Test Case 3: Dismiss Suggestion

**Action:**

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/suggestions/<suggestionId>/dismiss
```

**Expected:**

- Suggestion status changes to "dismissed"
- No relationship created
- Suggestion doesn't appear in pending list

## Error Handling

The system prevents:

- ❌ Duplicate suggestions (checks before creating)
- ❌ Suggesting relationships that already exist
- ❌ Accepting already-processed suggestions
- ❌ Creating invalid relationships

All errors are logged but don't fail the main operation.

## Performance Considerations

- Suggestions are created asynchronously (non-blocking)
- Database queries use indexes on `suggestedTo` and `status`
- Bulk operations process suggestions in sequence
- Dismissed suggestions stay in database for analytics

## Future Enhancements

### Tier 3 (Planned)

- Cousins (parent's sibling's children)
- Great-grandparents
- In-laws
- Second cousins

### Smart Suggestions

- Machine learning to predict which suggestions users accept
- Priority scoring based on family tree completeness
- Auto-dismiss unlikely suggestions after X days

### Notifications

- Real-time notifications when new suggestions appear
- Email digest of pending suggestions
- Push notifications on mobile

## Status

✅ **Implemented:**

- Database model (RelationshipSuggestion)
- Backend detection logic (Tier 2)
- API endpoints (full CRUD)
- Both code paths (direct API + connection requests)
- Bulk operations
- Statistics

🔨 **In Progress:**

- Testing with real data

⏳ **Pending:**

- Frontend UI components
- Notification system
- Tier 3 implementation

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Author:** Porompora Development Team
