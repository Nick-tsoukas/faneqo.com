# Corvana SEO API Documentation

AI-powered SEO analysis system for MusicBizQR using Google Search Console data.

## Environment Variables

Required env vars in `.env`:

```env
# Google OAuth for Search Console API
CORVANA_GOOGLE_CLIENT_ID=your_client_id
CORVANA_GOOGLE_CLIENT_SECRET=your_client_secret
CORVANA_GOOGLE_REDIRECT_URI=http://localhost:3000/api/corvana/google/callback
CORVANA_GSC_SITE_URL=sc-domain:musicbizqr.com

# Optional: Admin protection for production
CORVANA_ADMIN_TOKEN=your_secure_random_token

# Strapi connection (should already be configured)
STRAPI_URL=http://localhost:1337
# or for production:
# STRAPI_URL=https://qrserver-production.up.railway.app
```

## OAuth Setup

### 1. Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select project
3. Enable Google Search Console API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/corvana/google/callback` (local)
   - `https://musicbizqr.com/api/corvana/google/callback` (production)

### 2. Connect OAuth

1. Visit: `http://localhost:3000/api/corvana/google/connect`
2. Sign in with Google account that has Search Console access
3. Grant `webmasters.readonly` permission
4. Success message appears when connected

### 3. Verify Connection

```bash
curl http://localhost:3000/api/corvana/search-console/test
```

Should return Search Console data with clicks, impressions, and queries.

## Endpoints

### OAuth & Connection

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/corvana/google/connect` | GET | Start OAuth flow |
| `/api/corvana/google/callback` | GET | OAuth callback handler |
| `/api/corvana/search-console/test` | GET | Test connection |

### Article Inventory

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/corvana/seo/articles/inventory` | GET | Fetch Strapi article inventory |

**Query params:**
- `category` - filter by category (optional)
- `limit` - max articles (default 200)

### SEO Export Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/corvana/seo/export/snapshot` | GET | Full site SEO snapshot |
| `/api/corvana/seo/export/upgrade-queue` | GET | Prioritized pages to upgrade |
| `/api/corvana/seo/export/cannibalization` | GET | Query cannibalization analysis |
| `/api/corvana/seo/export/page-detail` | GET | Single page deep-dive |
| `/api/corvana/seo/export/chatgpt-prompt` | GET | Generate ChatGPT prompt |

**Common query params:**
- `days` - 28 (default) or 90
- `limit` - max results

**Page detail params:**
- `url` - required, URL-encoded page URL

### SEO Report Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/corvana/seo/report/cluster-health` | GET | Cluster performance report |
| `/api/corvana/seo/report/query-ownership` | GET | Query ownership mapping |
| `/api/corvana/seo/report/internal-links` | GET | Internal link recommendations |

### Upgrade Tracker

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/corvana/seo/upgrades` | GET | List all upgrades |
| `/api/corvana/seo/upgrades/mark` | POST | Mark a page as upgraded |
| `/api/corvana/seo/upgrades/report` | GET | Before/after comparison report |

**POST body for mark:**
```json
{
  "page": "https://musicbizqr.com/article/qr-code-strategy/example",
  "upgradeType": "TITLE_META_REWRITE",
  "notes": "Rewrote title and meta description for better CTR",
  "changedFields": ["title", "metaDescription"],
  "date": "2026-05-28T10:00:00Z"
}
```

**Upgrade types:**
- `TITLE_META_REWRITE`
- `ARTICLE_REFRESH`
- `INTERNAL_LINKING`
- `PILLAR_STRENGTHENING`
- `REDIRECT_MERGE`
- `HOMEPAGE_SEO_UPGRADE`

## Local Test URLs

```bash
# Test connection
curl http://localhost:3000/api/corvana/search-console/test

# Full snapshot
curl http://localhost:3000/api/corvana/seo/export/snapshot

# Upgrade queue
curl http://localhost:3000/api/corvana/seo/export/upgrade-queue

# Cannibalization
curl http://localhost:3000/api/corvana/seo/export/cannibalization

# Cluster health
curl http://localhost:3000/api/corvana/seo/report/cluster-health

# Query ownership
curl http://localhost:3000/api/corvana/seo/report/query-ownership

# Internal links
curl http://localhost:3000/api/corvana/seo/report/internal-links

# Page detail (encode URL)
curl "http://localhost:3000/api/corvana/seo/export/page-detail?url=https%3A%2F%2Fmusicbizqr.com%2F"

# Article inventory
curl http://localhost:3000/api/corvana/seo/articles/inventory

# ChatGPT prompt
curl "http://localhost:3000/api/corvana/seo/export/chatgpt-prompt?type=snapshot"

# List upgrades
curl http://localhost:3000/api/corvana/seo/upgrades

# Mark upgrade
curl -X POST http://localhost:3000/api/corvana/seo/upgrades/mark \
  -H "Content-Type: application/json" \
  -d '{
    "page": "https://musicbizqr.com/article/qr-code-strategy/test",
    "upgradeType": "TITLE_META_REWRITE",
    "notes": "Updated title tag"
  }'

# Upgrade report
curl http://localhost:3000/api/corvana/seo/upgrades/report
```

## Production Test URLs

Replace `localhost:3000` with `musicbizqr.com`:

```bash
curl https://musicbizqr.com/api/corvana/seo/export/snapshot
```

## Dashboard UI

Visit `/corvana/seo` for the web dashboard:
- Test connection
- Copy SEO data for ChatGPT
- View all reports
- Mark and track upgrades

## What Each Report Is For

### SEO Snapshot
Full site analysis combining Search Console data with insights. Use this to:
- Understand current performance
- Identify easy wins (position 5-25)
- Spot cannibalization risks
- Copy into ChatGPT for strategy recommendations

### Upgrade Queue
Prioritized list of pages needing work. Scored by:
- Position (5-15 gets highest priority)
- Intent (high-intent queries prioritized)
- Impressions (volume matters)
- CTR issues (0 clicks despite impressions)

### Cannibalization Report
Finds queries competing across multiple pages. Helps decide:
- Which page should "own" each query
- Whether to keep, retarget, merge, or redirect
- Internal linking strategy

### Cluster Health
Shows performance per content cluster (smart-links, qr-code-strategy, etc.). Reveals:
- Which clusters need attention
- Old articles needing refresh
- Easy wins per cluster
- Strategic recommendations

### Query Ownership
Maps each important query to its ideal owner page. Addresses:
- Homepage vs article conflicts
- Multiple articles targeting same query
- Intent mismatch detection
- Internal linking instructions

### Internal Links
Specific link recommendations for each page based on:
- Cluster membership
- High-intent queries
- Pillar page structure
- Authority flow

### Page Detail
Deep-dive on single page including:
- All queries it ranks for
- Competing pages
- Winning vs losing queries
- Specific recommendations

### Upgrade Tracker
Before/after tracking for SEO changes:
- Record what was changed
- Capture before metrics
- Compare to current performance
- Calculate improvement percentage

## Weekly Workflow

### Week Start (Monday)

1. **Pull snapshot**
   ```bash
   curl http://localhost:3000/api/corvana/seo/export/snapshot > snapshot.json
   ```

2. **Review in ChatGPT**
   - Copy snapshot JSON
   - Use prompt generator for context
   - Get top 5 priorities

3. **Check upgrade queue**
   ```bash
   curl http://localhost:3000/api/corvana/seo/export/upgrade-queue > queue.json
   ```

4. **Select 3 actions for the week**
   - Focus on HIGH or CRITICAL priority
   - Mix of quick wins (low effort) and strategic

### Mid-Week (Wednesday)

5. **Implement changes**
   - Homepage upgrades
   - Article refreshes
   - Internal linking

6. **Mark upgrades in tracker**
   ```bash
   curl -X POST http://localhost:3000/api/corvana/seo/upgrades/mark \
     -H "Content-Type: application/json" \
     -d '{
       "page": "https://musicbizqr.com/...",
       "upgradeType": "TITLE_META_REWRITE",
       "notes": "Updated title and meta"
     }'
   ```

### Week End (Friday)

7. **Document learnings**
   - What worked
   - What didn't
   - Questions for next week

### After 28 Days

8. **Check upgrade results**
   ```bash
   curl http://localhost:3000/api/corvana/seo/upgrades/report
   ```

9. **Assess impact**
   - SUCCESS: Document and replicate
   - MODERATE_SUCCESS: Iterate
   - NEEDS_REVIEW: Try different approach

## Important Warnings

### DO NOT AUTO-DELETE OR AUTO-REDIRECT

All recommendations require **manual review** before implementation:

- Review competing pages for unique content
- Check user intent alignment
- Verify no traffic loss risk
- Only redirect if pages are **exact duplicates**

### Safe Change Order

1. **Start with read-only analysis** (current phase)
2. **Manual review** of all recommendations
3. **Test changes** on low-traffic pages first
4. **Monitor for 2-4 weeks** before judging success
5. **Document results** for future decisions

### Content Decisions

| Situation | Action |
|-----------|--------|
| Exact duplicate content | Consider merge/redirect |
| Similar but unique angles | Keep both, retarget secondary |
| Homepage vs article conflict | Decide by intent match |
| Multiple weak articles | Merge into comprehensive guide |
| Old outdated content | Refresh, don't delete |

### Google Processing Time

- Title/meta changes: 7-14 days
- Content updates: 14-28 days
- Internal link changes: 14-28 days
- Major restructuring: 28-56 days

**Never judge an upgrade before 28 days.**

## Files Created

```
server/
  utils/
    corvanaAuth.ts              # Admin token protection
    seoExportUtils.ts           # Shared SEO helpers
    upgradeTracker.ts           # File-based upgrade storage
  api/
    corvana/
      google/
        connect.get.ts          # OAuth start
        callback.get.ts         # OAuth callback
      search-console/
        test.get.ts             # Connection test
      seo/
        articles/
          inventory.get.ts      # Strapi article sync
        export/
          snapshot.get.ts       # Full SEO snapshot
          upgrade-queue.get.ts  # Prioritized upgrades
          cannibalization.get.ts # Query conflicts
          page-detail.get.ts    # Single page analysis
          chatgpt-prompt.get.ts # Prompt generator
        report/
          cluster-health.get.ts # Cluster performance
          query-ownership.get.ts # Query ownership map
          internal-links.get.ts # Link recommendations
        upgrades/
          index.get.ts          # List upgrades
          mark.post.ts          # Mark new upgrade
          report.get.ts         # Before/after report

pages/
  corvana/
    seo.vue                     # Dashboard UI

docs/
  corvana-seo-api.md          # This documentation
```

## Files Modified

- `nuxt.config.ts` - Added Corvana runtime config
- `package.json` - Added `googleapis` dependency

## TODOs

### Database Migration

Current: File-based storage (`.corvana-data/upgrades.json`)

Future: Strapi entity for production:
```
api::corvana-upgrade.corvana-upgrade
- page: string
- upgradeType: enum
- notes: text
- beforeMetrics: json
- afterMetrics: json
- upgradeDate: datetime
```

### Additional Features

- [ ] Email notifications for upgrade milestones
- [ ] Slack integration for team alerts
- [ ] Automated weekly report generation
- [ ] Historical trend analysis
- [ ] Competitor tracking
- [ ] Content calendar integration

## Support

For issues:
1. Check connection: `/api/corvana/search-console/test`
2. Verify env vars are loaded
3. Check server logs for errors
4. Reconnect OAuth if token expired

## Assumptions About Strapi

The article inventory endpoint assumes:

- Content type: `seo-page`
- Endpoint: `/api/seo-pages`
- Fields: `title`, `slug`, `category`, `metaTitle`, `metaDescription`, `publishedAt`, `updatedAt`, `isPillar`, `keywords`
- Optional content fields: `content`, `body`, `excerpt`

If your Strapi schema differs, update the field mapping in:
`server/api/corvana/seo/articles/inventory.get.ts`

## Version

- Current: 1.0
- Last updated: 2026-05-28
