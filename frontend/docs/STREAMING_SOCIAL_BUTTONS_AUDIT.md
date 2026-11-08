# Streaming & Social Buttons - Complete Audit

**Purpose:** This document provides a complete audit of the streaming and social button system for adding new platforms.

---

## Quick Reference: All Links by Category

### 🎵 STREAMING (18 platforms - for music listening)

| # | Platform | Database Key | Icon Asset | Displayed |
|---|----------|--------------|------------|-----------|
| 1 | YouTube | `youtube` | `youtube-icon.svg` | ✅ Yes |
| 2 | YouTube Music | `youtubeMusic` | `youtube-icon.svg` | ✅ Yes |
| 3 | Spotify | `spotify` | `spotify.svg` | ✅ Yes |
| 4 | Apple Music | `appleMusic` | `apple.svg` | ✅ Yes |
| 5 | Amazon Music | `amazonMusic` | `amazon-music.svg` | ✅ Yes |
| 6 | TIDAL | `tidal` | `tidal.svg` | ✅ Yes |
| 7 | Pandora | `pandora` | `pandora.svg` | ✅ Yes |
| 8 | SoundCloud | `soundcloud` | `soundcloudlast.png` | ✅ Yes |
| 9 | Audiomack | `audiomack` | `audiomack.svg` | ✅ Yes |
| 10 | Bandcamp | `bandcamp` | `bandcamp.svg` | ✅ Yes |
| 11 | Deezer | `deezer` | `dezzer.svg` | ✅ Yes |
| 12 | Mixcloud | `mixcloud` | `mixcloud.svg` | ✅ Yes |
| 13 | Beatport | `beatport` | `beatport.svg` | ✅ Yes |
| 14 | Napster | `napster` | `napster.svg` | ✅ Yes |
| 15 | Twitch | `twitch` | `twitchfree.png` | ✅ Yes |
| 16 | Vimeo | `vimeo` | `vimeo.svg` | ✅ Yes |
| 17 | Kick | `kick` | `kick.svg` | ✅ Yes |
| 18 | Reverbnation | `reverbnation` | `reverbnation.png` | ✅ Yes |

### 📱 SOCIAL (10 platforms displayed, 2 hidden)

| # | Platform | Database Key | Icon Asset | Displayed |
|---|----------|--------------|------------|-----------|
| 1 | Facebook | `facebook` | `facebookfree.png` | ✅ Yes |
| 2 | Instagram | `instagram` | `instagramfree.png` | ✅ Yes |
| 3 | Twitter | `twitter` | `twitter.png` | ✅ Yes |
| 4 | TikTok | `tiktok` | `tiktok.png` | ✅ Yes |
| 5 | Threads | `threads` | `threads.svg` | ✅ Yes |
| 6 | Discord | `discord` | `discord.svg` | ✅ Yes |
| 7 | Telegram | `telegram` | `telegram.svg` | ✅ Yes |
| 8 | Reddit | `reddit` | `reddit.svg` | ✅ Yes |
| 9 | Pinterest | `pinterest` | `pinterest.svg` | ✅ Yes |
| 10 | LinkedIn | `linkedin` | `linkedin.svg` | ✅ Yes |
| 11 | WhatsApp | `whatsapp` | ❌ None | ⚠️ Edit form only |
| 12 | Snapchat | `snapchat` | ❌ None | ⚠️ Edit form only |

### 📅 EVENT HUBS (2 platforms - NEW CATEGORY)

| # | Platform | Database Key | Icon Asset | Displayed |
|---|----------|--------------|------------|-----------|
| 1 | Bandsintown | `bandsintown` | `bandsintown.svg` | ✅ Yes |
| 2 | Songkick | `songkick` | `songkick.svg` | ✅ Yes |

---

## Category Definitions

**STREAMING** = Platforms where fans can **listen to music**
- Music streaming services (Spotify, Apple Music, Amazon Music, TIDAL, Pandora, Deezer, Napster)
- Video platforms with music (YouTube, YouTube Music, Vimeo)
- Artist-focused platforms (Bandcamp, SoundCloud, Audiomack, Mixcloud, Beatport, Reverbnation)
- Live streaming (Twitch, Kick)

**SOCIAL** = Platforms for **following/engaging** with the artist
- Social networks (Facebook, Instagram, Twitter/X, TikTok, Threads, Reddit, Pinterest, LinkedIn)
- Community platforms (Discord, Telegram)
- Messaging apps (WhatsApp, Snapchat) - currently hidden

**EVENT HUBS** = Platforms for **concert discovery and ticketing**
- Bandsintown - Concert tracking and notifications
- Songkick - Tour dates and ticket alerts

---

## Current Platforms Detail

### Streaming Platforms (9 total)

| Platform | Database Key | Icon Asset | Label |
|----------|--------------|------------|-------|
| YouTube | `youtube` | `@/assets/youtube-icon.svg` | YouTube |
| YouTube Music | `youtubeMusic` | `@/assets/youtube-icon.svg` | YouTube Music |
| Spotify | `spotify` | `@/assets/spotify.svg` | Spotify |
| Apple Music | `appleMusic` | `@/assets/apple.svg` | Apple Music |
| Reverbnation | `reverbnation` | `@/assets/reverbnation.png` | Reverbnation |
| SoundCloud | `soundcloud` | `@/assets/soundcloudlast.png` | SoundCloud |
| Bandcamp | `bandcamp` | `@/assets/bandcamp.svg` | Bandcamp |
| Twitch | `twitch` | `@/assets/twitchfree.png` | Twitch |
| Deezer | `deezer` | `@/assets/dezzer.svg` | Deezer |

### Social Platforms (4 displayed + 2 hidden)

| Platform | Database Key | Icon Asset | Label |
|----------|--------------|------------|-------|
| Facebook | `facebook` | `@/assets/facebookfree.png` | Facebook |
| Instagram | `instagram` | `@/assets/instagramfree.png` | Instagram |
| Twitter | `twitter` | `@/assets/twitter.png` | Twitter |
| TikTok | `tiktok` | `@/assets/tiktok.png` | TikTok |

### ⚠️ In Edit Form but NOT Displayed on Band Page

| Platform | Database Key | Category | Status |
|----------|--------------|----------|--------|
| WhatsApp | `whatsapp` | Social | In edit form, NO icon, NOT in display array |
| Snapchat | `snapchat` | Social | In edit form, NO icon, NOT in display array |

---

## Files to Modify When Adding a Platform

### 1. Database Schema (Strapi)

**File:** `qrdb/src/api/band/content-types/band/schema.json`

Add a new field:
```json
"newPlatform": {
  "type": "string"
}
```

### 2. Edit Band Form

**File:** `qr/pages/editband/[id].vue`

**Location:** Lines ~1045-1064

Add to the appropriate `ref` object:

```javascript
// For streaming platforms (line ~1056)
const streaming = ref({
  appleMusic: "",
  spotify: "",
  soundcloud: "",
  youtube: "",
  deezer: "",
  bandcamp: "",
  reverbnation: "",
  newPlatform: "",  // ADD HERE
});

// For social platforms (line ~1045)
const social = ref({
  facebook: "",
  instagram: "",
  twitch: "",
  twitter: "",
  whatsapp: "",
  tiktok: "",
  snapchat: "",
  newPlatform: "",  // ADD HERE
});
```

### 3. Icon Asset

**Location:** `qr/assets/`

Add icon file (SVG preferred, PNG acceptable):
- Recommended size: 24x24 or 32x32
- Format: `.svg` or `.png`
- Naming: `newplatform.svg` or `newplatform-icon.png`

### 4. Band Page Display (Classic Template)

**File:** `qr/pages/[bandSlug]/index.vue`

**Step A:** Import the icon (line ~1173-1185):
```javascript
import newPlatformIcon from "@/assets/newplatform.svg";
```

**Step B:** Add to platform array (line ~2428-2445):

For streaming:
```javascript
const streamingPlatforms = [
  { name: "youtube", img: youtubeIcon, label: "YouTube" },
  // ... existing platforms
  { name: "newPlatform", img: newPlatformIcon, label: "New Platform" },  // ADD
];
```

For social:
```javascript
const socialPlatforms = [
  { name: "facebook", img: facebookIcon, label: "Facebook" },
  // ... existing platforms
  { name: "newPlatform", img: newPlatformIcon, label: "New Platform" },  // ADD
];
```

### 5. Cybered Template

**File:** `qr/components/band/BandPageCybered.vue`

**Step A:** Import the icon (near top of script):
```javascript
import newPlatformIcon from "@/assets/newplatform.svg";
```

**Step B:** Add to platform array (line ~439-456):

For streaming:
```javascript
const streamingPlatforms = [
  { name: 'youtube', img: youtubeIcon, label: 'YouTube' },
  // ... existing platforms
  { name: 'newPlatform', img: newPlatformIcon, label: 'New Platform' },  // ADD
]
```

For social:
```javascript
const socialPlatforms = [
  { name: 'facebook', img: facebookIcon, label: 'Facebook' },
  // ... existing platforms
  { name: 'newPlatform', img: newPlatformIcon, label: 'New Platform' },  // ADD
]
```

### 6. Layout Config (for drag-and-drop ordering)

**File:** `qr/composables/useLayoutConfig.js` (if exists)

Add the new platform key to the default button order arrays.

### 7. Create Band Form (optional)

**File:** `qr/pages/createband.vue`

If the create form has streaming/social inputs, add there too.

---

## Platform Array Structure

```javascript
{
  name: "platformKey",     // Database field name (camelCase)
  img: platformIcon,       // Imported icon asset
  label: "Display Name"    // Human-readable label shown to users
}
```

---

## Button Rendering Logic

### Classic Template (index.vue)

```vue
<template v-for="platform in orderedStreamingPlatforms" :key="platform.name">
  <a
    v-if="band.data[platform.name] && !isLinkHidden(platform.name)"
    :href="band.data[platform.name]"
    @click.prevent="handleClick(band.data.id, platform.name, band.data[platform.name])"
    :class="streamingButtonClasses"
  >
    <img :src="platform.img" :alt="platform.label" class="w-6 h-6" />
    <span class="text-white font-medium">{{ platform.label }}</span>
  </a>
</template>
```

### Cybered Template

```vue
<template v-for="platform in streamingPlatforms" :key="platform.name">
  <a
    v-if="band[platform.name] && !isLinkHidden(platform.name)"
    :href="band[platform.name]"
    @click.prevent="$emit('link-click', { name: platform.name, url: band[platform.name] })"
    class="w-full flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition"
  >
    <img :src="platform.img" :alt="platform.label" class="w-6 h-6 shrink-0" />
    <span class="text-white font-medium">{{ platform.label }}</span>
  </a>
</template>
```

---

## Button Styles

### Classic Style
```css
w-full mb-4 border border-white bg-transparent text-white flex items-center gap-3 
font-semibold px-4 py-4 rounded-md hover:bg-white/5 active:bg-white/10 
transition duration-200 ease-out hover:-translate-y-[1px] active:translate-y-0
```

### Modern Style (Cybered)
```css
w-full flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 
rounded-xl hover:bg-white/10 transition
```

---

## Hidden Links System

Users can hide individual links via the edit form. Hidden links are stored in `band.hiddenLinks` as an array of platform keys:

```javascript
hiddenLinks: ["facebook", "twitter"]  // These won't display
```

Check function:
```javascript
function isLinkHidden(key) {
  return hiddenLinks.value.includes(key);
}
```

---

## Suggested Platforms to Add

### Streaming
- **Amazon Music** - Major streaming platform
- **Tidal** - Hi-fi streaming
- **Pandora** - US radio/streaming
- **iHeartRadio** - Radio platform
- **Audiomack** - Hip-hop focused

### Social
- **Threads** - Meta's Twitter alternative
- **Discord** - Community platform
- **LinkedIn** - Professional networking
- **Pinterest** - Visual discovery
- **Bluesky** - Decentralized social
- **Mastodon** - Federated social

### Music-Specific
- **Songkick** - Concert discovery
- **Genius** - Lyrics/annotations
- **Last.fm** - Scrobbling/stats
- **Discogs** - Vinyl/physical releases

---

## Checklist for Adding a New Platform

- [ ] Add icon to `qr/assets/`
- [ ] Add field to Strapi schema (`qrdb`)
- [ ] Add to `streaming` or `social` ref in `editband/[id].vue`
- [ ] Import icon in `pages/[bandSlug]/index.vue`
- [ ] Add to `streamingPlatforms` or `socialPlatforms` array in `index.vue`
- [ ] Import icon in `components/band/BandPageCybered.vue`
- [ ] Add to platform array in `BandPageCybered.vue`
- [ ] (Optional) Add to `createband.vue` if it has platform inputs
- [ ] (Optional) Update layout config defaults
- [ ] Test on both Classic and Cybered templates
- [ ] Verify hidden links toggle works

---

## Code Locations Quick Reference

| What | File | Line Range |
|------|------|------------|
| Edit form streaming ref | `editband/[id].vue` | ~1056-1064 |
| Edit form social ref | `editband/[id].vue` | ~1045-1053 |
| Icon imports (Classic) | `[bandSlug]/index.vue` | ~1173-1185 |
| Platform arrays (Classic) | `[bandSlug]/index.vue` | ~2428-2445 |
| Platform arrays (Cybered) | `BandPageCybered.vue` | ~439-456 |
| Button classes | `[bandSlug]/index.vue` | ~1523-1531 |
| Hidden links check | `[bandSlug]/index.vue` | ~2174-2176 |
