# PWA QR Scanning Incident Audit Report

**Device:** REVVL 6x 5G (TMRVO65G)  
**Date:** February 3, 2026  
**Status:** Under Investigation (Research Only - No Code Changes)

---

## Incident Summary

| Field | Value |
|-------|-------|
| **Symptom** | Scanning MBQ QR shows "No apps installed to scan QR code" |
| **Scope** | Happens ONLY when MusicBizQR PWA is installed |
| **URL Format** | `https://musicbizqr.com/directqr?id=79` (and other patterns) |
| **Resolution** | Uninstalling PWA immediately fixes the issue |

---

## Timeline

| Date/Time | Event |
|-----------|-------|
| Feb 1, 2026 ~evening | QR scanning confirmed working with PWA installed |
| Feb 2, 2026 ~11:30 PM CT | Started making changes to PWA (share modal fix) |
| Feb 2, 2026 ~midnight | Multiple PWA config changes attempted (service worker, caching) |
| Feb 3, 2026 ~2:00 AM CT | Reverted all changes to commit `be1d8e5` |
| Feb 3, 2026 ~2:30 AM CT | Issue persists even after revert |
| Feb 3, 2026 ~morning | Issue still present |

**Changes Made in Problem Window:**
- Share modal z-index fixes
- Service worker caching strategy changes (NetworkOnly for navigations)
- Added `navigateFallbackDenylist` entries
- Added force service worker update logic
- Added critical update banner (later removed)
- Changed `registerType` from `prompt` to `autoUpdate` (reverted)
- All changes reverted to `be1d8e5`

---

## Reproduction Steps

### Path A: PWA Installed (FAILS)
1. Install MusicBizQR PWA from Chrome
2. Open device camera app
3. Point at any MBQ QR code
4. Camera decodes URL, shows chip
5. Tap chip or wait for auto-action
6. **Result:** "No apps installed to scan QR code"

### Path B: PWA Uninstalled (WORKS)
1. Uninstall MusicBizQR PWA
2. Open device camera app
3. Point at same QR code
4. Camera decodes URL, shows chip
5. Tap chip
6. **Result:** Opens in Chrome, redirects correctly

### Scanner Comparison
| Scanner | PWA Installed | PWA Uninstalled |
|---------|---------------|-----------------|
| Built-in Camera | ❌ Error | ✅ Works |
| Google Lens | ✅ Opens PWA | ✅ Opens Chrome |
| Gamma Play QR | ✅ Opens PWA | ✅ Opens Chrome |
| Tap URL in Notes | ✅ Opens PWA | ✅ Opens Chrome |

---

## Evidence Pack (TO BE COLLECTED)

### Version Forensics
The following versions should be collected from the device:

| Component | Version | Last Updated |
|-----------|---------|--------------|
| Chrome | [COLLECT] | [COLLECT] |
| Android System WebView | [COLLECT] | [COLLECT] |
| Camera App | [COLLECT] | [COLLECT] |
| Google Play Services | [COLLECT] | [COLLECT] |
| Device Personalization Services | [COLLECT] | [COLLECT] |
| Android Version | [COLLECT] | N/A |

**Action:** Check Play Store → Manage apps & device → Updates for recent update history between "worked" and "broken" dates.

### Link Handling Settings
Collect from Settings → Apps → MusicBizQR (WebAPK):

| Setting | Value |
|---------|-------|
| "Open supported links" enabled? | [COLLECT] |
| Listed domains | [COLLECT] |
| Shows "verified"? | [COLLECT] |
| Default browser app | [COLLECT] |
| Global "Open links in apps" setting | [COLLECT] |

### Camera Scanner Settings
Collect from Camera app settings:

| Setting | Value |
|---------|-------|
| "Scan QR codes" enabled? | [COLLECT] |
| "Smart suggestions" toggle | [COLLECT] |
| Can choose "Open in browser" vs "Open in app"? | [COLLECT] |
| Long-press offers copy/open options? | [COLLECT] |

---

## Controlled Experiments Matrix

| QR Content | Scanner | PWA Status | Result |
|------------|---------|------------|--------|
| `https://musicbizqr.com/` | Built-in Camera | Installed | [TEST] |
| `https://musicbizqr.com/` | Built-in Camera | Uninstalled | [TEST] |
| `https://musicbizqr.com/directqr?id=79` | Built-in Camera | Installed | ❌ Error |
| `https://musicbizqr.com/directqr?id=79` | Built-in Camera | Uninstalled | ✅ Works |
| `https://musicbizqr.com/directqr?id=79` | Google Lens | Installed | ✅ Opens PWA |
| `https://musicbizqr.com/directqr?id=79` | Gamma Play | Installed | ✅ Opens PWA |
| Tap URL in Notes/SMS | N/A | Installed | ✅ Opens PWA |

---

## Hypotheses & Tests

### Hypothesis 1: OEM Camera Scanner Bug
**Theory:** The REVVL stock camera QR scanner uses a different/broken intent resolution path that doesn't properly support WebAPK handlers.

| Test | Expected if True | Observed | Conclusion |
|------|------------------|----------|------------|
| Lens works with PWA | Yes | ✅ Yes | Supports theory |
| Third-party scanner works | Yes | ✅ Yes | Supports theory |
| Tapping URL works | Yes | ✅ Yes | Supports theory |
| Only stock camera fails | Yes | ✅ Yes | **STRONGLY SUPPORTS** |

### Hypothesis 2: WebAPK Not Verified
**Theory:** The WebAPK is not properly verified for the domain, causing intent resolution to fail.

| Test | Expected if True | Observed | Conclusion |
|------|------------------|----------|------------|
| No `assetlinks.json` file | Yes | ✅ Yes (confirmed) | Supports theory |
| "Open supported links" shows unverified | Yes | [COLLECT] | Pending |
| Lens would also fail | Maybe | ❌ No (Lens works) | **WEAKENS** theory |

**Note:** MusicBizQR does NOT have an `assetlinks.json` file at `/.well-known/assetlinks.json`. This is typically required for Android App Links verification. However, WebAPKs generated by Chrome may have different verification requirements.

### Hypothesis 3: Intent Resolver Cache Corruption
**Theory:** The camera app's intent resolver cached a bad state after PWA install/update.

| Test | Expected if True | Observed | Conclusion |
|------|------------------|----------|------------|
| Clear camera cache fixes it | Yes | [TEST] | Pending |
| Clear camera data fixes it | Yes | [TEST] | Pending |
| Reboot fixes it | Maybe | [TEST] | Pending |
| Reinstall PWA fixes it | Maybe | [TEST] | Pending |

### Hypothesis 4: Silent App Update
**Theory:** A silent update to Camera, Chrome, WebView, or Play Services changed behavior.

| Test | Expected if True | Observed | Conclusion |
|------|------------------|----------|------------|
| Recent updates in Play Store history | Yes | [COLLECT] | Pending |
| Same behavior on other devices | No | [TEST] | Pending |

### Hypothesis 5: PWA Manifest Scope Issue
**Theory:** `scope: "/"` causes Android to claim ALL URLs, but the PWA can't properly handle deep links.

| Test | Expected if True | Observed | Conclusion |
|------|------------------|----------|------------|
| Manifest has `scope: "/"` | Yes | ✅ Yes | Supports theory |
| Restricting scope would fix | Yes | Not tested (no code changes) | N/A |

---

## Technical Analysis

### Current PWA Configuration

```json
// manifest.webmanifest
{
  "scope": "/",
  "start_url": "/",
  "display": "standalone"
}
```

**Issue:** `scope: "/"` tells Android the PWA handles ALL URLs on the domain.

### Missing: Digital Asset Links

**Finding:** No `assetlinks.json` file exists at `/.well-known/assetlinks.json`

Per Android documentation:
> "On Android 12 and higher, a generic web intent resolves to an activity in your app only if your app is approved for the specific domain contained in that web intent."

Without `assetlinks.json`, the WebAPK may not be "verified" for the domain, causing some intent resolvers (like the stock camera) to fail while others (like Lens) succeed.

### Android 12+ Intent Resolution Changes

From [Android Developer Docs](https://developer.android.com/training/app-links/verify-applinks):
> "Starting in Android 12 (API level 31), a generic web intent resolves to an activity in your app only if your app is approved for the specific domain."

The REVVL 6x 5G likely runs Android 12 or 13, which has stricter intent resolution requirements.

---

## Most Likely Root Cause

**Primary Theory: OEM Camera Scanner + Unverified WebAPK**

The combination of:
1. **No `assetlinks.json`** → WebAPK is not "verified" for the domain
2. **REVVL stock camera** uses strict intent resolution that requires verification
3. **Google Lens and third-party scanners** use more permissive resolution

**Why it "worked yesterday":**
- Chrome/WebView/Camera app silent updates may have changed behavior
- WebAPK re-registration after PWA changes may have reset verification state
- Intent resolver cache may have been in a "good" state that got corrupted

**Why revert didn't fix it:**
- The issue is in the device's intent resolver state, not the code
- Once the WebAPK is in a "bad" state, code changes don't fix it
- The device needs cache clearing or WebAPK re-registration

---

## User Impact Assessment

### Scope
| Question | Assessment |
|----------|------------|
| Single device or systemic? | **Likely device/OEM-specific** |
| Affects all REVVL devices? | Unknown - needs testing |
| Affects other Android devices? | Unknown - needs testing |
| Affects iOS? | No - iOS doesn't use WebAPK |

### Prevalence Estimation
Without another phone to test:
- Check online forums for REVVL + PWA + QR issues
- Check Chrome bug tracker for WebAPK intent issues
- Ask users to report if they experience similar issues

---

## Mitigations (Research Only - No Code)

### Device-Side Mitigations

| Action | Steps | Expected Result |
|--------|-------|-----------------|
| Clear Camera cache | Settings → Apps → Camera → Storage → Clear Cache | May fix resolver cache |
| Clear Camera data | Settings → Apps → Camera → Storage → Clear Data | Stronger cache reset |
| Reset app preferences | Settings → Apps → Reset app preferences | Resets all default handlers |
| Uninstall/reinstall PWA | Remove from home screen, reinstall from Chrome | Re-registers WebAPK |
| Disable "Open supported links" | Settings → Apps → MusicBizQR → Opening links → Off | Forces browser fallback |
| Reboot device | Power cycle | Clears runtime caches |
| Check for updates | Play Store → Check for updates | May get fixed version |

### User Support Guidance

**Short version for users:**
> "If QR codes aren't working, try using Google Lens instead of your camera app to scan. Alternatively, you can temporarily uninstall the MusicBizQR app, scan the QR code, then reinstall the app later."

---

## Next Actions (If Code Changes Allowed Later)

**Lowest-risk, reversible options:**

1. **Add `assetlinks.json`** - Create proper Digital Asset Links file for domain verification
2. **Restrict PWA scope** - Change `scope` from `/` to `/dashboard` so band pages open in browser
3. **Add `capture_links: "none"`** - Tell Android not to capture external links
4. **Test on multiple devices** - Verify if issue is REVVL-specific or systemic

---

## Required Data Collection Checklist

- [ ] Chrome version
- [ ] Android System WebView version
- [ ] Camera app version
- [ ] Google Play Services version
- [ ] Android OS version
- [ ] Recent Play Store update history
- [ ] "Open supported links" setting for MusicBizQR
- [ ] Whether domain shows "verified"
- [ ] Camera app QR settings
- [ ] Result of clearing camera cache
- [ ] Result of clearing camera data
- [ ] Result of device reboot
- [ ] Result of PWA reinstall
- [ ] Test on second Android device (if available)

---

## Appendix: URL Integrity Check

Using Gamma Play scanner (which works), verify the exact decoded payload:

**Expected format:**
```
https://musicbizqr.com/directqr?id=79
```

**Check for:**
- [ ] Starts with `https://` (not `http://`)
- [ ] No leading/trailing spaces
- [ ] No brackets or markdown formatting
- [ ] No newline characters
- [ ] Exact match to expected URL

---

*Report generated: February 3, 2026*  
*Status: Awaiting device-side data collection*
