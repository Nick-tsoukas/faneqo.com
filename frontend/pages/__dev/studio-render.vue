<template>
  <div class="render">
    <input class="render__seek" type="number" aria-hidden="true" tabindex="-1" :value="motionT ?? ''" @input="onSeekInput">
    <div v-if="creative" class="render__frame" :data-t="motionT == null ? undefined : String(motionT)" :style="{ width: `${board.width}px`, height: `${board.height}px` }">
      <component :is="Template" :format="board.id" :content="creative.content" :snapshot="creative.snapshot" :scene="scene" :t="motionT" />
      <div v-if="guides" class="render__safe" :style="safeStyle" aria-hidden="true" />
    </div>
    <p v-else-if="error" class="render__error">{{ error }}</p>
    <p v-else class="render__error">Loading…</p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { AD_FORMATS, AD_SAFE_ZONES, isAdFormat } from '~/features/ads/formats.js'
import { newCreative } from '~/features/ads/studio/creativeModel.js'
import { demoBadflowerSnapshot } from '~/features/ads/studio/fixtures.js'
import { educationTopic } from '~/features/ads/studio/education.js'
import { templateComponentFor, templateFamily } from '~/features/ads/studio/templates/index.js'
import { defaultProductMotion } from '~/features/ads/studio/motion.js'

/**
 * Dev-only 1:1 renderer for studio template families. Used by
 * scripts/capture-studio.mjs for visual review. 404 outside `nuxi dev`.
 *
 *   ?template=song-spotlight&format=story&variant=bleed&artist=demo|<slug>
 *   &scene=0&excerpt=shows&preset=stop-renting&topic=promote-next-show
 *   &kind=ad&guides=1&photo=2
 */
definePageMeta({ layout: false, robots: 'noindex, nofollow', sitemap: false })

const renderHost = import.meta.client ? window.location.hostname : useRequestURL().hostname
const renderLocal = renderHost === 'localhost' || renderHost === '127.0.0.1' || renderHost === '::1'
if (!import.meta.dev && !(useRuntimeConfig().public.studioRenderInternal === true && renderLocal)) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const route = useRoute()
const q = (key) => String(route.query[key] ?? '')
const family = templateFamily(q('template'))
if (!family) throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })

const Template = templateComponentFor(family.id)
const board = computed(() => AD_FORMATS[isAdFormat(q('format')) && family.formats.includes(q('format')) ? q('format') : family.defaultFormat])
const scene = computed(() => Math.max(0, Number(q('scene')) || 0))
const guides = computed(() => q('guides') === '1')
const safeStyle = computed(() => {
  const zone = AD_SAFE_ZONES[board.value.id]
  return { top: `${zone.top}px`, bottom: `${zone.bottom}px`, left: `${zone.side ?? zone.left ?? 0}px`, right: `${zone.side ?? zone.right ?? 0}px` }
})

const creative = ref(null)
const error = ref('')
const seekMs = ref(null)

const motionT = computed(() => {
  if (q('motion') !== '1') return null
  if (seekMs.value != null) return seekMs.value
  if (route.query.t === undefined || route.query.t === '') return null
  const n = Number(q('t'))
  return Number.isFinite(n) ? n : null
})

function markReady(state) {
  if (import.meta.client) document.documentElement.dataset.renderReady = state
}

function onSeekInput(event) {
  const n = Number(event.target.value)
  if (!Number.isFinite(n) || n < 0 || n > 120000) return
  seekMs.value = Math.round(n)
}

function installBridge() {
  window.__faneqoSeek = (ms) => {
    const n = Number(ms)
    if (!Number.isFinite(n) || n < 0 || n > 120000) return false
    seekMs.value = Math.round(n)
    return true
  }
  document.querySelector('.render__seek')?.addEventListener('payload', (event) => {
    const raw = event.target?.dataset?.payload
    if (!raw) return
    try { window.__faneqoApplyCreative(JSON.parse(raw)) } catch { /* the exporter reports a rejected creative */ }
  })
  window.__faneqoApplyCreative = (payload) => {
    if (!payload || payload.templateId !== family.id || !payload.content) return false
    const next = { ...payload, content: { ...payload.content } }
    if (q('motion') === '1' && !next.content.motion) next.content.motion = defaultProductMotion(next.content.style)
    creative.value = next
    markReady('applied')
    return true
  }
}

async function snapshotFor(artist) {
  if (!artist || artist === 'none') return null
  if (artist === 'demo') return demoBadflowerSnapshot()
  const res = await $fetch(`/api/ads/artists/${encodeURIComponent(artist)}`)
  return res?.snapshot || null
}

onMounted(async () => {
  installBridge()
  try {
    const snapshot = await snapshotFor(q('artist') || (family.needsArtist ? 'demo' : 'none'))
    const draft = newCreative(family.id, { snapshot, kind: q('kind') === 'ad' ? 'ad' : 'post', format: board.value.id })
    const c = draft.content
    if (q('variant')) c.variant = q('variant')
    if (q('excerpt')) {
      c.excerpt = q('excerpt')
      const h = family.headlines?.find((x) => x.excerpt === c.excerpt)
      if (h) Object.assign(c, { headlineTop: h.top, headlineAccent: h.accent, support: h.support })
    }
    if (q('preset')) {
      const p = family.presets?.find((x) => x.id === q('preset'))
      if (p) Object.assign(c, { lines: p.lines.map((l) => ({ ...l })), support: p.support, cta: p.cta })
    }
    if (q('scale')) c.scale = q('scale')
    if (q('topic')) {
      const t = educationTopic(q('topic'))
      if (t) Object.assign(c, { topic: t.id, cover: { ...t.cover }, slides: t.slides.map((s) => ({ ...s })), closing: { ...t.closing }, cta: t.closing.cta })
    }
    if (q('photo') !== '' && snapshot?.photos?.length) {
      const photo = snapshot.photos[Math.min(snapshot.photos.length - 1, Math.max(0, Number(q('photo')) || 0))]
      c.photo = photo
      c.focal = photo?.focal || c.focal
    }
    if (q('show') !== '' && snapshot?.shows?.length) {
      c.show = { ...snapshot.shows[Math.min(snapshot.shows.length - 1, Math.max(0, Number(q('show')) || 0))] }
      if (c.show.city) c.headline = `Live in ${c.show.city}`
    }
    if (q('headline')) c.headline = q('headline')
    if (q('name')) c.artistName = q('name')
    if (q('title')) c.title = q('title')
    // Spotlight QA knobs: empty values clear the field (`desc=`, `badge=`, `song=`); focal is "x,y" in percent.
    if (route.query.desc !== undefined) c.description = q('desc')
    if (route.query.badge !== undefined) c.badgeText = q('badge')
    if (route.query.song !== undefined) c.songTitle = q('song')
    if (q('treatment')) c.treatment = q('treatment')
    // Spotlight design style; `style=legacy` renders the pre-style composition, `style=none` drops the key like an old record.
    if (q('style') === 'none') delete c.style
    else if (q('style')) {
      c.style = q('style')
      const styled = family.styleContent?.(q('style'), snapshot)
      if (styled) Object.assign(c, styled)
    }
    if (q('art') === 'none') c.songArt = null
    if (q('top')) c.headlineTop = q('top')
    if (route.query.accent !== undefined) c.headlineAccent = q('accent')
    if (route.query.support !== undefined) c.support = q('support')
    if (route.query.statement !== undefined) c.statement = q('statement')
    if (route.query.insight !== undefined) c.insight = q('insight')
    if (route.query.category !== undefined) c.category = q('category')
    if (q('motion') === '1') {
      c.motion = defaultProductMotion(c.style)
      if (q('close')) c.motion.close = q('close')
    }
    if (q('focal')) {
      const [x, y] = q('focal').split(',').map(Number)
      if (Number.isFinite(x) && Number.isFinite(y)) c.focal = { x, y }
    }
    if (document.documentElement.dataset.renderReady !== 'applied') {
      creative.value = draft
      markReady('1')
    }
  } catch (err) {
    error.value = err?.message || String(err)
    markReady('error')
  }
})

useHead({ title: `${family.name} — render`, meta: [{ name: 'robots', content: 'noindex, nofollow' }] })
</script>

<style scoped>
.render__seek {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.render {
  display: inline-block;
  padding: 24px;
  background: #050506;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.render__frame {
  position: relative;
  overflow: hidden;
}

.render__safe {
  position: absolute;
  z-index: 9;
  border: 2px solid rgba(126, 231, 255, 0.9);
  pointer-events: none;
}

.render__error {
  margin: 0;
  color: #ff8aa8;
}
</style>
