# Fans Module

The Fans module enables artists to capture, manage, and analyze their fan list directly within MusicBizQR.

## Overview

This is MBQ's owned audience system — not just a generic email list. Artists can:
- Capture fans from their band page and follow modal
- Import existing fan lists via CSV
- Export fan data for use in other tools
- Track fan growth and acquisition sources
- Manage their audience in one place

---

## Data Model

### Fan Collection Type

Location: `qrdb/src/api/fan/content-types/fan/schema.json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Fan's email address (normalized: trimmed, lowercase) |
| `status` | enum | Yes | `subscribed` or `unsubscribed` |
| `source` | enum | Yes | Where the fan came from |
| `subscribedAt` | datetime | Yes | When the fan joined |
| `band` | relation | Yes | The band this fan belongs to |
| `notes` | text | No | Optional notes about the fan |
| `importBatchId` | string | No | Batch ID for imported fans |
| `metadata` | json | No | Additional metadata for future use |

### Source Enum Values

| Value | Description |
|-------|-------------|
| `band_page` | Signed up from the public band page |
| `follow_modal` | Signed up via the follow modal |
| `import` | Imported via CSV |
| `manual` | Manually added by the artist |
| `other` | Other/unknown source |

### Band Fan Capture Fields

Added to the Band schema for customizing the public fan capture UI:

| Field | Type | Default |
|-------|------|---------|
| `fanCaptureEnabled` | boolean | `true` |
| `fanCaptureHeadline` | string | `"Join the fan list"` |
| `fanCaptureMessage` | text | `"Get first access to merch drops, show announcements, discounted shows, and exclusive updates."` |
| `fanCaptureButtonLabel` | string | `"Join Fan List"` |
| `fanCaptureSuccessMessage` | string | `"You're on the list."` |

---

## API Endpoints

All authenticated endpoints require a valid JWT token and automatically scope to the current user's band.

### Get Fans List

```
GET /api/fans/my-fans
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `pageSize` | number | 25 | Items per page |
| `sortField` | string | `subscribedAt` | Field to sort by |
| `sortOrder` | string | `desc` | Sort direction (`asc` or `desc`) |
| `search` | string | — | Search by email |
| `source` | string | — | Filter by source |
| `status` | string | — | Filter by status |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "email": "fan@example.com",
      "status": "subscribed",
      "source": "band_page",
      "subscribedAt": "2026-03-06T12:00:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 1
    }
  }
}
```

### Get Fan Analytics

```
GET /api/fans/my-fans-analytics
```

**Response:**
```json
{
  "data": {
    "totalFans": 150,
    "newFans7d": 12,
    "newFans30d": 45,
    "topSource": "band_page",
    "sourceBreakdown": {
      "band_page": 80,
      "follow_modal": 30,
      "import": 25,
      "manual": 10,
      "other": 5
    },
    "growthSeries": [
      { "date": "2026-02-05", "count": 2 },
      { "date": "2026-02-06", "count": 5 }
    ]
  }
}
```

### Import Fans

```
POST /api/fans/import
```

**Request Body:**
```json
{
  "fans": [
    { "email": "fan1@example.com" },
    { "email": "fan2@example.com" }
  ]
}
```

**Response:**
```json
{
  "data": {
    "totalRows": 100,
    "imported": 85,
    "duplicates": 10,
    "invalid": 5
  }
}
```

### Export Fans

```
GET /api/fans/export
```

**Response:**
```json
{
  "data": [
    {
      "email": "fan@example.com",
      "source": "band_page",
      "status": "subscribed",
      "subscribedAt": "2026-03-06T12:00:00.000Z"
    }
  ]
}
```

### Add Single Fan (Manual)

```
POST /api/fans/add
```

**Request Body:**
```json
{
  "email": "newfan@example.com",
  "notes": "Met at SXSW 2026"
}
```

### Public Subscribe (For Future Use)

```
POST /api/fans/subscribe
```

This endpoint is public (no auth required) for use by the band page fan capture UI.

**Request Body:**
```json
{
  "email": "fan@example.com",
  "bandId": 123,
  "source": "band_page"
}
```

---

## Frontend Components

### Dashboard Card

**Location:** `components/dashboard/fans/FansDashboardCard.vue`

The Fans card appears on the main dashboard after the Events section. Features:
- Pink/purple gradient header matching MBQ style
- Real fan list with sorting and pagination
- Import/Export buttons
- Analytics link to dedicated page
- Empty state with helpful messaging

### Analytics Page

**Location:** `pages/fans.vue`

The dedicated `/fans` page provides:
- **Stats Cards**: Total fans, 7-day growth, 30-day growth, top source
- **Growth Chart**: Visual 30-day fan acquisition trend
- **Source Breakdown**: Where fans are coming from
- **Full Table**: Searchable, filterable, sortable fan list with pagination

### Import Modal

**Location:** `components/dashboard/fans/FansImportModal.vue`

- Drag-and-drop CSV upload
- Automatic email validation and deduplication
- Import result summary (imported, duplicates, invalid)

### Composable

**Location:** `composables/useFans.js`

Methods:
- `getFans(options)` - Fetch paginated fan list
- `getFanAnalytics()` - Fetch analytics data
- `importFans(fans)` - Import fan array
- `exportFans()` - Export all fans
- `addFan({ email, notes })` - Add single fan
- `parseCSV(text)` - Parse CSV text to fan array
- `generateCSV(fans)` - Generate CSV from fan data
- `downloadCSV(content, filename)` - Trigger CSV download
- `formatSource(source)` - Format source for display
- `formatDate(date)` - Format date for display

---

## Business Rules

### Email Normalization
All emails are normalized before storage:
- Trimmed of whitespace
- Converted to lowercase

### Deduplication
- A fan email can only exist once per band
- Same email can exist across different bands
- Import automatically skips duplicates

### Ownership Security
- All authenticated endpoints verify the current user owns the band
- `bandId` is never trusted from frontend for authenticated routes
- Public subscribe endpoint validates band exists and has fan capture enabled

---

## CSV Format

### Import
Minimum required: one column with email addresses.

```csv
email
fan1@example.com
fan2@example.com
```

Or just emails without header:
```
fan1@example.com
fan2@example.com
```

### Export
```csv
Email,Source,Status,Date Joined
fan@example.com,band_page,subscribed,Mar 6, 2026
```

---

## Future Enhancements

The following are prepared but not yet implemented:

1. **Public Fan Capture UI** - Component for band page and follow modal
2. **Unsubscribe Flow** - Allow fans to unsubscribe
3. **Email Integration** - Connect to email marketing platforms
4. **Fan Segments** - Group fans by behavior or attributes
5. **Fan Activity Tracking** - Track engagement beyond subscription

---

## File Locations

### Backend (qrdb)
- `src/api/fan/content-types/fan/schema.json` - Collection type
- `src/api/fan/services/fan.js` - Business logic
- `src/api/fan/controllers/fan.js` - API handlers
- `src/api/fan/routes/fan.js` - Route definitions

### Frontend (qr)
- `composables/useFans.js` - API composable
- `components/dashboard/fans/FansDashboardCard.vue` - Dashboard card
- `components/dashboard/fans/FansImportModal.vue` - Import modal
- `components/dashboard/fans/FansStats.vue` - Stats cards
- `components/dashboard/fans/FansGrowthChart.vue` - Growth chart
- `components/dashboard/fans/FansSourceBreakdown.vue` - Source breakdown
- `pages/fans.vue` - Analytics page
- `pages/dashboard.vue` - Dashboard integration
