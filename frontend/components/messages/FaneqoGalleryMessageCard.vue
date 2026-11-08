<template>
  <article class="gallery-msg" :class="{ 'is-preview': preview, 'is-locked': unavailable }">
    <template v-if="unavailable">
      <div class="gallery-msg__locked" role="status">
        <component :is="icons.images" :size="20" :stroke-width="1.7" aria-hidden="true" />
        <div>
          <p class="gallery-msg__kicker">Gallery</p>
          <h3>This gallery is no longer available.</h3>
          <p>Access can change, but the private conversation stays intact.</p>
        </div>
      </div>
    </template>

    <template v-else>
      <header v-if="placeLine && preview" class="gallery-msg__night">
        <p class="gallery-msg__kicker">From the night</p>
        <p class="gallery-msg__place">{{ placeLine }}</p>
      </header>

      <FaneqoGalleryStack
        v-if="media.length"
        class="gallery-msg__stack"
        :media="media"
        :title="title"
        :count="photoCount"
        size="attachment"
        @activate="onStackActivate"
      />

      <div v-if="showCopy" class="gallery-msg__copy">
        <p v-if="showTitle" class="gallery-msg__title">{{ title }}</p>
        <p v-if="showCount" class="gallery-msg__count">{{ photoLabel }}</p>
        <p v-if="caption" class="gallery-msg__caption">{{ caption }}</p>
      </div>

      <footer v-if="!preview && !hideActions && (canSave || canShare)" class="gallery-msg__actions">
        <button
          v-if="canSave"
          type="button"
          class="gallery-msg__save"
          :disabled="saving || saved"
          @click="save"
        >
          {{ saved ? 'Saved to Passport' : saving ? 'Saving…' : 'Save to Passport' }}
        </button>
        <button
          v-if="canShare"
          type="button"
          class="gallery-msg__share"
          :disabled="sharing"
          :aria-label="sharing ? 'Sharing' : 'Share'"
          @click="share"
        >
          <component :is="icons.share" :size="15" :stroke-width="1.8" aria-hidden="true" />
        </button>
      </footer>

      <button
        v-if="removable"
        type="button"
        class="gallery-msg__remove"
        aria-label="Remove gallery"
        @click="emit('remove')"
      >
        <component :is="icons.close" :size="16" :stroke-width="2" aria-hidden="true" />
      </button>

      <p v-if="actionStatus" class="gallery-msg__status" role="status">{{ actionStatus }}</p>
    </template>
  </article>
</template>

<script setup>
import { computed, ref } from 'vue'
import FaneqoGalleryStack from '~/components/media/FaneqoGalleryStack.vue'
import { faneqoIcons } from '~/utils/messages/faneqoIcons'
import { formatShowNightDate } from '~/utils/shows/formatShowNightDate'
import { sharePassportGallery } from '~/utils/passport/fanPassport'
import { galleryMessageTitle, isGenericGalleryTitle } from '~/utils/messages/threadPresentation'

const props = defineProps({
  gallery: { type: Object, default: null },
  caption: { type: String, default: '' },
  viewerRole: { type: String, default: 'artist' },
  preview: { type: Boolean, default: false },
  removable: { type: Boolean, default: false },
  hideActions: { type: Boolean, default: false },
})

const emit = defineEmits(['open', 'remove', 'saved'])
const icons = faneqoIcons
const passport = useFanPassport()
const saving = ref(false)
const sharing = ref(false)
const saved = ref(false)
const actionStatus = ref('')

const unavailable = computed(() => !props.gallery || props.gallery.locked || props.gallery.unavailable)
const media = computed(() => Array.isArray(props.gallery?.media) ? props.gallery.media : [])
const photoCount = computed(() => Number(props.gallery?.photoCount || media.value.length) || 0)
const photoLabel = computed(() => (
  photoCount.value === 1 ? '1 photo' : `${photoCount.value} photos`
))
const isShowGallery = computed(() => {
  const show = props.gallery?.show
  return (show && typeof show === 'object' && (show.date || show.venue || show.city || show.title))
    || props.gallery?.visibility === 'show_attendees'
})
const title = computed(() => galleryMessageTitle(props.gallery))
const showTitle = computed(() => !media.value.length || !isGenericGalleryTitle(title.value))
const showCount = computed(() => !media.value.length && photoCount.value > 0)
const placeLine = computed(() => {
  const show = props.gallery?.show || {}
  const place = String(show.venue || show.city || show.title || '').trim()
  const date = formatShowNightDate(show.date)
  return [place, date].filter(Boolean).join(' · ')
})
const caption = computed(() => String(props.caption || '').trim())
const showCopy = computed(() => showTitle.value || showCount.value || Boolean(caption.value))
const canSave = computed(() => props.viewerRole === 'fan' && isShowGallery.value && !!props.gallery?.id)
const canShare = computed(() => !!props.gallery?.id)

function onStackActivate(payload = {}) {
  if (!media.value.length) return
  emit('open', {
    items: media.value,
    index: Number.isFinite(Number(payload.index)) ? Number(payload.index) : 0,
    mediaId: payload.mediaId || null,
  })
}

async function save() {
  if (saving.value || saved.value || !props.gallery?.id) return
  saving.value = true
  actionStatus.value = ''
  try {
    await passport.saveGallery(props.gallery.id)
    saved.value = true
    actionStatus.value = 'Saved to your FanPassport.'
    emit('saved', props.gallery.id)
  } catch {
    actionStatus.value = 'Could not save this memory. Try again.'
  } finally {
    saving.value = false
  }
}

async function share() {
  if (sharing.value || !props.gallery?.id) return
  sharing.value = true
  actionStatus.value = ''
  try {
    const result = await sharePassportGallery({
      artistUpdateId: props.gallery.id,
      artistName: props.gallery.band?.name,
      city: props.gallery.show?.city,
      bandSlug: props.gallery.band?.slug,
      slug: props.gallery.slug,
    })
    actionStatus.value = result.method === 'share' ? 'Share sheet opened.' : 'Link copied.'
  } catch (error) {
    if (error?.name !== 'AbortError') {
      actionStatus.value = error?.message || 'Could not share this gallery.'
    }
  } finally {
    sharing.value = false
  }
}
</script>

<style scoped>
.gallery-msg {
  position: relative;
  width: 100%;
  max-width: none;
  color: #f8fafc;
  white-space: normal;
}

.gallery-msg__night {
  padding: 0 0.1rem 0.55rem;
}

.gallery-msg__kicker {
  margin: 0;
  color: rgba(255, 255, 255, 0.42);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.gallery-msg__place,
.gallery-msg h3 {
  margin: 0.18rem 0 0;
  color: #F5F5F6;
  font-size: 0.92rem;
  font-weight: 650;
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.gallery-msg__stack {
  width: 100%;
}

.gallery-msg__copy {
  padding: 0.4rem 0.1rem 0;
}

.gallery-msg__title {
  margin: 0;
  color: rgba(245, 245, 246, 0.78);
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: -0.015em;
}

.gallery-msg__count {
  margin: 0.12rem 0 0;
  color: rgba(255, 255, 255, 0.46);
  font-size: 0.75rem;
}

.gallery-msg__caption {
  margin: 0.4rem 0 0;
  color: rgba(248, 250, 252, 0.78);
  font-size: 0.84rem;
  line-height: 1.45;
}

.gallery-msg__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.15rem 0.15rem;
  padding: 0.28rem 0 0.05rem;
}

.gallery-msg__save,
.gallery-msg__share {
  min-height: 36px;
  padding: 0 0.35rem;
  border: 0;
  background: transparent;
  color: rgba(248, 250, 252, 0.46);
  font-size: 0.72rem;
  font-weight: 550;
  cursor: pointer;
}

.gallery-msg__save {
  padding-left: 0.05rem;
}

.gallery-msg__share {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  padding: 0;
}

.gallery-msg__save:hover,
.gallery-msg__share:hover,
.gallery-msg__save:focus-visible,
.gallery-msg__share:focus-visible {
  color: #fff;
}

.gallery-msg__save:focus-visible,
.gallery-msg__share:focus-visible,
.gallery-msg__remove:focus-visible {
  outline: 2px solid var(--fq-accent-focus, #39D5FF);
  outline-offset: 3px;
  border-radius: 0.35rem;
}

.gallery-msg__save:disabled,
.gallery-msg__share:disabled {
  opacity: 0.62;
  cursor: default;
}

.gallery-msg__remove {
  position: absolute;
  top: 0.15rem;
  right: 0.05rem;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 999px;
  background: rgba(5, 6, 8, 0.72);
  color: #fff;
  cursor: pointer;
}

.gallery-msg__status {
  margin: 0.35rem 0 0;
  color: rgba(248, 250, 252, 0.5);
  font-size: 0.72rem;
}

.gallery-msg__locked {
  display: flex;
  gap: 0.7rem;
  align-items: flex-start;
  padding: 0.2rem 0;
  color: rgba(248, 250, 252, 0.55);
}

.gallery-msg__locked p:last-child {
  margin: 0.28rem 0 0;
  font-size: 0.72rem;
  line-height: 1.4;
}

.gallery-msg.is-preview {
  width: min(100%, 28rem);
  margin: 0 0 0.5rem;
}

@media (max-width: 430px) {
  .gallery-msg { max-width: 100%; }
}
</style>
