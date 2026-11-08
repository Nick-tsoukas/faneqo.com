# Marketer Attribution System

> **Shannon-Only Implementation** - This is a focused internal feature for one marketer (Shannon Tehya), not a general affiliate platform.

## Overview

The marketer attribution system tracks referrals from Shannon's TikTok marketing efforts. When users land on MBQ with `?ref=shannon` and sign up within 30 days, they are attributed to Shannon for commission tracking.

**Key Points:**
- 30-day attribution window
- No Stripe payout automation (manual payouts)
- Shannon sees a private dashboard with stats and referred users
- Commission rate: 10% of monthly subscription ($7.00 default)

---

## How It Works

### 1. Referral Capture Flow

```
User clicks Shannon's link → musicbizqr.com/?ref=shannon
                ↓
Plugin captures ref param → stores in localStorage + cookie (30 days)
                ↓
User signs up (email/password or Google)
                ↓
Signup flow reads attribution → sends refCode to backend
                ↓
Backend validates marketer code → saves attribution to user record
                ↓
Attribution cleared from browser storage
```

### 2. Attribution Window

- **Duration:** 30 days from first click
- **Storage:** localStorage (primary) + cookie (backup)
- **Overwrite:** New `?ref=` param overwrites previous attribution
- **Expiry:** Attribution ignored if expired

### 3. Shannon's Dashboard

Shannon (user with `isMarketer: true`) sees:
- **MarketerOverviewCard** on main dashboard
- **Full analytics page** at `/dashboard/marketer`

---

## Data Model

### Marketer Content Type (`api::marketer.marketer`)

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Marketer display name |
| `slug` | uid | URL-safe identifier |
| `email` | email | Marketer's email (matches user email) |
| `commissionPercent` | integer | Commission rate (default: 10) |
| `isActive` | boolean | Whether marketer is active |
| `code` | string | Unique referral code (e.g., "shannon") |
| `referredUsers` | relation | One-to-many with users |

### User Fields (Extended)

| Field | Type | Description |
|-------|------|-------------|
| `referredByMarketer` | relation | Link to marketer record |
| `marketerCodeUsed` | string | The code used at signup |
| `referredAt` | datetime | When attribution was captured |
| `isMarketer` | boolean | Whether user is a marketer (shows dashboard) |

---

## API Endpoints

### Protected (Authenticated + isMarketer)

#### `GET /api/marketer/me/stats`
Returns marketer statistics.

**Response:**
```json
{
  "data": {
    "totalReferredUsers": 15,
    "trialUsers": 3,
    "activeUsers": 10,
    "canceledUsers": 2,
    "estimatedMonthlyRevenue": 70.00,
    "estimatedMonthlyCommission": 7.00,
    "signupsThisMonth": 4,
    "conversionRate": 76.9,
    "commissionPercent": 10
  }
}
```

#### `GET /api/marketer/me/users`
Returns paginated list of referred users.

**Query Params:**
- `page` (default: 1)
- `pageSize` (default: 25)

**Response:**
```json
{
  "data": [
    {
      "id": 123,
      "email": "fan@example.com",
      "username": "fan@example.com",
      "status": "active",
      "trialEndsAt": "2026-04-05",
      "createdAt": "2026-03-06T10:00:00Z",
      "referredAt": "2026-03-06T10:00:00Z",
      "marketerCodeUsed": "shannon",
      "estimatedMonthlyValue": 0.70
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 15
    }
  }
}
```

### Public

#### `GET /api/marketer/by-code/:code`
Validates a marketer code exists and is active.

**Response:**
```json
{
  "data": {
    "id": 1,
    "name": "Shannon Tehya",
    "code": "shannon"
  }
}
```

---

## Frontend Components

### Composables

#### `useMarketingAttribution.js`
Handles browser-side attribution storage.

```js
const { 
  setMarketingAttribution,    // Store ref code
  getMarketingAttribution,    // Get stored attribution
  isMarketingAttributionValid, // Check if not expired
  clearMarketingAttribution,  // Clear after signup
  getValidRefCode             // Get code if valid, else null
} = useMarketingAttribution()
```

#### `useMarketer.js`
API calls for marketer dashboard.

```js
const {
  isMarketer,        // Computed: is current user a marketer?
  getMarketerStats,  // Fetch stats
  getMarketerUsers,  // Fetch referred users
  formatCurrency,    // Helper: format $X.XX
  formatDate,        // Helper: format date
  getStatusColor,    // Helper: status badge color
  formatStatus       // Helper: status label
} = useMarketer()
```

### Plugin

#### `marketing-attribution.client.js`
Auto-captures `?ref=` param on any page load or navigation.

### Middleware

#### `marketer.ts`
Protects `/dashboard/marketer` route. Redirects:
- Not logged in → `/login`
- Not a marketer → `/dashboard`

### Components

#### `MarketerOverviewCard.vue`
Dashboard card showing quick stats. Only renders if `isMarketer === true`.

### Pages

#### `/marketer-dashboard`
Full analytics page with:
- KPI cards (total, trial, active, commission)
- Secondary stats (signups this month, conversion rate)
- Referral link with copy button
- Referred users table with pagination

---

## Commission Calculation

```
Estimated Monthly Commission = Active Users × Monthly Price × Commission Rate

Example:
10 active users × $7.00 × 10% = $7.00/month
```

**Monthly Price:** Set via `MBQ_MONTHLY_PRICE` env var (default: $7.00)

---

## Setup Instructions

### 1. Create Marketer Record in Strapi

Go to **Content Manager → Marketer → Create new entry**:

| Field | Value |
|-------|-------|
| name | Shannon Tehya |
| code | shannon |
| email | shannonmorgello@gmail.com |
| commissionPercent | 10 |
| isActive | true |

### 2. Enable Shannon as Marketer

Find user **ID 365** (shannonmorgello@gmail.com) in **Users** and set:
- `isMarketer: true`

### 3. Configure Strapi Permissions

**Settings → Users & Permissions → Roles**

**Authenticated role:**
- Enable: `marketer.myStats`
- Enable: `marketer.myUsers`

**Public role:**
- Enable: `marketer.findByCode`

### 4. (Optional) Set Monthly Price

Add to environment variables:
```
MBQ_MONTHLY_PRICE=7.00
```

---

## Shannon's Referral Link

```
https://musicbizqr.com/?ref=shannon
```

This link can be used in:
- TikTok bio
- Video descriptions
- Direct messages
- Any marketing material

---

## File Reference

### Strapi Backend (`qrdb`)

| File | Purpose |
|------|---------|
| `src/api/marketer/content-types/marketer/schema.json` | Marketer data model |
| `src/api/marketer/controllers/marketer.js` | API logic |
| `src/api/marketer/routes/marketer.js` | Route definitions |
| `src/api/marketer/services/marketer.js` | Core service |
| `src/extensions/users-permissions/content-types/user/schema.json` | Extended user fields |
| `src/api/stripe/controllers/stripe.js` | Signup attribution handling |

### Nuxt Frontend (`qr`)

| File | Purpose |
|------|---------|
| `composables/useMarketingAttribution.js` | Attribution storage |
| `composables/useMarketer.js` | Marketer API calls |
| `composables/useSignup.ts` | Email signup with refCode |
| `composables/useFirebase.ts` | Google signup with refCode |
| `plugins/marketing-attribution.client.js` | Auto-capture plugin |
| `middleware/marketer.ts` | Route protection |
| `components/dashboard/marketer/MarketerOverviewCard.vue` | Dashboard card |
| `pages/marketer-dashboard.vue` | Analytics page |
| `server/api/stripe/confirm-social.ts` | Server-side signup |

---

## Future Considerations

If expanding to multiple marketers:
- Add marketer signup/application flow
- Build admin management UI
- Consider Stripe Connect for automated payouts
- Add marketer-specific landing pages
- Implement tiered commission rates

**For now, this is intentionally lean and Shannon-focused.**
