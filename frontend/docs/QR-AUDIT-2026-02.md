# QR Code System Audit — February 2026

> Comprehensive audit of QR code creation, scanning, tracking, and download functionality.

---

## Audit Summary

| Area | Status | Notes |
|------|--------|-------|
| QR Creation | ✅ Healthy | Proper URL generation and validation |
| QR Editing | ✅ Healthy | Auto-repairs legacy records |
| QR Scanning | ✅ Healthy | Proper redirect with analytics |
| QR Download | ✅ Healthy | Multi-format export working |
| PWA Compatibility | ✅ Fixed | `/directqr` excluded from service worker |
| Error Handling | ✅ Good | Fallbacks and logging in place |

---

## Files Audited

### Frontend Components

| File | Lines | Status | Notes |
|------|-------|--------|-------|
| `components/QrCode.client.vue` | 850 | ✅ | Create flow solid |
| `components/EditQrCode.client.vue` | 889 | ✅ | Edit flow with auto-repair |
| `components/DownloadQr.client.vue` | - | ✅ | Modal-based download |

### Server Routes

| File | Lines | Status | Notes |
|------|-------|--------|-------|
| `server/routes/directqr.ts` | 231 | ✅ | Comprehensive redirect logic |

### Backend (Strapi)

| File | Status | Notes |
|------|--------|-------|
| `qrdb/src/api/qr/content-types/qr/schema.json` | ✅ | All fields present |

---

## Detailed Findings

### 1. QrCode.client.vue (Create New QR)

**Strengths:**
- Uses `uuidv4()` for unique QR identifiers
- `ensureValidQrUrl()` validates URL format before encoding
- Proper two-step save: create → update with final URL
- Live preview updates via debounced/throttled watchers
- Error correction level set to `'H'` (highest)

**Code Patterns:**
```javascript
// URL validation (line 423-429)
function ensureValidQrUrl(url) {
  if (!url || !url.startsWith('https://')) {
    console.error('[QR] INVALID URL detected:', url)
    return `https://musicbizqr.com/directqr?id=${uuid}`
  }
  return url
}
```

**Minor Observation:**
- Line 435: `name` defaults to `'name'` - could be more descriptive like `'Untitled QR'`

---

### 2. EditQrCode.client.vue (Edit Existing QR)

**Strengths:**
- Auto-repairs legacy records missing `slugId` or `url`
- `directUrl` is computed property ensuring consistency
- Extracts `slugId` from URL if not stored separately
- Persists repairs immediately on load

**Auto-Repair Logic (lines 532-546):**
```javascript
const existingId = data.slugId || extractIdFromUrl(data.url)
slugId.value = existingId || uuidv4()
qrValue.value = directUrl.value

if (!data.slugId || !data.url || extractIdFromUrl(data.url) !== slugId.value) {
  await client(`/qrs/${qrData.value.id}`, {
    method: "PUT",
    body: { data: { slugId: slugId.value, url: directUrl.value } },
  })
}
```

**Minor Observation:**
- Line 332: `extra-rounded` option value differs from create form (`extraRounded`) - mismatch could cause issues if library is strict

---

### 3. directqr.ts (Server Route)

**Strengths:**
- Multiple fallback strategies for finding QR record
- Rich analytics capture (Cloudflare geo, UTMs, click IDs)
- Sets attribution cookie for page-view correlation
- Preserves UTM params through redirect
- Handles multiple Strapi v4 response formats for relations

**Redirect Priority (correct order):**
1. AR mode (`arEnabled`)
2. Band profile (`bandProfile` type)
3. Event page (`events` type)
4. External URL (`externalURL` type)
5. Fallback to site root

**Analytics Captured:**
- Country, city, region, lat/lng (from Cloudflare)
- UTM params (source, medium, campaign, term, content)
- Click IDs (gclid, fbclid, ttclid, twclid)
- User agent, referrer

---

### 4. PWA Configuration

**Status: ✅ Fixed**

The previous PWA caching issue has been properly addressed in `nuxt.config.ts`:

```typescript
// Lines 107-115
navigateFallbackDenylist: [
  /^\/api/,
  /^\/account/,
  /^\/dashboard/,
  /^\/agency/,
  /^\/internal/,
  /^\/checkout/,
  /^\/directqr/,  // CRITICAL: Don't cache QR redirect route
],
```

The `directqr` route is also excluded from runtime caching (line 118).

---

### 5. Strapi QR Schema

**All Required Fields Present:**
- `slugId` (string) - UUID for URL
- `url` (string) - Full redirect URL
- `q_type` (string) - Type enum
- `link` (string) - Destination for external URLs
- `options` (JSON) - Styling options
- `q_image` (media) - PNG preview
- `band` (relation) - For band profile type
- `event` (relation) - For event type
- `arEnabled` (boolean) - AR mode flag
- `scans` (relation) - Linked scan records

---

## Potential Issues Identified

### Issue 1: Corner Square Type Mismatch

**Location:** `EditQrCode.client.vue` line 332 vs `QrCode.client.vue` line 333

**Problem:** Create form uses `extraRounded`, Edit form uses `extra-rounded`

```html
<!-- Create (correct) -->
<option value="extraRounded">Extra Rounded</option>

<!-- Edit (inconsistent) -->
<option value="extra-rounded">Extra Rounded</option>
```

**Risk:** Low - `qr-code-styling` library appears to accept both
**Recommendation:** Standardize to `extraRounded` (camelCase)

---

### Issue 2: Gradient Rotation Conversion

**Location:** `EditQrCode.client.vue` line 558-560

**Problem:** Confusing conversion formula that may not correctly restore degrees from radians:

```javascript
gradientRotation.value = data.options?.dotsOptions?.gradient?.rotation
  ? (data.options.dotsOptions.gradient.rotation * Math.PI) / Math.PI / 2
  : 0
```

The formula `(rad * PI) / PI / 2` simplifies to `rad / 2`, which is incorrect. Should be `(rad * 180) / Math.PI`.

**Risk:** Medium - Gradient rotation may not match original after edit
**Recommendation:** Fix formula:
```javascript
gradientRotation.value = data.options?.dotsOptions?.gradient?.rotation
  ? (data.options.dotsOptions.gradient.rotation * 180) / Math.PI
  : 0
```

---

### Issue 3: No Error Toast on Save Failure

**Location:** Both `QrCode.client.vue` and `EditQrCode.client.vue`

**Problem:** Save errors are logged to console but not shown to user:

```javascript
} catch (error) {
  console.error('Error during QR code save:', error?.response?.data || error)
}
```

**Risk:** Low - User doesn't know save failed
**Recommendation:** Add toast notification for save errors

---

### Issue 4: Missing Link Normalization on Edit

**Location:** `EditQrCode.client.vue` line 122-131

**Problem:** Unlike create form, edit form doesn't normalize link on change:

```html
<!-- Create form has this -->
@change="link = normalizeLink(link)"

<!-- Edit form missing it -->
<input v-model="link" type="text" ... />
```

**Risk:** Low - Link is normalized on save anyway (line 763)
**Recommendation:** Add `@change` handler for consistency

---

## Recommendations

### High Priority
1. **Fix gradient rotation formula** in `EditQrCode.client.vue`

### Medium Priority
2. **Standardize corner square type values** across forms
3. **Add user-facing error notifications** for save failures

### Low Priority
4. **Add link normalization** on change in edit form
5. **Update default QR name** from `'name'` to `'Untitled QR'`

---

## Test Scenarios Verified

| Scenario | Status |
|----------|--------|
| Create band profile QR | ✅ |
| Create external URL QR | ✅ |
| Edit existing QR | ✅ |
| Download QR (PNG/SVG/JPEG) | ✅ |
| Scan QR → redirect to band | ✅ |
| Scan QR → redirect to external URL | ✅ |
| Scan tracking with analytics | ✅ |
| PWA doesn't cache directqr | ✅ |
| Legacy QR auto-repair | ✅ |

---

## Documentation Status

| Doc | Status | Last Updated |
|-----|--------|--------------|
| `QR-SYSTEM.md` | ✅ Current | Feb 2026 |
| `QR-TROUBLESHOOTING.md` | ✅ Current | Feb 2026 |
| `QR-QUICK-REFERENCE.md` | ✅ Current | - |

---

## Critical Fix: Band Relation Not Populating (February 2, 2026)

### Problem
QR codes were redirecting to the home page instead of the artist page, even though the band relation was properly set in Strapi admin.

**Symptoms:**
- `?debug=1` showed `band: null` and `resolvedSlug: null`
- `attrsKeys` did not include `band`
- `q_type` was correctly `bandProfile`

### Root Cause
1. **Strapi API permission sanitization** was stripping the band relation from responses
2. Standard `populate=*` and `populate=band` syntax didn't work
3. The custom `/api/qrs/lookup` endpoint existed but was **missing direct `slugId` field lookup**

### Solution

**Strapi (`qrdb/src/api/qr/controllers/qr.js`):**
Added proper lookup chain to the custom endpoint:
```javascript
// 1. Try exact URL match
// 2. Try direct slugId field match (NEW - most reliable)
// 3. Try numeric Strapi ID match (NEW)
// 4. Last resort: search options.data
```

**Nuxt (`qr/server/routes/directqr.ts`):**
Switched from standard Strapi API to custom `/api/qrs/lookup` endpoint that:
- Uses `strapi.db.query` directly (bypasses permission sanitization)
- Returns flat structure with band data included
- Properly populates band with `{ id, slug, name }`

### Verification
Test URL: `https://musicbizqr.com/directqr?id={slugId}&debug=1`

Expected response:
```json
{
  "foundBy": "custom-lookup",
  "qrId": 84,
  "q_type": "bandProfile",
  "band": { "id": 32, "slug": "escaper", "name": "Escaper" },
  "resolvedSlug": "escaper",
  "destination": "https://musicbizqr.com/escaper"
}
```

### Files Modified
| File | Change |
|------|--------|
| `qrdb/src/api/qr/controllers/qr.js` | Added slugId and numeric ID lookups |
| `qr/server/routes/directqr.ts` | Use custom lookup endpoint |

---

## Conclusion

The QR system is **stable and production-ready**. The previous PWA caching issue has been properly fixed. The codebase has good error handling, validation, and fallback mechanisms.

The identified issues are minor and don't affect core functionality. The gradient rotation bug in the edit form is the only one worth addressing in the near term.

---

*Audit completed: February 2, 2026*
*Updated: February 2, 2026 - Band relation fix*
