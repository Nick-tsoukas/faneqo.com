# Band Search Feature

> **Version:** 1.0  
> **Created:** January 2026  
> **Status:** MVP Complete

## Overview

A CodePen-style, full-screen search modal that allows users to discover bands/artists on the platform. Accessible to everyone (no auth required).

---

## Components

### Frontend (qr)

| Component | Path | Description |
|-----------|------|-------------|
| `BandSearchModal.vue` | `components/BandSearchModal.vue` | Full-screen search overlay with input and results |
| `BandSearchCard.vue` | `components/BandSearchCard.vue` | Elite visual card for search results |
| `Header.vue` | `components/Header.vue` | Contains search trigger button and keyboard shortcut |

### Backend (qrdb)

| File | Path | Description |
|------|------|-------------|
| `band.js` (controller) | `src/api/band/controllers/band.js` | Contains `search()` method |
| `band.js` (routes) | `src/api/band/routes/band.js` | Defines `/api/bands/search` route |

---

## API Endpoint

### `GET /api/bands/search`

**Auth:** None (public)

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `q` | string | required | Search query (min 2 characters) |
| `limit` | number | 12 | Max results to return (capped at 50) |

**Response:**
```json
{
  "data": [
    {
      "id": 123,
      "name": "Band Name",
      "slug": "band-name",
      "genre": "Rock",
      "bio": "Truncated bio (120 chars max)...",
      "imageUrl": "https://..."
    }
  ],
  "meta": {
    "total": 5,
    "query": "band"
  }
}
```

**Search Logic:**
- Case-insensitive contains match on `name` field
- Uses Strapi's `$containsi` filter

---

## User Experience

### Triggers
1. **Desktop:** Click search icon in header nav
2. **Mobile:** Tap "Search Artists" in hamburger menu
3. **Keyboard:** `Cmd/Ctrl + K` (global shortcut)

### Behavior
- Full-screen overlay with blurred backdrop
- Auto-focus on search input when opened
- Debounced search (300ms delay)
- Minimum 2 characters required
- Results animate in with staggered delay
- Click result or press Enter to navigate to band page
- ESC or click backdrop to close

### Keyboard Navigation
| Key | Action |
|-----|--------|
| `Cmd/Ctrl + K` | Open search |
| `ESC` | Close search |
| `↑` / `↓` | Navigate results |
| `Enter` | Select highlighted result |

---

## Visual Design

### BandSearchCard
- Gradient background: `from-gray-900/80 via-gray-900/60 to-gray-800/40`
- Hover glow effect with purple/pink gradient
- Band image with ring effect and blur glow on hover
- Genre displayed as purple pill/tag
- Bio preview with 2-line clamp
- Arrow indicator slides in on hover
- Bottom gradient accent bar on hover

### BandSearchModal
- Backdrop: `bg-black/90 backdrop-blur-xl`
- Search input with animated glow border
- Loading spinner during search
- Empty states for: initial, no results, min characters
- Footer with keyboard hints

---

## Future Improvements (V2+)

### Search Enhancements
- [ ] Search by genre
- [ ] Search by location/city
- [ ] Fuzzy matching (typo tolerance)
- [ ] Search history (recent searches)
- [ ] Popular/trending bands section
- [ ] Filter by: has upcoming events, has music, etc.

### UI/UX
- [ ] Skeleton loading states for cards
- [ ] Infinite scroll for more results
- [ ] Preview audio on hover (if band has featured song)
- [ ] "Save" button on cards
- [ ] Recently viewed bands
- [ ] Personalized recommendations

### Performance
- [ ] Server-side caching of search results
- [ ] Elasticsearch/Algolia integration for better fuzzy search
- [ ] Prefetch popular searches

### Analytics
- [ ] Track search queries
- [ ] Track click-through rates
- [ ] A/B test card designs

---

## Code Examples

### Opening Search Programmatically
```vue
<script setup>
const isSearchOpen = ref(false)

function openSearch() {
  isSearchOpen.value = true
}
</script>

<template>
  <BandSearchModal
    :is-open="isSearchOpen"
    @close="isSearchOpen = false"
    @select="(band) => router.push(`/${band.slug}`)"
  />
</template>
```

### Customizing Search Results
The `BandSearchCard` component accepts a `band` prop with this shape:
```ts
interface BandSearchResult {
  id: number
  name: string
  slug: string
  genre: string | null
  bio: string | null
  imageUrl: string | null
}
```

---

## Testing

### Manual Testing Checklist
- [ ] Search returns results for valid queries
- [ ] Empty state shows for no results
- [ ] Min 2 character requirement works
- [ ] Keyboard shortcut opens modal
- [ ] ESC closes modal
- [ ] Clicking result navigates to band page
- [ ] Mobile menu search button works
- [ ] Loading spinner shows during search
- [ ] Debounce prevents excessive API calls

### API Testing
```bash
# Test search endpoint
curl "http://localhost:1337/api/bands/search?q=test&limit=5"
```

---

## Dependencies

- `@vueuse/core` - `useDebounceFn` for search debouncing
- Tailwind CSS - All styling
- Nuxt 3 - `Teleport`, routing, runtime config
