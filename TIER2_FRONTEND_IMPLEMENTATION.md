# Tier 2 Relationship Suggestions - Frontend Implementation

## 🎨 Overview

This document describes the complete frontend implementation for the Tier 2 relationship suggestion system. The UI allows users to review and manage relationship suggestions (uncle, aunt, niece, nephew) that require user confirmation before being created.

---

## 📁 File Structure

```
client/src/
├── types/index.ts                              # Updated with suggestion types
├── services/api.ts                             # Updated with suggestionAPI
├── pages/
│   └── Suggestions.tsx                         # Main suggestions page
├── components/
│   ├── dashboard/
│   │   └── Dashboard.tsx                       # Updated with Suggestions link
│   └── suggestions/
│       ├── SuggestionCard.tsx                  # Individual suggestion card
│       └── SuggestionBadge.tsx                 # Notification badge
└── App.tsx                                     # Updated with /suggestions route
```

---

## 🔧 Components Created

### 1. **SuggestionCard.tsx**

**Location:** `/client/src/components/suggestions/SuggestionCard.tsx`

**Purpose:** Displays an individual relationship suggestion with accept/dismiss actions.

**Features:**

- ✅ Displays both people's names (firstName + lastName)
- ✅ Shows tier badge (Tier 2/3)
- ✅ Displays relationship type formatted properly
- ✅ Shows reason/explanation for the suggestion
- ✅ Lists both people with gender
- ✅ Accept/Dismiss action buttons with loading states
- ✅ Shows creation date

**Props:**

```typescript
interface SuggestionCardProps {
  suggestion: RelationshipSuggestion;
  onAccept: (id: string) => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
}
```

**Design:**

- TailwindCSS styling with gradient accents
- Hover shadow effects
- Loading state during actions
- Color-coded tier badges (blue for Tier 2, purple for Tier 3)

---

### 2. **SuggestionBadge.tsx**

**Location:** `/client/src/components/suggestions/SuggestionBadge.tsx`

**Purpose:** Shows notification badge with pending suggestion count.

**Features:**

- ✅ Auto-fetches pending count on mount
- ✅ Auto-refreshes every 30 seconds
- ✅ Shows "9+" for counts over 9
- ✅ Hidden when count is 0
- ✅ Red badge with white text

**API Integration:**

- Calls `suggestionAPI.getStats()` to get pending counts
- Sums Tier 2 and Tier 3 pending counts

---

### 3. **Suggestions.tsx (Page)**

**Location:** `/client/src/pages/Suggestions.tsx`

**Purpose:** Main page for viewing and managing all relationship suggestions.

**Features:**

- ✅ Stats dashboard showing Tier 2/3 pending/accepted/dismissed counts
- ✅ Filter tabs: All, Tier 2, Tier 3
- ✅ Bulk Accept/Dismiss all visible suggestions
- ✅ Individual card actions (accept/dismiss)
- ✅ Loading states with spinner
- ✅ Error handling with user-friendly messages
- ✅ Empty state when no suggestions
- ✅ Responsive grid layout

**State Management:**

```typescript
const [suggestions, setSuggestions] = useState<RelationshipSuggestion[]>([]);
const [loading, setLoading] = useState(true);
const [filter, setFilter] = useState<"all" | "tier2" | "tier3">("all");
const [stats, setStats] = useState<SuggestionStatsResponse | null>(null);
const [error, setError] = useState<string | null>(null);
```

**API Integration:**

- `suggestionAPI.getAll()` - Get all suggestions
- `suggestionAPI.getByTier()` - Get suggestions filtered by tier
- `suggestionAPI.getStats()` - Get statistics
- `suggestionAPI.accept(id)` - Accept suggestion
- `suggestionAPI.dismiss(id)` - Dismiss suggestion
- `suggestionAPI.bulkAccept(ids)` - Accept multiple
- `suggestionAPI.bulkDismiss(ids)` - Dismiss multiple

---

## 📊 TypeScript Types Added

**Location:** `/client/src/types/index.ts`

```typescript
// Core suggestion type
export interface RelationshipSuggestion {
  _id: string;
  person1: Person;
  person2: Person;
  relationshipType: string;
  tier: number;
  reason: string;
  triggerRelationships?: string[];
  status: "pending" | "accepted" | "dismissed";
  suggestedTo: string;
  respondedAt?: string;
  createdRelationship?: string;
  createdAt: string;
  updatedAt: string;
}

// API response types
export interface SuggestionsResponse {
  suggestions: RelationshipSuggestion[];
  count: number;
}

export interface SuggestionsByTierResponse {
  tier2: {
    suggestions: RelationshipSuggestion[];
    count: number;
  };
  tier3: {
    suggestions: RelationshipSuggestion[];
    count: number;
  };
  totalCount: number;
}

export interface SuggestionStatsResponse {
  tier2: {
    pending: number;
    accepted: number;
    dismissed: number;
  };
  tier3: {
    pending: number;
    accepted: number;
    dismissed: number;
  };
}
```

---

## 🔌 API Service Methods

**Location:** `/client/src/services/api.ts`

```typescript
export const suggestionAPI = {
  // Get all suggestions (default: pending)
  getAll: (status = "pending") => api.get(`/suggestions?status=${status}`),

  // Get suggestions grouped by tier
  getByTier: (status = "pending") =>
    api.get(`/suggestions/by-tier?status=${status}`),

  // Get statistics summary
  getStats: () => api.get("/suggestions/stats/summary"),

  // Accept a suggestion
  accept: (suggestionId: string) =>
    api.post(`/suggestions/${suggestionId}/accept`),

  // Dismiss a suggestion
  dismiss: (suggestionId: string, reason?: string) =>
    api.post(`/suggestions/${suggestionId}/dismiss`, { reason }),

  // Bulk accept suggestions
  bulkAccept: (suggestionIds: string[]) =>
    api.post("/suggestions/bulk/accept", { suggestionIds }),

  // Bulk dismiss suggestions
  bulkDismiss: (suggestionIds: string[], reason?: string) =>
    api.post("/suggestions/bulk/dismiss", { suggestionIds, reason }),
};
```

---

## 🗺️ Routing Configuration

**Location:** `/client/src/App.tsx`

**Added Route:**

```tsx
<Route
  path="/suggestions"
  element={
    <ProtectedRoute>
      <Suggestions />
    </ProtectedRoute>
  }
/>
```

---

## 🎨 Dashboard Integration

**Location:** `/client/src/components/dashboard/Dashboard.tsx`

**Changes:**

1. **Imported Lightbulb icon** from lucide-react
2. **Imported SuggestionBadge** component
3. **Replaced "Manage Photos" card** with "Suggestions" card:
   - Orange/amber gradient background
   - Lightbulb icon
   - Notification badge showing pending count
   - Links to `/suggestions` route

**Card Code:**

```tsx
<Link
  to="/suggestions"
  className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-8 block hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 hover:bg-white/80 relative"
>
  <div className="flex flex-col items-center text-center">
    <div className="w-20 h-20 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 relative">
      <Lightbulb className="h-10 w-10 text-white" />
      <div className="absolute -top-2 -right-2">
        <SuggestionBadge />
      </div>
    </div>
    <h3 className="text-2xl font-bold text-gray-800 mb-3">Suggestions</h3>
    <p className="text-gray-600 leading-relaxed">
      Review relationship suggestions based on family connections 💡
    </p>
  </div>
</Link>
```

---

## 🎯 User Flow

### 1. **Accessing Suggestions**

- User sees notification badge on Dashboard
- Clicks "Suggestions" card
- Navigates to `/suggestions` route

### 2. **Viewing Suggestions**

- Page loads with statistics at top
- Shows All/Tier 2/Tier 3 filter tabs
- Displays suggestion cards in grid
- Each card shows:
  - People involved
  - Relationship type
  - Reason/explanation
  - Accept/Dismiss buttons

### 3. **Individual Actions**

- **Accept:** Creates relationship, removes from list, updates stats
- **Dismiss:** Marks as dismissed, removes from list, updates stats
- Loading state during API call
- Error handling with alert

### 4. **Bulk Actions**

- "Accept All" button: Confirms with user, processes all visible suggestions
- "Dismiss All" button: Confirms with user, dismisses all visible suggestions
- Refreshes list and stats after completion

### 5. **Filtering**

- Click "All" tab: Shows all pending suggestions
- Click "Tier 2" tab: Shows only Tier 2 suggestions
- Click "Tier 3" tab: Shows only Tier 3 suggestions (when implemented)

---

## 🎨 Design System

### Colors

- **Tier 2 Badge:** `bg-blue-100 text-blue-800`
- **Tier 3 Badge:** `bg-purple-100 text-purple-800`
- **Accept Button:** `bg-green-600 hover:bg-green-700`
- **Dismiss Button:** `bg-red-600 hover:bg-red-700`
- **Notification Badge:** `bg-red-500 text-white`
- **Suggestions Card (Dashboard):** `from-amber-500 to-orange-500`

### Icons (lucide-react)

- **Lightbulb:** Suggestions feature
- **Users:** Family members stat
- **Calendar:** Generations stat
- **Heart:** Recent additions stat
- **TreePine:** Family tree
- **Plus:** Add member
- **UserPlus:** Connections

---

## 🧪 Testing Steps

### 1. **Backend Prerequisites**

- Ensure server is running on port 3001
- Verify suggestions endpoint working:
  ```bash
  curl -H "Authorization: Bearer <token>" http://localhost:3001/api/suggestions
  ```

### 2. **Frontend Testing**

1. Start React dev server: `cd client && npm start`
2. Login to your account
3. Navigate to Dashboard
4. Check if SuggestionBadge appears (if there are pending suggestions)
5. Click "Suggestions" card
6. Verify:
   - Stats load correctly
   - Suggestions display properly
   - Filter tabs work
   - Accept/Dismiss buttons work
   - Bulk actions work
   - Empty state shows when no suggestions

### 3. **Integration Testing**

1. Create test relationships that trigger Tier 2:
   ```bash
   # Example: Add uncle relationship via parent's sibling
   # This should create a Tier 2 suggestion
   ```
2. Check if suggestion appears in UI
3. Accept suggestion
4. Verify relationship created in database
5. Check if suggestion removed from list

---

## 📝 API Endpoints Used

| Endpoint                         | Method | Purpose                                  |
| -------------------------------- | ------ | ---------------------------------------- |
| `/api/suggestions`               | GET    | Get all suggestions (with status filter) |
| `/api/suggestions/by-tier`       | GET    | Get suggestions grouped by tier          |
| `/api/suggestions/stats/summary` | GET    | Get statistics dashboard                 |
| `/api/suggestions/:id/accept`    | POST   | Accept a suggestion                      |
| `/api/suggestions/:id/dismiss`   | POST   | Dismiss a suggestion                     |
| `/api/suggestions/bulk/accept`   | POST   | Bulk accept suggestions                  |
| `/api/suggestions/bulk/dismiss`  | POST   | Bulk dismiss suggestions                 |

---

## 🚀 Next Steps (Future Enhancements)

1. **Tier 3 Implementation**

   - Add cousin relationship detection
   - Add great-grandparent detection
   - Update UI to handle Tier 3 suggestions

2. **Notification System**

   - Real-time notifications when new suggestions arrive
   - Email notifications for pending suggestions

3. **Suggestion Reasoning**

   - Expand reason explanations
   - Show visual family tree path

4. **Advanced Filtering**

   - Filter by relationship type
   - Filter by date range
   - Search suggestions

5. **Undo Feature**
   - Allow undoing dismissed suggestions
   - Allow undoing accepted relationships

---

## ✅ Completion Checklist

- [x] TypeScript types defined
- [x] API service methods created
- [x] SuggestionCard component
- [x] SuggestionBadge component
- [x] Suggestions page component
- [x] Routing configured
- [x] Dashboard integration
- [x] Error handling
- [x] Loading states
- [x] Empty states
- [x] Bulk actions
- [x] Filter functionality
- [x] Stats dashboard
- [x] Responsive design

---

## 🎉 Summary

The Tier 2 frontend implementation is now complete! Users can:

1. ✅ View pending relationship suggestions
2. ✅ See statistics dashboard
3. ✅ Filter by tier (All, Tier 2, Tier 3)
4. ✅ Accept or dismiss individual suggestions
5. ✅ Bulk accept/dismiss multiple suggestions
6. ✅ See notification badge on Dashboard
7. ✅ Navigate to suggestions from Dashboard

**All components are fully functional and integrated with the backend API!** 🚀
