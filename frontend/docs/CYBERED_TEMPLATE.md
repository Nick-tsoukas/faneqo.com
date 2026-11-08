# Cybered Template Documentation

## Overview

The **Cybered** template is a modern, Smart Link-style band page design featuring Live Surface components, responsive hero images, and integrated band content. It's designed to give artists a sleek, professional presence.

## Features

### Hero Section
- **Rounded hero image** with gradient overlay
- **Smart image positioning** (`object-position: center 25%`) - prioritizes showing faces/upper portion of images
- **Live badges** - Shows "Live" indicator when band has upcoming events
- **Genre badge** - Displays band's genre

### Live Surface Components
- **ShowDayHeader** - Displays next upcoming event with ticket link
- **NowBanner** - Dynamic banner showing tour status or quiet state
- **ContinueChip** - Engagement prompt for returning fans
- **LiveFeed** - Real-time activity feed

### Content Sections
- **Featured Song** - Card-style audio player with:
  - Album art thumbnail
  - Song title and artist name
  - Play/pause button with inline audio playback
  - Support for embedded players (Spotify, SoundCloud, etc.)
  
- **Featured Video** - YouTube video with:
  - Thumbnail preview with play button overlay
  - Click to play inline
  - Video title overlay

- **Streaming Links** - Modern card-style buttons for:
  - Spotify, Apple Music, YouTube Music
  - SoundCloud, Bandcamp, Deezer, Twitch

- **Social Links** - Card-style buttons for:
  - Facebook, Instagram, Twitter/X, TikTok

- **Upcoming Events** - Event cards with:
  - Date, venue, city/state
  - Click to view event details

- **Support Module** - Fan engagement and tipping

### Action Bar
- **Follow** - Opens follow modal
- **Save** - Saves band to user's collection
- **Share** - Opens share drawer

## Technical Details

### File Location
```
components/band/BandPageCybered.vue
```

### Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `band` | Object | Yes | Band data object |
| `upcomingEvents` | Array | No | List of upcoming events |
| `hiddenLinks` | Array | No | Links to hide from display |
| `enabledPaymentButtons` | Array | No | Enabled payment options |
| `followablePlatforms` | Array | No | Platforms available for following |

### Events Emitted
| Event | Payload | Description |
|-------|---------|-------------|
| `play-song` | - | Fired when audio starts playing |
| `play-video` | - | Fired when video starts playing |
| `link-click` | `{ name, url }` | Fired when streaming/social link clicked |
| `view-event` | `event` | Fired when event card clicked |
| `quick-tip` | `amount` | Fired when tip button clicked |
| `follow` | - | Fired when follow button clicked |
| `save` | - | Fired when save button clicked |
| `share` | - | Fired when share button clicked |

### Page Style Value
The Cybered template uses `pageStyle: 'smartlink'` in the database.

## Usage

### In Band Page (`pages/[bandSlug]/index.vue`)
```vue
<BandPageCybered
  v-else-if="isCyberedStyle"
  :band="band.data"
  :upcoming-events="upcomingEvents"
  :hidden-links="hiddenLinks"
  :enabled-payment-buttons="enabledPaymentButtons"
  :followable-platforms="followablePlatforms"
  @play-song="onSongPlay"
  @play-video="playVideo"
  @link-click="(link) => handleClick(band.data.id, link.name, link.url)"
  @view-event="(event) => router.push(`/${route.params.bandSlug}/event/${event.slug}`)"
  @follow="openFollowModal"
  @save="onToggleSaveBand"
  @share="shareDrawerOpen = true"
/>
```

### Detecting Cybered Style
```javascript
const isCyberedStyle = computed(() => {
  return band.value?.data?.pageStyle === 'smartlink'
})
```

## Image Guidelines

### Hero Image
- **Recommended aspect ratio**: 16:10 (landscape)
- **Minimum resolution**: 1200x750px
- **Best practice**: Use images with the subject in the upper portion
- **Note**: Images are cropped with `object-position: center 25%` to prioritize faces

### Song Cover
- **Recommended aspect ratio**: 1:1 (square)
- **Minimum resolution**: 300x300px

## Styling

The template uses:
- **Tailwind CSS** for styling
- **Purple/cyan accent colors** for interactive elements
- **Glass morphism effects** (backdrop-blur, semi-transparent backgrounds)
- **Rounded corners** throughout (rounded-xl, rounded-2xl)

## Changelog

### January 2026
- Released Cybered template to all users (removed email whitelist)
- Added inline audio player with play/pause toggle
- Added inline video player with YouTube embed
- Fixed hero image positioning to show artist faces
- Added support for embedded audio players (Spotify, SoundCloud)
- Fixed "View Event" buttons to navigate to event page instead of scrolling
