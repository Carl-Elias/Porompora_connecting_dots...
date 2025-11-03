# Tier 1 Relationship Inference - Implementation Documentation

## Overview

Porompora now automatically infers critical family relationships (Tier 1) when relationships are created or accepted. This ensures family tree consistency and reduces manual data entry.

## What is Tier 1?

Tier 1 includes the most obvious and critical family relationships that should always be automatically created:

### 🔹 Sibling → Parent

**Rule:** If A and B are siblings, and A has parent P, then P should also be B's parent.

**Example:**

- Rahim and Kona are siblings
- Hasan is Rahim's parent
- ✅ Automatically creates: Hasan is Kona's parent

### 🔹 Parent → Grandparent

**Rule:** If P is a parent of C, and GP is a parent of P, then GP is a grandparent of C.

**Example:**

- Hasan is Rahim's parent
- Abdullah is Hasan's parent
- ✅ Automatically creates: Abdullah is Rahim's grandparent

**Bidirectional:** Also works the other way - if Hasan already has children when Abdullah is added as parent, Abdullah becomes grandparent to those children.

### 🔹 Child → Grandchild (Reciprocal)

**Rule:** Same as parent → grandparent, but from the child's perspective.

**Example:**

- Rahim is Hasan's child
- Abdullah is Hasan's parent
- ✅ Automatically creates: Rahim is Abdullah's grandchild

## Implementation Details

### Two Code Paths

Relationships can be created in two ways in Porompora:

1. **Direct Relationship API** (`POST /api/relationships`)

   - Implementation: `server/controllers/relationshipController.js`
   - Function: `inferAllTier1Relationships()`

2. **Connection Request Acceptance** (`POST /api/connections/:id/accept`)
   - Implementation: `server/models/ConnectionRequest.js`
   - Function: `inferAllTier1RelationshipsForConnection()`

Both paths have identical logic to ensure consistency.

### Key Functions

#### `inferAllTier1Relationships(relationshipType, person1Id, person2Id, person1, person2, userId)`

Master function that routes to appropriate inference logic based on relationship type:

```javascript
// Called automatically after creating a relationship
if (relationshipType === "sibling") {
  await inferParentChildRelationshipsForSiblings(...);
}
if (relationshipType === "parent") {
  await inferGrandparentRelationships(...);
}
if (relationshipType === "child") {
  await inferGrandparentRelationships(...); // Swapped parameters
}
```

#### `inferParentChildRelationshipsForSiblings()`

Handles sibling → parent inference:

1. Finds all parents of person1
2. Finds all parents of person2
3. For each parent of person1, creates parent → person2 if not exists
4. For each parent of person2, creates parent → person1 if not exists

#### `inferGrandparentRelationships(parentId, childId, parent, child, userId)`

Handles parent → grandparent inference (bidirectional):

1. **Upward:** Finds all parents of the parent → creates grandparent → child
2. **Downward:** Finds all children of the child → creates parent → grandchild

### Execution Flow

```
User adds relationship
         ↓
Direct API or Connection Request?
         ↓
    ┌────────┴────────┐
    ↓                 ↓
Controller      ConnectionRequest
    ↓                 ↓
inferAllTier1Relationships()
    ↓
Check relationship type
    ↓
┌───┴───┬───────┬────────┐
↓       ↓       ↓        ↓
sibling parent child  (others)
↓       ↓       ↓        ↓
inferParent inferGrandparent (skip)
    ↓       ↓
Automatically create missing relationships
    ↓
✅ Complete
```

## How to Use

### For New Relationships

No action needed! When you create or accept any Tier 1 relationship, the system automatically infers related relationships.

### For Existing Relationships (Historical Data)

Run the fix script to process all existing relationships:

```bash
chmod +x fix-relationships.sh
./fix-relationships.sh
```

The script will:

1. Prompt for your login credentials
2. Process all existing sibling, parent, and child relationships
3. Create any missing Tier 1 inferred relationships
4. Show summary of processed relationships

## Testing

### Test Case 1: Sibling → Parent

1. Add Hasan as Rahim's parent ✅
2. Add Kona as Rahim's sibling ✅
3. **Expected:** Hasan automatically becomes Kona's parent ✅

### Test Case 2: Parent → Grandparent

1. Add Hasan as Rahim's parent ✅
2. Add Abdullah as Hasan's parent ✅
3. **Expected:** Abdullah automatically becomes Rahim's grandparent ✅

### Test Case 3: Existing Children

1. Hasan already has children: Rahim, Kona
2. Add Abdullah as Hasan's parent ✅
3. **Expected:** Abdullah becomes grandparent to both Rahim AND Kona ✅

## Console Logs

The system provides detailed logging for debugging:

```
🔗 Starting Tier 1 inference for parent relationship between Hasan and Rahim
👴 Inferring grandparent relationships: Hasan (parent) → Rahim (child)
✨ Creating grandparent relationship: Abdullah (grandparent) → Rahim (grandchild)
✅ Created grandparent relationship: Abdullah → Rahim
✅ Tier 1 inference completed successfully
```

## Database Impact

### Before Tier 1 Implementation

```
Relationships:
1. Hasan → Rahim (parent)
2. Rahim → Kona (sibling)

Total: 2 relationships
Missing: Hasan → Kona ❌
```

### After Tier 1 Implementation

```
Relationships:
1. Hasan → Rahim (parent)
2. Rahim → Kona (sibling)
3. Hasan → Kona (parent) ✅ Automatically created

Total: 3 relationships
Consistency: ✅ Complete
```

## Future Tiers

### Tier 2 (Planned - User Confirmation Required)

- Uncle/Aunt (parent's sibling)
- Niece/Nephew (sibling's child)

These will show as **suggestions** or **notifications** that the user must confirm.

### Tier 3 (Planned - Suggestions Only)

- Cousins (parent's sibling's children)
- Great-grandparents
- In-laws

These will appear in an **exploration/discovery** system for the user to review and add manually.

## Error Handling

The system includes comprehensive error handling:

- All inference functions are wrapped in try/catch
- Errors are logged but don't fail the main operation
- Existing relationships are never duplicated (checked before creation)
- Console logs show detailed progress for debugging

## Performance Considerations

- Inference happens asynchronously after relationship creation
- Each inference function queries only relevant relationships
- Duplicate checks prevent redundant database writes
- Logging can be disabled in production if needed

## API Endpoints

### Create Relationship (with automatic Tier 1)

```http
POST /api/relationships
Authorization: Bearer <token>
Content-Type: application/json

{
  "person1Id": "...",
  "person2Id": "...",
  "relationshipType": "parent"
}
```

### Accept Connection Request (with automatic Tier 1)

```http
POST /api/connections/:requestId/accept
Authorization: Bearer <token>
```

### Fix Existing Relationships

```http
POST /api/relationships/fix-sibling-relationships
Authorization: Bearer <token>
```

## Verification

To verify Tier 1 is working:

1. Check server logs for inference messages (🔗, 👴, ✨, ✅)
2. Use the fix script and check the summary
3. View family tree and confirm all expected relationships appear
4. Test with new relationships and verify automatic inference

## Troubleshooting

### Relationships not being created?

1. Check server logs for error messages
2. Verify server restarted after code changes (`nodemon` should auto-restart)
3. Run fix script to process existing relationships
4. Check that both persons belong to the authenticated user

### Duplicate relationships?

The system checks for existing relationships before creating new ones. If duplicates appear:

1. Check database for duplicate entries
2. Clear cache/restart server
3. Contact developer with logs

## Status

✅ **Implemented:** Tier 1 automatic inference  
🔨 **In Progress:** Testing and validation  
⏳ **Planned:** Tier 2 and Tier 3 inference

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Author:** Porompora Development Team
