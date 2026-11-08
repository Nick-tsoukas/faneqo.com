# PWA Scope Restriction Implementation

**Date:** February 4, 2026  
**Purpose:** Fix Android OEM camera QR scanning failures caused by PWA/WebAPK link capturing

---

## Summary

Changed PWA scope from `/` (entire domain) to `/dashboard` (logged-in area only). This ensures:
- QR codes and band pages open in browser, not PWA
- Stock camera QR scanning works reliably
- PWA experience preserved for dashboard/app functionality

---

## Files Changed

| File | Change |
|------|--------|
| `public/manifest.webmanifest` | `scope` and `start_url` changed from `/` to `/dashboard` |
| `composables/useOpenExternal.ts` | New utility to open URLs in external browser |
| `pages/dashboard.vue` | View buttons use `openExternal()` instead of `router.push()` |
| `components/BackToAppButton.vue` | New component for logged-in users on public pages |
| `pages/[bandSlug]/index.vue` | Added `BackToAppButton` component |

---

## How It Works

### Before (scope: "/")
```
QR scan → Android routes to PWA → PWA tries to handle → FAILS on some cameras
```

### After (scope: "/dashboard")
```
QR scan → Android sees URL is outside PWA scope → Opens in Chrome → SUCCESS
```

### User Flow
1. User scans QR → Opens in Chrome browser
2. User views band page in browser
3. If logged in, sees "Back to App" button
4. Tapping button returns to PWA dashboard

---

## Verification Checklist

### Android
- [ ] Install PWA from Chrome
- [ ] Scan MBQ QR with stock camera → should open in Chrome (not PWA)
- [ ] From dashboard in PWA, tap "View" on band → should open Chrome tab
- [ ] On band page while logged in → "Back to App" button visible
- [ ] Tap "Back to App" → returns to dashboard in PWA
- [ ] PWA home screen icon still works
- [ ] PWA update toast still works

### iOS
- [ ] Install PWA (Add to Home Screen)
- [ ] PWA opens to dashboard
- [ ] View button opens Safari
- [ ] Back to App button works

### Desktop
- [ ] No navigation regressions
- [ ] View buttons open new tab
- [ ] Back to App button appears when logged in

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Legacy WebAPKs still claim `/` scope | Medium | Users must reinstall PWA for new scope |
| Stale service worker | Low | SW doesn't affect manifest scope |
| Users confused by browser opening | Low | "Back to App" button provides clear path back |
| SEO impact | None | Public pages unchanged |

### Legacy WebAPK Handling
- Existing PWA installs will continue using old scope until reinstalled
- Chrome periodically updates WebAPKs (usually within 24-48 hours)
- Users can manually reinstall: uninstall PWA → reinstall from Chrome

---

## Rollback Plan

Single command to revert all changes:
```bash
git revert HEAD
```

This reverts:
- Manifest scope back to `/`
- Removes openExternal composable usage
- Removes BackToAppButton component

---

## Technical Details

### Manifest Scope
```json
{
  "start_url": "/dashboard",
  "scope": "/dashboard"
}
```

The `scope` property tells Android which URLs the PWA "claims". URLs outside scope open in browser.

### openExternal Utility
```typescript
export function useOpenExternal() {
  const openExternal = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  return { openExternal }
}
```

Used inside PWA to force public URLs to open in browser tab.

### BackToAppButton
- Only renders for authenticated users (`useStrapiUser()`)
- Fixed position at bottom center
- Respects safe-area-inset for notched devices
- Links to `/dashboard`

---

## Future Considerations

1. **Trusted Web Activity (TWA)**: For full control, consider building a TWA wrapper and publishing to Play Store
2. **assetlinks.json**: Already added for domain verification, but scope restriction is the primary fix
3. **Deep linking**: If deep linking into PWA is needed later, consider using a different URL pattern for app-only routes
