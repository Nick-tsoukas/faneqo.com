# Band Page Templates

## Available Templates

MusicBizQR offers two band page templates that artists can choose from:

### 1. Classic (Default)
**Page Style Value**: `default`

The original band page design with:
- Full-width hero image
- Bold typography
- White-bordered buttons
- Separate sections for streaming, social, events
- Traditional layout

### 2. Cybered
**Page Style Value**: `smartlink`

A modern Smart Link-style design with:
- Rounded hero with gradient overlay
- Live Surface components (ShowDayHeader, NowBanner, LiveFeed)
- Card-based content sections
- Inline audio/video players
- Glass morphism effects
- Purple/cyan accent colors

See [CYBERED_TEMPLATE.md](./CYBERED_TEMPLATE.md) for detailed documentation.

## Selecting a Template

### For New Bands
1. Go to **Create Band** page
2. In the "Page Style" section, choose Classic or Cybered
3. Preview each template before selecting
4. Complete the rest of the form and save

### For Existing Bands
1. Go to **Edit Band** page
2. In the "Page Style" section, choose Classic or Cybered
3. Preview each template before selecting
4. Save changes

## Template Detection

In code, templates are detected using the `pageStyle` field:

```javascript
// Classic template
const isClassicStyle = computed(() => {
  return !band.value?.data?.pageStyle || band.value?.data?.pageStyle === 'default'
})

// Cybered template
const isCyberedStyle = computed(() => {
  return band.value?.data?.pageStyle === 'smartlink'
})
```

## Database Schema

The `pageStyle` field is stored in the band content type:

```json
{
  "pageStyle": {
    "type": "enumeration",
    "enum": ["default", "compact", "bold", "smartlink"],
    "default": "default"
  }
}
```

**Note**: `compact` and `bold` are legacy values. Only `default` (Classic) and `smartlink` (Cybered) are shown to users.

## File Locations

| Template | Preview Component | Full Component |
|----------|-------------------|----------------|
| Classic | `BandPageStyleClassic.vue` | Default in `[bandSlug]/index.vue` |
| Cybered | `BandPageStyleDefault.vue` | `BandPageCybered.vue` |

## Preview Components

Preview components are used in the template selection UI:

```
components/band/BandPageStylePreview.vue  - Modal wrapper
components/band/BandPageStyleClassic.vue  - Classic preview
components/band/BandPageStyleDefault.vue  - Cybered preview
```
