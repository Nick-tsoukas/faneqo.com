<template>
  <div class="cc">
    <!-- Artist -->
    <section v-if="has('artist')" class="sec">
      <header class="sec__head">
        <h3>Artist</h3>
        <button type="button" class="link" @click="pickingArtist = !pickingArtist">{{ pickingArtist ? 'Cancel' : (snapshot ? 'Change' : 'Choose') }}</button>
      </header>
      <p v-if="snapshot" class="sec__value">
        <strong>{{ snapshot.name }}</strong>
        <span> · {{ snapshot.genre || 'Artist' }} · {{ (snapshot.photos || []).length }} photo{{ (snapshot.photos || []).length === 1 ? '' : 's' }}<template v-if="snapshot.demo"> · demo</template></span>
      </p>
      <p v-else class="sec__value muted">No artist. The composition uses Faneqo defaults.</p>
      <p v-if="snapshot?.snapshotAt" class="muted small">Snapshot from {{ shortDate(snapshot.snapshotAt) }}. Re-choose the artist to refresh it.</p>
      <ArtistPicker v-if="pickingArtist" class="sec__picker" @select="onArtist" />
    </section>

    <!-- Design style: live thumbnails of this creative in each style, so the choice is seen, not read -->
    <section v-if="has('style') && family.styles?.length" class="sec" data-testid="design-style">
      <header class="sec__head">
        <h3>Design style</h3>
        <span class="muted small">{{ family.styles.find((s) => s.id === currentStyle)?.label }}</span>
      </header>
      <div class="styles" role="radiogroup" aria-label="Design style">
        <button
          v-for="s in family.styles"
          :key="s.id"
          type="button"
          class="style"
          role="radio"
          :aria-checked="currentStyle === s.id"
          :title="s.hint"
          :data-style="s.id"
          @click="setStyle(s.id)"
        >
          <span class="style__thumb" :style="{ aspectRatio: `${thumbBoard.width} / ${thumbBoard.height}` }" aria-hidden="true">
            <span class="style__canvas" :style="{ width: `${thumbBoard.width}px`, height: `${thumbBoard.height}px`, transform: `scale(${thumbScale})` }" inert>
              <component :is="styleComponent(s.id)" :format="thumbBoard.id" :content="{ ...content, style: s.id }" :snapshot="snapshot" :scene="0" />
            </span>
          </span>
          <span class="style__label">{{ s.label }}<template v-if="styleStill(s.id)"> · Still</template></span>
        </button>
      </div>
      <p class="muted small">{{ family.styles.find((s) => s.id === currentStyle)?.hint }}</p>
    </section>

    <section v-if="has('angle') && visibleAngles.length" class="sec">
      <h3>Marketing angle</h3>
      <div class="chips">
        <button v-for="angle in visibleAngles" :key="angle.id" type="button" class="chip" @click="applyAngle(angle)">{{ angle.label }}</button>
      </div>
      <p class="muted small">Replaces the lines on this creative. Duplicate it first if you want to keep both.</p>
    </section>

    <!-- Variant -->
    <section v-if="has('variant') && family.variants?.length && variantsVisible" class="sec">
      <h3>Layout</h3>
      <div class="chips">
        <button
          v-for="v in family.variants"
          :key="v.id"
          type="button"
          class="chip"
          :aria-pressed="content.variant === v.id"
          :title="v.hint"
          @click="set('variant', v.id)"
        >
          {{ v.label }}
        </button>
      </div>
      <p class="muted small">{{ currentVariantHint }}</p>
    </section>

    <!-- Product excerpt -->
    <section v-if="has('excerpt') && pageCampaign" class="sec">
      <h3>Page excerpt</h3>
      <div class="chips">
        <button v-for="e in family.excerpts" :key="e.id" type="button" class="chip" :aria-pressed="content.excerpt === e.id" @click="setExcerpt(e.id)">{{ e.label }}</button>
      </div>
      <p class="muted small">An inert excerpt of the real artist page. Nothing plays or submits.</p>
      <p v-if="excerptStill" class="muted small">Only the artist-page excerpt plays as video. This one stays a still.</p>
      <p v-if="productNote" class="muted small">{{ productNote }}</p>
    </section>

    <section v-if="has('showcaseLinks') && content.excerpt !== 'song' && content.excerpt !== 'fanlist' && content.excerpt !== 'shows' && content.excerpt !== 'gallery' && availableLinks.length" class="sec">
      <h3>Links on the page</h3>
      <div class="chips chips--wrap">
        <button v-for="link in availableLinks" :key="link.key" type="button" class="chip" :aria-pressed="linkOn(link.key)" @click="toggleLink(link.key)">{{ link.label }}</button>
      </div>
      <p class="muted small">Only links this artist actually has. The frame shows the first few that are on.</p>
    </section>

    <!-- Education topic -->
    <section v-if="has('topic')" class="sec">
      <h3>Topic</h3>
      <select class="select" :value="content.topic" @change="setTopic($event.target.value)">
        <option v-for="t in family.topics" :key="t.id" :value="t.id">{{ t.label }}</option>
      </select>
      <p class="muted small">Curated, general advice. Edit the words, but do not add statistics or promises.</p>
    </section>

    <!-- Show -->
    <section v-if="has('show')" class="sec">
      <h3>Show</h3>
      <template v-if="shows.length">
        <select class="select" :value="showKey(content.show)" @change="setShow($event.target.value)">
          <option v-for="s in shows" :key="showKey(s)" :value="showKey(s)">{{ showLabel(s) }}</option>
        </select>
        <p v-if="content.show && !content.show.upcoming" class="warn small">This date has passed. Fine for a recap, not for promotion.</p>
      </template>
      <p v-else class="warn small">No events on this artist's page. Add the show on the artist page first; the studio never invents dates.</p>
    </section>

    <!-- Headline -->
    <section v-if="has('headline')" class="sec">
      <h3>Headline</h3>
      <div v-if="family.headlines?.length && !visibleAngles.length" class="chips chips--wrap">
        <button
          v-for="(h, i) in family.headlines"
          :key="i"
          type="button"
          class="chip"
          :aria-pressed="isHeadline(h)"
          @click="setHeadline(h)"
        >
          {{ headlinePreview(h) }}
        </button>
      </div>
      <template v-if="typeof content.headline === 'string'">
        <input class="input" type="text" maxlength="40" :value="content.headline" placeholder="Headline" @input="set('headline', $event.target.value)" />
      </template>
      <template v-else>
        <div class="pair">
          <input class="input" type="text" maxlength="28" :value="content.headlineTop" placeholder="First line" @input="set('headlineTop', $event.target.value)" />
          <input class="input" type="text" maxlength="28" :value="content.headlineAccent" placeholder="Accent line" @input="set('headlineAccent', $event.target.value)" />
        </div>
      </template>
    </section>

    <!-- Type statement -->
    <section v-if="has('preset')" class="sec">
      <h3>Statement</h3>
      <div class="chips chips--wrap">
        <button v-for="p in family.presets" :key="p.id" type="button" class="chip" :aria-pressed="isPreset(p)" @click="setPreset(p)">{{ p.lines.map((l) => l.text).join(' ') }}</button>
      </div>
      <div class="lines">
        <div v-for="(line, i) in content.lines" :key="i" class="line">
          <input class="input" type="text" maxlength="24" :value="line.text" :placeholder="`Line ${i + 1}`" @input="setLine(i, { text: $event.target.value })" />
          <select class="select select--tone" :value="line.tone" @change="setLine(i, { tone: $event.target.value })">
            <option value="plain">Plain</option>
            <option value="muted">Muted</option>
            <option value="accent">Accent</option>
          </select>
          <button type="button" class="icon" aria-label="Remove line" :disabled="content.lines.length <= 1" @click="removeLine(i)">×</button>
        </div>
        <button type="button" class="link" :disabled="content.lines.length >= 4" @click="addLine">Add a line</button>
      </div>
      <div class="row">
        <div class="chips">
          <button v-for="s in family.scales" :key="s.id" type="button" class="chip" :aria-pressed="content.scale === s.id" @click="set('scale', s.id)">{{ s.label }}</button>
        </div>
        <div class="chips">
          <button type="button" class="chip" :aria-pressed="content.weight !== 'medium'" @click="set('weight', 'heavy')">Heavy</button>
          <button type="button" class="chip" :aria-pressed="content.weight === 'medium'" @click="set('weight', 'medium')">Medium</button>
        </div>
      </div>
    </section>

    <!-- Education cover / slides / closing -->
    <section v-if="has('cover')" class="sec">
      <h3>Cover</h3>
      <input class="input" type="text" maxlength="60" :value="content.cover?.headline" placeholder="Cover headline" @input="setNested('cover', 'headline', $event.target.value)" />
      <input class="input" type="text" maxlength="110" :value="content.cover?.sub" placeholder="Sub line" @input="setNested('cover', 'sub', $event.target.value)" />
    </section>
    <section v-if="has('slides')" class="sec">
      <header class="sec__head">
        <h3>Slides <span class="muted">{{ (content.slides || []).length }}</span></h3>
        <button type="button" class="link" :disabled="(content.slides || []).length >= 7" @click="addSlide">Add slide</button>
      </header>
      <div v-for="(s, i) in content.slides" :key="i" class="slide">
        <div class="slide__head">
          <span class="muted small">Slide {{ i + 1 }}</span>
          <button type="button" class="icon" aria-label="Remove slide" :disabled="content.slides.length <= 1" @click="removeSlide(i)">×</button>
        </div>
        <input class="input" type="text" maxlength="48" :value="s.title" placeholder="Title" @input="setSlide(i, { title: $event.target.value })" />
        <textarea class="input input--area" rows="3" maxlength="220" :value="s.body" placeholder="Body" @input="setSlide(i, { body: $event.target.value })" />
      </div>
    </section>
    <section v-if="has('closing')" class="sec">
      <h3>Closing</h3>
      <input class="input" type="text" maxlength="48" :value="content.closing?.headline" placeholder="Closing headline" @input="setNested('closing', 'headline', $event.target.value)" />
      <textarea class="input input--area" rows="2" maxlength="200" :value="content.closing?.line" placeholder="Closing line" @input="setNested('closing', 'line', $event.target.value)" />
    </section>

    <!-- Song fields -->
    <section v-if="has('kicker')" class="sec">
      <h3>Kicker</h3>
      <div class="chips chips--wrap">
        <button v-for="k in family.kickers" :key="k" type="button" class="chip" :aria-pressed="content.kicker === k" @click="set('kicker', k)">{{ k }}</button>
      </div>
    </section>
    <section v-if="has('title')" class="sec">
      <h3>Song title</h3>
      <input class="input" type="text" maxlength="60" :value="content.title" placeholder="Song title" @input="set('title', $event.target.value)" />
      <p v-if="snapshot?.song?.title && content.title !== snapshot.song.title" class="muted small">Featured song on the page: “{{ snapshot.song.title }}”.</p>
    </section>
    <section v-if="has('line')" class="sec">
      <h3>Line</h3>
      <input class="input" type="text" maxlength="90" :value="content.line" placeholder="One line about the song (optional)" @input="set('line', $event.target.value)" />
    </section>
    <section v-if="has('release')" class="sec">
      <h3>Release label</h3>
      <input class="input" type="text" maxlength="24" :value="content.releaseLabel" placeholder="Year or label (optional)" @input="set('releaseLabel', $event.target.value)" />
    </section>
    <section v-if="has('art')" class="sec">
      <header class="sec__head">
        <h3>Artwork</h3>
        <span class="muted small">Single or album cover</span>
      </header>
      <PhotoPicker
        :options="artOptions"
        :model-value="content.art"
        label="Artwork"
        :allow-none="false"
        :paid="paid"
        uploadable
        upload-title="Upload artwork"
        :uploading="uploadTarget === 'art' && uploader.uploading.value"
        :upload-error="uploadTarget === 'art' ? uploader.error.value : ''"
        empty-text="No artwork on this artist's page yet. Upload a single or album cover."
        @update:model-value="set('art', $event)"
        @upload="onUpload('art', $event)"
      />
    </section>
    <section v-if="has('accent')" class="sec">
      <h3>Accent</h3>
      <div class="chips">
        <button type="button" class="chip" :aria-pressed="!content.accent" @click="set('accent', null)">Auto</button>
        <button
          v-for="a in ACCENTS"
          :key="a.id"
          type="button"
          class="swatch"
          :style="{ '--swatch': a.hex }"
          :aria-pressed="content.accent === a.hex"
          :aria-label="a.label"
          :title="a.label"
          @click="set('accent', a.hex)"
        />
      </div>
    </section>
    <section v-if="has('player')" class="sec">
      <label class="toggle">
        <input type="checkbox" :checked="content.playerExcerpt !== false" @change="set('playerExcerpt', $event.target.checked)" />
        <span>Show the player excerpt</span>
      </label>
    </section>

    <!-- Photo + focal -->
    <section v-if="has('photo')" class="sec">
      <header class="sec__head">
        <h3>Photograph</h3>
        <span class="muted small">{{ photoOptions.length }} available</span>
      </header>
      <PhotoPicker
        :options="photoOptions"
        :model-value="content.photo"
        :focal="content.focal"
        :with-focal="has('focal') && Boolean(content.photo)"
        :allow-none="!photoRequired"
        :paid="paid"
        uploadable
        upload-title="Upload photo"
        :uploading="uploadTarget === 'photo' && uploader.uploading.value"
        :upload-error="uploadTarget === 'photo' ? uploader.error.value : ''"
        :empty-text="photoRequired ? 'This artist has no photographs on their page yet. Upload one, or the frame shows an empty field.' : 'No artist photographs. Upload one, or let the statement stand on type alone.'"
        @update:model-value="set('photo', $event)"
        @update:focal="set('focal', $event)"
        @upload="onUpload('photo', $event)"
      />
    </section>

    <!-- Photograph treatment: three presets, not a slider, so the frame keeps its hierarchy -->
    <section v-if="has('treatment') && content.photo" class="sec">
      <h3>Treatment</h3>
      <div class="chips">
        <button
          v-for="t in PHOTO_TREATMENTS"
          :key="t.id"
          type="button"
          class="chip"
          :aria-pressed="(content.treatment || 'balanced') === t.id"
          :title="t.hint"
          @click="set('treatment', t.id)"
        >
          {{ t.label }}
        </button>
      </div>
      <p class="muted small">{{ PHOTO_TREATMENTS.find((t) => t.id === (content.treatment || 'balanced'))?.hint }}</p>
    </section>

    <!-- Product showcase: the artwork shown inside the page / song excerpt -->
    <section v-if="has('excerptArt')" class="sec">
      <header class="sec__head">
        <h3>Excerpt artwork</h3>
        <span class="muted small">Single or album cover</span>
      </header>
      <PhotoPicker
        :options="artOptions"
        :model-value="content.songArt"
        label="Excerpt artwork"
        :allow-none="false"
        :paid="paid"
        uploadable
        upload-title="Upload artwork"
        :uploading="uploadTarget === 'songArt' && uploader.uploading.value"
        :upload-error="uploadTarget === 'songArt' ? uploader.error.value : ''"
        empty-text="No artwork on this artist's page yet. Upload a single or album cover."
        @update:model-value="set('songArt', $event)"
        @upload="onUpload('songArt', $event)"
      />
      <p class="muted small">Shown in the page and song excerpts. The photograph above stays the hero; this is the record.</p>
    </section>
    <section v-if="has('veil') && content.photo" class="sec">
      <h3>Veil <span class="muted">{{ Math.round((content.veil ?? 0.72) * 100) }}%</span></h3>
      <input class="range" type="range" min="0.3" max="0.95" step="0.01" :value="content.veil ?? 0.72" @input="set('veil', Number($event.target.value))" />
    </section>

    <!-- Artist spotlight extras -->
    <section v-if="has('description')" class="sec">
      <h3>Description</h3>
      <textarea class="input input--area" rows="2" maxlength="140" :value="content.description" placeholder="One sentence about the artist" @input="set('description', $event.target.value)" />
    </section>
    <section v-if="has('songArt')" class="sec">
      <label class="toggle">
        <input type="checkbox" :checked="Boolean(content.songTitle)" @change="toggleSong($event.target.checked)" />
        <span>Featured song row</span>
      </label>
      <template v-if="content.songTitle">
        <input class="input" type="text" maxlength="60" :value="content.songTitle" placeholder="Song title" @input="set('songTitle', $event.target.value)" />
        <PhotoPicker
          :options="artOptions"
          :model-value="content.songArt"
          label="Song artwork"
          :paid="paid"
          uploadable
          upload-title="Upload artwork"
          :uploading="uploadTarget === 'songArt' && uploader.uploading.value"
          :upload-error="uploadTarget === 'songArt' ? uploader.error.value : ''"
          empty-text="No artwork on the page yet. Upload a single or album cover, or the row shows an empty tile."
          @update:model-value="set('songArt', $event)"
          @upload="onUpload('songArt', $event)"
        />
      </template>
    </section>
    <section v-if="has('badge')" class="sec">
      <h3>Badge</h3>
      <input class="input" type="text" maxlength="28" :value="content.badgeText" placeholder="Badge (optional)" @input="set('badgeText', $event.target.value)" />
    </section>

    <section v-if="has('category')" class="sec">
      <h3>Category</h3>
      <input class="input" type="text" maxlength="28" :value="content.category" placeholder="Fan list" @input="set('category', $event.target.value)" />
    </section>
    <section v-if="has('statement')" class="sec">
      <h3>Headline</h3>
      <textarea class="input input--area" rows="3" maxlength="140" :value="content.statement" placeholder="The line this post is built around" @input="set('statement', $event.target.value)" />
    </section>
    <section v-if="has('insight') && content.style === 'playbook'" class="sec">
      <h3>Takeaway</h3>
      <textarea class="input input--area" rows="2" maxlength="120" :value="content.insight" placeholder="The one thing to remember" @input="set('insight', $event.target.value)" />
    </section>

    <!-- Support -->
    <section v-if="has('support')" class="sec">
      <h3>Support line</h3>
      <textarea class="input input--area" rows="2" maxlength="140" :value="content.support" placeholder="Support line (optional)" @input="set('support', $event.target.value)" />
    </section>

    <!-- CTA -->
    <section v-if="has('cta')" class="sec">
      <h3>Call to action</h3>
      <div class="chips chips--wrap">
        <button v-for="c in family.ctas" :key="c" type="button" class="chip" :aria-pressed="content.cta === c" @click="set('cta', c)">{{ c }}</button>
      </div>
      <input class="input" type="text" maxlength="40" :value="content.cta" placeholder="Custom call to action" @input="set('cta', $event.target.value)" />
      <input class="input" type="text" maxlength="48" :value="content.site" placeholder="faneqo.com" @input="set('site', $event.target.value)" />
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import ArtistPicker from '@/features/ads/studio/ArtistPicker.vue'
import PhotoPicker from '@/features/ads/studio/editor/PhotoPicker.vue'
import { isPlaceholderText, showcaseLinkKeys, SHOWCASE_LINK_ORDER, snapshotMediaOptions } from '@/features/ads/studio/artistSnapshot.js'
import { educationTopic } from '@/features/ads/studio/education.js'
import { ACCENTS, PHOTO_TREATMENTS, fillToken, spotlightStyle } from '@/features/ads/studio/families.js'
import { spotlightStyleComponent } from '@/features/ads/studio/templates/spotlight/index.js'
import { templateComponentFor } from '@/features/ads/studio/templates/index.js'
import { AD_FORMATS, isAdFormat } from '@/features/ads/formats.js'
import { useStudioUploads } from '@/features/ads/studio/useStudioUploads.js'
import { productStyle } from '@/features/ads/studio/campaigns.js'
import { productMotionFilm } from '@/features/ads/studio/motion.js'
import { isStudioUpload } from '@/features/ads/studio/studioUploads.js'

/**
 * Family-aware controls. Emits `patch` with partial content; the editor
 * applies it. Emits `artist` with a fresh snapshot when the artist changes.
 */
const props = defineProps({
  family: { type: Object, required: true },
  content: { type: Object, required: true },
  snapshot: { type: Object, default: null },
  paid: { type: Boolean, default: false },
  /* Studio uploads referenced by other saved creatives, for reuse by reference. */
  uploads: { type: Array, default: () => [] },
  /* The format on the stage, so design-style thumbnails preview the same composition. */
  format: { type: String, default: 'post' },
})
const emit = defineEmits(['patch', 'artist'])

/* Design styles (Artist Spotlight): thumbnails are the real templates, scaled, in the stage format. */
const THUMB_W = 128 /* 132px thumb minus its 2px border each side */
const currentStyle = computed(() => {
  if (props.family.id === 'artist-spotlight') return spotlightStyle(props.content)
  const ids = (props.family.styles || []).map((s) => s.id)
  return ids.includes(props.content?.style) ? props.content.style : (props.family.defaultStyle || ids[0] || '')
})
const styleComponent = (id) => (props.family.id === 'artist-spotlight' ? spotlightStyleComponent(id) : templateComponentFor(props.family.id))
const thumbBoard = computed(() => AD_FORMATS[isAdFormat(props.format) && props.family.formats?.includes(props.format) ? props.format : props.family.defaultFormat] || AD_FORMATS.post)
const thumbScale = computed(() => THUMB_W / thumbBoard.value.width)
const variantsVisible = computed(() => (typeof props.family.showVariants === 'function' ? props.family.showVariants(props.content) : true))
const pageCampaign = computed(() => props.family.id !== 'product-showcase' || productStyle(props.content) === 'page')
const excerptStill = computed(() => pageCampaign.value && props.content?.excerpt && props.content.excerpt !== 'page')
function styleStill(id) {
  return props.family?.id === 'product-showcase' && !productMotionFilm({ style: id, excerpt: 'page' })
}
const visibleAngles = computed(() => (props.family.angles || []).filter((angle) => angle.style === currentStyle.value))

const pickingArtist = ref(false)
const uploader = useStudioUploads()
const uploadTarget = ref(null)
/* Uploads made while this editor is open, so a removed upload can be picked again without re-uploading. */
const sessionUploads = ref([])

const fields = computed(() => new Set(props.family.fields || []))
const has = (f) => fields.value.has(f)

const mediaOptions = computed(() => snapshotMediaOptions(props.snapshot))
/* Uploads from the library that are not already in the list (artist media or the current pick). */
function withUploads(list) {
  const seen = new Set(list.map((m) => m.url))
  const extra = []
  for (const u of [...sessionUploads.value, ...props.uploads]) {
    if (!u?.url || seen.has(u.url)) continue
    seen.add(u.url)
    extra.push({ ...u, group: 'Uploaded' })
  }
  return [...list, ...extra]
}
const photoOptions = computed(() => {
  const photos = mediaOptions.value.filter((m) => m.group === 'Photos')
  const showImages = (props.snapshot?.shows || []).map((s) => s.image).filter(Boolean).map((m) => ({ ...m, group: 'Show' }))
  const current = props.content.photo
  const list = [...photos, ...showImages]
  if (current?.url && !list.some((m) => m.url === current.url)) list.unshift({ ...current, group: 'Current' })
  return withUploads(list)
})
const artOptions = computed(() => {
  const art = mediaOptions.value.filter((m) => m.group === 'Artwork' || m.group === 'Preview only')
  const current = props.content.art || props.content.songArt
  if (current?.url && !art.some((m) => m.url === current.url)) art.unshift({ ...current, group: 'Current' })
  return withUploads(art)
})

async function onUpload(key, file) {
  uploadTarget.value = key
  const mediaRef = await uploader.upload(file)
  if (!mediaRef) return
  sessionUploads.value = [mediaRef, ...sessionUploads.value.filter((u) => u.url !== mediaRef.url)]
  const patch = { [key]: mediaRef }
  if (key === 'photo' && has('focal')) patch.focal = { ...mediaRef.focal }
  emit('patch', patch)
}
/* Families whose frame or excerpt always shows a photograph: no "None", only replace. */
const photoRequired = computed(() => ['artist-spotlight', 'show-promo', 'product-showcase'].includes(props.family.id))
const shows = computed(() => {
  const list = [...(props.snapshot?.shows || [])]
  list.sort((a, b) => Number(Boolean(b.upcoming)) - Number(Boolean(a.upcoming)) || String(a.date || '').localeCompare(String(b.date || '')))
  return list
})
const currentVariantHint = computed(() => props.family.variants?.find((v) => v.id === props.content.variant)?.hint || '')
const availableLinks = computed(() => SHOWCASE_LINK_ORDER
  .filter(([key]) => props.snapshot?.links?.[key])
  .map(([key, label]) => ({ key, label })))
const productNote = computed(() => {
  if (props.family?.id !== 'product-showcase' || props.content?.excerpt !== 'page') return ''
  if (props.snapshot?.demoFilled) return 'Empty fields on this artist were filled from the Badflower studio fixture. Real biography, song, photo, and links were kept.'
  const notes = []
  if (isPlaceholderText(props.snapshot?.bio, 'bio')) notes.push('The biography is placeholder text, so it stays off the artwork.')
  if (isPlaceholderText(props.snapshot?.song?.title, 'song')) notes.push('The featured song is placeholder text, so it stays off the artwork.')
  if (props.snapshot && !availableLinks.value.length) notes.push('This artist has no streaming or social links yet. None are invented.')
  return notes.join(' ')
})

function linkOn(key) {
  const selected = props.content.showcaseLinks
  if (!Array.isArray(selected)) return showcaseLinkKeys(props.snapshot, null, 99).includes(key)
  return selected.includes(key)
}

function toggleLink(key) {
  const current = Array.isArray(props.content.showcaseLinks)
    ? props.content.showcaseLinks.filter((id) => availableLinks.value.some((link) => link.key === id))
    : showcaseLinkKeys(props.snapshot, null, 99)
  const next = current.includes(key) ? current.filter((id) => id !== key) : [...current, key]
  set('showcaseLinks', next)
}

function setStyle(id) {
  const patch = { style: id }
  if (typeof props.family.styleContent === 'function') {
    const next = props.family.styleContent(id, props.snapshot)
    if (next) Object.assign(patch, next)
  }
  if (isStudioUpload(props.content?.photo)) {
    patch.photo = props.content.photo
    if (props.content.focal) patch.focal = props.content.focal
  }
  emit('patch', patch)
}

function applyAngle(angle) {
  emit('patch', {
    kicker: angle.kicker,
    headlineTop: angle.headlineTop,
    headlineAccent: angle.headlineAccent,
    support: angle.support,
    cta: angle.cta,
  })
}

function set(key, value) {
  emit('patch', { [key]: value })
}

function setNested(key, sub, value) {
  emit('patch', { [key]: { ...(props.content[key] || {}), [sub]: value } })
}

function shortDate(iso) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function onArtist(snapshot) {
  pickingArtist.value = false
  emit('artist', snapshot)
}

function setExcerpt(id) {
  const preset = props.family.headlines?.find((h) => h.excerpt === id)
  const patch = { excerpt: id }
  if (preset) Object.assign(patch, { headlineTop: preset.top, headlineAccent: preset.accent, support: preset.support })
  emit('patch', patch)
}

function setTopic(id) {
  const topic = educationTopic(id)
  if (!topic) return
  emit('patch', { topic: id, cover: { ...topic.cover }, slides: topic.slides.map((s) => ({ ...s })), closing: { ...topic.closing }, cta: topic.closing.cta })
}

function showKey(s) {
  return s ? `${s.id ?? ''}|${s.date || ''}|${s.venue || ''}` : ''
}

function showLabel(s) {
  const bits = [s.date, s.venue, [s.city, s.state].filter(Boolean).join(', ')].filter(Boolean)
  return `${bits.join(' · ')}${s.upcoming ? '' : ' (past)'}`
}

function setShow(key) {
  const show = shows.value.find((s) => showKey(s) === key) || null
  const patch = { show: show ? { ...show } : null }
  if (show?.city && /^Live( in .*)?$/.test(props.content.headline || '')) patch.headline = `Live in ${show.city}`
  if (!props.content.photo && show?.image) patch.photo = show.image
  emit('patch', patch)
}

function headlineValues() {
  return { artist: props.snapshot?.name || props.content.artistName || '', city: props.content.show?.city || '' }
}

function headlinePreview(h) {
  if (typeof h === 'string') return fillToken(h, headlineValues()) || h.replace(/\{\w+\}/g, '').trim()
  return `${fillToken(h.top, headlineValues())} ${fillToken(h.accent, headlineValues())}`.trim()
}

function isHeadline(h) {
  if (typeof h === 'string') return props.content.headline === fillToken(h, headlineValues())
  return props.content.headlineTop === fillToken(h.top, headlineValues()) && props.content.headlineAccent === fillToken(h.accent, headlineValues())
}

function setHeadline(h) {
  if (typeof h === 'string') {
    emit('patch', { headline: fillToken(h, headlineValues()) })
    return
  }
  const patch = { headlineTop: fillToken(h.top, headlineValues()), headlineAccent: fillToken(h.accent, headlineValues()) }
  if (h.support != null) patch.support = h.support
  if (h.excerpt) patch.excerpt = h.excerpt
  emit('patch', patch)
}

function isPreset(p) {
  return JSON.stringify(p.lines) === JSON.stringify(props.content.lines)
}

function setPreset(p) {
  emit('patch', { lines: p.lines.map((l) => ({ ...l })), support: p.support, cta: p.cta })
}

function setLine(i, patch) {
  const lines = (props.content.lines || []).map((l, idx) => (idx === i ? { ...l, ...patch } : l))
  emit('patch', { lines })
}

function addLine() {
  emit('patch', { lines: [...(props.content.lines || []), { text: '', tone: 'plain' }] })
}

function removeLine(i) {
  emit('patch', { lines: (props.content.lines || []).filter((_, idx) => idx !== i) })
}

function setSlide(i, patch) {
  emit('patch', { slides: (props.content.slides || []).map((s, idx) => (idx === i ? { ...s, ...patch } : s)) })
}

function addSlide() {
  emit('patch', { slides: [...(props.content.slides || []), { title: '', body: '' }] })
}

function removeSlide(i) {
  emit('patch', { slides: (props.content.slides || []).filter((_, idx) => idx !== i) })
}

function toggleSong(on) {
  if (on) emit('patch', { songTitle: props.snapshot?.song?.title || 'Featured song', songArt: props.content.songArt || props.snapshot?.song?.art || null })
  else emit('patch', { songTitle: '' })
}
</script>

<style scoped>
.cc { display: flex; flex-direction: column; }

.sec {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.sec:last-child { border-bottom: 0; }

.sec h3 {
  margin: 0;
  color: rgba(247, 249, 252, 0.88);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.sec h3 .muted { margin-left: 6px; font-weight: 500; letter-spacing: 0.04em; }

.sec__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.sec__value { margin: 0; font-size: 14px; line-height: 1.4; }
.sec__value strong { font-weight: 600; }
.sec__value span { color: rgba(247, 249, 252, 0.55); }
.sec__picker { margin-top: 6px; }

.muted { color: rgba(247, 249, 252, 0.5); }
.small { margin: 0; font-size: 12px; line-height: 1.45; }
.warn { margin: 0; color: #ffcf8a; }

.link {
  padding: 0;
  border: 0;
  background: transparent;
  color: #7ee7ff;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
}

.link:disabled { color: rgba(247, 249, 252, 0.3); cursor: default; }

.chips { display: flex; flex-wrap: wrap; gap: 6px; }

/* Design style thumbnails: 2 × 2, each a real render scaled to 132px wide. */
.styles { display: grid; grid-template-columns: repeat(2, 132px); gap: 12px 14px; }

.style {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
  border: 0;
  background: transparent;
  color: rgba(247, 249, 252, 0.72);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.style__thumb {
  position: relative;
  display: block;
  width: 132px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  background: #050506;
}

.style__canvas { position: absolute; top: 0; left: 0; display: block; transform-origin: 0 0; pointer-events: none; }

.style__label { font-size: 12px; font-weight: 600; line-height: 1.25; }

.style[aria-checked="true"] { color: #f7f9fc; }
.style[aria-checked="true"] .style__thumb { border-color: #f7f9fc; box-shadow: 0 0 0 2px #050506 inset; }
.style:focus-visible { outline: 1px solid rgba(126, 231, 255, 0.7); outline-offset: 2px; border-radius: 10px; }

.chip {
  padding: 7px 11px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  background: transparent;
  color: rgba(247, 249, 252, 0.78);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  text-align: left;
  cursor: pointer;
}

.chip[aria-pressed="true"] {
  border-color: #f7f9fc;
  background: #f7f9fc;
  color: #050506;
}

.chip:focus-visible,
.swatch:focus-visible,
.input:focus-visible,
.select:focus-visible,
.icon:focus-visible {
  outline: 1px solid rgba(126, 231, 255, 0.7);
  outline-offset: 2px;
}

.swatch {
  width: 28px;
  height: 28px;
  border: 2px solid transparent;
  border-radius: 999px;
  background: var(--swatch);
  cursor: pointer;
}

.swatch[aria-pressed="true"] { border-color: #f7f9fc; box-shadow: 0 0 0 2px #050506 inset; }

.input,
.select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: #f7f9fc;
  font: inherit;
  font-size: 14px;
}

.input--area { resize: vertical; line-height: 1.4; }
.select option { color: #050506; }
.select--tone { width: auto; }

.pair { display: grid; gap: 8px; }
.row { display: flex; flex-wrap: wrap; gap: 14px; }

.lines { display: flex; flex-direction: column; gap: 8px; }
.line { display: grid; grid-template-columns: 1fr auto auto; gap: 6px; align-items: center; }

.icon {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  background: transparent;
  color: rgba(247, 249, 252, 0.7);
  font: inherit;
  font-size: 16px;
  cursor: pointer;
}

.icon:disabled { opacity: 0.3; cursor: default; }

.slide { display: flex; flex-direction: column; gap: 6px; padding: 10px; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; }
.slide__head { display: flex; align-items: center; justify-content: space-between; }

.toggle { display: flex; align-items: center; gap: 10px; font-size: 14px; cursor: pointer; }
.toggle input { width: 18px; height: 18px; accent-color: #7ee7ff; }

.range { width: 100%; accent-color: #7ee7ff; }
</style>
