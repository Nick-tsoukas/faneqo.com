# MusicBizQR Authentication & Signup Flows

> **Last Updated:** January 28, 2026  
> **Purpose:** Complete documentation of all signup, login, Stripe, and email flows

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Flow 1: Google OAuth Signup/Login](#flow-1-google-oauth-signuplogin)
3. [Flow 2: Email/Password Signup](#flow-2-emailpassword-signup)
4. [Flow 3: Email/Password Login](#flow-3-emailpassword-login)
5. [Flow 4: Fan Passwordless Magic-Link Auth](#flow-4-fan-passwordless-magic-link-auth)
6. [Stripe Customer Management](#stripe-customer-management)
7. [Email Configuration](#email-configuration)
8. [Environment Variables](#environment-variables)
9. [Common Issues & Solutions](#common-issues--solutions)
10. [API Endpoints Reference](#api-endpoints-reference)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Nuxt)                              │
│                    https://musicbizqr.com                            │
├─────────────────────────────────────────────────────────────────────┤
│  composables/useFirebase.ts    → Google OAuth via Firebase           │
│  composables/useSignup.ts      → Email/Password signup               │
│  server/api/stripe/confirm-social.ts → Nuxt server route for OAuth   │
│  server/utils/stripe-trial.ts  → Stripe customer/subscription helper │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Strapi)                              │
│              https://qrserver-production.up.railway.app              │
├─────────────────────────────────────────────────────────────────────┤
│  /api/stripe/register          → Email/Password signup + Stripe      │
│  /api/stripe/confirm-social    → Google OAuth (Strapi route)         │
│  /api/auth/local               → Standard Strapi login               │
│  /api/auth/local/register      → Standard Strapi register (BROKEN)   │
│  /api/user-admin/*             → Custom API for user management      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Flow 1: Google OAuth Signup/Login

### Overview
Users click "Continue with Google" → Firebase handles OAuth → Nuxt server creates/logs in user

### Detailed Flow

```
1. User clicks "Continue with Google" button
   └── File: pages/signup.vue or pages/login.vue
   └── Calls: loginWithGoogle() from composables/useFirebase.ts

2. Firebase OAuth Popup
   └── File: composables/useFirebase.ts
   └── Signs out first (forces account picker)
   └── Sets prompt: 'select_account' 
   └── Calls: signInWithPopup(auth, provider)
   └── Returns: { email, displayName, uid }

3. Nuxt Server Route
   └── File: server/api/stripe/confirm-social.ts
   └── Endpoint: POST /api/stripe/confirm-social (NUXT, not Strapi)
   └── Receives: { email, name, uid, provider: 'google' }

4. User Lookup
   └── Calls: GET /api/user-admin/by-email/:email (Strapi)
   └── Uses: STRAPI_API_TOKEN for auth
   └── File: qrdb/src/api/user-admin/controllers/user-admin.js

5a. EXISTING USER WITH customerId:
   └── Try login with Firebase-derived password: uid + '_firebaseA1!'
   └── If login fails, update password via PUT /api/user-admin/:id
   └── Do not reprovision Stripe
   └── Return JWT (identity login). Temporary Stripe trouble does not lock them out.

5b. EXISTING USER WITHOUT customerId (incomplete / retry):
   └── Authenticate identity
   └── Attempt Stripe repair/provision (reuse existing customer/sub when present)
   └── If success: persist billing truth, then return JWT + billingReady: true
   └── If Stripe fails: persist unpaid (never fabricate trialing), return JWT + billingReady: false

5c. NEW USER:
   └── Register via POST /api/user-admin/register as unpaid (no Pro yet)
   └── Create Stripe customer + 30-day trial (dedupe existing customer/sub)
   └── Persist customerId, subscriptionId, real Stripe status, trialEndsAt
   └── Only then login and return JWT
   └── If Stripe or metadata persist fails: no JWT, user remains unpaid, retryable 503

6. Client Completion
   └── Set JWT token via strapiAuth.setToken()
   └── Fetch user data via strapiAuth.fetchUser()
   └── Redirect to /dashboard
```

### Key Files
| File | Purpose |
|------|---------|
| `qr/composables/useFirebase.ts` | Firebase OAuth client-side |
| `qr/server/api/stripe/confirm-social.ts` | Nuxt server route |
| `qr/server/utils/stripe-trial.ts` | Stripe customer/subscription helper |
| `qrdb/src/api/user-admin/controllers/user-admin.js` | Custom Strapi API |

### Password Generation
Google OAuth users get a reproducible password:
```javascript
const password = uid + '_firebaseA1!'
// Example: 'abc123xyz_firebaseA1!'
```

---

## Flow 2: Email/Password Signup

### Overview
User fills form → Direct call to Strapi → Creates user + Stripe customer + trial

### Detailed Flow

```
1. User fills signup form
   └── File: pages/signup.vue
   └── Fields: email, password

2. Frontend Call
   └── File: composables/useSignup.ts
   └── Calls: POST {strapiUrl}/api/stripe/register
   └── Body: { name: email, email, password }

3. Strapi Endpoint
   └── File: qrdb/src/api/subscription/controllers/subscription.js
   └── Function: register()

4. Validation
   └── Check if user already exists (return error if so)
   └── Validate required fields

5. Stripe Customer (with deduplication)
   └── Check: stripe.customers.list({ email, limit: 1 })
   └── If exists: use existing customer
   └── If not: stripe.customers.create({ email, name })

6. Stripe Subscription
   └── stripe.subscriptions.create({
         customer: customer.id,
         items: [{ price: STRIPE_DEFAULT_PRICE_ID }],
         trial_period_days: 30
       })

7. Create Strapi User WITH required Stripe metadata in the canonical write
   └── username / email / password / provider / confirmed / role
   └── customerId, subscriptionId, subscriptionStatus (mapped from Stripe), trialEndsAt
   └── If user create fails: cancel/delete ONLY Stripe objects created in this request
   └── Pre-existing / grandfathered subscriptions are never canceled

8. Persist gate
   └── Registration success requires persisted customerId + subscriptionId + status
   └── trialEndsAt required when status is trialing
   └── Metadata miss returns 500 (not signup success)

9. Send Confirmation Email (best-effort, non-fatal)
   └── Uses: EMAIL_DEFAULT_FROM env var
   └── Email failure does not unwind a valid Stripe + Strapi signup

10. Return Response
    └── { user: { id, email }, message: '...' }

11. Frontend shows success, user must LOGIN separately
```

### Key Files
| File | Purpose |
|------|---------|
| `qr/pages/signup.vue` | Signup form |
| `qr/composables/useSignup.ts` | API call helper |
| `qrdb/src/api/subscription/controllers/subscription.js` | register() function |
| `qrdb/src/api/subscription/routes/subscription.js` | Route definition |

---

## Flow 3: Email/Password Login

### Overview
Standard Strapi login via /api/auth/local

### Detailed Flow

```
1. User enters email/password
   └── File: pages/login.vue

2. Strapi Auth Module
   └── Calls: POST /api/auth/local
   └── Body: { identifier: email, password }

3. Strapi Validates
   └── Finds user by email
   └── Checks provider = 'local'
   └── Verifies password hash
   └── Checks confirmed = true

4. Returns JWT
   └── { jwt: '...', user: {...} }

5. Client stores JWT and redirects to dashboard
```

### IMPORTANT: Provider Field
- Users created via email/password have `provider: 'local'`
- The login endpoint ONLY works for `provider: 'local'` users
- Google OAuth users are set to `provider: 'local'` so they can also use password login

---

## Flow 4: Fan Passwordless Magic-Link Auth

> Added Slice A (Fan Account V1). Fans **never** set a password.

### Overview

Fans are created through magic-link verification, not a signup form. There is no
password creation, no password reset, and no password field on any fan surface.
Create/claim and returning sign-in share one backend endpoint; only the copy and
entry context differ.

### Routes

| Route | Purpose | Surface type |
|-------|---------|--------------|
| `/fan/login` | Returning fan requests a sign-in link | **auth** (no fan bottom nav) |
| `/fan/verify?token=…` | Consumes the magic link, stores JWT | **auth** (no fan bottom nav) |
| `/fan` | Authenticated fan home | app |
| `/login` | Artist email/password + Google. Carries a secondary fan link to `/fan/login` | auth |

### Detailed flow

```
1. Fan enters email on /fan/login
   └── composables/useFanLogin.js
   └── POST {strapiUrl}/api/fan-account/request-link
   └── Body: { email, trigger: 'fan_login', visitorToken? }

2. Backend (qrserver src/utils/fanAccount.js → requestMagicLink)
   └── Rate limit: 3 per 15 min, per email / per sha256(ip|ua) / per visitor hash
   └── Expires any prior pending link for that email
   └── Stores fan-account-link { email, sha256(token), expiresAt +30min, status: pending }
   └── Emails /fan/verify?token=<raw>   (raw token is never persisted)
   └── ALWAYS returns a generic response — never confirms the account exists

3. Fan taps the link → /fan/verify
   └── POST /api/fan-account/verify { token }
   └── Backend marks the link `used` before side effects (one-time use)
   └── findOrCreateUserByEmail → ensureFanProfile → claimFanRelationships
   └── Returns { jwt, user, claim, redirectTo }

4. Frontend stores the session
   └── useStrapiAuth().setToken(jwt) → `strapi_jwt` cookie (30 days)
   └── fetchUser()
   └── router.replace(internalDestination(redirectTo))  // currently /fan?welcome=1
```

### Session model

Fan and artist share **one** `strapi_jwt` cookie and one `users-permissions`
identity. There is no separate fan token store and no second auth system.

A verified magic link authenticates the **global** identity for that email. If
that identity is also an artist or team user, the resulting JWT is that same
account. This is passwordless authentication, not account duplication — see the
security decision below. `fan-profile` is a presentation layer on that user, so
an artist using `/fan` owns a fan profile without a second account. Backend
model and profile API: `qrserver/docs/FANEQO_FAN_IDENTITY.md`.
Logout is the global `useStrapiAuth().logout()` in `components/Header.vue`.

### Return paths

`/fan/login?redirect=…` is honoured **only** for a fan who already has a live
session (sanitized by `safeFanPostAuthRedirect`, `/fan` and `/fan/*` only). It
cannot survive the email round-trip. Server-side magic-link `returnTo` storage is
a later slice; until then `/fan/verify` always lands on `/fan?welcome=1`.

`pages/fan/verify.vue` guards the server-supplied `redirectTo` through
`internalDestination()` (rejects non-`/`, `//`, CRLF, `..`) so a future return
path can never become an off-site redirect.

### Chrome rules

`utils/ui/appSurface.js` excludes `/fan/login` and `/fan/verify` from
`isFaneqoAppPath`, and `utils/ui/fanNav.js` hides the fan bottom nav there.
Fan-section matching is segment-bounded: `/fans` is the **artist-facing** fan
list and must never be treated as a fan-account route.

---

### ⚠️ SECURITY DECISION — artist account reachable via fan magic link

**Status: intentional. Flagged for later security review.**

`findOrCreateUserByEmail` returns the *existing* user for a known email. Because
Faneqo deliberately keeps one global `users-permissions` identity, an artist or
team user who verifies a magic link sent to their own account email receives a
session for **that** account, carrying its role — without their password.

Why this is accepted:

- Magic-link verification proves ownership of the account email, which is the
  same trust level as a password reset.
- The alternative (separate artist and fan user tables) is explicitly rejected by
  the architecture invariants — it would fork identity and duplicate accounts.

What must not be weakened:

- one-time token use and the 30-minute expiry;
- the 3-per-15-minute rate limit across email / fingerprint / visitor;
- generic non-enumerating responses;
- claim rules that never reactivate unsubscribed or removed relationships.

Open items for review: there is no "a sign-in link was requested for your
account" notification, and no reset-specific throttle distinct from the fan
request-link limit.

---

### ⚠️ TECHNICAL DEBT — `GET /api/fan-account/artists` writes on read

**Status: unchanged on purpose. Do not refactor until the fan profile/auth
foundation is stable.**

`src/api/fan-account/controllers/fan-account.js` (`artists`) calls
`ensureFanProfile()` and a full `claimFanRelationshipsForUser()` on every read.
This is the same write-on-read pattern logged as issue #5 for DM candidates in
`qrserver/docs/FANEQO_MESSAGING_RELATIONSHIP_START_HERE.md`.

It is load-bearing today: it is how a fan who signed in before their fan rows
existed still gets claimed. Removing it needs an explicit idempotent claim path
first. Until then, do not add further write-on-read behavior to fan surfaces.

---

## Stripe Customer Management

### Deduplication Logic
ALL signup flows now check for existing Stripe customers AND subscriptions before creating:

```javascript
// Step 1: Check for existing customer
const existingCustomers = await stripe.customers.list({ email, limit: 1 });
if (existingCustomers.data.length > 0) {
  customer = existingCustomers.data[0];  // Use existing
  
  // Step 2: Check for existing active/trialing subscription
  const existingSubs = await stripe.subscriptions.list({ customer: customer.id, status: 'all', limit: 1 });
  if (existingSubs.data.length > 0 && 
      (existingSubs.data[0].status === 'active' || existingSubs.data[0].status === 'trialing')) {
    subscription = existingSubs.data[0];  // Use existing subscription
  }
} else {
  customer = await stripe.customers.create({ email, name });  // Create new
}

// Step 3: Only create subscription if none exists
if (!subscription) {
  subscription = await stripe.subscriptions.create({ ... });
}
```

### Stripe Fields on User
| Field | Type | Description |
|-------|------|-------------|
| `customerId` | string | Stripe customer ID (cus_xxx) |
| `subscriptionId` | string | Stripe subscription ID (sub_xxx) |
| `subscriptionStatus` | enum | default **unpaid**; live: trialing, active, pastDue, canceled, unpaid, free |
| `plan` | string | Founder grant: `free` = billing-exempt **lifetime full Pro** (ambassador / white-glove). Not a fan account. Not a future limited free artist tier. |
| `trialEndsAt` | datetime | When trial expires |

### Ambassador / white-glove artist (founder grant)

Manually maintained in Strapi (example: BADFLOWER).

- Canonical grant today: **`plan = free`**
- Means: full Pro forever, **no Stripe**, no card, no portal
- Legacy compat: `subscriptionStatus = free` also grants
- Must never be inferred from missing `customerId` / `subscriptionId`
- Fan-only unpaid users are **not** ambassadors
- Do **not** reuse `plan=free` later for a limited free artist product
- Login (Google or email) must not provision or repair Stripe for these accounts
- `subscription-active`, `/stripe/billing`, and `/stripe/subscription-status` must allow / skip Stripe

### Where Stripe Customers Are Created
1. **Nuxt** `server/utils/stripe-trial.ts` - Google OAuth (frontend route)
2. **Strapi** `api/subscription/controllers/subscription.js` - Email/Password signup
3. **Strapi** `api/stripe/controllers/stripe.js` - confirmSocial, createCustomer

---

## Email Configuration

### Provider: Resend
- Configured in: `qrdb/config/env/production/plugins.js`
- API Key: `RESEND_API_KEY` env var

### Settings
```javascript
email: {
  config: {
    provider: 'strapi-provider-email-resend',
    providerOptions: { apiKey: env('RESEND_API_KEY') },
    settings: { 
      defaultFrom: env('EMAIL_DEFAULT_FROM'),      // no-reply@musicbizqr.com
      defaultReplyTo: env('EMAIL_DEFAULT_REPLY_TO') // support@musicbizqr.com
    },
  },
},
```

### KNOWN ISSUE: Strapi Built-in Register
The built-in `/api/auth/local/register` endpoint uses its own email settings and defaults to `strapi.io` domain, which is NOT verified in Resend. This causes 500 errors.

**Solution:** Use custom `/api/user-admin/register` endpoint which does NOT send emails.

### Email Sending Locations
| Location | From Address | Works? |
|----------|--------------|--------|
| `/api/stripe/register` | `EMAIL_DEFAULT_FROM` | ✅ Yes |
| `/api/auth/local/register` | `strapi.io` (hardcoded) | ❌ No |
| Custom endpoints | N/A (no email sent) | ✅ Yes |

---

## Environment Variables

### Frontend (Nuxt) - Railway
```bash
STRAPI_URL=https://qrserver-production.up.railway.app
STRAPI_API_TOKEN=<same as backend>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_DEFAULT_PRICE_ID=price_...
```

### Backend (Strapi) - Railway
```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_DEFAULT_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...
EMAIL_DEFAULT_FROM=no-reply@musicbizqr.com
EMAIL_DEFAULT_REPLY_TO=support@musicbizqr.com

# Auth
JWT_SECRET=<secret>
STRAPI_API_TOKEN=<must match frontend>

# Database
DATABASE_URL=postgresql://...
```

### CRITICAL: STRAPI_API_TOKEN
The `STRAPI_API_TOKEN` must be **identical** in both frontend and backend. The custom `user-admin` API validates this token directly.

---

## Common Issues & Solutions

### Issue 1: 401 Unauthorized on user lookup
**Cause:** `STRAPI_API_TOKEN` mismatch between frontend and backend
**Solution:** Copy token from Strapi backend to frontend env vars

### Issue 2: 500 Error on registration
**Cause:** Strapi's `/api/auth/local/register` tries to send email with `strapi.io` domain
**Solution:** Use custom `/api/user-admin/register` endpoint

### Issue 3: Google login always uses same account
**Cause:** Firebase caches the signed-in user
**Solution:** Call `signOut(auth)` before `signInWithPopup` and set `prompt: 'select_account'`

### Issue 4: Duplicate Stripe customers
**Cause:** No deduplication check before creating customers
**Solution:** Always call `stripe.customers.list({ email })` first

### Issue 7: Duplicate Stripe subscriptions
**Cause:** Even with customer deduplication, subscriptions were always created new
**Solution:** Check `stripe.subscriptions.list({ customer })` for active/trialing subscription before creating

### Issue 5: User can't login after Google signup
**Cause:** `provider` field was set to `'google'` but login requires `'local'`
**Solution:** Always set `provider: 'local'` for all users

### Issue 6: Username has random suffix
**Cause:** Username was generated with timestamp
**Solution:** Use email as username for all signup flows

---

## API Endpoints Reference

### Custom User Admin API (Strapi)
**Base:** `/api/user-admin`  
**Auth:** `Authorization: Bearer <STRAPI_API_TOKEN>`

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/by-email/:email` | Find user by email |
| PUT | `/:id` | Update user fields |
| POST | `/register` | Create user (no email sent) |

### Stripe API (Strapi)
**Base:** `/api/stripe`

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/register` | None | Email/password signup |
| POST | `/confirm-social` | None | Google OAuth (Strapi route) |
| GET | `/subscription-status` | JWT | Get subscription status |
| GET | `/billing` | JWT | Get billing info |
| POST | `/create-billing-portal-session` | JWT | Stripe portal URL |

### Nuxt Server Routes
**Base:** `/api/stripe`

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/confirm-social` | Google OAuth handler (Nuxt route) |

---

## Testing Checklist

### Google OAuth Signup
- [ ] Account picker shows every time
- [ ] New user created with email as username
- [ ] Stripe customer created (check for duplicates)
- [ ] 30-day trial subscription created
- [ ] User redirected to dashboard
- [ ] User can logout and login again

### Email/Password Signup
- [ ] Duplicate email rejected
- [ ] Stripe customer created (check for duplicates)
- [ ] 30-day trial subscription created
- [ ] User marked as confirmed: true
- [ ] Success message shown
- [ ] User can login with same credentials

### Login
- [ ] Correct credentials work
- [ ] Wrong password rejected
- [ ] Non-existent user rejected
- [ ] JWT stored correctly
- [ ] User data fetched after login

---

## File Reference Map

```
qr/ (Frontend - Nuxt)
├── composables/
│   ├── useFirebase.ts          # Google OAuth
│   └── useSignup.ts            # Email signup helper
├── pages/
│   ├── signup.vue              # Signup page
│   └── login.vue               # Login page
├── server/
│   ├── api/stripe/
│   │   └── confirm-social.ts   # Google OAuth Nuxt route
│   └── utils/
│       └── stripe-trial.ts     # Stripe helper
└── plugins/
    └── firebase..ts            # Firebase init

qrdb/ (Backend - Strapi)
├── config/
│   └── env/production/
│       └── plugins.js          # Email, upload, users-permissions config
├── src/api/
│   ├── user-admin/
│   │   ├── controllers/user-admin.js   # Custom user API
│   │   ├── routes/user-admin.js        # Routes
│   │   └── services/user-admin.js      # Empty service
│   ├── stripe/
│   │   ├── controllers/stripe.js       # Stripe endpoints
│   │   └── routes/stripe.js            # Routes
│   └── subscription/
│       ├── controllers/subscription.js  # register(), webhook
│       └── routes/subscription.js       # Routes
└── src/extensions/
    └── users-permissions/
        └── strapi-server.js    # Custom auth policy
```

---

*This document should be updated whenever auth flows are modified.*
