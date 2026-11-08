<template>
  <div
    ref="rootEl"
    class="fq-demo"
    :class="[
      `is-${phase}`,
      `view-${mobileView}`,
      { 'is-campaigns': phase === 'campaigns', 'is-live': isLive, 'is-reduced': reduced, 'is-editorial': editorial },
    ]"
    role="img"
    :aria-label="ariaLabel"
  >
    <header class="fq-demo__bar">
      <LayoutGroup>
        <div class="fq-demo__tabs" aria-hidden="true">
          <span class="fq-demo__tab" :class="{ 'is-active': tab === 'inbox' }">
            Inbox
            <Motion
              v-if="tab === 'inbox'"
              layout-id="home-msg-tab-ink"
              class="fq-demo__ink fq-demo__ink--inbox"
              :transition="inkTransition"
            />
          </span>
          <span v-if="!editorial" class="fq-demo__tab" :class="{ 'is-active': tab === 'campaigns' }">
            Campaigns
            <Motion
              v-if="tab === 'campaigns'"
              layout-id="home-msg-tab-ink"
              class="fq-demo__ink fq-demo__ink--campaigns"
              :transition="inkTransition"
            />
          </span>
        </div>
      </LayoutGroup>
      <span class="fq-demo__new" aria-hidden="true">New Message</span>
    </header>

    <div class="fq-demo__body">
      <!-- Inbox rail -->
      <aside class="fq-rail" aria-hidden="true">
        <div
          v-for="row in inboxRows"
          :key="row.id"
          class="fq-row"
          :class="{
            'is-active': row.primary && tab === 'inbox' && phase !== 'idle',
            'is-unread': row.primary && showUnread,
          }"
        >
          <span class="fq-row__avatar">{{ row.initials }}</span>
          <div class="fq-row__meta">
            <div class="fq-row__top">
              <span class="fq-row__name">{{ row.name }}</span>
              <span v-if="row.primary && showUnread" class="fq-row__badge">1</span>
              <span v-else class="fq-row__time">{{ row.time }}</span>
            </div>
            <p class="fq-row__context">{{ row.context }}</p>
            <p class="fq-row__preview">{{ rowPreview(row) }}</p>
            <div v-if="editorial && row.primary" class="fq-row__thumbs" aria-hidden="true">
              <img
                v-for="photo in PHOTOS.slice(0, 3)"
                :key="photo.id"
                :src="photo.src"
                alt=""
                width="48"
                height="48"
                loading="lazy"
                decoding="async"
              >
            </div>
          </div>
        </div>
      </aside>

      <!-- Thread -->
      <div class="fq-thread" aria-hidden="true">
        <div class="fq-thread__head">
          <span class="fq-thread__back" />
          <span class="fq-row__avatar">SM</span>
          <div class="min-w-0">
            <p class="fq-thread__name">Sarah Miller</p>
            <p class="fq-thread__info">Nashville · Superfan · 2 shows</p>
          </div>
        </div>

        <div class="fq-thread__scroller">
          <template v-if="editorial">
            <div class="fq-msg" data-echo-msg="open">
              <span class="fq-msg__avatar">SM</span>
              <div class="fq-msg__col">
                <p class="fq-msg__who">Sarah M.</p>
                <div class="fq-msg__bubble">
                  <p class="fq-msg__text">{{ FAN_OPEN }}</p>
                </div>
              </div>
            </div>
            <div class="fq-msg is-mine" data-echo-msg="artist">
              <div class="fq-msg__col">
                <div class="fq-msg__bubble">
                  <p class="fq-msg__text">{{ ARTIST_REPLY }}</p>
                </div>
                <div class="fq-gallery" :class="{ 'is-three': PHOTOS.length === 3, 'is-single': PHOTOS.length === 1 }" data-echo-gallery>
                  <div
                    v-for="(photo, index) in PHOTOS"
                    :key="photo.id"
                    class="fq-gallery__cell"
                    :class="{ 'is-lead': index === 0 }"
                  >
                    <img
                      :src="photo.src"
                      alt=""
                      width="640"
                      height="640"
                      loading="lazy"
                      decoding="async"
                      :style="{ objectPosition: photo.pos }"
                    >
                  </div>
                  <span class="fq-gallery__mark">Gallery · {{ PHOTOS.length }}</span>
                </div>
              </div>
            </div>
            <div class="fq-msg" data-echo-msg="close">
              <span class="fq-msg__avatar">
                SM
                <span class="fq-msg__echo">
                  <FaneqoEcho ref="echoRef" moment="echo-back" size="xs" />
                </span>
              </span>
              <div class="fq-msg__col">
                <p class="fq-msg__who">Sarah M.</p>
                <div class="fq-msg__bubble">
                  <p class="fq-msg__text">{{ FAN_CLOSE }}</p>
                </div>
              </div>
            </div>
          </template>
          <template v-else>
            <Motion
              v-if="showArtistMessage"
              class="fq-msg is-mine"
              :initial="reduced ? false : msgEnter.initial"
              :animate="msgEnter.animate"
              :transition="msgEnter.transition"
            >
              <div class="fq-msg__col">
                <div class="fq-msg__bubble">
                  <p class="fq-msg__text">{{ ARTIST_TEXT }}</p>
                </div>
                <Motion
                  v-if="showPhotos"
                  class="fq-photos"
                  :initial="reduced ? false : photoEnter.initial"
                  :animate="photoEnter.animate"
                  :transition="photoEnter.transition"
                >
                  <div
                    v-for="(photo, index) in PHOTOS"
                    :key="photo.id"
                    class="fq-photos__cell"
                  >
                    <img
                      :src="photo.src"
                      alt=""
                      width="640"
                      height="640"
                      loading="lazy"
                      decoding="async"
                      :style="{ objectPosition: photo.pos }"
                    >
                    <span v-if="index === 0" class="fq-photos__hint">4 photos</span>
                  </div>
                </Motion>
                <p v-if="showPhotos" class="fq-photos__note">Share photos. Keep the conversation going.</p>
                <p v-if="showSeen" class="fq-seen">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M18 7l-8.5 10L5 12.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M22 7l-8.5 10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  Seen
                </p>
              </div>
            </Motion>

            <Motion
              v-if="showReply"
              class="fq-msg"
              :initial="reduced ? false : msgEnter.initial"
              :animate="msgEnter.animate"
              :transition="msgEnter.transition"
            >
              <span class="fq-msg__avatar">SM</span>
              <div class="fq-msg__col">
                <div class="fq-msg__bubble">
                  <p class="fq-msg__text">{{ FAN_TEXT }}</p>
                </div>
              </div>
            </Motion>
          </template>
        </div>

        <div class="fq-composer" :class="{ 'is-editorial': editorial }">
          <span v-if="editorial" class="fq-composer__attach" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M4 7.5A2.5 2.5 0 016.5 5h11A2.5 2.5 0 0120 7.5v9a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 014 16.5v-9z" stroke="currentColor" stroke-width="1.7" />
              <path d="M8 14.5l2.4-2.4a1 1 0 011.4 0L15 15.2l1.2-1.2a1 1 0 011.4 0l1.4 1.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
              <circle cx="9" cy="9" r="1.15" fill="currentColor" />
            </svg>
          </span>
          <div class="fq-composer__field">
            <span v-if="editorial" class="fq-composer__ghost">Add photos from the show…</span>
            <template v-else>
              <span class="fq-composer__ghost" :class="{ 'is-hidden': showComposedText }">Message Sarah…</span>
              <span class="fq-composer__typed" :class="{ 'is-on': showComposedText }">{{ ARTIST_TEXT }}</span>
            </template>
          </div>
          <span class="fq-composer__send" :class="{ 'is-ready': editorial || phase === 'ready' }">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
        </div>
      </div>

      <!-- Campaigns -->
      <div class="fq-camps" aria-hidden="true">
        <article v-for="campaign in CAMPAIGNS" :key="campaign.id" class="fq-camp">
          <div class="fq-camp__main">
            <div class="fq-camp__title-row">
              <h3>{{ campaign.title }}</h3>
              <span class="fq-camp__status">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M20 7L9.5 17.5 4 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                Completed
              </span>
            </div>
            <p class="fq-camp__meta">{{ campaign.meta }}</p>
          </div>
          <p class="fq-camp__when">{{ campaign.when }}</p>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Homepage-only Messages demonstration.
 * Presentational fake data — no inbox composables, APIs, auth, or polling.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { LayoutGroup, Motion } from 'motion-v'
import { gsap } from 'gsap'
import FaneqoEcho from '@/components/rive/FaneqoEcho.vue'
import { motionMessageEnter, motionMessageEnterReduced, motionTokens } from '~/utils/ui/motionTokens'

const props = defineProps({
  /** Homepage V2: quieter live chrome. Production `/` leaves this false. */
  editorial: {
    type: Boolean,
    default: false,
  },
  /** Gallery shared in the thread; defaults to the original demo photos. */
  photos: {
    type: Array,
    default: null,
  },
})

const ARTIST_TEXT = 'Thanks for coming out last night 🤘'
const FAN_TEXT = 'That show was incredible!'
const FAN_OPEN = 'That show was incredible. Are you coming back this fall?'
const ARTIST_REPLY = 'October 🤘\nHere’s last night — we’ll announce soon.'
const FAN_CLOSE = 'I’m there.'

const DEFAULT_PHOTOS = [
  { id: 'moondough', src: 'https://qrcode101.s3.us-east-1.amazonaws.com/moondoug_6829e46a19.jpg', pos: '50% 42%' },
  { id: 'emerge', src: 'https://qrcode101.s3.us-east-1.amazonaws.com/61651_7df7eb9bab.png', pos: '50% 40%' },
  { id: 'andydarling', src: 'https://qrcode101.s3.us-east-1.amazonaws.com/andydarling_7d4caf6ff2.webp', pos: '50% 28%' },
  { id: 'shannontehya', src: 'https://qrcode101.s3.us-east-1.amazonaws.com/a3f241_692a27b6b7f54cc99d9668ba78417271_mv2_e1e00ed0ca.jpg', pos: '50% 22%' },
]

const PHOTOS = computed(() => (props.photos?.length ? props.photos : DEFAULT_PHOTOS))

const CAMPAIGNS = [
  {
    id: 'nashville',
    title: 'Photos from Nashville',
    meta: 'All Fans · 428 recipients',
    when: 'Today · 5:42 PM',
  },
  {
    id: 'tour',
    title: 'New tour dates are live',
    meta: 'All Fans · 428 recipients',
    when: 'Yesterday',
  },
]

const inboxRows = [
  {
    id: 'sarah',
    primary: true,
    name: 'Sarah Miller',
    initials: 'SM',
    context: 'Nashville · Superfan · 2 shows',
    time: 'Now',
    preview: 'Thanks for last night',
  },
  {
    id: 'marcus',
    primary: false,
    name: 'Marcus Hale',
    initials: 'MH',
    context: 'Austin · 1 show',
    time: 'Tue',
    preview: 'See you on the next one',
  },
  {
    id: 'priya',
    primary: false,
    name: 'Priya Shah',
    initials: 'PS',
    context: 'Chicago · Superfan',
    time: 'Mon',
    preview: 'The merch table was packed',
  },
]

/** @typedef {'idle'|'highlight'|'compose'|'ready'|'sent'|'photos'|'reply'|'seen'|'campaigns'} DemoPhase */

const rootEl = ref(null)
const echoRef = ref(null)
/** @type {import('vue').Ref<DemoPhase>} */
const phase = ref(props.editorial ? 'seen' : 'idle')
const tab = ref('inbox')
const reduced = ref(false)

const showArtistMessage = computed(() =>
  ['sent', 'photos', 'reply', 'seen'].includes(phase.value)
)
const showPhotos = computed(() => ['photos', 'reply', 'seen'].includes(phase.value))
const showReply = computed(() => ['reply', 'seen'].includes(phase.value))
const showSeen = computed(() => phase.value === 'seen')
const showUnread = computed(() => phase.value === 'reply')
const showComposedText = computed(() =>
  phase.value === 'compose' || phase.value === 'ready'
)
const isLive = computed(() =>
  ['ready', 'sent', 'photos', 'reply', 'seen'].includes(phase.value)
)
const mobileView = computed(() => {
  if (props.editorial) return 'thread'
  if (phase.value === 'campaigns') return 'campaigns'
  if (phase.value === 'idle' || phase.value === 'highlight') return 'list'
  return 'thread'
})

const msgEnter = computed(() => (reduced.value ? motionMessageEnterReduced : motionMessageEnter))
const photoEnter = computed(() => (
  reduced.value
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.12 } }
    : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: motionTokens.springMessage }
))
const inkTransition = computed(() => (reduced.value ? motionTokens.micro : motionTokens.standard))

const ariaLabel = computed(() => {
  if (props.editorial) {
    return [
      'Faneqo Messages demo.',
      'Sarah M. writes: That show was incredible. Are you coming back this fall?',
      'Artist replies with a four-photo gallery: October. Here’s last night — we’ll announce soon.',
      'Sarah replies: I’m there.',
    ].join(' ')
  }
  return [
    'Faneqo Messages demo.',
    'Sarah Miller, Nashville, Superfan, 2 shows.',
    `${ARTIST_TEXT} Four photos from the show.`,
    `Sarah replies: ${FAN_TEXT}`,
    'Seen.',
    'Campaigns: Photos from Nashville, and New tour dates are live, sent to all fans.',
  ].join(' ')
})

function rowPreview(row) {
  if (!row.primary) return row.preview
  if (props.editorial) return 'Gallery · I’m there.'
  if (showReply.value) return FAN_TEXT
  if (showPhotos.value) return '4 photos'
  if (showArtistMessage.value) return ARTIST_TEXT
  return row.preview
}

let timers = []
let observer = null
let running = false

function clearTimers() {
  for (const id of timers) clearTimeout(id)
  timers = []
}

function wait(ms) {
  return new Promise((resolve) => {
    const id = setTimeout(resolve, ms)
    timers.push(id)
  })
}

function showStaticEnd() {
  tab.value = 'inbox'
  phase.value = 'seen'
}

async function runCycle() {
  if (!running) return

  tab.value = 'inbox'
  phase.value = 'idle'
  await wait(280)
  if (!running) return

  phase.value = 'highlight'
  await wait(520)
  if (!running) return

  phase.value = 'compose'
  await wait(820)
  if (!running) return

  phase.value = 'ready'
  await wait(420)
  if (!running) return

  phase.value = 'sent'
  await wait(380)
  if (!running) return

  phase.value = 'photos'
  await wait(620)
  if (!running) return

  phase.value = 'reply'
  await wait(480)
  if (!running) return

  phase.value = 'seen'
  await wait(1400)
  if (!running) return

  tab.value = 'campaigns'
  await wait(180)
  if (!running) return
  phase.value = 'campaigns'
  await wait(2300)
  if (!running) return

  tab.value = 'inbox'
  await wait(160)
  if (!running) return
  phase.value = 'idle'
  await wait(280)
  if (running) runCycle()
}

function start() {
  if (running || reduced.value) return
  running = true
  runCycle()
}

function stop() {
  running = false
  clearTimers()
}

function playEditorialEcho() {
  if (!rootEl.value) return
  const artistWrap = rootEl.value.querySelector('[data-echo-msg="artist"]')
  const closeWrap = rootEl.value.querySelector('[data-echo-msg="close"]')
  const artist = rootEl.value.querySelector('[data-echo-msg="artist"] .fq-msg__bubble')
  const close = rootEl.value.querySelector('[data-echo-msg="close"] .fq-msg__bubble')
  const galleryCells = rootEl.value.querySelectorAll('[data-echo-gallery] .fq-gallery__cell')
  if (!reduced.value) {
    if (artistWrap) gsap.set(artistWrap, { autoAlpha: 0, y: 14 })
    if (closeWrap) gsap.set(closeWrap, { autoAlpha: 0, y: 14 })
    if (galleryCells.length) gsap.set(galleryCells, { autoAlpha: 0, y: 18, scale: 0.94 })
  }
  observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      if (!reduced.value && artistWrap) {
        tl.to(artistWrap, { autoAlpha: 1, y: 0, duration: 0.42 }, 0.2)
      }
      if (!reduced.value && galleryCells.length) {
        tl.to(galleryCells, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.46,
          stagger: 0.08,
        }, '-=0.12')
      }
      tl.add(() => echoRef.value?.signalOut?.(0.55), reduced.value ? 0.2 : 0.08)
      if (artist) {
        tl.to(artist, { boxShadow: '0 12px 28px -12px rgba(76, 166, 255, 0.45)', duration: 0.32 }, '<')
      }
      if (!reduced.value && closeWrap) {
        tl.to(closeWrap, { autoAlpha: 1, y: 0, duration: 0.4 }, '+=0.22')
      }
      tl.add(() => echoRef.value?.echoBack?.(0.7), '<0.04')
      if (close) {
        tl.to(close, { boxShadow: '0 10px 24px -12px rgba(57, 213, 255, 0.4)', duration: 0.28 }, '<')
      }
      tl.add(() => echoRef.value?.settle?.(), '+=0.36')
      observer?.disconnect()
    },
    { threshold: 0.38 }
  )
  observer.observe(rootEl.value)
}

onMounted(() => {
  if (!process.client) return

  if (props.editorial) {
    showStaticEnd()
    reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    playEditorialEcho()
    return
  }

  reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced.value) {
    showStaticEnd()
    return
  }

  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) start()
      else {
        stop()
        phase.value = 'idle'
        tab.value = 'inbox'
      }
    },
    { threshold: 0.32 }
  )

  if (rootEl.value) observer.observe(rootEl.value)
})

watch(reduced, (next) => {
  if (!next) return
  stop()
  showStaticEnd()
})

onBeforeUnmount(() => {
  stop()
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>

<style scoped>
.fq-demo {
  --fq-green: #39ff14;
  --fq-purple: #9100ff;
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 1.45rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #09090b;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.28),
    0 12px 28px rgba(0, 0, 0, 0.32),
    0 36px 72px -20px rgba(0, 0, 0, 0.72);
  transition: box-shadow 0.45s ease, border-color 0.45s ease;
}

.fq-demo.is-editorial {
  --fq-green: #39d5ff;
  overflow: visible;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3),
    0 16px 36px rgba(0, 0, 0, 0.38),
    0 48px 88px -18px rgba(0, 0, 0, 0.78),
    0 0 0 1px rgba(76, 166, 255, 0.08);
}

.fq-demo.is-editorial .fq-demo__new,
.fq-demo.is-editorial .fq-camps,
.fq-demo.is-editorial .fq-thread__back {
  display: none;
}

.fq-demo.is-editorial .fq-demo__bar {
  padding: 0.35rem 1rem 0;
  background: rgba(7, 8, 12, 0.92);
  backdrop-filter: blur(16px);
}

.fq-demo.is-editorial .fq-msg__who {
  margin: 0 0 0.22rem;
  font-size: 0.72rem;
  font-weight: 750;
  letter-spacing: 0.01em;
  color: #39d5ff;
}

.fq-demo.is-editorial .fq-thread__scroller {
  justify-content: flex-end;
  gap: 1.15rem;
  padding: 1.35rem 1.15rem 1.2rem;
  overflow: visible;
}

.fq-demo.is-editorial .fq-thread,
.fq-demo.is-editorial .fq-demo__body {
  overflow: visible;
}

.fq-demo.is-editorial .fq-msg__bubble {
  padding: 0.85rem 1.05rem;
  font-size: 1.04rem;
  line-height: 1.48;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.28),
    0 10px 22px -12px rgba(0, 0, 0, 0.7);
}

.fq-demo.is-editorial .fq-msg__text {
  white-space: pre-line;
}

.fq-demo.is-editorial .fq-msg.is-mine .fq-msg__bubble {
  background: rgba(76, 166, 255, 0.14);
  border: 1px solid rgba(76, 166, 255, 0.28);
}

.fq-demo.is-editorial .fq-row.is-active {
  background: linear-gradient(90deg, rgba(76, 166, 255, 0.14), rgba(57, 213, 255, 0.05) 46%, transparent);
  box-shadow: inset 3px 0 0 #39d5ff;
}

.fq-demo.is-editorial .fq-row__avatar,
.fq-demo.is-editorial .fq-msg__avatar {
  background: rgba(57, 213, 255, 0.12);
  color: #39d5ff;
  box-shadow: 0 8px 18px -10px rgba(57, 213, 255, 0.55);
}

.fq-demo.is-live {
  border-color: rgba(57, 255, 20, 0.18);
  box-shadow:
    0 30px 80px -24px rgba(0, 0, 0, 0.88),
    0 0 64px -12px rgba(57, 255, 20, 0.16),
    0 0 0 1px rgba(57, 255, 20, 0.1);
}

.fq-demo.is-editorial.is-live {
  border-color: rgba(76, 166, 255, 0.22);
  box-shadow:
    0 30px 80px -24px rgba(0, 0, 0, 0.88),
    0 0 48px -16px rgba(76, 166, 255, 0.16),
    0 0 0 1px rgba(76, 166, 255, 0.1);
}

.fq-demo.is-campaigns {
  border-color: rgba(145, 0, 255, 0.22);
  box-shadow:
    0 30px 80px -24px rgba(0, 0, 0, 0.88),
    0 0 70px -14px rgba(145, 0, 255, 0.2),
    0 0 0 1px rgba(145, 0, 255, 0.14);
}

.fq-demo__bar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.15rem 0.85rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: #070709;
}

.fq-demo__tabs {
  display: flex;
  align-items: flex-end;
  gap: 0.1rem;
}

.fq-demo__tab {
  position: relative;
  padding: 0.7rem 0.9rem 0.65rem;
  color: rgba(255, 255, 255, 0.46);
  font-size: 0.92rem;
  font-weight: 650;
}

.fq-demo__tab.is-active {
  color: #fff;
}

.fq-demo__ink {
  position: absolute;
  left: 0.75rem;
  right: 0.75rem;
  bottom: -1px;
  height: 2px;
  border-radius: 99px;
}

.fq-demo__ink--inbox {
  background: var(--fq-green);
}

.fq-demo__ink--campaigns {
  background: linear-gradient(90deg, var(--fq-purple), #c084fc);
}

.fq-demo__new {
  margin-bottom: 0.45rem;
  padding: 0.32rem 0.7rem;
  border-radius: 999px;
  border: 1px solid rgba(57, 255, 20, 0.28);
  background: rgba(57, 255, 20, 0.08);
  color: #bbf7d0;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.fq-demo__body {
  position: relative;
  height: 28.75rem;
}

.fq-rail,
.fq-thread,
.fq-camps {
  position: absolute;
  inset: 0;
}

.fq-rail {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.45rem 0.4rem;
  background: #08080a;
}

.fq-row {
  display: flex;
  gap: 0.65rem;
  padding: 0.55rem 0.65rem 0.55rem 0.75rem;
  border-radius: 0.85rem;
  position: relative;
}

.fq-row.is-active {
  background: linear-gradient(90deg, rgba(57, 255, 20, 0.12), rgba(57, 255, 20, 0.04) 46%, transparent);
  box-shadow: inset 3px 0 0 var(--fq-green);
}

.fq-row__avatar,
.fq-msg__avatar {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 999px;
  background: rgba(57, 255, 20, 0.12);
  color: var(--fq-green);
  font-size: 0.7rem;
  font-weight: 700;
}

.fq-msg__avatar {
  position: relative;
  width: 28px;
  height: 28px;
  font-size: 0.58rem;
}

.fq-msg__echo {
  position: absolute;
  right: -0.55rem;
  top: -0.45rem;
}

.fq-row__meta {
  min-width: 0;
  flex: 1;
}

.fq-row__top {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.fq-row__name,
.fq-thread__name {
  min-width: 0;
  flex: 1;
  color: #fff;
  font-size: 0.88rem;
  font-weight: 650;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fq-row.is-active .fq-row__name {
  font-weight: 750;
}

.fq-row__time {
  color: rgba(255, 255, 255, 0.32);
  font-size: 0.68rem;
}

.fq-row__badge {
  min-width: 1.1rem;
  height: 1.1rem;
  padding: 0 0.28rem;
  border-radius: 999px;
  background: var(--fq-green);
  color: #052e16;
  font-size: 0.62rem;
  font-weight: 800;
  display: grid;
  place-items: center;
}

.fq-row__context,
.fq-thread__info {
  margin: 0.1rem 0 0;
  color: rgba(255, 255, 255, 0.42);
  font-size: 0.7rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fq-row__preview {
  margin: 0.12rem 0 0;
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fq-row__thumbs {
  display: flex;
  align-items: center;
  margin-top: 0.42rem;
  padding-left: 0.08rem;
}

.fq-row__thumbs img {
  width: 1.6rem;
  height: 1.6rem;
  object-fit: cover;
  border-radius: 0.38rem;
  border: 1.5px solid #08080a;
  margin-left: -0.38rem;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.4),
    0 8px 14px -8px rgba(0, 0, 0, 0.85);
}

.fq-row__thumbs img:first-child {
  margin-left: 0;
}

.fq-row.is-unread .fq-row__preview {
  color: rgba(255, 255, 255, 0.78);
}

.fq-thread {
  display: flex;
  flex-direction: column;
  background: #0b0b0e;
}

.fq-thread__head {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 3.15rem;
  padding: 0.4rem 0.8rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: #09090b;
}

.fq-thread__back {
  display: none;
  width: 0.55rem;
  height: 0.55rem;
  border-left: 2px solid rgba(255, 255, 255, 0.55);
  border-bottom: 2px solid rgba(255, 255, 255, 0.55);
  transform: rotate(45deg);
}

.fq-thread__scroller {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.7rem;
  padding: 0.85rem 0.85rem 0.45rem;
  overflow: hidden;
}

.fq-msg {
  display: flex;
  gap: 0.45rem;
}

.fq-msg.is-mine {
  justify-content: flex-end;
}

.fq-msg__col {
  max-width: min(78%, 20rem);
}

.fq-msg.is-mine .fq-msg__col {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.fq-msg__bubble {
  padding: 0.55rem 0.75rem;
  border-radius: 1.05rem;
  background: #27272a;
  color: #fafafa;
  font-size: 0.9rem;
  line-height: 1.4;
}

.fq-msg.is-mine .fq-msg__bubble {
  background: rgba(57, 255, 20, 0.1);
  border: 1px solid rgba(57, 255, 20, 0.2);
}

.fq-msg__text {
  margin: 0;
}

.fq-photos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.18rem;
  width: 13.25rem;
  margin-top: 0.35rem;
  overflow: hidden;
  border-radius: 0.9rem;
}

.fq-gallery {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.42rem;
  width: min(100%, 16.75rem);
  margin-top: 0.7rem;
  padding: 0.2rem;
}

.fq-gallery__cell {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1;
  border-radius: 0.9rem;
  background: #141416;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.4),
    0 8px 16px -8px rgba(0, 0, 0, 0.7),
    0 22px 40px -18px rgba(0, 0, 0, 0.78);
}

/* A three-photo gallery: the lead print takes the full width */
.fq-gallery.is-three .fq-gallery__cell.is-lead {
  grid-column: 1 / -1;
  aspect-ratio: 2 / 1;
}

/* One photo: a single wide print */
.fq-gallery.is-single .fq-gallery__cell.is-lead {
  grid-column: 1 / -1;
  aspect-ratio: 16 / 10;
}

.fq-gallery__cell.is-lead {
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.36),
    0 14px 28px -10px rgba(0, 0, 0, 0.72),
    0 32px 52px -20px rgba(76, 166, 255, 0.28);
}

.fq-gallery__cell img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.08);
}

.fq-gallery__cell:nth-child(1) img {
  transform: scale(1.1) rotate(-2deg);
}

.fq-gallery__cell:nth-child(2) img {
  transform: scale(1.1) rotate(2.2deg);
}

.fq-gallery__cell:nth-child(3) img {
  transform: scale(1.1) rotate(1.1deg);
}

.fq-gallery__cell:nth-child(4) img {
  transform: scale(1.1) rotate(-1.8deg);
}

.fq-gallery__mark {
  position: absolute;
  left: 0.45rem;
  bottom: 0.45rem;
  z-index: 2;
  padding: 0.22rem 0.5rem;
  border-radius: 999px;
  background: rgba(5, 6, 10, 0.72);
  color: #fff;
  font-size: 0.62rem;
  font-weight: 750;
  letter-spacing: 0.04em;
  box-shadow: 0 8px 18px -10px rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
}

.fq-composer__attach {
  display: grid;
  place-items: center;
  width: 2.45rem;
  height: 2.45rem;
  flex-shrink: 0;
  border-radius: 0.9rem;
  border: 1px solid rgba(76, 166, 255, 0.22);
  background: rgba(76, 166, 255, 0.1);
  color: #39d5ff;
  box-shadow: 0 10px 20px -12px rgba(57, 213, 255, 0.55);
}

.fq-composer__attach svg {
  width: 1.15rem;
  height: 1.15rem;
}

.fq-composer.is-editorial .fq-composer__attach {
  animation: fq-attach-float 3.6s ease-in-out infinite;
}

.fq-composer.is-editorial .fq-composer__field {
  border-color: rgba(76, 166, 255, 0.22);
  background: rgba(76, 166, 255, 0.06);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 10px 22px -16px rgba(0, 0, 0, 0.8);
}

.fq-demo.is-editorial .fq-composer__send.is-ready {
  color: #031018;
  box-shadow:
    0 2px 4px rgba(57, 213, 255, 0.28),
    0 12px 24px -10px rgba(57, 213, 255, 0.55);
}

@keyframes fq-attach-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.fq-photos__cell {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: #141416;
}

.fq-photos__cell img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fq-photos__hint {
  position: absolute;
  left: 0.35rem;
  bottom: 0.3rem;
  padding: 0.1rem 0.38rem;
  border-radius: 99px;
  background: rgba(0, 0, 0, 0.58);
  color: #fff;
  font-size: 0.58rem;
  font-weight: 650;
}

.fq-photos__note {
  margin: 0.4rem 0 0;
  color: rgba(255, 255, 255, 0.38);
  font-size: 0.68rem;
  letter-spacing: 0.01em;
}

.fq-seen {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  margin: 0.22rem 0.1rem 0;
  color: rgba(57, 255, 20, 0.82);
  font-size: 0.68rem;
  font-weight: 650;
}

.fq-seen svg {
  width: 0.85rem;
  height: 0.85rem;
}

.fq-composer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.7rem 0.7rem;
}

.fq-composer__field {
  position: relative;
  flex: 1;
  min-height: 2.55rem;
  padding: 0.62rem 0.8rem;
  overflow: hidden;
  border-radius: 1.05rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  font-size: 0.84rem;
}

.fq-composer__ghost,
.fq-composer__typed {
  display: block;
}

.fq-composer__ghost {
  color: rgba(255, 255, 255, 0.34);
  transition: opacity 0.28s ease;
}

.fq-composer__ghost.is-hidden {
  opacity: 0;
}

.fq-composer__typed {
  position: absolute;
  inset: 0.62rem 0.8rem auto;
  color: #fff;
  clip-path: inset(0 100% 0 0);
  opacity: 0;
  transition: clip-path 0.72s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease;
}

.fq-composer__typed.is-on {
  clip-path: inset(0 0 0 0);
  opacity: 1;
}

.fq-composer__send {
  display: grid;
  place-items: center;
  width: 2.45rem;
  height: 2.45rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.35);
  transition: background 0.28s ease, color 0.28s ease, box-shadow 0.28s ease;
}

.fq-composer__send svg {
  width: 1.05rem;
  height: 1.05rem;
}

.fq-composer__send.is-ready {
  background: var(--fq-green);
  color: #052e16;
  box-shadow: 0 0 18px rgba(57, 255, 20, 0.28);
}

.fq-camps {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.15rem;
  padding: 0.85rem 0.9rem;
  background: #0b0b0e;
  opacity: 0;
  pointer-events: none;
}

.fq-camp {
  padding: 0.95rem 1rem;
  border-radius: 0.95rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.025);
}

.fq-camp__title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.fq-camp h3 {
  margin: 0;
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.fq-camp__status {
  display: inline-flex;
  align-items: center;
  gap: 0.22rem;
  flex-shrink: 0;
  padding: 0.16rem 0.45rem;
  border-radius: 999px;
  background: rgba(57, 255, 20, 0.07);
  color: #86efac;
  font-size: 0.68rem;
  font-weight: 650;
}

.fq-camp__status svg {
  width: 0.8rem;
  height: 0.8rem;
}

.fq-camp__meta {
  margin: 0.35rem 0 0;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.78rem;
}

.fq-camp__when {
  margin: 0.55rem 0 0;
  color: rgba(255, 255, 255, 0.36);
  font-size: 0.74rem;
}

/* Mobile: one-pane stack, like real Messages */
@media (max-width: 1023px) {
  .fq-demo.is-editorial .fq-demo__body {
    height: auto;
    min-height: 32rem;
  }

  .fq-demo.is-editorial .fq-rail,
  .fq-demo.is-editorial .fq-camps {
    display: none;
  }

  .fq-demo.is-editorial .fq-thread {
    position: relative;
    opacity: 1;
    transform: none;
    pointer-events: auto;
  }

  .fq-demo__new {
    display: none;
  }

  .fq-thread__back {
    display: block;
    margin-right: 0.15rem;
  }

  .fq-rail,
  .fq-thread,
  .fq-camps {
    transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.28s ease;
  }

  .view-list .fq-thread,
  .view-list .fq-camps,
  .view-thread .fq-rail,
  .view-thread .fq-camps,
  .view-campaigns .fq-rail,
  .view-campaigns .fq-thread {
    opacity: 0;
    pointer-events: none;
  }

  .view-list .fq-thread,
  .view-thread .fq-camps,
  .view-campaigns .fq-thread {
    transform: translateX(22px);
  }

  .view-thread .fq-rail,
  .view-campaigns .fq-rail {
    transform: translateX(-16px);
  }

  .view-campaigns .fq-camps {
    opacity: 1;
  }

  .fq-photos {
    width: 11.75rem;
  }
}

/* Desktop: two-pane inbox */
@media (min-width: 1024px) {
  .fq-demo.is-editorial .fq-demo__body {
    display: grid;
    grid-template-columns: 17.25rem 1fr;
    height: auto;
    min-height: 38rem;
  }

  .fq-demo.is-editorial .fq-rail {
    display: flex;
    position: relative;
  }

  .fq-demo.is-editorial .fq-camps {
    display: none;
  }

  .fq-demo.is-editorial .fq-thread {
    position: relative;
  }

  .fq-demo.is-editorial .fq-msg__col {
    max-width: min(92%, 28rem);
  }

  .fq-demo.is-editorial .fq-msg__bubble {
    font-size: 1.12rem;
    padding: 0.95rem 1.15rem;
  }

  .fq-demo.is-editorial .fq-gallery {
    width: 19.25rem;
  }

  .fq-demo__body {
    display: grid;
    grid-template-columns: 17.75rem 1fr;
    height: 32.5rem;
  }

  .fq-rail,
  .fq-thread,
  .fq-camps {
    position: relative;
    inset: auto;
  }

  .fq-rail {
    border-right: 1px solid rgba(255, 255, 255, 0.06);
  }

  .fq-camps {
    display: none;
    grid-column: 1 / -1;
  }

  .fq-demo.is-campaigns .fq-rail,
  .fq-demo.is-campaigns .fq-thread {
    display: none;
  }

  .fq-demo.is-campaigns .fq-camps {
    display: flex;
    opacity: 1;
    pointer-events: none;
    animation: fq-camp-in 0.48s cubic-bezier(0.22, 1, 0.36, 1);
  }

  @keyframes fq-camp-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  .fq-photos {
    width: 15rem;
  }

  .fq-msg__col {
    max-width: min(78%, 22rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .fq-gallery__cell img,
  .fq-gallery__cell:nth-child(n) img {
    transform: scale(1.04);
  }

  .fq-composer.is-editorial .fq-composer__attach {
    animation: none;
  }
  .fq-rail,
  .fq-thread,
  .fq-camps,
  .fq-composer__typed,
  .fq-composer__ghost,
  .fq-composer__send,
  .fq-demo {
    transition: none;
  }

  .fq-demo.is-campaigns .fq-camps {
    animation: none;
  }
}
</style>
