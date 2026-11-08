<template>
  <article
    class="fq-gitem"
    :class="{ 'is-menu-open': menuOpen, 'is-put-away': hidden, 'is-lead': lead }"
  >
    <FaneqoGalleryStack
      :media="item.media || []"
      :title="stackTitle"
      :count="photoCount"
      :priority="priority"
      :selected="selected"
      :transition-key="item.id"
      :frame-ratio="frameRatio"
      :plate="true"
      fit="auto"
      :active-index="browseIndex"
      @update:active-index="onBrowse"
      @index-change="onBrowseChange"
      @activate="onActivate"
    />
    <div class="fq-gitem__meta">
      <div class="fq-gitem__copy">
        <h3 v-if="plateName" class="fq-gitem__title">{{ plateName }}</h3>
        <p class="fq-gitem__facts">
          <span class="fq-gitem__count">{{ countLabel }}</span>
          <span class="fq-gitem__sep" aria-hidden="true">·</span>
          <span class="fq-gitem__vis" :class="{ 'is-open': audienceIsOpen }">{{ visibilityLabel }}</span>
          <span v-if="draft" class="fq-gitem__draft">Draft</span>
          <span v-if="hidden" class="fq-gitem__draft">Hidden</span>
          <span
            v-if="rocksnapsLabel"
            class="fq-gitem__draft fq-gitem__rocksnaps"
            :class="{ 'is-on': rocksnapsOn }"
          >{{ rocksnapsLabel }}</span>
        </p>
        <p class="fq-gitem__feature">
          <template v-if="featured">
            <span class="fq-gitem__draft" :class="featureBlock.eligible ? 'is-featured' : 'is-attention'">
              {{ featureBlock.eligible ? 'Featured' : 'Needs attention' }}
            </span>
            <button
              type="button"
              class="fq-gitem__remove"
              :disabled="featureBusy"
              @click.stop="emit('unfeature', item)"
            >
              Remove
            </button>
          </template>
          <button
            v-else-if="featureBlock.eligible"
            type="button"
            class="fq-gitem__feature-btn"
            :disabled="featureBusy"
            @click.stop="emit('feature', item)"
          >
            Feature on artist page
          </button>
          <span v-else class="fq-gitem__feature-reason">{{ featureBlock.reason }}</span>
        </p>
      </div>
      <div class="fq-gitem__tools">
        <button
          ref="menuBtn"
          type="button"
          class="fq-gitem__more"
          :aria-expanded="menuOpen ? 'true' : 'false'"
          aria-haspopup="menu"
          :aria-label="`More actions for ${stackTitle}`"
          @click.stop="toggleMenu"
        >
          <component :is="icons.more" :size="18" :stroke-width="1.8" aria-hidden="true" />
        </button>
      </div>
    </div>
    <button
      v-if="hidden"
      type="button"
      class="fq-gitem__restore"
      @click="emit('restore', item)"
    >
      Restore gallery
    </button>
    <p v-if="status" class="fq-gitem__status">{{ status }}</p>

    <Teleport to="body">
      <div
        v-if="menuOpen"
        ref="menuRef"
        class="fq-gitem__menu"
        :class="{ 'is-sheet': sheet }"
        :style="sheet ? undefined : placement"
        role="menu"
        :aria-label="stackTitle"
        @keydown="onMenuKey"
      >
        <p v-if="sheet" class="fq-gitem__menu-head">{{ stackTitle }}</p>
        <button type="button" role="menuitem" tabindex="-1" @click="choose('open')">Open gallery</button>
        <NuxtLink
          v-if="editTo"
          :to="editTo"
          role="menuitem"
          tabindex="-1"
          :aria-label="`Edit ${stackTitle}`"
          @click="closeMenu(false)"
        >
          Edit gallery
        </NuxtLink>
        <NuxtLink
          v-if="sendTo && !hidden"
          :to="sendTo"
          role="menuitem"
          tabindex="-1"
          @click="closeMenu(false)"
        >
          Send to fans
        </NuxtLink>
        <button v-if="!hidden" type="button" role="menuitem" tabindex="-1" @click="choose('share')">Share link</button>
        <button
          v-if="hidden"
          type="button"
          role="menuitem"
          tabindex="-1"
          @click="choose('restore')"
        >
          Restore gallery
        </button>
        <button
          v-else-if="live"
          type="button"
          role="menuitem"
          tabindex="-1"
          class="fq-gitem__quiet"
          @click="choose('hide')"
        >
          Hide gallery
        </button>
      </div>
    </Teleport>
  </article>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { onClickOutside } from '@vueuse/core'
import FaneqoGalleryStack from '~/components/media/FaneqoGalleryStack.vue'
import { faneqoIcons } from '~/utils/messages/faneqoIcons'
import {
  archiveVisibilityLabel,
  galleryPhotoCount,
  galleryTitle,
  isDraftGallery,
  isHiddenGallery,
  isLiveGallery,
  manageEditPath,
  manageSendPath,
} from '~/utils/galleries/archiveShelves'
import {
  plateAudienceIsOpen,
  plateIdentity,
  platePhotoLabel,
} from '~/utils/galleries/archivePlates'
import { featureProfileBlock } from '~/utils/galleries/artistPageFeature'
import { rocksnapsOverviewLabel } from '~/utils/galleries/rocksnapsOverview'
import { recalledStackIndex, rememberStackIndex } from '~/utils/galleries/stackBrowseMemory'

const props = defineProps({
  item: { type: Object, required: true },
  priority: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
  status: { type: String, default: '' },
  frameRatio: { type: Number, default: 0 },
  lead: { type: Boolean, default: false },
  featureBusy: { type: Boolean, default: false },
})

const emit = defineEmits(['open', 'share', 'hide', 'restore', 'feature', 'unfeature'])
const icons = faneqoIcons
const menuOpen = ref(false)
const menuBtn = ref(null)
const menuRef = ref(null)
const sheet = ref(false)
const placement = ref({ top: '0px', left: '0px' })
let anchor = null

/* The plate caption speaks only when it has something the row header does not. */
const plateName = computed(() => plateIdentity(props.item))
/* Screen-reader and menu labels still need a stable name for every gallery. */
const stackTitle = computed(() => plateName.value || galleryTitle(props.item))
const photoCount = computed(() => galleryPhotoCount(props.item))
const countLabel = computed(() => platePhotoLabel(props.item))
/* Public is stated, never implied by silence — it is the highest-stakes fact. */
const visibilityLabel = computed(() => archiveVisibilityLabel(props.item?.visibility, { quietPublic: false }))
const audienceIsOpen = computed(() => plateAudienceIsOpen(props.item?.visibility))
const draft = computed(() => isDraftGallery(props.item))
const hidden = computed(() => isHiddenGallery(props.item))
const live = computed(() => isLiveGallery(props.item))
const featured = computed(() => props.item?.featuredOnProfile === true)
const featureBlock = computed(() => featureProfileBlock(props.item))
const rocksnapsLabel = computed(() => rocksnapsOverviewLabel(props.item))
const rocksnapsOn = computed(() => props.item?.rocksnaps?.onRockSnaps === true)
const sendTo = computed(() => manageSendPath(props.item))
const editTo = computed(() => manageEditPath(props.item))
const browseIndex = ref(recalledStackIndex(props.item?.id, 0))

watch(
  () => props.item?.id,
  (id) => {
    browseIndex.value = recalledStackIndex(id, 0)
  },
)

function onBrowse(index) {
  browseIndex.value = Number(index) || 0
}

function onBrowseChange(payload) {
  rememberStackIndex(props.item?.id, payload?.index)
}

function onActivate(payload) {
  rememberStackIndex(props.item?.id, payload?.index)
  emit('open', props.item, payload)
}

/* ---- action menu ---------------------------------------------------------
   Portalled so it can never be clipped by a plate, and focus actually moves
   into it so the role="menu" it announces is the role it behaves as. */

function menuItems() {
  if (!menuRef.value) return []
  return [...menuRef.value.querySelectorAll('[role="menuitem"]')]
}

function focusItem(index) {
  const rows = menuItems()
  if (!rows.length) return
  const i = Math.max(0, Math.min(index, rows.length - 1))
  rows[i]?.focus?.()
}

function placeMenu() {
  if (sheet.value || !menuRef.value || !anchor) return
  const menu = menuRef.value.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  let top = anchor.bottom + 4
  if (top + menu.height > vh - 8) top = Math.max(8, anchor.top - menu.height - 4)
  let left = anchor.right - menu.width
  if (left + menu.width > vw - 8) left = vw - 8 - menu.width
  if (left < 8) left = 8
  placement.value = { top: `${Math.round(top)}px`, left: `${Math.round(left)}px` }
}

async function openMenu() {
  const rect = menuBtn.value?.getBoundingClientRect?.()
  sheet.value = typeof window !== 'undefined' && window.innerWidth < 760
  anchor = rect
    ? { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right }
    : null
  menuOpen.value = true
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', dismiss, { passive: true, capture: true })
    window.addEventListener('resize', dismiss, { passive: true })
  }
  await nextTick()
  placeMenu()
  focusItem(0)
}

function closeMenu(returnFocus = true) {
  if (!menuOpen.value) return
  menuOpen.value = false
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', dismiss, { capture: true })
    window.removeEventListener('resize', dismiss)
  }
  if (returnFocus) menuBtn.value?.focus?.()
}

function dismiss() {
  closeMenu(false)
}

function toggleMenu() {
  if (menuOpen.value) closeMenu()
  else openMenu()
}

function onMenuKey(evt) {
  const rows = menuItems()
  const at = rows.indexOf(document.activeElement)
  if (evt.key === 'Escape') {
    evt.preventDefault()
    closeMenu()
    return
  }
  if (evt.key === 'Tab') {
    closeMenu()
    return
  }
  if (evt.key === 'ArrowDown') {
    evt.preventDefault()
    focusItem(at < 0 ? 0 : (at + 1) % rows.length)
    return
  }
  if (evt.key === 'ArrowUp') {
    evt.preventDefault()
    focusItem(at <= 0 ? rows.length - 1 : at - 1)
    return
  }
  if (evt.key === 'Home') {
    evt.preventDefault()
    focusItem(0)
    return
  }
  if (evt.key === 'End') {
    evt.preventDefault()
    focusItem(rows.length - 1)
  }
}

function choose(action) {
  closeMenu()
  if (action === 'open') {
    emit('open', props.item, {
      index: browseIndex.value,
      mediaId: null,
      media: null,
    })
  }
  if (action === 'share') emit('share', props.item)
  if (action === 'hide') emit('hide', props.item)
  if (action === 'restore') emit('restore', props.item)
}

onClickOutside(menuRef, (evt) => {
  if (menuBtn.value?.contains?.(evt.target)) return
  closeMenu(false)
}, { ignore: [menuBtn] })

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return
  window.removeEventListener('scroll', dismiss, { capture: true })
  window.removeEventListener('resize', dismiss)
})
</script>

<style scoped>
.fq-gitem {
  min-width: 0;
  overflow: visible;
}
/* A put-away gallery recedes in place and keeps its way back. */
.fq-gitem.is-put-away :deep(.fq-gstack) {
  opacity: 0.46;
}
.fq-gitem__meta {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.55rem;
  padding: 0.1rem 0.2rem 0;
}
.fq-gitem__copy {
  min-width: 0;
  padding-top: 0.28rem;
}
.fq-gitem__title {
  margin: 0 0 0.2rem;
  color: #f5f5f6;
  font-size: 0.98rem;
  font-weight: 620;
  letter-spacing: -0.022em;
  line-height: 1.25;
  overflow-wrap: anywhere;
}
.fq-gitem.is-lead .fq-gitem__title {
  font-size: 1.06rem;
}
.fq-gitem__facts {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.2rem 0.45rem;
  margin: 0;
  font-size: 0.84rem;
  line-height: 1.4;
}
/* Count leads in near-white; audience is the one earned qualifier beside it. */
.fq-gitem__count {
  color: rgba(245, 245, 246, 0.92);
  font-weight: 560;
  font-variant-numeric: tabular-nums;
}
.fq-gitem__sep {
  color: rgba(245, 245, 246, 0.38);
}
.fq-gitem__vis {
  color: rgba(245, 245, 246, 0.62);
}
/* Reaching the open web is the one audience that earns emphasis. */
.fq-gitem__vis.is-open {
  color: rgba(245, 245, 246, 0.78);
}
.fq-gitem__draft {
  padding: 0.08rem 0.42rem;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  color: rgba(245, 245, 246, 0.78);
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  white-space: nowrap;
}
.fq-gitem__draft.is-featured {
  border-color: rgba(245, 245, 246, 0.72);
  color: #f5f5f6;
}
.fq-gitem__draft.is-attention {
  border-color: rgba(245, 245, 246, 0.42);
  color: #f5f5f6;
}
.fq-gitem__rocksnaps {
  color: rgba(245, 245, 246, 0.62);
}
.fq-gitem__rocksnaps.is-on {
  border-color: rgba(245, 245, 246, 0.34);
  color: rgba(245, 245, 246, 0.92);
}
.fq-gitem__feature {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.15rem 0.65rem;
  margin: 0.28rem 0 0;
}
.fq-gitem__feature-btn,
.fq-gitem__remove {
  min-height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  font-size: 0.84rem;
  text-align: left;
  cursor: pointer;
}
.fq-gitem__feature-btn {
  color: rgba(245, 245, 246, 0.78);
  font-weight: 600;
}
.fq-gitem__feature-btn:hover,
.fq-gitem__remove:hover {
  color: #f5f5f6;
}
.fq-gitem__remove {
  color: rgba(245, 245, 246, 0.5);
  font-weight: 550;
}
.fq-gitem__feature-btn:focus-visible,
.fq-gitem__remove:focus-visible {
  outline: 2px solid #f5f5f6;
  outline-offset: 2px;
}
.fq-gitem__feature-btn:disabled,
.fq-gitem__remove:disabled {
  opacity: 0.45;
  cursor: default;
}
.fq-gitem__feature-reason {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  color: rgba(245, 245, 246, 0.46);
  font-size: 0.84rem;
}
.fq-gitem__tools {
  position: relative;
  flex-shrink: 0;
}
/* Never hover-only: the only route to Share / Send / Hide stays on the page. */
.fq-gitem__more {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-right: -0.5rem;
  border: 0;
  border-radius: 0.5rem;
  background: transparent;
  color: rgba(245, 245, 246, 0.72);
  cursor: pointer;
  transition: color 160ms ease, background-color 160ms ease;
}
.fq-gitem__more:hover,
.fq-gitem__more[aria-expanded="true"] {
  background: rgba(255, 255, 255, 0.06);
  color: #f5f5f6;
}
.fq-gitem__more:focus-visible {
  outline: 2px solid #f5f5f6;
  outline-offset: 2px;
}
.fq-gitem__restore {
  min-height: 44px;
  margin: 0.1rem 0 0;
  padding: 0 0.2rem;
  border: 0;
  background: transparent;
  color: #f5f5f6;
  font-size: 0.84rem;
  font-weight: 620;
  text-align: left;
  cursor: pointer;
}
.fq-gitem__restore:focus-visible {
  outline: 2px solid #f5f5f6;
  outline-offset: 2px;
}
.fq-gitem__status {
  margin: 0.3rem 0.2rem 0;
  color: rgba(245, 245, 246, 0.62);
  font-size: 0.82rem;
  line-height: 1.4;
}
</style>

<style>
/* Portalled menu: unscoped because it renders at the document root. */
.fq-gitem__menu {
  position: fixed;
  z-index: 60;
  display: grid;
  min-width: 12rem;
  padding: 0.3rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.6rem;
  background: #111318;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.5);
}
.fq-gitem__menu button,
.fq-gitem__menu a {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 0 0.7rem;
  border: 0;
  border-radius: 0.4rem;
  background: transparent;
  color: #f5f5f6;
  font-size: 0.86rem;
  font-weight: 550;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}
.fq-gitem__menu button:hover,
.fq-gitem__menu a:hover {
  background: rgba(255, 255, 255, 0.06);
}
.fq-gitem__menu .fq-gitem__quiet {
  color: rgba(245, 245, 246, 0.72);
}
.fq-gitem__menu button:focus-visible,
.fq-gitem__menu a:focus-visible {
  outline: 2px solid #f5f5f6;
  outline-offset: -2px;
}
.fq-gitem__menu-head {
  margin: 0;
  padding: 0.5rem 0.7rem 0.45rem;
  color: rgba(245, 245, 246, 0.62);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  overflow-wrap: anywhere;
}

/* One hand, dark room: on a phone the menu arrives as a sheet in thumb reach. */
.fq-gitem__menu.is-sheet {
  top: auto;
  right: 0;
  bottom: 0;
  left: 0;
  min-width: 0;
  padding: 0.35rem 0.6rem calc(0.6rem + env(safe-area-inset-bottom, 0px));
  border: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem 1rem 0 0;
  background: #10131a;
  box-shadow: 0 -18px 44px rgba(0, 0, 0, 0.6);
}
.fq-gitem__menu.is-sheet button,
.fq-gitem__menu.is-sheet a {
  min-height: 52px;
  font-size: 0.95rem;
}
</style>
