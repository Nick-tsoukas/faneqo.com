# MusicBizQR PWA Documentation

## Overview

MusicBizQR is configured as a Progressive Web App (PWA) with:
- Installable app experience
- Offline support for public pages
- Background updates with user-friendly prompts
- Network status indicators
- **iOS-optimized** splash screens and safe area handling

## Architecture

### Files Created

```
qr/
├── public/
│   ├── manifest.webmanifest     # PWA manifest
│   ├── icons/
│   │   ├── icon-192.png         # Standard icon
│   │   ├── icon-512.png         # Large icon  
│   │   ├── icon-512-maskable.png # Maskable icon for Android
│   │   └── apple-touch-icon.png  # iOS icon (180x180)
│   └── splash/
│       ├── apple-splash-1170x2532.png  # iPhone 12/13/14
│       ├── apple-splash-1179x2556.png  # iPhone 14 Pro
│       ├── apple-splash-1284x2778.png  # iPhone 12/13/14 Pro Max
│       ├── apple-splash-1290x2796.png  # iPhone 14 Pro Max
│       ├── apple-splash-1125x2436.png  # iPhone X/XS/11 Pro
│       ├── apple-splash-1242x2688.png  # iPhone XS/11 Pro Max
│       ├── apple-splash-828x1792.png   # iPhone XR/11
│       ├── apple-splash-750x1334.png   # iPhone 8/SE
│       ├── apple-splash-1242x2208.png  # iPhone 8 Plus
│       ├── apple-splash-2048x2732.png  # iPad Pro 12.9"
│       ├── apple-splash-1668x2388.png  # iPad Pro 11"
│       └── apple-splash-1536x2048.png  # iPad Air/Mini
├── pages/
│   ├── install.vue              # Premium install page
│   └── offline.vue              # Branded offline page
├── components/
│   ├── PwaUpdateToast.vue       # Update notification
│   ├── NetworkStatus.vue        # Online/offline indicator
│   ├── MobileBottomNav.vue      # Bottom nav with Share QR
│   └── ShareQrDrawer.vue        # CashApp-style QR sharing
├── composables/
│   └── usePwa.js                # PWA state management
└── scripts/
    ├── generate-pwa-icons.cjs   # Icon generation script
    └── generate-ios-splash.cjs  # Splash screen generation
```

### Configuration (nuxt.config.ts)

The PWA is configured with:
- `registerType: 'prompt'` - User must approve updates
- Custom manifest at `/manifest.webmanifest`
- Service worker with runtime caching

## Caching Strategy

### Excluded from Cache (Never cached)
- `/api/*` - API routes
- `/account/*` - User account pages
- `/dashboard/*` - Dashboard
- `/agency/*` - Agency pages
- `/internal/*` - Internal pages
- `/checkout/*` - Checkout flow
- Any request with Authorization header

### Caching Rules

| Content Type | Strategy | TTL | Notes |
|-------------|----------|-----|-------|
| Page routes | NetworkFirst | 24h | 3s timeout, falls back to cache |
| Images | CacheFirst | 30 days | Up to 100 entries |
| Fonts | CacheFirst | 1 year | Up to 20 entries |
| Google Fonts | CacheFirst | 1 year | External fonts |

## Testing

### Lighthouse PWA Audit

1. Open Chrome DevTools (F12)
2. Go to **Lighthouse** tab
3. Check **Progressive Web App**
4. Click **Analyze page load**
5. Review PWA score and recommendations

### Test Offline Mode

1. Open Chrome DevTools (F12)
2. Go to **Network** tab
3. Check **Offline** checkbox
4. Navigate to a public page
5. Should see cached content or `/offline` page

### Test Update Flow

1. Deploy a new version
2. Visit the site
3. Wait for service worker to detect update
4. Update toast should appear (bottom-right on desktop, bottom-center on mobile)
5. Click "Update now" - page should refresh with new version

### Test Install on iOS

1. Open https://musicbizqr.com/install in Safari
2. Follow the on-screen instructions:
   - Tap Share button
   - Tap "Add to Home Screen"
   - Tap "Add"
3. Open from home screen - should launch in standalone mode
4. **Verify splash screen** appears during launch (MBQ branded)
5. **Verify status bar** is translucent black

### Test Install on Android

1. Open https://musicbizqr.com/install in Chrome
2. Click "Install MBQ" button
3. Confirm installation
4. App icon should appear on home screen

## Unregister Service Worker

If you need to reset the PWA:

1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** in sidebar
4. Click **Unregister** next to the service worker
5. Clear site data: **Application** → **Storage** → **Clear site data**

Or via console:
```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister())
})
```

## Verify Installation

### Check if Running as PWA
```javascript
// In browser console
window.matchMedia('(display-mode: standalone)').matches
// Returns true if installed PWA
```

### Check Service Worker Status
```javascript
navigator.serviceWorker.controller
// Returns ServiceWorker object if active
```

## Troubleshooting

### Update Toast Not Appearing
- Check browser console for SW errors
- Verify not on excluded route (`/account`, `/dashboard`, etc.)
- Check if `updateDismissed` is true in session

### Install Button Not Appearing
- Must be served over HTTPS
- Must have valid manifest
- Must meet PWA installability criteria
- Check `beforeinstallprompt` event in console

### Offline Page Not Loading
- Verify `/offline` route exists
- Check `navigateFallback` in PWA config
- Verify SW is registered and active

### Cache Not Updating
- SW updates happen in background
- Close all tabs and reopen
- Or use DevTools → Application → Service Workers → Update

---

## iOS-Specific Configuration

### Meta Tags (nuxt.config.ts)

```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="MBQ" />
```

### Viewport (layouts/default.vue)

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no" />
```

The `viewport-fit=cover` is **critical** for proper notch/safe area handling on iPhone X and later.

### Safe Area CSS

Components use CSS environment variables for safe area insets:

```css
/* Bottom padding for nav bars */
.safe-area-pb {
  padding-bottom: env(safe-area-inset-bottom, 0);
}

/* Full safe area support */
.safe-area-all {
  padding-top: env(safe-area-inset-top, 20px);
  padding-bottom: env(safe-area-inset-bottom, 20px);
  padding-left: env(safe-area-inset-left, 0);
  padding-right: env(safe-area-inset-right, 0);
}
```

### Splash Screens

iOS splash screens are linked via `apple-touch-startup-image` with media queries for each device size. They are generated by `scripts/generate-ios-splash.cjs`.

To regenerate splash screens:
```bash
node scripts/generate-ios-splash.cjs
```

### iOS PWA Limitations

Be aware of these iOS Safari PWA limitations:
- **No push notifications** (iOS 16.4+ supports, but limited)
- **No background sync**
- **Storage may be cleared** after 7 days of inactivity
- **No beforeinstallprompt** event (must use Share → Add to Home Screen)
- **Audio playback** requires user gesture to start

### iOS Audit Checklist

| Item | Status | Notes |
|------|--------|-------|
| apple-mobile-web-app-capable | ✅ | Enables standalone mode |
| apple-mobile-web-app-status-bar-style | ✅ | black-translucent |
| apple-mobile-web-app-title | ✅ | "MBQ" |
| apple-touch-icon (180x180) | ✅ | /icons/apple-touch-icon.png |
| Splash screens (12 sizes) | ✅ | All iPhone/iPad sizes |
| viewport-fit=cover | ✅ | For notch handling |
| Safe area CSS | ✅ | env() variables used |
| Theme color | ✅ | #FF00FF (magenta) |
| Standalone display mode | ✅ | In manifest |

---

## Mobile Bottom Nav Features

The PWA includes a premium mobile bottom navigation for logged-in users:

### Components
- **MobileBottomNav.vue** - Fixed bottom nav with Dash, Artist, Analytics, Share
- **ShareQrDrawer.vue** - Full-screen QR code sharing (CashApp-style)

### Share QR Feature
- Displays scannable QR code linking to artist's page
- Shows artist profile image and name
- Native share via Web Share API
- Copy link fallback
- Full-screen with animated gradient background

---

## Regenerating Assets

### PWA Icons
```bash
node scripts/generate-pwa-icons.cjs
```
Generates: icon-192.png, icon-512.png, icon-512-maskable.png, apple-touch-icon.png

### iOS Splash Screens
```bash
node scripts/generate-ios-splash.cjs
```
Generates 12 splash screens for all iPhone and iPad sizes
