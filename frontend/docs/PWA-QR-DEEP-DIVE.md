# PWA QR Scanning Issue - Deep Dive Research

## The Error Message

**Exact error:** "No apps installed to scan QR code"

This is NOT a service worker caching error. This is an **OS-level error** that happens BEFORE the PWA even loads.

## What This Error Means

When you scan a QR code on Android, the system tries to:
1. Decode the QR → gets URL (e.g., `https://musicbizqr.com/bandname`)
2. Check if any installed app can handle this URL
3. If yes → open in that app
4. If no → show error "No apps installed to scan QR code"

## Why PWA Installation Causes This

### Android Deep Linking Behavior (from research)

According to [Progressier's PWA Deep Links guide](https://intercom.help/progressier/en/articles/6902113-complete-guide-to-pwa-deep-links):

> "On Android, deep linking is the default behavior. As long as the target URL is in the scope of an installed PWA, the system will open that installed PWA"

**The following actions SHOULD deep link into the PWA:**
- ✅ Scanning a QR code from a scanner app
- ✅ Clicking on a link in messaging apps
- ✅ Tapping push notifications
- ✅ Opening links with `target="_blank"` from browser

## Root Cause Theory

When the PWA is installed with `scope: "/"`:

1. **Android registers the PWA** to handle ALL URLs under `musicbizqr.com/*`
2. **QR scanner detects URL** → asks Android "who can handle this?"
3. **Android says:** "The MusicBizQR PWA can handle it"
4. **Android tries to launch PWA** with that URL
5. **PWA fails to launch/handle the URL properly** (why?)
6. **Android shows error:** "No apps installed to scan QR code"

## Why PWA Might Fail to Launch

### Possibility 1: Service Worker Initialization Failure
- PWA tries to start
- Service worker takes too long to initialize
- Android times out → error

### Possibility 2: Cached Service Worker Breaks Launch
- Old service worker is cached
- It tries to handle the navigation but fails
- PWA never fully loads → error

### Possibility 3: NetworkFirst Timeout
Our config has:
```javascript
handler: 'NetworkFirst',
options: {
  networkTimeoutSeconds: 3,  // ⚠️ Only 3 seconds!
}
```

If network is slow:
1. Service worker waits 3 seconds for network
2. Falls back to cache (which might be stale/broken)
3. PWA loads broken page → appears as "failed to launch"

### Possibility 4: Redirect Handling
Band slug URLs like `musicbizqr.com/bandname` might:
1. Hit service worker
2. Service worker caches the initial request
3. Server tries to do internal routing/redirect
4. Service worker interferes with redirect
5. Page never loads properly

### Possibility 5: Manifest Scope Issue
With `scope: "/"`, the PWA claims ALL URLs. But maybe:
- Some URLs shouldn't be handled by PWA
- PWA tries to handle them anyway
- Fails to load → error

## Current Config Analysis

```json
// manifest.webmanifest
{
  "scope": "/",           // ⚠️ Claims ALL URLs
  "start_url": "/",
  "display": "standalone"
}
```

```javascript
// nuxt.config.ts
pwa: {
  registerType: 'prompt',  // User must approve updates
  workbox: {
    navigateFallback: '/offline',  // ⚠️ Fallback for failed navigations
    navigateFallbackDenylist: [
      /^\/directqr/,  // Excluded from fallback
      // Band slugs NOT excluded from fallback
    ],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/musicbizqr\.com\/(?!api|account|dashboard|agency|internal|checkout|directqr).*/,
        handler: 'NetworkFirst',  // ⚠️ Tries network first
        options: {
          networkTimeoutSeconds: 3,  // ⚠️ Short timeout
          cacheName: 'pages-cache',
          expiration: {
            maxAgeSeconds: 60 * 60 * 24, // 24 hours
          },
        },
      },
    ],
  },
}
```

## The Problem

**Band slug URLs** (e.g., `/bandname`) are:
- ✅ In PWA scope → Android routes to PWA
- ✅ Match the runtimeCaching pattern → Service worker handles them
- ⚠️ Use NetworkFirst with 3s timeout
- ⚠️ NOT in navigateFallbackDenylist

**What probably happens:**
1. QR scan → Android launches PWA with `/bandname`
2. Service worker intercepts navigation
3. NetworkFirst tries network (3s timeout)
4. If slow/fails → serves cached version (might be stale/broken)
5. OR falls back to `/offline` page
6. PWA appears "broken" → Android shows error

## Why Deleting PWA Fixes It

Without PWA installed:
1. QR scan → Android has no app to handle URL
2. Opens in Chrome browser instead
3. Browser loads page normally (no service worker interference)
4. Works perfectly

## Solutions

### Solution A: Exclude Band Slugs from Service Worker (TRIED)
Add band slugs to `navigateFallbackDenylist` and use `NetworkOnly`:
```javascript
navigateFallbackDenylist: [
  /^\/[a-zA-Z0-9_-]+$/,  // Band slugs
],
runtimeCaching: [
  {
    urlPattern: /\/(directqr|[a-zA-Z0-9_-]+)/,
    handler: 'NetworkOnly',  // Never cache
  },
]
```
**Status:** Tried, still broken

### Solution B: NetworkOnly for ALL Navigations (TRIED)
```javascript
runtimeCaching: [
  {
    urlPattern: ({request}) => request.mode === 'navigate',
    handler: 'NetworkOnly',
  },
]
```
**Status:** Tried, still broken

### Solution C: Restrict PWA Scope
```json
{
  "scope": "/dashboard",
  "start_url": "/dashboard"
}
```
**Result:** Band pages open in browser, not PWA. QR codes work.
**Downside:** Can't navigate to band pages from within PWA.

### Solution D: Disable navigateFallback
```javascript
workbox: {
  navigateFallback: null,  // Don't fallback to offline page
}
```
**Theory:** Maybe the fallback is interfering with deep links.

### Solution E: Add capture_links to Manifest
```json
{
  "capture_links": "none"  // Don't capture external links
}
```
**Theory:** Tell Android not to route external URLs to PWA.

## Testing Needed

After revert to `be1d8e5`:
1. Check if QR scanning works with original config
2. If yes → something in tonight's changes broke it
3. If no → issue existed before, just wasn't noticed

## Key Insight

The error "no apps installed to scan QR code" is misleading. It doesn't mean no apps exist. It means:
- Android found an app (the PWA)
- Tried to launch it
- Launch failed
- Shows generic error

This is an **Android deep linking failure**, not a service worker caching issue.

---
*Research completed: February 2, 2026*
