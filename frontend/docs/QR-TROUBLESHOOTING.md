# QR Code Troubleshooting Guide

> Quick reference for diagnosing and fixing QR code issues.

---

## Common Issues & Solutions

### 1. "No App Found" / Phone Won't Scan QR

**Symptoms:**
- Phone camera shows "No app to open this"
- QR scanner says content not recognized
- Nothing happens when pointing camera at QR

**Causes:**
1. QR encodes invalid data (not a URL)
2. QR encodes empty string
3. QR encodes just the domain without path

**Diagnosis:**
1. Upload QR image to https://webqr.com/
2. Check what data is encoded
3. Should be: `https://musicbizqr.com/directqr?id=...`

**Fix:**
1. Go to Dashboard → Edit the QR
2. Click Save (regenerates q_image with correct URL)
3. Re-download the QR
4. Scan again

---

### 2. QR Scans But Goes to Wrong Page

**Symptoms:**
- QR scans successfully
- Browser opens but wrong destination

**Causes:**
1. `q_type` doesn't match destination
2. Band/Event relation missing
3. `link` field empty for externalURL type

**Diagnosis:**
Check server logs for:
```
[directqr] QR ID: 46 q_type: bandProfile
[directqr] band relation: null  ← Problem!
```

**Fix:**
1. Edit QR → Ensure band/event is selected
2. For externalURL: Ensure link field has valid URL
3. Save changes

---

### 3. Download Button Doesn't Work

**Symptoms:**
- Click download, nothing happens
- Error in console

**Diagnosis:**
Open browser console (F12) and look for errors:
- `CORS error` → Image fetch blocked
- `undefined` errors → Missing QR data

**Fix:**
- Refresh page and try again
- Check if logged in
- Check if QR exists in database

---

### 4. QR Styling Lost After Download

**Symptoms:**
- Preview looks correct
- Downloaded QR has wrong colors/style

**Causes:**
- `styleOpts` not preserved during export
- Options not saved to database

**Fix:**
1. Edit QR → Make any small change
2. Save → Downloads will now have correct style

---

### 5. Scans Not Being Tracked

**Symptoms:**
- QR works but no scan records
- Analytics empty

**Causes:**
- `/api/scans/track` endpoint failing
- Strapi permissions issue

**Diagnosis:**
Check server logs for scan creation errors.

**Fix:**
- Verify Strapi scan content-type permissions
- Check STRAPI_API_TOKEN is set

---

## Debug Checklist

### For Any QR Issue:

1. **Check the URL encoded in QR:**
   ```
   Upload to webqr.com → Should show:
   https://musicbizqr.com/directqr?id=XXXXX
   ```

2. **Test directqr route:**
   ```
   Open in browser: https://musicbizqr.com/directqr?id=46
   Should redirect to destination
   ```

3. **Check console logs:**
   - Open dashboard, click Download
   - Look for `[QR Download Debug]` messages
   - `FINAL DATA TO ENCODE` should be valid URL

4. **Check Strapi data:**
   - QR record should have:
     - `url`: `https://musicbizqr.com/directqr?id=...`
     - `slugId`: UUID string
     - `options.data`: Same as `url`

---

## Phone Scanner Requirements

### iPhone (iOS 11+):
- Use native Camera app
- Settings → Camera → "Scan QR Codes" must be ON
- Point camera at QR, tap notification banner

### Android:
- Use Google Lens (built into most cameras)
- Or install Google Lens from Play Store
- Point camera at QR

### If Phone Says "No App":
1. The QR data is NOT a valid URL
2. Check what's encoded using webqr.com
3. Re-save the QR to regenerate image

---

## Emergency Fixes

### All QRs Broken:
1. Check if directqr route is working:
   ```
   curl -I https://musicbizqr.com/directqr?id=46
   ```
   Should return `302 Found`

2. If 404: Check `server/routes/directqr.ts` for errors

3. If 500: Check Strapi connection and API token

### Need to Fix All User QRs:
1. Go to `/admin/repair-qrs` (requires login)
2. Click "Repair All QRs"
3. This updates URL fields in database
4. Users still need to re-download for new image

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `server/routes/directqr.ts` | Handles QR scan redirects |
| `components/QrCode.client.vue` | Create new QRs |
| `components/EditQrCode.client.vue` | Edit existing QRs |
| `components/DownloadQr.client.vue` | Download modal |
| `pages/dashboard.vue` | QR list and download trigger |

---

## Contact

If issues persist after trying all fixes, check:
1. Browser console for JavaScript errors
2. Network tab for failed API calls
3. Server logs for backend errors

---

*Last updated: February 2026*
