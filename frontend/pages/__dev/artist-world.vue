<template>
  <div class="dev">
    <p class="dev__rail">Design lab · local only · public Night / Gallery world</p>
    <PublicNightExperience :payload="shownNight" band-slug="badflower" :from="nightFrom" />
    <template v-if="!nightHeroOn">
    <hr class="dev__break">
    <PublicNightExperience :payload="noCoverNight" band-slug="badflower" />
    <hr class="dev__break">
    <PublicGalleryExperience :payload="onePhotoGallery" band-slug="badflower" return-to="/badflower/gallery/one" />
    <hr class="dev__break">
    <PublicGalleryExperience :payload="twoPhotoGallery" band-slug="badflower" return-to="/badflower/gallery/pair" />
    <hr class="dev__break">
    <PublicGalleryExperience
      :payload="publicGallery"
      band-slug="badflower"
      return-to="/badflower/gallery/live-set"
    />
    <hr class="dev__break">
    <PublicGalleryExperience
      :payload="previewGallery"
      band-slug="badflower"
      from="/galleries"
      return-to="/badflower/gallery/live-set?from=/galleries"
    />
    <hr class="dev__break">
    <PublicGalleryExperience
      :payload="standaloneGallery"
      band-slug="badflower"
      return-to="/badflower/gallery/backstage"
    />
    <hr class="dev__break">
    <PublicGalleryExperience :payload="lockedGallery" band-slug="badflower" return-to="/badflower/gallery/after" />
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import PublicNightExperience from '~/components/nights/PublicNightExperience.vue'
import PublicGalleryExperience from '~/components/nights/PublicGalleryExperience.vue'
import { galleryLabConcertPrints } from '~/config/galleryArchiveLab.js'
import { nightRecordingLabStates } from '~/config/nightRecordingsLab'

definePageMeta({
  layout: 'artist-world',
  robots: 'noindex, nofollow',
  sitemap: false,
})

if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

const route = useRoute()
const nightHeroOn = computed(() => String(route.query.hero || '') === '1')
const nightEmpty = computed(() => String(route.query.empty || '') === '1')
const nightGuest = computed(() => String(route.query.guest || '') === '1')
const nightLong = computed(() => String(route.query.long || '') === '1')
const nightOneGallery = computed(() => String(route.query.one || '') === '1')
const nightFrom = computed(() => String(route.query.from || ''))

const cover = { url: '/__dev/gallery/portrait-crowd.svg', alternativeText: 'Night cover' }
const liveNightHero = {
  url: 'https://qrcode101.s3.us-east-1.amazonaws.com/medium_gary_bendig_6_G_Mq7_A_Gx_Nb_E_unsplash_33c44247ac.jpg',
  width: 5472,
  height: 3648,
  alternativeText: 'Night hero',
}
const night = {
  nightSlug: 'nashville-sep-5',
  title: 'The Moon Show',
  venue: 'The Basement East',
  city: 'Nashville',
  region: 'Tennessee',
  date: '2026-09-05',
  publicStory: 'The room was already loud before we walked on. Thank you for staying until the last note.',
  lineup: [
    { name: 'Local Opener', role: 'Opener' },
    { name: 'Dead Poet Society', role: 'Support' },
    { name: 'Badflower', role: 'Headliner' },
  ],
  cover,
  attendanceCount: 147,
}
const longStory = [
  'The room was already loud before we walked on.',
  'Chicago always feels like a home show even when the set list is new. The lights hit the back wall, someone yelled the first line of the chorus, and the night stopped being a schedule.',
  'We kept the encore shorter. The last photograph is from the merch table after the house lights came up.',
].join('\n\n')
const longLineup = [
  { name: 'The Waters', role: 'Co-headliner' },
  { name: 'Hade Somoes', role: 'Support' },
  { name: 'Fable', role: 'Support' },
  { name: 'Drop Kick Murphy', role: 'Support' },
  { name: 'Local Opener', role: 'Opener' },
  { name: 'Dead Poet Society', role: 'Support' },
  { name: 'Badflower', role: 'Headliner' },
]
const artist = { name: 'Badflower', slug: 'badflower', image: { url: '/__dev/band-profile/art.svg' } }

const nightPayload = {
  artist,
  night,
  viewer: { authenticated: true, youWereThere: true, showOrdinal: 2 },
  galleries: [
    {
      slug: 'live-set',
      title: 'Fun Time Last gallery',
      photoCount: 8,
      locked: false,
      media: galleryLabConcertPrints(8),
      canonicalPath: '/badflower/gallery/live-set',
    },
    {
      slug: 'backstage',
      title: 'Backstage',
      photoCount: 5,
      locked: false,
      media: galleryLabConcertPrints(5),
      canonicalPath: '/badflower/gallery/backstage',
    },
    {
      slug: 'after',
      title: 'After the show',
      photoCount: 12,
      locked: true,
      visibility: 'show_attendees',
      lockReason: 'show_attendees',
      media: [{ url: '/should-not-show.png' }],
      canonicalPath: '/badflower/gallery/after',
    },
  ],
  recordings: nightRecordingLabStates.mixed,
  share: { canonicalPath: '/badflower/night/nashville-sep-5', title: 'Badflower', description: '', image: cover },
}

const shownNight = computed(() => {
  const next = {
    ...nightPayload,
    night: { ...nightPayload.night },
    viewer: { ...nightPayload.viewer },
    galleries: nightPayload.galleries.slice(),
    recordings: (nightPayload.recordings || []).slice(),
  }
  if (nightHeroOn.value) {
    next.night.hero = liveNightHero
    next.night.heroFocalX = 42
    next.night.heroFocalY = 28
  }
  if (nightGuest.value) {
    next.viewer = { authenticated: false, youWereThere: false }
  }
  if (nightLong.value) {
    next.night.publicStory = longStory
    next.night.lineup = longLineup
  }
  if (nightOneGallery.value) {
    next.galleries = nightPayload.galleries.slice(0, 1)
  }
  if (nightEmpty.value) {
    next.night.cover = null
    next.night.publicStory = ''
    next.night.lineup = []
    next.galleries = []
    next.recordings = []
    next.viewer = { authenticated: false, youWereThere: false }
  }
  return next
})

const noCoverNight = {
  artist,
  night: {
    ...night,
    cover: null,
    publicStory: '',
    lineup: [],
  },
  viewer: { authenticated: false, youWereThere: false },
  galleries: [nightPayload.galleries[0]],
  share: { canonicalPath: '/badflower/night/nashville-sep-5' },
}

const publicGallery = {
  artist,
  night,
  viewer: { authenticated: false, youWereThere: false },
  gallery: {
    slug: 'live-set',
    title: 'Live set',
    caption: 'First three songs. No phones in the front row.',
    photoCount: 3,
    locked: false,
    media: [
      { url: '/__dev/gallery/landscape-stage.svg', alt: 'Live', width: 1600, height: 900 },
      { url: '/__dev/gallery/portrait-figure.svg', alt: 'Figure', width: 900, height: 1400 },
      { url: '/__dev/gallery/square-mark.svg', alt: 'Mark', width: 800, height: 800 },
    ],
  },
  share: { canonicalPath: '/badflower/gallery/live-set' },
}

const onePhotoGallery = {
  artist,
  night,
  viewer: { authenticated: true, youWereThere: true, showOrdinal: 1 },
  gallery: {
    slug: 'one',
    title: 'Encore',
    caption: 'Last song. Lights down.',
    photoCount: 1,
    locked: false,
    media: [{ url: '/__dev/gallery/portrait-figure.svg', alt: 'Encore', width: 900, height: 1400 }],
  },
  share: { canonicalPath: '/badflower/gallery/one' },
}

const twoPhotoGallery = {
  artist,
  night,
  viewer: { authenticated: false, youWereThere: false },
  gallery: {
    slug: 'pair',
    title: 'Two from the floor',
    photoCount: 2,
    locked: false,
    media: [
      { url: '/__dev/gallery/portrait-figure.svg', alt: 'Figure', width: 900, height: 1400 },
      { url: '/__dev/gallery/landscape-stage.svg', alt: 'Stage', width: 1600, height: 900 },
    ],
  },
  share: { canonicalPath: '/badflower/gallery/pair' },
}

const previewGallery = {
  ...publicGallery,
  night: { ...night, venue: 'the rock', city: 'chicago' },
}

const standaloneGallery = {
  artist,
  night: null,
  viewer: { authenticated: false, youWereThere: false },
  gallery: {
    slug: 'backstage',
    title: 'Backstage',
    photoCount: 1,
    locked: false,
    media: [{ url: '/__dev/gallery/square-mark.svg', alt: 'Mark', width: 800, height: 800 }],
  },
  share: { canonicalPath: '/badflower/gallery/backstage' },
}

const lockedGallery = {
  artist,
  night,
  viewer: { authenticated: false, youWereThere: false },
  gallery: {
    slug: 'after',
    title: 'After the show',
    photoCount: 12,
    locked: true,
    visibility: 'show_attendees',
    lockReason: 'show_attendees',
    media: [],
  },
  share: { canonicalPath: '/badflower/gallery/after' },
}

useHead({ title: 'Artist world lab · Faneqo', meta: [{ name: 'robots', content: 'noindex' }] })
</script>

<style scoped>
.dev { background: #050506; }
.dev__rail {
  margin: 0;
  padding: 0.75rem 1.25rem;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(245, 245, 246, 0.4);
}
.dev__break {
  border: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin: 3rem 0;
}
</style>
