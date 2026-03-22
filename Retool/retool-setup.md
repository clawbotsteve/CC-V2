# TaviraLabs Admin Dashboard - Retool Setup Guide

Complete step-by-step instructions to build the internal admin dashboard in Retool.

---

## Section 1: REST API Resource Setup

1. Go to **Retool > Resources > Create New > REST API**
2. Configure:

| Field | Value |
|---|---|
| **Name** | `TaviraLabs Admin API` |
| **Base URL** | `https://taviralabsai.com/api/webhook/dashboard` |
| **Headers** | `Authorization` = `Bearer yebeud7dnj3nu3immmms` |
| | `Content-Type` = `application/json` |

3. Click **Save**.

---

## Section 2: Queries (13 Total)

Every query uses:
- **Resource**: `TaviraLabs Admin API`
- **Method**: `POST`
- **Body type**: JSON

---

### Query 1: `getUsers`

| Field | Value |
|---|---|
| **Endpoint** | `/users` |
| **Body** | See below |

```json
{
  "page": {{ usersTable.paginationIndex ?? 1 }},
  "pageSize": 25,
  "search": {{ JSON.stringify(searchInput.value || "") }},
  "planFilter": {{ JSON.stringify(planFilterSelect.value || null) }},
  "statusFilter": {{ JSON.stringify(statusFilterSelect.value || null) }},
  "sortBy": {{ JSON.stringify(usersTable.sortedColumn || "createdAt") }},
  "sortOrder": {{ JSON.stringify(usersTable.sortedDesc ? "desc" : "asc") }}
}
```

**Response shape:**
```
{
  users: [
    {
      id, userId, name, email, imageUrl, isActive, isBanned,
      lastActiveAt, lastLoginAt, totalLogins, createdAt,
      subscription: { planTier, planName, price, period, status, currentPeriodEnd } | null,
      credits: { available, used, monthlyRemaining, avatarSlots, avatarSlotsUsed } | null
    }
  ],
  pagination: { page, pageSize, total, totalPages }
}
```

**Settings:**
- Run on page load: **Yes**
- Pagination: Enable server-side pagination on the table, mapping `pagination.total` and `pagination.totalPages`.

---

### Query 2: `findUserByEmail`

| Field | Value |
|---|---|
| **Endpoint** | `/user/find` |
| **Body** | See below |

```json
{
  "email": {{ JSON.stringify(emailSearchInput.value) }}
}
```

**Response shape:**
```
{ userId: "user_xxx" }
```

**Settings:**
- Run on page load: **No**
- Trigger manually from a button.

---

### Query 3: `getUserDetail`

| Field | Value |
|---|---|
| **Endpoint** | `/user/detail` |
| **Body** | See below |

```json
{
  "userId": {{ JSON.stringify(usersTable.selectedRow.data.userId) }}
}
```

**Response shape:**
```
{
  user: {
    userId, name, email, imageUrl, isActive, isBanned, createdAt, lastActiveAt,
    subscription: { planTier, planName, price, period, creditsPerMonth, maxAvatarCount, status, currentPeriodEnd, phyziroSubscriptionId } | null,
    credits: { available, used, monthlyRemaining, avatarSlots, avatarSlotsUsed } | null
  },
  generationCounts: { images, videos, upscales, faceSwaps, faceEnhances, imageEdits, imageAnalyses, total },
  totalCreditsSpent,
  recentImages: [{ id, imageUrl, prompt, status, variant, creditUsed, createdAt }],
  recentVideos: [{ id, videoUrl, prompt, model, status, variant, creditUsed, createdAt }],
  influencers: [{ id, name, status, avatarImageUrl, isActive, createdAt }],
  transactions: [{ ... }]
}
```

**Settings:**
- Run on page load: **No**
- Trigger: Add an event handler on `usersTable` row click to run `getUserDetail`.

---

### Query 4: `banUnbanUser`

| Field | Value |
|---|---|
| **Endpoint** | `/user/ban` |
| **Body** | See below |

```json
{
  "userId": {{ JSON.stringify(usersTable.selectedRow.data.userId) }},
  "banned": {{ !getUserDetail.data.user.isBanned }},
  "adminUserId": "retool-admin"
}
```

**Settings:**
- Run on page load: **No**
- Requires confirmation: **Yes** (set Confirmation Message to `Are you sure you want to {{ getUserDetail.data.user.isBanned ? "unban" : "ban" }} this user?`)
- On success: Run `getUserDetail`, then `getUsers`.

---

### Query 5: `setCredits`

| Field | Value |
|---|---|
| **Endpoint** | `/user/set-credits` |
| **Body** | See below |

```json
{
  "userId": {{ JSON.stringify(usersTable.selectedRow.data.userId) }},
  "availableCredit": {{ setAvailableCreditInput.value }},
  "monthlyRemainingCredits": {{ setMonthlyCreditsInput.value }},
  "availableAvatarSlot": {{ setAvatarSlotsInput.value }},
  "adminUserId": "retool-admin"
}
```

**Response shape:**
```
{
  message: "Credits updated",
  before: { availableCredit, monthlyRemainingCredits, availableAvatarSlot },
  after: { availableCredit, monthlyRemainingCredits, availableAvatarSlot }
}
```

**Settings:**
- Run on page load: **No**
- Requires confirmation: **Yes**
- On success: Run `getUserDetail`.

---

### Query 6: `changePlan`

| Field | Value |
|---|---|
| **Endpoint** | `/user/change-plan` |
| **Body** | See below |

```json
{
  "userId": {{ JSON.stringify(usersTable.selectedRow.data.userId) }},
  "planTier": {{ JSON.stringify(changePlanSelect.value) }},
  "adminUserId": "retool-admin"
}
```

**Valid plan tiers for the dropdown:**

| Value | Label |
|---|---|
| `plan_free` | Free |
| `plan_basic` | Starter (Monthly) |
| `plan_pro` | Creator (Monthly) |
| `plan_elite` | Studio (Monthly) |
| `plan_basic_3month` | Starter (Quarterly) |
| `plan_pro_3month` | Creator (Quarterly) |
| `plan_elite_3month` | Studio (Quarterly) |

**Settings:**
- Run on page load: **No**
- Requires confirmation: **Yes**
- On success: Run `getUserDetail`, then `getUsers`.

---

### Query 7: `addCredits`

| Field | Value |
|---|---|
| **Endpoint** | `/user/update` |
| **Body** | See below |

```json
{
  "userId": {{ JSON.stringify(usersTable.selectedRow.data.userId) }},
  "creditIncrease": {{ addCreditsInput.value || 0 }},
  "loraIncrease": {{ addLoraInput.value || 0 }},
  "adminUserId": "retool-admin"
}
```

**Response shape:**
```
{ message: "User limits updated", updatedLimit: { ... } }
```

**Settings:**
- Run on page load: **No**
- Requires confirmation: **Yes**
- On success: Run `getUserDetail`.

---

### Query 8: `getDailyStats`

| Field | Value |
|---|---|
| **Endpoint** | `/daily` |
| **Body** | See below |

```json
{
  "filter": {{ JSON.stringify(periodFilterSelect.value || "last-7-days") }}
}
```

**Period filter dropdown values:**

| Value | Label |
|---|---|
| `daily` | Today |
| `yesterday` | Yesterday |
| `last-3-days` | Last 3 Days |
| `last-7-days` | Last 7 Days |
| `last-15-days` | Last 15 Days |
| `last-month` | Last Month |
| `last-3-months` | Last 3 Months |

**Response shape:**
```
{
  filter,
  range: { currentStart, currentEnd, previousStart, previousEnd },
  usersSignedUp: { current, previous, change },
  subscriptions: {
    basic: { current, previous, change },
    pro: { current, previous, change },
    elite: { current, previous, change }
  },
  tools: {
    loraPurchase: { current, previous, change },
    generatedImage: { current, previous, change },
    generatedVideo: { current, previous, change },
    upscaled: { current, previous, change },
    faceSwap: { current, previous, change },
    faceEnhance: { current, previous, change },
    imageEdit: { current, previous, change },
    imageAnalysis: { current, previous, change },
    influencer: { current, previous, change }
  }
}
```

**Settings:**
- Run on page load: **Yes**

---

### Query 9: `getTotals`

| Field | Value |
|---|---|
| **Endpoint** | `/total` |
| **Body** | `{}` |

**Response shape:**
```
{
  usersSignedUp, basicUsers, proUsers, eliteUsers,
  loraPurchases, imageGenerations, videoGenerations,
  upscales, faceSwaps, imageEdits, imageAnalyses, loraTrainings
}
```

**Settings:**
- Run on page load: **Yes**

---

### Query 10: `getAnalytics`

| Field | Value |
|---|---|
| **Endpoint** | `/analytics` |
| **Body** | `{}` |

**Response shape:**
```
{
  growthRate: "12.50",      // string
  churnRate: "3.20",        // string
  mrr: "4500.00",           // string
  arr: "54000.00",          // string
  topPlans: [{ planId, count, name }],
  cohortCounts: { "2026-1": 50, "2026-2": 75, ... },
  dailyTrend: [{ date: "2026-03-01", signUps: 5, subscriptions: 2 }]
}
```

**Settings:**
- Run on page load: **Yes**

---

### Query 11: `getGenerations`

| Field | Value |
|---|---|
| **Endpoint** | `/generations` |
| **Body** | See below |

```json
{
  "granularity": {{ JSON.stringify(granularitySelect.value || "daily") }},
  "days": {{ daysInput.value || 30 }}
}
```

**Granularity dropdown values:** `daily`, `weekly`, `monthly`

**Response shape:**
```
{
  granularity, days, rangeStart, rangeEnd,
  summary: {
    totalGenerations, totalCreditsUsed, completed, failed,
    byType: { images, videos, upscales, faceSwaps, faceEnhances, imageEdits, imageAnalyses }
  },
  videoBreakdown: { "kling-v2": 50, "runway-gen3": 30, ... },
  timeline: [
    {
      label: "2026-03-01",
      images, videos, upscales, faceSwaps, faceEnhances, imageEdits, imageAnalyses,
      total, creditsUsed, completed, failed
    }
  ]
}
```

**Settings:**
- Run on page load: **Yes**

---

### Query 12: `getAuditLog`

| Field | Value |
|---|---|
| **Endpoint** | `/audit` |
| **Body** | See below |

```json
{
  "page": {{ auditTable.paginationIndex ?? 1 }},
  "pageSize": 50,
  "action": {{ JSON.stringify(auditActionFilter.value || null) }},
  "targetUserId": {{ JSON.stringify(auditUserIdFilter.value || null) }}
}
```

**Known action values for the filter dropdown:**
- `ban_user`
- `unban_user`
- `set_credits`
- `credit_adjustment`
- `plan_change`

**Response shape:**
```
{
  logs: [{ id, adminUserId, action, targetUserId, details, createdAt }],
  pagination: { page, pageSize, total, totalPages }
}
```

**Settings:**
- Run on page load: **Yes**
- Enable server-side pagination on the table.

---

### Query 13: `updateToolCosts`

| Field | Value |
|---|---|
| **Endpoint** | `/toolcost/update` |
| **Body** | See below |

```json
{
  "toolUpdate": {{ toolCostTable.changesetArray }}
}
```

Each item in the array must have `{ "id": "xxx", "creditCost": 1.5 }`.

**Response shape:**
```
{ message: "Bulk update complete", results: [{ id, success, updated? }] }
```

**Settings:**
- Run on page load: **No**
- Requires confirmation: **Yes**
- Trigger from a "Save Changes" button.

---

## Section 3: Dashboard Layout

### Page 1: Overview Dashboard

Create a new Retool app page named **"Overview"**.

#### Row 1: Period Filter + All-Time Totals

1. **periodFilterSelect** (Select component)
   - Values: `daily`, `yesterday`, `last-3-days`, `last-7-days`, `last-15-days`, `last-month`, `last-3-months`
   - Labels: Today, Yesterday, Last 3 Days, Last 7 Days, Last 15 Days, Last Month, Last 3 Months
   - Default: `last-7-days`
   - On change: Run `getDailyStats`

2. **Statistic components** (4 across, using data from `getTotals`):

| Component | Label | Value | Suffix |
|---|---|---|---|
| `statTotalUsers` | Total Users | `{{ getTotals.data.usersSignedUp }}` | |
| `statMRR` | MRR | `${{ parseFloat(getAnalytics.data.mrr).toLocaleString() }}` | |
| `statARR` | ARR | `${{ parseFloat(getAnalytics.data.arr).toLocaleString() }}` | |
| `statChurn` | Churn Rate | `{{ getAnalytics.data.churnRate }}` | `%` |

#### Row 2: Period Stat Cards (from `getDailyStats`)

Use **Statistic** components. Each shows current value, previous value, and % change.

| Component | Label | Value | Change |
|---|---|---|---|
| `statSignups` | New Signups | `{{ getDailyStats.data.usersSignedUp.current }}` | `{{ getDailyStats.data.usersSignedUp.change }}` |
| `statBasic` | Starter Subs | `{{ getDailyStats.data.subscriptions.basic.current }}` | `{{ getDailyStats.data.subscriptions.basic.change }}` |
| `statPro` | Creator Subs | `{{ getDailyStats.data.subscriptions.pro.current }}` | `{{ getDailyStats.data.subscriptions.pro.change }}` |
| `statElite` | Studio Subs | `{{ getDailyStats.data.subscriptions.elite.current }}` | `{{ getDailyStats.data.subscriptions.elite.change }}` |

For the change indicator, use conditional formatting:
- Positive: green, show up arrow
- Negative: red, show down arrow
- Null: gray, show dash

Tooltip/secondary text: `{{ getDailyStats.data.usersSignedUp.previous }} in previous period`

#### Row 3: Tool Usage Cards (from `getDailyStats`)

Same pattern as Row 2, one Statistic per tool:

| Label | Data Path |
|---|---|
| Images | `getDailyStats.data.tools.generatedImage` |
| Videos | `getDailyStats.data.tools.generatedVideo` |
| Upscales | `getDailyStats.data.tools.upscaled` |
| Face Swaps | `getDailyStats.data.tools.faceSwap` |
| Face Enhance | `getDailyStats.data.tools.faceEnhance` |
| Image Edits | `getDailyStats.data.tools.imageEdit` |
| Image Analysis | `getDailyStats.data.tools.imageAnalysis` |
| Avatar Training | `getDailyStats.data.tools.influencer` |
| LoRA Purchases | `getDailyStats.data.tools.loraPurchase` |

#### Row 4: Generation Timeline Chart

1. **granularitySelect** (Select): values `daily`, `weekly`, `monthly`. Default `daily`. On change: run `getGenerations`.
2. **daysInput** (Number Input): default 30. On change: run `getGenerations`.
3. **Chart** component (Plotly or Retool Chart):
   - Type: **Stacked Area** or **Stacked Bar**
   - Data source: `{{ getGenerations.data.timeline }}`
   - X-axis: `label`
   - Y-axis series:
     - `images` (color: #3B82F6)
     - `videos` (color: #8B5CF6)
     - `upscales` (color: #10B981)
     - `faceSwaps` (color: #F59E0B)
     - `faceEnhances` (color: #EF4444)
     - `imageEdits` (color: #EC4899)
     - `imageAnalyses` (color: #6366F1)
   - Title: "Generations Over Time"

4. **Summary stats** row (from `getGenerations.data.summary`):
   - Total Generations: `{{ getGenerations.data.summary.totalGenerations }}`
   - Credits Used: `{{ getGenerations.data.summary.totalCreditsUsed.toFixed(1) }}`
   - Completed: `{{ getGenerations.data.summary.completed }}`
   - Failed: `{{ getGenerations.data.summary.failed }}`

#### Row 5: Signup & Subscription Trend Chart

- **Chart** component:
  - Type: **Line** (dual Y-axis or grouped)
  - Data source: `{{ getAnalytics.data.dailyTrend }}`
  - X-axis: `date`
  - Series 1: `signUps` (label: "Sign-ups", color: #3B82F6)
  - Series 2: `subscriptions` (label: "Subscriptions", color: #10B981)
  - Title: "Daily Sign-ups & Subscriptions (Current Month)"

#### Row 6: All-Time Totals Breakdown

Use a **Table** or stat grid from `getTotals`:

| Metric | Data Path |
|---|---|
| Basic Subscribers | `getTotals.data.basicUsers` |
| Pro Subscribers | `getTotals.data.proUsers` |
| Elite Subscribers | `getTotals.data.eliteUsers` |
| Total Image Generations | `getTotals.data.imageGenerations` |
| Total Video Generations | `getTotals.data.videoGenerations` |
| Total Upscales | `getTotals.data.upscales` |
| Total Face Swaps | `getTotals.data.faceSwaps` |
| Total Image Edits | `getTotals.data.imageEdits` |
| Total Image Analyses | `getTotals.data.imageAnalyses` |
| Total LoRA Trainings | `getTotals.data.loraTrainings` |
| Total LoRA Purchases | `getTotals.data.loraPurchases` |

---

### Page 2: User Management

Create a new page named **"Users"**.

#### Left Panel: User List

1. **searchInput** (Text Input)
   - Placeholder: "Search by name, email, or userId..."
   - On change (debounced 500ms): Run `getUsers`

2. **planFilterSelect** (Select)
   - Values: `null`, `plan_free`, `plan_basic`, `plan_pro`, `plan_elite`
   - Labels: All Plans, Free, Starter, Creator, Studio
   - Default: `null`
   - On change: Run `getUsers`

3. **statusFilterSelect** (Select)
   - Values: `null`, `active`, `banned`
   - Labels: All, Active, Banned
   - Default: `null`
   - On change: Run `getUsers`

4. **usersTable** (Table component)
   - Data: `{{ getUsers.data.users }}`
   - Columns:

| Column | Key | Width | Notes |
|---|---|---|---|
| Avatar | `imageUrl` | 40px | Image column type |
| Name | `name` | 150px | |
| Email | `email` | 200px | |
| Plan | `subscription.planName` | 100px | Use tag colors: Free=gray, Starter=blue, Creator=purple, Studio=gold |
| Status | mapped | 80px | Tag: green "Active" if `isActive && !isBanned`, red "Banned" if `isBanned`, gray "Inactive" otherwise |
| Credits | `credits.available` | 80px | |
| Monthly Remaining | `credits.monthlyRemaining` | 80px | |
| Signed Up | `createdAt` | 120px | Date format |
| Last Active | `lastActiveAt` | 120px | Relative time |

   - Enable server-side pagination:
     - Total records: `{{ getUsers.data.pagination.total }}`
     - Page size: 25
   - Row click event: Run `getUserDetail`

5. **emailSearchInput** (Text Input) + **findUserButton** (Button)
   - Label: "Find by Email"
   - Button on click: Run `findUserByEmail`, then on success set `searchInput.value = findUserByEmail.data.userId` and run `getUsers`.

#### Right Panel: User Detail Drawer/Sidebar

When `getUserDetail` has data, show a **Drawer** or right sidebar.

##### Header Section
- **Avatar**: `{{ getUserDetail.data.user.imageUrl }}` (Image component, 64px)
- **Name**: `{{ getUserDetail.data.user.name }}` (Text, bold, 18px)
- **Email**: `{{ getUserDetail.data.user.email }}` (Text, gray)
- **User ID**: `{{ getUserDetail.data.user.userId }}` (Text, monospace, small)
- **Status Badge**: Show "BANNED" in red if `getUserDetail.data.user.isBanned`, else "Active" in green

##### Subscription Info
- **Plan**: `{{ getUserDetail.data.user.subscription?.planName ?? "No plan" }}` with tier badge
- **Price**: `${{ getUserDetail.data.user.subscription?.price ?? 0 }}/{{ getUserDetail.data.user.subscription?.period ?? "-" }}`
- **Status**: `{{ getUserDetail.data.user.subscription?.status }}`
- **Period End**: `{{ getUserDetail.data.user.subscription?.currentPeriodEnd }}`
- **Phyziro Sub ID**: `{{ getUserDetail.data.user.subscription?.phyziroSubscriptionId }}`

##### Credit Info
- **Available Credits**: `{{ getUserDetail.data.user.credits?.available }}`
- **Credits Used**: `{{ getUserDetail.data.user.credits?.used }}`
- **Monthly Remaining**: `{{ getUserDetail.data.user.credits?.monthlyRemaining }}`
- **Avatar Slots**: `{{ getUserDetail.data.user.credits?.avatarSlotsUsed }} / {{ getUserDetail.data.user.credits?.avatarSlots }}`

##### Generation Counts
Use a **Key-Value** or stat grid:

| Label | Value |
|---|---|
| Images | `{{ getUserDetail.data.generationCounts.images }}` |
| Videos | `{{ getUserDetail.data.generationCounts.videos }}` |
| Upscales | `{{ getUserDetail.data.generationCounts.upscales }}` |
| Face Swaps | `{{ getUserDetail.data.generationCounts.faceSwaps }}` |
| Face Enhances | `{{ getUserDetail.data.generationCounts.faceEnhances }}` |
| Image Edits | `{{ getUserDetail.data.generationCounts.imageEdits }}` |
| Image Analyses | `{{ getUserDetail.data.generationCounts.imageAnalyses }}` |
| **Total** | `{{ getUserDetail.data.generationCounts.total }}` |
| **Credits Spent** | `{{ getUserDetail.data.totalCreditsSpent }}` |

##### Action Section: Change Plan

1. **changePlanSelect** (Select)
   - Values/Labels:
     - `plan_free` / Free
     - `plan_basic` / Starter (Monthly)
     - `plan_pro` / Creator (Monthly)
     - `plan_elite` / Studio (Monthly)
     - `plan_basic_3month` / Starter (Quarterly)
     - `plan_pro_3month` / Creator (Quarterly)
     - `plan_elite_3month` / Studio (Quarterly)
   - Default: `{{ getUserDetail.data.user.subscription?.planTier }}`

2. **changePlanButton** (Button)
   - Label: "Change Plan"
   - Color: Blue
   - On click: Run `changePlan`

##### Action Section: Set Credits (Absolute)

Three number inputs + one button:

1. **setAvailableCreditInput** (Number Input) - Label: "Available Credits" - Default: `{{ getUserDetail.data.user.credits?.available }}`
2. **setMonthlyCreditsInput** (Number Input) - Label: "Monthly Remaining" - Default: `{{ getUserDetail.data.user.credits?.monthlyRemaining }}`
3. **setAvatarSlotsInput** (Number Input) - Label: "Avatar Slots" - Default: `{{ getUserDetail.data.user.credits?.avatarSlots }}`
4. **setCreditsButton** (Button) - Label: "Set Credits" - Color: Orange - On click: Run `setCredits`

##### Action Section: Add Credits (Increment)

Two number inputs + one button:

1. **addCreditsInput** (Number Input) - Label: "Credit Increase" - Default: 0
2. **addLoraInput** (Number Input) - Label: "LoRA Slot Increase" - Default: 0
3. **addCreditsButton** (Button) - Label: "Add Credits" - Color: Green - On click: Run `addCredits`

##### Action Section: Ban/Unban

1. **banButton** (Button)
   - Label: `{{ getUserDetail.data.user.isBanned ? "Unban User" : "Ban User" }}`
   - Color: `{{ getUserDetail.data.user.isBanned ? "green" : "red" }}`
   - On click: Run `banUnbanUser`

##### Recent Images Table

- **recentImagesTable** (Table)
  - Data: `{{ getUserDetail.data.recentImages }}`
  - Columns: Thumbnail (`imageUrl`, image type), Prompt (truncated), Status (tag), Variant, Credits Used, Created At

##### Recent Videos Table

- **recentVideosTable** (Table)
  - Data: `{{ getUserDetail.data.recentVideos }}`
  - Columns: Prompt (truncated), Model, Status (tag), Variant, Credits Used, Created At

##### Influencers/Avatars Table

- **influencersTable** (Table)
  - Data: `{{ getUserDetail.data.influencers }}`
  - Columns: Avatar Image (`avatarImageUrl`), Name, Status, Active (boolean), Created At

##### Transactions Table

- **transactionsTable** (Table)
  - Data: `{{ getUserDetail.data.transactions }}`
  - Show all columns returned by API.

---

### Page 3: Audit Log

Create a new page named **"Audit Log"**.

#### Filters Row

1. **auditActionFilter** (Select)
   - Values: `null`, `ban_user`, `unban_user`, `set_credits`, `credit_adjustment`, `plan_change`
   - Labels: All Actions, Ban User, Unban User, Set Credits, Credit Adjustment, Plan Change
   - Default: `null`
   - On change: Run `getAuditLog`

2. **auditUserIdFilter** (Text Input)
   - Placeholder: "Filter by target userId..."
   - On change (debounced 500ms): Run `getAuditLog`

#### Audit Table

- **auditTable** (Table)
  - Data: `{{ getAuditLog.data.logs }}`
  - Columns:

| Column | Key | Width | Notes |
|---|---|---|---|
| Timestamp | `createdAt` | 160px | DateTime format |
| Action | `action` | 120px | Tag component: ban_user=red, unban_user=green, set_credits=orange, credit_adjustment=blue, plan_change=purple |
| Admin | `adminUserId` | 120px | |
| Target User | `targetUserId` | 200px | Monospace. Optionally make clickable to navigate to User Management page filtered by this user. |
| Details | `details` | flex | JSON viewer or formatted text. Use `{{ JSON.stringify(currentRow.details, null, 2) }}` |

  - Enable server-side pagination:
    - Total records: `{{ getAuditLog.data.pagination.total }}`
    - Page size: 50

---

### Page 4: Tool Costs (Optional)

Create a new page named **"Tool Costs"**.

1. First, create a query to **fetch** current tool costs. Since there is no dedicated GET endpoint, you may need to add one. For now, display an editable table with known tool IDs.

2. **toolCostTable** (Editable Table)
   - Columns: ID (read-only), Tool Name (read-only), Credit Cost (editable, number)
   - Enable changesets

3. **saveToolCostsButton** (Button)
   - Label: "Save Changes"
   - Color: Blue
   - Disabled: `{{ toolCostTable.changesetArray.length === 0 }}`
   - On click: Run `updateToolCosts`
   - On success: Show notification "Tool costs updated", refresh table

---

## Section 4: Navigation

Set up a **Tabbed Navigation** at the top of the app or use Retool's built-in page navigation:

| Tab | Page |
|---|---|
| Overview | Page 1 |
| Users | Page 2 |
| Audit Log | Page 3 |
| Tool Costs | Page 4 |
| **Affiliates** | **Page 5** |

---

## Section 5: Global Settings

1. **App name**: TaviraLabs Admin Dashboard
2. **Theme**: Use Retool's dark theme or default.
3. **App-level queries that run on page load**:
   - `getTotals`
   - `getAnalytics`
   - `getDailyStats`
   - `getGenerations`
   - `getUsers`
   - `getAuditLog`

4. **Error handling**: For all mutation queries (ban, setCredits, addCredits, changePlan, updateToolCosts, createAffiliate, updateAffiliate, affiliatePayoutAction), add:
   - On success: Show success notification + refresh relevant data queries
   - On failure: Show error notification with `{{ queryName.error.message }}`

---

### Page 5: Affiliate Management

Create a new page named **"Affiliates"**.

#### Queries needed:

**`getAffiliates`** — List all affiliates
- Endpoint: `/affiliates`
- Body:
```json
{
  "search": {{ JSON.stringify(affiliateSearchInput.value || "") }},
  "statusFilter": {{ JSON.stringify(affiliateStatusFilter.value || null) }}
}
```
- Returns:
```
{
  affiliates: [{
    id, userId, affiliateCode, commissionType, commissionRate, status,
    payoutMethod, payoutEmail, totalEarnings, totalPaidOut, pendingBalance,
    minimumPayout, notes, createdAt,
    userName, userEmail, userImageUrl,
    totalReferrals, totalConversions, pendingPayoutRequests
  }],
  summary: { totalAffiliates, activeAffiliates, totalEarnings, totalPending, totalPaidOut }
}
```
- Settings: Run on page load: **Yes**

**`createAffiliate`** — Create a new affiliate
- Endpoint: `/affiliates/create`
- Body:
```json
{
  "email": {{ JSON.stringify(newAffiliateEmailInput.value) }},
  "commissionType": {{ JSON.stringify(newCommissionTypeSelect.value || "percentage") }},
  "commissionRate": {{ newCommissionRateInput.value || 15 }},
  "payoutMethod": {{ JSON.stringify(newPayoutMethodSelect.value || null) }},
  "payoutEmail": {{ JSON.stringify(newPayoutEmailInput.value || null) }},
  "notes": {{ JSON.stringify(newAffiliateNotesInput.value || null) }}
}
```
- Returns: `{ message, affiliate, affiliateLink, user }`
- Settings: Run on page load: **No**. Requires confirmation: **Yes**. On success: Run `getAffiliates`, show notification with `affiliateLink`.

**`updateAffiliate`** — Update affiliate settings
- Endpoint: `/affiliates/update`
- Body:
```json
{
  "affiliateId": {{ JSON.stringify(affiliatesTable.selectedRow.data.id) }},
  "commissionType": {{ JSON.stringify(editCommissionTypeSelect.value) }},
  "commissionRate": {{ editCommissionRateInput.value }},
  "status": {{ JSON.stringify(editStatusSelect.value) }},
  "payoutMethod": {{ JSON.stringify(editPayoutMethodSelect.value) }},
  "payoutEmail": {{ JSON.stringify(editPayoutEmailInput.value) }},
  "minimumPayout": {{ editMinPayoutInput.value }},
  "notes": {{ JSON.stringify(editNotesInput.value) }}
}
```
- Settings: Run on page load: **No**. Requires confirmation: **Yes**. On success: Run `getAffiliates`.

**`getAffiliatePayouts`** — List all payouts
- Endpoint: `/affiliates/payouts`
- Body:
```json
{
  "statusFilter": {{ JSON.stringify(payoutStatusFilter.value || null) }},
  "affiliateId": {{ JSON.stringify(payoutAffiliateFilter.value || null) }}
}
```
- Returns:
```
{
  payouts: [{
    id, affiliateId, amount, status, payoutMethod, payoutEmail, notes,
    createdAt, processedAt, affiliateName, affiliateEmail,
    affiliate: { userId, affiliateCode, payoutEmail }
  }],
  summary: { totalPending, totalProcessing, totalCompleted, pendingCount }
}
```
- Settings: Run on page load: **Yes**

**`affiliatePayoutAction`** — Approve/reject payouts
- Endpoint: `/affiliates/payout-action`
- Body:
```json
{
  "payoutId": {{ JSON.stringify(payoutsTable.selectedRow.data.id) }},
  "action": {{ JSON.stringify(payoutActionSelect.value) }},
  "notes": {{ JSON.stringify(payoutActionNotesInput.value || null) }}
}
```
- Valid actions: `approve`, `reject`, `processing`
- Settings: Run on page load: **No**. Requires confirmation: **Yes**. On success: Run `getAffiliatePayouts`, `getAffiliates`.

#### Layout:

**Row 1: Summary Stats (from `getAffiliates.data.summary`)**

| Card | Value |
|------|-------|
| Total Affiliates | `{{ getAffiliates.data.summary.totalAffiliates }}` |
| Active Affiliates | `{{ getAffiliates.data.summary.activeAffiliates }}` |
| Total Earnings | `${{ getAffiliates.data.summary.totalEarnings.toFixed(2) }}` |
| Pending Payouts | `${{ getAffiliates.data.summary.totalPending.toFixed(2) }}` |
| Total Paid Out | `${{ getAffiliates.data.summary.totalPaidOut.toFixed(2) }}` |

**Row 2: Filters + Add Affiliate Button**

1. **affiliateSearchInput** (Text Input) — Placeholder: "Search by code or userId..." — On change (debounced): Run `getAffiliates`
2. **affiliateStatusFilter** (Select) — Values: `null`, `active`, `paused`, `banned` — Labels: All, Active, Paused, Banned — On change: Run `getAffiliates`
3. **"Add Affiliate" Button** — Opens a modal/drawer with the create form

**Row 3: Affiliates Table**

- **affiliatesTable** (Table)
  - Data: `{{ getAffiliates.data.affiliates }}`
  - Columns:

| Column | Key | Notes |
|--------|-----|-------|
| Avatar | `userImageUrl` | Image column, 32px |
| Name | `userName` | |
| Email | `userEmail` | |
| Code | `affiliateCode` | Monospace |
| Commission | mapped | `{{ currentRow.commissionType === 'percentage' ? currentRow.commissionRate + '%' : '$' + currentRow.commissionRate.toFixed(2) }}` |
| Status | `status` | Tag: active=green, paused=yellow, banned=red |
| Total Earnings | `totalEarnings` | Format: `$X.XX` |
| Pending | `pendingBalance` | Format: `$X.XX` |
| Paid Out | `totalPaidOut` | Format: `$X.XX` |
| Referrals | `totalReferrals` | |
| Conversions | `totalConversions` | |
| Created | `createdAt` | Date format |

  - Row click: Open edit sidebar/modal with affiliate details

**Row 4: Create Affiliate Modal**

Form fields:
1. **newAffiliateEmailInput** (Text Input) — Label: "User Email" — Required
2. **newCommissionTypeSelect** (Select) — Values: `percentage`, `flat` — Default: `percentage`
3. **newCommissionRateInput** (Number Input) — Label: "Commission Rate" — Default: 15
4. **newPayoutMethodSelect** (Select) — Values: `null`, `paypal`, `stripe`, `bank_transfer` — Labels: Not Set, PayPal, Stripe, Bank Transfer
5. **newPayoutEmailInput** (Text Input) — Label: "Payout Email"
6. **newAffiliateNotesInput** (Text Area) — Label: "Notes"
7. **"Create Affiliate" Button** — On click: Run `createAffiliate`
   - On success: Copy `createAffiliate.data.affiliateLink` to clipboard, show notification: "Affiliate created! Link: {{ createAffiliate.data.affiliateLink }}"

**Row 5: Edit Affiliate Sidebar**

When a row is clicked, show these editable fields:
1. **editCommissionTypeSelect** — Default: `{{ affiliatesTable.selectedRow.data.commissionType }}`
2. **editCommissionRateInput** — Default: `{{ affiliatesTable.selectedRow.data.commissionRate }}`
3. **editStatusSelect** — Values: `active`, `paused`, `banned` — Default: `{{ affiliatesTable.selectedRow.data.status }}`
4. **editPayoutMethodSelect** — Default: `{{ affiliatesTable.selectedRow.data.payoutMethod }}`
5. **editPayoutEmailInput** — Default: `{{ affiliatesTable.selectedRow.data.payoutEmail }}`
6. **editMinPayoutInput** — Default: `{{ affiliatesTable.selectedRow.data.minimumPayout }}`
7. **editNotesInput** — Default: `{{ affiliatesTable.selectedRow.data.notes }}`
8. **Affiliate Link display**: `https://coregen.ai?affiliate={{ affiliatesTable.selectedRow.data.affiliateCode }}` with copy button
9. **"Save Changes" Button** — On click: Run `updateAffiliate`

**Row 6: Payouts Tab**

Use a **Tabbed Container** with tabs: "Affiliates" and "Payouts".

Payouts tab:

1. **payoutStatusFilter** (Select) — Values: `null`, `pending`, `processing`, `completed`, `failed` — Default: `null` — On change: Run `getAffiliatePayouts`

2. **Payout summary stats** (from `getAffiliatePayouts.data.summary`):
   - Pending: `${{ getAffiliatePayouts.data.summary.totalPending.toFixed(2) }}` ({{ getAffiliatePayouts.data.summary.pendingCount }} requests)
   - Processing: `${{ getAffiliatePayouts.data.summary.totalProcessing.toFixed(2) }}`
   - Completed: `${{ getAffiliatePayouts.data.summary.totalCompleted.toFixed(2) }}`

3. **payoutsTable** (Table)
   - Data: `{{ getAffiliatePayouts.data.payouts }}`
   - Columns:

| Column | Key | Notes |
|--------|-----|-------|
| Affiliate | `affiliateName` | |
| Email | `affiliateEmail` | |
| Amount | `amount` | Format: `$X.XX` |
| Method | `payoutMethod` | |
| Payout Email | `payoutEmail` | |
| Status | `status` | Tag: pending=yellow, processing=blue, completed=green, failed=red |
| Requested | `createdAt` | Date format |
| Processed | `processedAt` | Date format, empty if null |
| Notes | `notes` | |

   - Row click: Show action buttons

4. **payoutActionSelect** (Select) — Values: `approve`, `reject`, `processing` — Labels: Approve, Reject, Mark Processing
5. **payoutActionNotesInput** (Text Input) — Label: "Notes (optional)"
6. **"Submit Action" Button** — Disabled if no row selected — On click: Run `affiliatePayoutAction`

---

## Quick Reference: All Endpoints

| # | Query Name | Endpoint | Trigger |
|---|---|---|---|
| 1 | `getUsers` | `/users` | Page load + filters |
| 2 | `findUserByEmail` | `/user/find` | Manual button |
| 3 | `getUserDetail` | `/user/detail` | Row click |
| 4 | `banUnbanUser` | `/user/ban` | Manual button |
| 5 | `setCredits` | `/user/set-credits` | Manual button |
| 6 | `changePlan` | `/user/change-plan` | Manual button |
| 7 | `addCredits` | `/user/update` | Manual button |
| 8 | `getDailyStats` | `/daily` | Page load + filter |
| 9 | `getTotals` | `/total` | Page load |
| 10 | `getAnalytics` | `/analytics` | Page load |
| 11 | `getGenerations` | `/generations` | Page load + filter |
| 12 | `getAuditLog` | `/audit` | Page load + filters |
| 13 | `updateToolCosts` | `/toolcost/update` | Manual button |
| 14 | `getAffiliates` | `/affiliates` | Page load + filters |
| 15 | `createAffiliate` | `/affiliates/create` | Manual button |
| 16 | `updateAffiliate` | `/affiliates/update` | Manual button |
| 17 | `getAffiliatePayouts` | `/affiliates/payouts` | Page load + filter |
| 18 | `affiliatePayoutAction` | `/affiliates/payout-action` | Manual button |
