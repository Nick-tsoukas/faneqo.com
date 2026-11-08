# Account Page Documentation

> **Last Updated:** January 28, 2026  
> **File:** `pages/account.vue`

---

## Overview

The account page allows users to:
1. Update their email and password
2. View subscription status
3. Access the Stripe Billing Portal (manage billing, cancel subscription)

---

## Features

### 1. Update Account (Email/Password)

**Frontend:** `account.vue` lines 134-152
```javascript
async function updateAccount() {
  const updates = { email, username: email };
  if (password.value) updates.password = password.value;
  await client(`/users/${user.value.id}`, { method: 'PUT', body: updates });
}
```

**Endpoint:** `PUT /users/:id` (Strapi built-in)

**Fields Updated:**
- `email`
- `username` (kept in sync with email)
- `password` (optional, only if provided)

---

### 2. Subscription Status Display

**Frontend:** `account.vue` lines 35-58

**Data Fetched:** `GET /api/stripe/billing`

**Displays:**
| Field | Source | Description |
|-------|--------|-------------|
| Plan | `subscription.plan.nickname` | "Trial" or "Monthly" |
| Status | `subscription.status` | trialing, active, past_due, canceled |
| Trial Ends | `trialEndsAt` | Date when trial expires |
| Renewal | `subscription.price` from Stripe | Formatted with `Intl.NumberFormat`. Trial: `After trial: $X.XX/month`. Active: `Renews at $X.XX/month`. Hidden if price truth is missing. Ambassador / lifetime Pro (`billingExempt`) shows **Lifetime Pro · Complimentary** and never a renewal amount. |

**Status Logic:**
```javascript
// Strapi status takes precedence for pastDue
const normalizedStatus = strapiStatus === 'pastDue' ? 'pastDue' : stripeStatus;
const isPastDue = status === 'past_due' || status === 'pastDue';
```

---

### 3. Manage Billing / Cancel Subscription

**Button:** "Manage Billing Info" (or "Pay Invoice" if past due)

**Frontend:** `account.vue` lines 154-169
```javascript
async function goToBillingPortal() {
  const res = await client('stripe/create-billing-portal-session', { method: 'POST' });
  window.location.href = res.url;  // Redirects to Stripe
}
```

**Backend Endpoints (DUPLICATE - both exist):**

1. **Strapi `/api/stripe/create-billing-portal-session`**
   - File: `qrdb/src/api/stripe/controllers/stripe.js` lines 144-163
   - Route: `qrdb/src/api/stripe/routes/stripe.js` lines 6-14

2. **Strapi `/api/stripe/create-billing-portal-session`** (subscription API)
   - File: `qrdb/src/api/subscription/controllers/subscription.js` lines 88-123
   - Route: `qrdb/src/api/subscription/routes/subscription.js` lines 14-20

**Flow:**
```
User clicks "Manage Billing" 
  → POST /api/stripe/create-billing-portal-session
  → Creates Stripe Billing Portal session
  → Redirects to Stripe (https://billing.stripe.com/...)
  → User can update payment method, cancel subscription, view invoices
  → Redirects back to BILLING_RETURN_URL
```

**Cancel Subscription:**
- Users cancel through the **Stripe Billing Portal** (no direct cancel button in app)
- When canceled, Stripe sends webhook `customer.subscription.deleted`
- Webhook handler updates user: `subscriptionStatus: 'canceled'`

---

## Environment Variables Required

| Variable | Used In | Description |
|----------|---------|-------------|
| `BILLING_RETURN_URL` | `createBillingPortalSession` | URL to return to after billing portal |
| `STRIPE_SECRET_KEY` | All Stripe calls | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Webhook handler | Verifies webhook signatures |

**⚠️ IMPORTANT:** `BILLING_RETURN_URL` must be set in Strapi backend Railway env vars.

Recommended value: `https://musicbizqr.com/account`

---

## API Endpoints

### GET /api/stripe/billing
**Auth:** JWT required  
**Returns:**
```json
{
  "hasPaymentMethod": true,
  "trialEndsAt": "2026-02-28T00:00:00.000Z",
  "subscription": {
    "id": "sub_xxx",
    "status": "trialing",
    "trial_end": 1740700800,
    "plan": { "nickname": "Monthly" },
    "current_period_end": 1740700800,
    "price": {
      "id": "price_xxx",
      "unitAmount": 1200,
      "currency": "usd",
      "interval": "month",
      "intervalCount": 1
    }
  }
}
```

### POST /api/stripe/create-billing-portal-session
**Auth:** JWT required  
**Returns:**
```json
{
  "url": "https://billing.stripe.com/session/xxx"
}
```

### GET /api/stripe/subscription-status
**Auth:** JWT required  
**Returns:**
```json
{
  "status": "trialing",
  "plan": "Monthly",
  "trialEndsAt": 1740700800,
  "gracePeriodStart": null
}
```

---

## Webhook Handlers

Webhooks are handled in `qrdb/src/api/subscription/controllers/subscription.js`

| Event | Handler | Action |
|-------|---------|--------|
| `checkout.session.completed` | `onCheckoutCompleted` | Sets status to trialing/active |
| `invoice.payment_succeeded` | `onInvoicePaid` | Sets status to active |
| `invoice.payment_failed` | `onInvoiceFailed` | Sets status to pastDue |
| `customer.subscription.updated` | `onSubscriptionUpdated` | Syncs status, plan, trialEndsAt |
| `customer.subscription.deleted` | `onSubscriptionCanceled` | Sets status to canceled |

---

## User Schema Fields (Subscription-Related)

| Field | Type | Description |
|-------|------|-------------|
| `customerId` | string | Stripe customer ID (cus_xxx) |
| `subscriptionId` | string | Stripe subscription ID (sub_xxx) |
| `subscriptionStatus` | enum | Default **unpaid** (fail closed). Live values: trialing, active, pastDue, canceled, unpaid, free |
| `plan` | string | Plan nickname |
| `trialEndsAt` | date | Trial end date |
| `gracePeriodStart` | date | When grace period started (for past due) |
| `cancelAt` | date | When subscription will cancel |

---

## Known Issues / Notes

### 1. Duplicate Routes
Both `stripe/routes/stripe.js` and `subscription/routes/subscription.js` define:
- `/stripe/create-billing-portal-session`
- `/stripe/subscription-status`

This may cause conflicts. The subscription API version is more complete.

### 2. No In-App Cancel Button
Users must go to Stripe Billing Portal to cancel. Consider adding a direct cancel button.

### 3. BILLING_RETURN_URL
Ensure this is set in Railway backend env vars, otherwise users won't return to the app after billing portal.

---

## Testing Checklist

- [ ] View account page shows correct email
- [ ] Update email works
- [ ] Update password works
- [ ] Subscription status displays correctly
- [ ] "Manage Billing" opens Stripe portal
- [ ] After billing portal, redirects back to app
- [ ] Cancel in Stripe portal → webhook updates user status
