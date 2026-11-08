<template>
  <div class="ne" role="dialog" aria-modal="true" aria-labelledby="ne-title">
    <button type="button" class="ne__backdrop" aria-label="Close" @click="$emit('close')" />
    <div class="ne__sheet">
      <header class="ne__head">
        <button type="button" class="ne__nav" @click="$emit('close')">
          <span class="ne__back" aria-hidden="true">←</span>
          <span class="ne__back-label">Back</span>
        </button>
        <h2 id="ne-title">Edit Night</h2>
        <button type="button" class="ne__nav ne__nav--end" @click="$emit('close')">
          <span class="ne__done">Done</span>
          <span class="ne__close">Close</span>
        </button>
      </header>

      <form class="ne__form" @submit.prevent="save">
        <div class="ne__scroll">
        <section class="ne__block">
          <h3>Hero image</h3>
          <p class="ne__help">How this Night opens.</p>
          <input
            ref="heroInput"
            class="ne__file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Choose a Night hero"
            @change="onHeroPicked"
          >
          <div class="ne__hero-frame">
            <img
              v-if="heroPreviewSrc"
              :src="heroPreviewSrc"
              :alt="hasNightHero ? 'Night hero preview' : 'Artist image preview'"
              :style="heroPreviewStyle"
            >
          </div>
          <p v-if="!hasNightHero" class="ne__status">Using artist image</p>
          <div class="ne__preview-actions">
            <button
              v-if="!hasNightHero"
              type="button"
              class="ne__ghost"
              :disabled="heroBusy"
              @click="heroInput?.click()"
            >
              Upload hero
            </button>
            <template v-else>
              <button type="button" class="ne__ghost" :disabled="heroBusy" @click="heroInput?.click()">
                Change hero
              </button>
              <button type="button" class="ne__ghost" :disabled="heroBusy" @click="heroAdjustOpen = true">
                Adjust position
              </button>
              <button type="button" class="ne__ghost" :disabled="heroBusy" @click="useArtistImage">
                Use artist image
              </button>
            </template>
          </div>
          <p v-if="heroBusy" class="ne__help">Uploading…</p>
          <p v-if="heroError" class="ne__error" role="alert">{{ heroError }}</p>
        </section>

        <section class="ne__block">
          <h3>Night photo</h3>
          <p class="ne__help">A photo from this Night. This is a memory image, not the page hero.</p>
          <input
            ref="fileInput"
            class="ne__file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Choose a Night photo"
            @change="onCover"
          >
          <button
            v-if="!coverPreviewSrc"
            type="button"
            class="ne__drop"
            :disabled="uploading"
            @click="fileInput?.click()"
          >
            <span>{{ uploading ? 'Adding photo…' : '+ Add a Night photo' }}</span>
          </button>
          <div v-else class="ne__preview">
            <img :src="coverPreviewSrc" alt="Night photo preview">
            <div class="ne__preview-actions">
              <button type="button" class="ne__ghost" :disabled="uploading" @click="fileInput?.click()">
                Change
              </button>
              <button type="button" class="ne__ghost" :disabled="uploading" @click="removeCover">
                Remove
              </button>
            </div>
            <p v-if="uploading" class="ne__help">Uploading…</p>
          </div>
        </section>

        <section class="ne__block">
          <label class="ne__label" for="ne-story">Story for fans</label>
          <p class="ne__help">Say something about this night.</p>
          <textarea
            id="ne-story"
            v-model="story"
            class="ne__grow"
            rows="3"
            maxlength="5000"
            @input="grow($event.target)"
          />
        </section>

        <section class="ne__block">
          <h3>Lineup</h3>
          <ul v-if="lineup.length" class="ne__lineup">
            <li v-for="(row, index) in lineup" :key="row.key">
              <div>
                <p class="ne__act">{{ row.name || 'Untitled artist' }}</p>
                <p class="ne__role">{{ lineupRoleLabel(row.role) || 'Role' }}</p>
              </div>
              <details class="ne__more">
                <summary aria-label="Lineup actions">···</summary>
                <div class="ne__menu">
                  <button type="button" @click="editMember(index)">Edit</button>
                  <button type="button" :disabled="index === 0" @click="moveMember(index, -1)">Move up</button>
                  <button type="button" :disabled="index === lineup.length - 1" @click="moveMember(index, 1)">Move down</button>
                  <button type="button" class="is-danger" @click="lineup.splice(index, 1)">Remove</button>
                </div>
              </details>
            </li>
          </ul>
          <button type="button" class="ne__add" @click="editMember(-1)">+ Add artist</button>
        </section>

        <section class="ne__block">
          <label class="ne__label" for="ne-note">
            Private band note
            <svg class="ne__lock" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.6" />
              <path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" stroke-width="1.6" />
            </svg>
          </label>
          <p class="ne__help">Only your team can see this.</p>
          <textarea
            id="ne-note"
            v-model="note"
            class="ne__grow"
            rows="3"
            maxlength="10000"
            @input="grow($event.target)"
          />
        </section>

        <p v-if="error" class="ne__error" role="alert">{{ error }}</p>
        </div>

        <div class="ne__save-bar">
          <button type="submit" class="ne__save" :disabled="saving || uploading || heroBusy">
            {{ saving ? 'Saving…' : 'Save Night' }}
          </button>
        </div>
      </form>
    </div>

    <div v-if="memberOpen" class="ne__sub" role="dialog" aria-modal="true" aria-labelledby="ne-member-title">
      <div class="ne__sub-sheet">
        <header class="ne__head">
          <button type="button" class="ne__nav" @click="memberOpen = false">Cancel</button>
          <h3 id="ne-member-title">{{ memberIndex >= 0 ? 'Edit artist' : 'Add artist' }}</h3>
          <span class="ne__nav" />
        </header>
        <label class="ne__label" for="ne-member-name">Artist / band name</label>
        <input
          id="ne-member-name"
          ref="memberNameInput"
          v-model="draftName"
          class="ne__input"
          type="text"
          maxlength="160"
          autocomplete="off"
        >
        <p class="ne__label">Role</p>
        <div class="ne__roles" role="radiogroup" aria-label="Lineup role">
          <button
            v-for="opt in roles"
            :key="opt.value"
            type="button"
            role="radio"
            :aria-checked="draftRole === opt.value"
            :class="{ 'is-on': draftRole === opt.value }"
            @click="draftRole = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
        <div class="ne__member-bar">
          <button type="button" class="ne__save" :disabled="!draftName.trim()" @click="commitMember">
            {{ memberIndex >= 0 ? 'Save artist' : 'Add to lineup' }}
          </button>
          <button type="button" class="ne__ghost ne__member-cancel" @click="memberOpen = false">Cancel</button>
        </div>
      </div>
    </div>

    <ArtistImagePositionSheet
      :open="heroAdjustOpen"
      mode="night-hero"
      :image-url="heroPreviewSrc"
      :image-width="heroMedia?.width"
      :image-height="heroMedia?.height"
      :artist-name="recap.band?.name || ''"
      :position-x="heroFocal.x"
      :position-y="heroFocal.y"
      :saving="heroAdjustSaving"
      :error="heroAdjustError"
      @close="heroAdjustOpen = false"
      @save="saveHeroFocal"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import ArtistImagePositionSheet from '~/components/nights/ArtistImagePositionSheet.vue'
import { useMediaUploadQueue } from '~/composables/useMediaUploadQueue'
import { LINEUP_ROLE_OPTIONS, lineupRoleLabel, recapCoverUrl, recapNightHeroFocal, recapNightHeroMedia, recapNightHeroUrl } from '~/utils/nights/artistRecap'
import { getArtistFocalStyle } from '~/utils/media/artistImage'
import { humanizeFaneqoUploadError, resolveFaneqoMediaSrc } from '~/utils/media/faneqoMedia'

const props = defineProps({
  recap: { type: Object, required: true },
  artistImageUrl: { type: String, default: '' },
  artistImageFit: { type: String, default: 'cover' },
  artistFocalX: { type: [Number, String], default: 50 },
  artistFocalY: { type: [Number, String], default: 50 },
  startAddArtist: { type: Boolean, default: false },
  localOnly: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'saved', 'updated'])
const { updateNight } = useShowRecaps()
const config = useRuntimeConfig()
const token = useStrapiToken()
const heroQueue = useMediaUploadQueue({ maxItems: 1 })
const heroInput = ref(null)
const heroError = ref('')
const heroPatching = ref(false)
const heroAdjustOpen = ref(false)
const heroAdjustSaving = ref(false)
const heroAdjustError = ref('')
let lastHeroMediaId = null

const roles = LINEUP_ROLE_OPTIONS
const fileInput = ref(null)
const memberNameInput = ref(null)
const story = ref(String(props.recap.publicStory || ''))
const note = ref(String(props.recap.privateArtistNote || ''))
const lineup = ref(
  Array.isArray(props.recap.lineup)
    ? props.recap.lineup
      .filter((row) => String(row?.name || '').trim())
      .map((row, index) => ({
        key: `${index}-${row.name}`,
        name: row.name || '',
        role: row.role || '',
        bandId: row.bandId || null,
      }))
    : [],
)
const previewUrl = ref('')
const coverFile = ref(null)
const coverRemoved = ref(false)
const uploading = ref(false)
const saving = ref(false)
const error = ref('')
const memberOpen = ref(false)
const memberIndex = ref(-1)
const draftName = ref('')
const draftRole = ref('support')
let localPreview = ''
const mediaOrigin = computed(() => String(config.public?.strapiUrl || '').replace(/\/+$/, ''))
const heroMedia = computed(() => recapNightHeroMedia(props.recap))
const hasNightHero = computed(() => Boolean(recapNightHeroUrl(props.recap)))
const heroFocal = computed(() => recapNightHeroFocal(props.recap))
const queuedHero = computed(() => heroQueue.items[0] || null)
const heroBusy = computed(() => heroQueue.busy || heroPatching.value)
const coverFromRecap = computed(() => {
  if (coverRemoved.value) return ''
  const existing = recapCoverUrl(props.recap)
  return existing ? (resolveFaneqoMediaSrc(existing, mediaOrigin.value) || existing) : ''
})
const coverPreviewSrc = computed(() => previewUrl.value || coverFromRecap.value)
const heroPreviewSrc = computed(() => {
  const queued = queuedHero.value?.previewUrl || queuedHero.value?.url
  if (queued) return queued
  const override = recapNightHeroUrl(props.recap)
  if (override) return resolveFaneqoMediaSrc(override, mediaOrigin.value) || override
  return resolveFaneqoMediaSrc(props.artistImageUrl, mediaOrigin.value) || props.artistImageUrl || ''
})
const heroPreviewStyle = computed(() => {
  if (hasNightHero.value || queuedHero.value) {
    return {
      objectFit: 'cover',
      ...getArtistFocalStyle({
        positionX: heroFocal.value.x,
        positionY: heroFocal.value.y,
      }),
    }
  }
  return {
    objectFit: props.artistImageFit || 'cover',
    ...getArtistFocalStyle({
      positionX: props.artistFocalX,
      positionY: props.artistFocalY,
    }),
  }
})

watch(
  () => queuedHero.value,
  async (item) => {
    if (!item) return
    if (item.state === 'failed') {
      heroError.value = item.error || humanizeFaneqoUploadError(item) || 'Could not upload that photo.'
      return
    }
    if (item.state === 'ready' && item.mediaId && item.mediaId !== lastHeroMediaId) {
      lastHeroMediaId = item.mediaId
      await patchHero({ heroMediaId: item.mediaId })
    }
  },
  { deep: true },
)

function onKey(event) {
  if (event.key !== 'Escape') return
  if (heroAdjustOpen.value) {
    if (!heroAdjustSaving.value) heroAdjustOpen.value = false
    return
  }
  if (memberOpen.value) {
    memberOpen.value = false
    return
  }
  emit('close')
}

function onHeroPicked(event) {
  const files = event.target.files
  heroError.value = ''
  if (!files?.length) return
  heroQueue.clear()
  lastHeroMediaId = null
  const added = heroQueue.addFiles(files)
  if (!added.length) {
    heroError.value = 'Choose a JPEG, PNG, or WebP up to 8 MB.'
  }
  event.target.value = ''
}

function localHeroNight(patch) {
  const clearing = Object.prototype.hasOwnProperty.call(patch, 'heroMediaId') && patch.heroMediaId == null
  return {
    hero: clearing ? null : (props.recap.hero || props.recap.heroImage || null),
    heroFocalX: Object.prototype.hasOwnProperty.call(patch, 'heroFocalX') ? patch.heroFocalX : props.recap.heroFocalX,
    heroFocalY: Object.prototype.hasOwnProperty.call(patch, 'heroFocalY') ? patch.heroFocalY : props.recap.heroFocalY,
  }
}

async function patchHero(patch) {
  heroPatching.value = true
  heroError.value = ''
  try {
    if (props.localOnly) {
      emit('updated', localHeroNight(patch))
      return
    }
    const night = await updateNight(props.recap.id, patch)
    emit('updated', night)
  } catch (err) {
    lastHeroMediaId = null
    heroError.value = err?.data?.error?.message || humanizeFaneqoUploadError(err) || 'Could not save this hero.'
    throw err
  } finally {
    heroPatching.value = false
  }
}

async function useArtistImage() {
  if (heroBusy.value) return
  heroQueue.clear()
  lastHeroMediaId = null
  try {
    await patchHero({ heroMediaId: null })
  } catch {
    // error already shown
  }
}

async function saveHeroFocal(next) {
  heroAdjustError.value = ''
  heroAdjustSaving.value = true
  try {
    await patchHero({
      heroFocalX: next.positionX,
      heroFocalY: next.positionY,
    })
    heroAdjustOpen.value = false
  } catch (err) {
    heroAdjustError.value = err?.data?.error?.message || 'Could not save this image position.'
  } finally {
    heroAdjustSaving.value = false
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKey)
  document.documentElement.style.overflow = 'hidden'
  nextTick(() => {
    document.querySelectorAll('.ne__grow').forEach((el) => grow(el))
    if (props.startAddArtist) editMember(-1)
  })
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKey)
  document.documentElement.style.overflow = ''
  if (localPreview) URL.revokeObjectURL(localPreview)
})

function grow(el) {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.max(el.scrollHeight, 104)}px`
}

function onCover(evt) {
  const file = evt.target?.files?.[0] || null
  if (fileInput.value) fileInput.value.value = ''
  if (!file) return
  if (localPreview) URL.revokeObjectURL(localPreview)
  coverFile.value = file
  coverRemoved.value = false
  localPreview = URL.createObjectURL(file)
  previewUrl.value = localPreview
}

function removeCover() {
  if (localPreview) URL.revokeObjectURL(localPreview)
  localPreview = ''
  coverFile.value = null
  coverRemoved.value = true
  previewUrl.value = ''
}

function editMember(index) {
  memberIndex.value = index
  const row = index >= 0 ? lineup.value[index] : null
  draftName.value = row?.name || ''
  draftRole.value = row?.role || (index < 0 && !lineup.value.length ? 'headliner' : 'support')
  memberOpen.value = true
  nextTick(() => memberNameInput.value?.focus())
}

function commitMember() {
  const name = String(draftName.value || '').trim()
  if (!name) return
  const next = { key: `${Date.now()}`, name, role: draftRole.value || '', bandId: null }
  if (memberIndex.value >= 0) {
    const current = lineup.value[memberIndex.value]
    lineup.value.splice(memberIndex.value, 1, { ...current, ...next, key: current.key })
  } else {
    lineup.value.push(next)
  }
  memberOpen.value = false
}

function moveMember(index, dir) {
  const next = index + dir
  if (next < 0 || next >= lineup.value.length) return
  const copy = lineup.value.slice()
  const [row] = copy.splice(index, 1)
  copy.splice(next, 0, row)
  lineup.value = copy
}

async function uploadCover() {
  if (!coverFile.value) return undefined
  uploading.value = true
  try {
    const body = new FormData()
    body.append('files', coverFile.value)
    const uploaded = await $fetch(`${config.public.strapiUrl}/api/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value}` },
      body,
    })
    const media = Array.isArray(uploaded) ? uploaded[0] : uploaded
    return media?.id || null
  } finally {
    uploading.value = false
  }
}

async function save() {
  if (saving.value || uploading.value) return
  saving.value = true
  error.value = ''
  try {
    const patch = {
      publicStory: story.value,
      privateArtistNote: note.value,
      lineup: lineup.value
        .filter((row) => String(row.name || '').trim())
        .map((row, order) => ({
          name: String(row.name).trim(),
          role: row.role || null,
          order,
          ...(row.bandId ? { bandId: row.bandId } : {}),
        })),
    }
    if (coverRemoved.value && !coverFile.value) patch.coverMediaId = null
    if (coverFile.value) {
      const coverMediaId = await uploadCover()
      if (coverMediaId) patch.coverMediaId = coverMediaId
    }
    const night = await updateNight(props.recap.id, patch)
    emit('saved', night)
  } catch (err) {
    error.value = err?.data?.error?.message || err?.message || 'Could not save this night.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.ne {
  position: fixed;
  inset: 0;
  z-index: 80;
  color: #f5f5f6;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}
.ne__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(5, 5, 6, 0.58);
}
.ne__sheet {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #050506;
}
.ne__head {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  min-height: 56px;
  padding: 0.35rem 0.7rem;
  padding-top: calc(0.35rem + env(safe-area-inset-top, 0px));
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}
.ne__head h2, .ne__head h3 {
  margin: 0;
  text-align: center;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.ne__nav {
  min-height: 44px;
  padding: 0 0.4rem;
  border: 0;
  background: transparent;
  color: rgba(245, 245, 246, 0.72);
  font: inherit;
  cursor: pointer;
}
.ne__nav--end { justify-self: end; }
.ne__back-label, .ne__close { display: none; }
.ne__form {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.ne__scroll {
  flex: 1;
  overflow: auto;
  padding: 1.15rem 1.25rem 1rem;
}
.ne__block { margin: 0 0 1.7rem; }
.ne__block h3, .ne__label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  color: rgba(245, 245, 246, 0.78);
  font-size: 0.8125rem;
  font-weight: 600;
}
.ne__help { margin: 0.3rem 0 0.7rem; color: rgba(245, 245, 246, 0.4); font-size: 0.88rem; }
.ne__status { margin: 0.45rem 0 0; color: rgba(245, 245, 246, 0.46); font-size: 0.88rem; }
.ne__hero-frame {
  overflow: hidden;
  height: 11rem;
  border-radius: 2px;
  background: #0f1115;
}
.ne__hero-frame img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ne__lock { width: 14px; height: 14px; color: rgba(245, 245, 246, 0.4); }
.ne__file {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}
.ne__drop, .ne__input, .ne__grow {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.075);
  border-radius: 14px;
  background: #0f1115;
  color: #f5f5f6;
  font: inherit;
}
.ne__drop {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 7.5rem;
  cursor: pointer;
}
.ne__input {
  height: 52px;
  margin-top: 0.45rem;
  padding: 0 1rem;
  font-size: 1rem;
}
.ne__grow {
  min-height: 104px;
  padding: 0.9rem 1rem;
  font-size: 1rem;
  line-height: 1.5;
  resize: none;
  overflow: hidden;
}
.ne__drop:hover, .ne__input:hover, .ne__grow:hover { border-color: rgba(255, 255, 255, 0.12); }
.ne__input:focus, .ne__grow:focus {
  border-color: rgba(255, 255, 255, 0.18);
  outline: none;
}
.ne__preview img {
  display: block;
  width: 100%;
  max-height: 16rem;
  object-fit: cover;
  border-radius: 2px;
}
.ne__preview-actions { display: flex; gap: 0.7rem; margin-top: 0.65rem; }
.ne__lineup { margin: 0; padding: 0; list-style: none; }
.ne__lineup li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}
.ne__act { margin: 0; font-weight: 650; }
.ne__role { margin: 0.15rem 0 0; color: rgba(245, 245, 246, 0.45); font-size: 0.88rem; }
.ne__more { position: relative; }
.ne__more summary {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  list-style: none;
  cursor: pointer;
  letter-spacing: 0.08em;
  color: rgba(245, 245, 246, 0.55);
}
.ne__more summary::-webkit-details-marker { display: none; }
.ne__menu {
  position: absolute;
  right: 0;
  z-index: 2;
  display: grid;
  min-width: 9.5rem;
  padding: 0.35rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: #111318;
}
.ne__menu button, .ne__add, .ne__ghost {
  min-height: 44px;
  padding: 0 0.7rem;
  border: 0;
  background: transparent;
  color: rgba(245, 245, 246, 0.78);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.ne__add { padding-left: 0; color: rgba(245, 245, 246, 0.62); }
.ne__menu .is-danger { color: #fca5a5; }
.ne__error { margin: 0 0 1rem; color: #fca5a5; }
.ne__save-bar {
  flex-shrink: 0;
  padding: 0.85rem 1.25rem calc(0.85rem + env(safe-area-inset-bottom, 0px));
  background: #050506;
  box-shadow: 0 -1px 0 rgba(255, 255, 255, 0.06);
}
.ne__save {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 52px;
  border: 0;
  border-radius: 14px;
  background: #f3f3f4;
  color: #08090a;
  font: inherit;
  font-weight: 650;
  cursor: pointer;
}
.ne__save:disabled { opacity: 0.55; }
.ne__sub {
  position: absolute;
  inset: 0;
  z-index: 2;
  overflow: auto;
  background: #050506;
}
.ne__sub-sheet {
  min-height: 100%;
  padding: 0 1.25rem calc(8rem + env(safe-area-inset-bottom, 0px));
}
.ne__member-bar {
  position: sticky;
  bottom: 0;
  margin: 1.4rem -1.25rem 0;
  padding: 0.85rem 1.25rem calc(0.85rem + env(safe-area-inset-bottom, 0px));
  background: linear-gradient(180deg, rgba(5, 5, 6, 0) 0%, #050506 28%);
}
.ne__member-cancel { display: block; width: 100%; text-align: center; }
.ne__roles {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.55rem;
}
.ne__roles button {
  min-height: 44px;
  padding: 0 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  background: #0f1115;
  color: rgba(245, 245, 246, 0.72);
  font: inherit;
  cursor: pointer;
}
.ne__roles .is-on {
  background: #f3f3f4;
  color: #08090a;
  border-color: #f3f3f4;
}
.ne__nav:focus-visible, .ne__save:focus-visible, .ne__drop:focus-visible, .ne__add:focus-visible, .ne__ghost:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}
@media (min-width: 768px) {
  .ne__sheet {
    left: auto;
    width: min(32rem, 100vw);
    border-left: 1px solid rgba(255, 255, 255, 0.07);
  }
  .ne__back, .ne__done { display: none; }
  .ne__back-label, .ne__close { display: inline; }
  .ne__save-bar {
    padding: 0.85rem 1.25rem 1.25rem;
  }
  .ne__sub { left: auto; width: min(32rem, 100vw); }
}
@media (prefers-reduced-motion: reduce) {
  .ne * { transition: none !important; }
}
</style>
