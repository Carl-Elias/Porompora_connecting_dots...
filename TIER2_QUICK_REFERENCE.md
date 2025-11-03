# Tier 2 Frontend - Quick Reference Guide

## 🚀 Quick Start

### 1. Start the Application

```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
cd client
npm start
```

### 2. Access the UI

- Open browser: `http://localhost:3000`
- Login to your account
- Go to Dashboard
- Click "Suggestions" card (orange with lightbulb icon)

---

## 📍 Key Files Created

| File                                                    | Purpose                              |
| ------------------------------------------------------- | ------------------------------------ |
| `client/src/types/index.ts`                             | Added suggestion TypeScript types    |
| `client/src/services/api.ts`                            | Added suggestionAPI methods          |
| `client/src/components/suggestions/SuggestionCard.tsx`  | Individual suggestion card component |
| `client/src/components/suggestions/SuggestionBadge.tsx` | Notification badge component         |
| `client/src/pages/Suggestions.tsx`                      | Main suggestions page                |
| `client/src/App.tsx`                                    | Added `/suggestions` route           |
| `client/src/components/dashboard/Dashboard.tsx`         | Added Suggestions card with badge    |

---

## 🎯 User Journey

```
Dashboard
    ↓
Click "Suggestions" (orange card with 💡)
    ↓
Suggestions Page (/suggestions)
    ├── View Stats (Tier 2/3 pending/accepted/dismissed)
    ├── Filter by Tier (All/Tier 2/Tier 3)
    ├── Accept Individual Suggestion
    ├── Dismiss Individual Suggestion
    ├── Bulk Accept All
    └── Bulk Dismiss All
```

---

## 🔌 API Endpoints Reference

```typescript
// Get all pending suggestions
GET /api/suggestions?status=pending

// Get suggestions by tier
GET /api/suggestions/by-tier?status=pending

// Get statistics
GET /api/suggestions/stats/summary

// Accept suggestion
POST /api/suggestions/:id/accept

// Dismiss suggestion
POST /api/suggestions/:id/dismiss
{
  "reason": "optional reason"
}

// Bulk accept
POST /api/suggestions/bulk/accept
{
  "suggestionIds": ["id1", "id2", ...]
}

// Bulk dismiss
POST /api/suggestions/bulk/dismiss
{
  "suggestionIds": ["id1", "id2", ...],
  "reason": "optional reason"
}
```

---

## 🧪 Test Scenario

### Create a Tier 2 Suggestion (Uncle/Aunt)

1. **Setup:**

   - Login to your account
   - Ensure you have a person (e.g., "Kona")

2. **Create Parent's Sibling:**

   ```
   Step 1: Add Kona's parent (e.g., "Hasan")
   Step 2: Add Hasan's sibling (e.g., "Rahim")

   Result: System suggests "Rahim is Uncle/Aunt of Kona"
   ```

3. **Verify Suggestion:**
   - Go to Dashboard
   - See notification badge on "Suggestions" card
   - Click "Suggestions"
   - Find suggestion: "Rahim & Kona - Uncle/Aunt"
   - Click "Accept"
   - Verify relationship created

---

## 🎨 UI Components

### SuggestionCard

```tsx
<SuggestionCard
  suggestion={suggestion}
  onAccept={handleAccept}
  onDismiss={handleDismiss}
/>
```

**Features:**

- Displays person names
- Shows tier badge
- Shows relationship type
- Shows reason
- Accept/Dismiss buttons
- Loading states

---

### SuggestionBadge

```tsx
<SuggestionBadge />
```

**Features:**

- Auto-updates every 30 seconds
- Shows pending count
- Displays "9+" for large numbers
- Hidden when count is 0

---

### Suggestions Page

```tsx
<Route path="/suggestions" element={<Suggestions />} />
```

**Features:**

- Stats dashboard
- Filter tabs (All/Tier 2/Tier 3)
- Suggestion grid
- Bulk actions
- Loading/error/empty states

---

## 📊 Stats Response Example

```json
{
  "tier2": {
    "pending": 5,
    "accepted": 10,
    "dismissed": 2
  },
  "tier3": {
    "pending": 0,
    "accepted": 0,
    "dismissed": 0
  }
}
```

---

## 🔍 Debugging Tips

### No suggestions showing?

1. Check backend is running: `curl http://localhost:3001/api/suggestions -H "Authorization: Bearer <token>"`
2. Check browser console for errors
3. Verify user is logged in
4. Check if suggestions exist in database:
   ```bash
   mongosh
   use family_tree
   db.relationshipsuggestions.find({ status: "pending" })
   ```

### Badge not showing?

1. Check if there are pending suggestions
2. Check browser console for API errors
3. Verify `suggestionAPI.getStats()` is returning data

### Accept/Dismiss not working?

1. Check browser console for errors
2. Verify API endpoints are accessible
3. Check server logs for errors

---

## ✅ Verification Checklist

- [ ] Backend running on port 3001
- [ ] Frontend running on port 3000
- [ ] Can login successfully
- [ ] Dashboard loads properly
- [ ] "Suggestions" card visible with lightbulb icon
- [ ] Notification badge shows (if suggestions exist)
- [ ] Can navigate to /suggestions page
- [ ] Stats display correctly
- [ ] Filter tabs work
- [ ] Suggestions cards display properly
- [ ] Accept button works
- [ ] Dismiss button works
- [ ] Bulk actions work
- [ ] List refreshes after actions

---

## 🎉 Success Indicators

✅ **Working correctly if:**

1. Suggestions page loads without errors
2. Stats dashboard shows accurate counts
3. Filter tabs change the displayed suggestions
4. Accept creates relationships and removes from list
5. Dismiss removes from list
6. Bulk actions process all suggestions
7. Badge updates in real-time
8. Empty state shows when no suggestions

---

## 📚 Related Documentation

- `TIER2_RELATIONSHIP_SUGGESTIONS.md` - Backend implementation details
- `TIER2_FRONTEND_IMPLEMENTATION.md` - Complete frontend documentation
- `TIER1_RELATIONSHIP_INFERENCE.md` - Tier 1 automatic inference

---

**Happy Testing! 🚀**
