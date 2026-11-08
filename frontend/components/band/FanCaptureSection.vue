<template>
  <section
    v-if="enabled"
    class="fan-capture-section"
    :class="[
      `fan-capture-section--${variant}`,
      labVisual && 'fan-capture-section--lab',
      showArtistJoinedState && 'is-artist-joined',
      isClose && 'fan-capture-section--close',
    ]"
  >
    <h3 v-if="labVisual" class="lab-kicker">Fan List</h3>

    <div
      class="fan-capture-card"
      :class="[
        `fan-capture-card--${variant}`,
        variant === 'artist' && 'fq-fan-card',
        (success || alreadyJoined || contactable) && 'is-joined',
      ]"
    >
      <!-- Gradient accent line -->
      <div v-if="!labVisual" class="accent-line" :class="variant === 'artist' && 'fq-fan-edge'"></div>
      
      <div class="card-content">
        <div v-if="isClose" class="close-avatar" aria-hidden="true">
          <img
            v-if="showAvatarImage"
            :src="artistImage"
            alt=""
            :style="avatarStyle"
            @error="avatarFailed = true"
          />
          <span v-else class="close-avatar__mark">{{ avatarMark }}</span>
        </div>

        <div
          v-if="showArtistJoinedState"
          class="artist-joined"
          role="status"
          aria-live="polite"
        >
          <p class="artist-joined__title">
            <svg class="artist-joined__icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M4.5 10.5l3.2 3.2L15.5 6.2" />
            </svg>
            <span>You're in</span>
          </p>
          <p class="artist-joined__line">{{ artistJoinedMembership }}</p>
          <p class="artist-joined__support">Show updates, new music &amp; messages will come your way.</p>
          <div v-if="galleryTeaser" class="close-teaser">
            <p class="close-teaser__label">From the gallery</p>
            <div class="close-teaser__strip">
              <NuxtLink
                v-for="(photo, index) in galleryTeaser.photos"
                :key="photo.id || index"
                :to="galleryTeaser.path"
                class="close-teaser__link"
                :aria-label="photo.alt || `Photograph ${index + 1} from the gallery`"
              >
                <img
                  :src="photo.src"
                  alt=""
                  :width="photo.width || undefined"
                  :height="photo.height || undefined"
                  loading="lazy"
                  decoding="async"
                >
              </NuxtLink>
            </div>
          </div>
        </div>

        <div v-else class="capture-row">
        <div v-if="!(labVisual && (success || alreadyJoined || contactable))" class="lead-block">
          <div v-if="!labVisual && variant !== 'artist'" class="icon-wrapper" aria-hidden="true">
            <div class="icon-glow"></div>
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>

          <!-- Premium Text Content -->
          <div class="text-content">
            <div v-if="isClose" class="close-identity">
              <p class="close-eyebrow">{{ closeEyebrow }}</p>
              <component :is="labVisual ? 'p' : 'h3'" class="headline">
                <template v-if="closeLead">
                  <span class="headline__lead">{{ closeLead }}</span>
                  <span class="headline__name">{{ closeName }}</span>
                </template>
                <template v-else>{{ displayHeadline }}</template>
              </component>
            </div>
            <component v-else :is="labVisual ? 'p' : 'h3'" class="headline">{{ displayHeadline }}</component>
            <p class="message">{{ displayMessage }}</p>
            <p
              v-if="variant === 'artist' && !labVisual && showDefaultCapture"
              class="value-line"
            >{{ isClose ? 'Music, videos, photos, and messages.' : 'Music · Video · Photos · Messages' }}</p>
            <div v-if="galleryTeaser" class="close-teaser">
              <p class="close-teaser__label">From the gallery</p>
              <div class="close-teaser__strip">
                <NuxtLink
                  v-for="(photo, index) in galleryTeaser.photos"
                  :key="photo.id || index"
                  :to="galleryTeaser.path"
                  class="close-teaser__link"
                  :aria-label="photo.alt || `Photograph ${index + 1} from the gallery`"
                >
                  <img
                    :src="photo.src"
                    alt=""
                    :width="photo.width || undefined"
                    :height="photo.height || undefined"
                    loading="lazy"
                    decoding="async"
                  >
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="labVisual && (success || alreadyJoined)"
          class="lab-result"
          :class="alreadyJoined && !success ? 'is-already' : 'is-success'"
          role="status"
          aria-live="polite"
        >
          <p class="lab-result__title">{{ alreadyJoined && !success ? alreadyJoinedTitle : successMessage }}</p>
          <p v-if="success && successDetail" class="lab-result__detail">{{ successDetail }}</p>
        </div>

        <!-- Form: always visible until success / already-joined. No reveal CTA. -->
        <form v-else @submit.prevent="handleSubmit" class="form">
          <div class="input-wrapper" :class="{ 'has-error': error, 'is-success': success }">
            <label :for="emailFieldId" class="email-label">Email address</label>
            <input
              v-if="showEmailField"
              :id="emailFieldId"
              ref="emailInputRef"
              v-model="email"
              type="email"
              :placeholder="labVisual ? 'you@email.com' : (isClose ? 'Email address' : 'your@email.com')"
              :disabled="loading"
              class="email-input"
              :class="variant === 'artist' && 'fq-fan-input'"
              name="email"
              autocomplete="email"
              inputmode="email"
              enterkeyhint="go"
              :aria-invalid="error ? 'true' : 'false'"
              :aria-describedby="error ? errorId : undefined"
            />
            <div v-if="!labVisual && showJoinedState" class="success-box">
              <svg class="success-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
              </svg>
              <span>{{ joinedDisplayMessage }}</span>
            </div>
            </div>
          <p v-if="isClose && error" :id="errorId" class="error-message" role="alert">{{ error }}</p>

          <NuxtLink
            v-if="!contactable && continueTo"
            :to="continueTo"
            class="submit-btn"
            :class="variant === 'artist' && 'fq-fan-cta'"
            :aria-label="`Join ${artistName || 'this artist'}'s fan list on their page`"
          >
            <span class="submit-btn__label">
              {{ submitLabel }}
              <svg v-if="isClose" class="submit-btn__arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3.25 8h9.5M9.25 4.25 13 8l-3.75 3.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </NuxtLink>
          <button
            v-else-if="!contactable"
            type="submit"
            :disabled="labVisual ? loading : (isClose ? loading : (loading || !email))"
            :aria-busy="loading ? 'true' : 'false'"
            class="submit-btn"
            :class="variant === 'artist' && 'fq-fan-cta'"
          >
            <span v-if="loading" class="submit-btn__busy">
              <span class="loading-spinner" aria-hidden="true"></span>
              <span>{{ labVisual ? 'Joining…' : '' }}</span>
            </span>
            <span v-else class="submit-btn__label">
              {{ submitLabel }}
              <svg v-if="isClose" class="submit-btn__arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3.25 8h9.5M9.25 4.25 13 8l-3.75 3.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </button>
          <p v-if="isClose && !contactable" class="privacy-note">
            <svg class="lock-icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd" />
            </svg>
            No spam. Unsubscribe anytime.
          </p>
        </form>
        </div>

        <!-- Post-Signup Check-In Prompt (Show Mode Only) -->
        <div v-if="success && showModeEnabled && attendanceResolved && !isCheckedIn" class="post-signup-checkin">
          <div class="checkin-prompt-content">
            <div class="prompt-icon">📍</div>
            <h4 class="prompt-title">Were you at the show tonight?</h4>
            <p class="prompt-subtitle">Check in to be part of tonight's attendance</p>
            <button 
              @click="$emit('open-check-in-modal')"
              class="prompt-checkin-btn"
            >
              Check In Now
            </button>
          </div>
        </div>

        <!-- Confirmed attendance (after check-in via the page modal) -->
        <div v-else-if="success && showModeEnabled && isCheckedIn" class="checkin-success">
          <span class="checkin-icon">✅</span>
          <span class="checkin-text">You're checked in for tonight</span>
        </div>

        <!-- Error Message -->
        <p v-if="error && !isClose" :id="errorId" class="error-message" role="alert">{{ error }}</p>

        <!-- Privacy Note -->
        <p v-if="!contactable && !isClose" class="privacy-note">
          <svg class="lock-icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd" />
          </svg>
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </div>

    <!-- Show Check-In Button (standalone, when show mode active) -->
    <ShowCheckInButton
      v-if="showModeEnabled && attendanceResolved && !success && !isCheckedIn"
      :show-mode-enabled="showModeEnabled"
      class="mt-4"
      @open-check-in-modal="$emit('open-check-in-modal')"
    />
  </section>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { useRuntimeConfig, useStrapiToken, useStrapiUser } from '#imports';
import { resolveFanCaptureCopy } from '@/utils/fanCaptureCopy';
import { useFanAccountConversion } from '~/composables/useFanAccountConversion';
import { joinArtistFanList } from '~/utils/fan/joinArtistFanList';
import { featuredGalleryTeaser } from '~/utils/galleries/publicFeaturedGallery';
import ShowCheckInButton from '@/components/band/ShowCheckInButton.vue';

const props = defineProps({
  bandId: {
    type: [Number, String],
    required: true,
  },
  bandSlug: {
    type: String,
    default: '',
  },
  artistName: {
    type: String,
    default: '',
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  showModeEnabled: {
    type: Boolean,
    default: false,
  },
  showModeTitle: {
    type: String,
    default: '',
  },
  showModeVenue: {
    type: String,
    default: '',
  },
  showModeCity: {
    type: String,
    default: '',
  },
  captureSurface: {
    type: String,
    default: 'band_page',
  },
  eventId: {
    type: [Number, String],
    default: null,
  },
  campaignId: {
    type: String,
    default: null,
  },
  headline: {
    type: String,
    default: 'Become an Insider',
  },
  message: {
    type: String,
    default: 'Get backstage access, exclusive content, early ticket releases, and connect with the band directly. This is where the real magic happens.',
  },
  buttonLabel: {
    type: String,
    default: 'Unlock Access',
  },
  successMessage: {
    type: String,
    default: "Welcome to the inner circle.",
  },
  variant: {
    type: String,
    default: 'artist',
    validator: (v) => ['artist', 'publication'].includes(v),
  },
  // Set by the page once the fan has checked in through the show check-in modal.
  alreadyCheckedIn: {
    type: Boolean,
    default: false,
  },
  attendanceResolved: {
    type: Boolean,
    default: false,
  },
  testMode: {
    type: Boolean,
    default: false,
  },
  labVisual: {
    type: Boolean,
    default: false,
  },
  labPreview: {
    type: String,
    default: 'default',
  },
  successDetail: {
    type: String,
    default: '',
  },
  followed: {
    type: Boolean,
    default: false,
  },
  subscribed: {
    type: Boolean,
    default: false,
  },
  composition: {
    type: String,
    default: 'default',
  },
  artistImage: {
    type: String,
    default: '',
  },
  imageFocalX: {
    type: Number,
    default: 50,
  },
  imageFocalY: {
    type: Number,
    default: 50,
  },
  featuredGallery: {
    type: Object,
    default: null,
  },
  /**
   * Marketing showcase only. When set, Join opens this page instead of
   * subscribing here. Artist pages leave it empty and join as usual.
   */
  continueTo: {
    type: String,
    default: '',
  },
});

// Computed props for show mode messaging
const resolvedCopy = computed(() =>
  resolveFanCaptureCopy({
    headline: props.headline,
    message: props.message,
    artistName: props.artistName,
  })
)

const displayHeadline = computed(() => {
  if (props.showModeEnabled) {
    if (props.showModeTitle) {
      return `Thanks for coming to ${props.showModeTitle}`;
    }
    if (props.showModeVenue) {
      return `Thanks for coming out tonight`;
    }
    return "You're at the show tonight";
  }
  if (showFollowOnlyCapture.value) return followingTitle.value;
  return resolvedCopy.value.headline;
});

const displayMessage = computed(() => {
  if (props.showModeEnabled) {
    const parts = [];
    if (props.showModeVenue) parts.push(props.showModeVenue);
    if (props.showModeCity) parts.push(props.showModeCity);
    const locationStr = parts.length > 0 ? ` at ${parts.join(', ')}` : '';
    return `Get show updates, new music, and messages directly from the band${locationStr}.`;
  }
  if (showFollowOnlyCapture.value) return 'Want to hear directly from them?';
  return resolvedCopy.value.message;
});

const emit = defineEmits(['subscribed', 'open-check-in-modal']);

const config = useRuntimeConfig();
const user = useStrapiUser();
const strapiToken = useStrapiToken();
const route = useRoute();
const { showAfterFanJoin } = useFanAccountConversion();

const email = ref('');
const loading = ref(false);
const success = ref(false);
const error = ref('');
const alreadyJoined = ref(false);
const emailInputRef = ref(null);

const emailFieldId = computed(() => `fan-list-email-${props.bandId || 'x'}`);
const errorId = computed(() => `${emailFieldId.value}-error`);
const alreadyJoinedTitle = computed(() => {
  const name = String(props.artistName || '').trim();
  return name ? `You're already on ${name}'s fan list.` : "You're already on the fan list.";
});
const followingTitle = computed(() => {
  const name = String(props.artistName || '').trim();
  return name ? `You're following ${name}` : "You're following this artist";
});
const contactable = computed(() => {
  if (props.labVisual) return success.value || alreadyJoined.value;
  return success.value || alreadyJoined.value || !!props.subscribed;
});
const relationshipActive = computed(() => !props.labVisual && !!props.followed);
const showFollowOnlyCapture = computed(() => relationshipActive.value && !contactable.value && !props.showModeEnabled);
const showDefaultCapture = computed(() => !contactable.value && !relationshipActive.value);
const isClose = computed(() => props.composition === 'close' && props.variant === 'artist' && !props.labVisual);
const galleryTeaser = computed(() => (isClose.value ? featuredGalleryTeaser(props.featuredGallery) : null));
const closeLead = computed(() => {
  if (!isClose.value) return '';
  const name = String(props.artistName || '').trim();
  const headline = displayHeadline.value;
  if (name && headline === `Stay close to ${name}`) return 'Stay close to';
  if (name && headline === `You're following ${name}`) return "You're following";
  return '';
});
const closeName = computed(() => (
  closeLead.value ? String(props.artistName || '').trim() : displayHeadline.value
));
const closeEyebrow = computed(() => (props.showModeEnabled ? 'Tonight' : 'Fan list'));
const avatarMark = computed(() => {
  const parts = String(props.artistName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '•';
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
});
const avatarFailed = ref(false);
const showAvatarImage = computed(() => Boolean(String(props.artistImage || '').trim()) && !avatarFailed.value);
const avatarStyle = computed(() => ({
  objectPosition: `${Number(props.imageFocalX) || 50}% ${Number(props.imageFocalY) || 50}%`,
}));
const showEmailField = computed(() => !contactable.value);
const showJoinedState = computed(() => contactable.value);
const showArtistJoinedState = computed(() => props.variant === 'artist' && !props.labVisual && showJoinedState.value);
const artistJoinedMembership = computed(() => {
  const name = String(props.artistName || '').trim();
  return name ? `You're on ${name}'s fan list.` : "You're on the fan list.";
});
const submitLabel = computed(() => (
  showFollowOnlyCapture.value ? 'Keep me in the loop' : resolvedCopy.value.buttonLabel || props.buttonLabel
));
const joinedDisplayMessage = computed(() => {
  if (contactable.value) {
    const name = String(props.artistName || '').trim();
    return name
      ? `You're in. ${name} can reach you with music, shows and messages.`
      : "You're in. The artist can reach you with music, shows and messages.";
  }
  if (alreadyJoined.value) return alreadyJoinedTitle.value;
  return props.successMessage;
});

const isCheckedIn = computed(() => props.alreadyCheckedIn);
let applyingLabPreview = false;

function resetLabState() {
  email.value = '';
  loading.value = false;
  success.value = false;
  alreadyJoined.value = false;
  error.value = '';
}

async function applyLabPreview(state) {
  if (!props.labVisual) return;
  applyingLabPreview = true;
  resetLabState();
  await nextTick();

  if (state === 'focus') {
    await nextTick();
    emailInputRef.value?.focus?.();
  } else if (state === 'loading') {
    email.value = 'you@email.com';
    loading.value = true;
  } else if (state === 'success') {
    success.value = true;
  } else if (state === 'already') {
    alreadyJoined.value = true;
  } else if (state === 'error') {
    email.value = 'you@email.com';
    error.value = 'Something went wrong. Please try again.';
  }

  await nextTick();
  applyingLabPreview = false;
}

watch(email, () => {
  if (applyingLabPreview) return;
  if (props.labVisual && error.value) error.value = '';
});

watch(
  () => props.labPreview,
  (state) => {
    applyLabPreview(state || 'default');
  },
  { immediate: true }
);

function prefillSignedInEmail() {
  if (props.labVisual || contactable.value || email.value) return;
  const next = String(user.value?.email || '').trim();
  if (next) email.value = next;
}

async function resolveSignedInMembership() {
  if (props.labVisual || props.variant !== 'artist') return;
  if (!user.value || !strapiToken.value || !props.bandId) return;
  try {
    const res = await $fetch(`${config.public.strapiUrl}/api/fan-account/artists`, {
      headers: { Authorization: `Bearer ${strapiToken.value}` },
    });
    const artists = res?.data?.artists || [];
    const match = artists.find((row) => String(row.bandId) === String(props.bandId));
    if (match?.status === 'subscribed') alreadyJoined.value = true;
  } catch {
    /* fail closed — keep the capture form */
  }
}

onMounted(() => {
  resolveSignedInMembership();
  prefillSignedInEmail();
});

watch([() => props.bandId, user], () => {
  resolveSignedInMembership();
  prefillSignedInEmail();
});

watch(() => props.artistImage, () => {
  avatarFailed.value = false;
});

watch(() => props.subscribed, (next, prev) => {
  if (props.labVisual) return;
  if (prev && !next) {
    success.value = false;
    alreadyJoined.value = false;
  }
});

async function handleSubmit() {
  if (props.continueTo) {
    await navigateTo(props.continueTo);
    return;
  }
  if (loading.value || contactable.value) return;

  if (!email.value) {
    if (props.labVisual || isClose.value) {
      error.value = 'Enter your email address';
      await nextTick();
      emailInputRef.value?.focus?.();
    }
    return;
  }

  loading.value = true;
  error.value = '';

  if (props.testMode) {
    await new Promise((resolve) => setTimeout(resolve, 220));
    success.value = true;
    loading.value = false;
    return;
  }

  try {
    const { ensureSession, getVisitorToken } = useFanIdentity();
    await ensureSession().catch(() => {});

    const accountEmail = String(user.value?.email || '').trim().toLowerCase();
    const result = await joinArtistFanList({
      strapiUrl: config.public.strapiUrl,
      email: accountEmail || email.value,
      bandId: props.bandId,
      source: props.showModeEnabled ? 'show_mode' : 'band_page',
      captureSurface: props.captureSurface || 'band_page',
      visitorToken: getVisitorToken() || undefined,
      authToken: strapiToken.value || undefined,
      eventId: props.showModeEnabled ? props.eventId : undefined,
    });

    if (!result.ok) {
      throw new Error(result.message || 'Failed to subscribe');
    }

    success.value = true;
    emit('subscribed', { email: result.email });
    if (user.value) {
      await resolveSignedInMembership();
    } else if (props.variant === 'artist' && !props.labVisual) {
      showAfterFanJoin({
        email: result.email,
        bandName: props.artistName,
        returnTo: route.fullPath,
        artistImage: props.artistImage,
        photos: featuredGalleryTeaser(props.featuredGallery)?.photos || [],
        bandId: props.bandId,
        bandSlug: route.params.bandSlug,
      });
    }

    try {
      localStorage.setItem('mbq_fan_email', result.email);
    } catch (storageErr) {
      // Private mode / storage disabled — prefill is a convenience, not a requirement
    }
  } catch (err) {
    console.error('Fan subscribe error:', err);
    error.value = err.message || 'Something went wrong. Please try again.';
  } finally {
    loading.value = false;
  }
}

</script>

<style scoped>
.fan-capture-section {
  width: 100%;
  padding: 0;
  margin-top: 2.5rem;
}

@media (min-width: 768px) {
  .fan-capture-section {
    max-width: 80vw;
    margin-left: auto;
    margin-right: auto;
  }
}

.fan-capture-card--publication {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(0, 0, 0, 0.2) 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
}

.fan-capture-card--publication .accent-line {
  background: linear-gradient(90deg, #34d399, #10b981, #34d399);
  background-size: 200% 100%;
}

.fan-capture-card--publication .icon-wrapper {
  background: rgba(52, 211, 153, 0.12);
  border-color: rgba(52, 211, 153, 0.25);
}

.fan-capture-card--publication .icon {
  color: #34d399;
}

.fan-capture-card--publication .submit-btn {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  box-shadow: 0 4px 20px rgba(16, 185, 129, 0.25);
}

.fan-capture-card--publication .submit-btn:hover:not(:disabled) {
  box-shadow: 0 6px 28px rgba(16, 185, 129, 0.35);
}

.fan-capture-card--publication .submit-btn::before {
  display: none;
}

.fan-capture-section--publication {
  margin-top: 1.5rem;
}

.fan-capture-card {
  position: relative;
  background:
    linear-gradient(180deg, rgba(139, 108, 255, 0.16) 0%, rgba(255, 79, 216, 0.05) 24%, transparent 50%),
    var(--faneqo-fan-surface, #100B16);
  border: 1px solid rgba(139, 108, 255, 0.22);
  border-radius: 1.5rem;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
}

.accent-line {
  height: 2px;
  background: var(--faneqo-fan-edge, linear-gradient(90deg, #8B6CFF 0%, #4CA6FF 100%));
}

.fan-capture-card.is-joined {
  border-color: rgba(98, 242, 157, 0.28);
}

.fan-capture-card.is-joined .accent-line {
  background: var(--faneqo-success, #62F29D);
}

.card-content {
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.lead-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 1.25rem;
  border: 1px solid rgba(57, 213, 255, 0.34);
  background: rgba(76, 166, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  position: relative;
}

.icon-glow {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 1.25rem;
  background: radial-gradient(circle, rgba(57, 213, 255, 0.16) 0%, rgba(69, 227, 174, 0.06) 42%, transparent 72%);
}

.icon {
  width: 32px;
  height: 32px;
  color: var(--faneqo-connection-cyan);
  position: relative;
  z-index: 2;
}

.text-content {
  margin-bottom: 1.25rem;
}

.headline {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--faneqo-text);
  letter-spacing: -0.02em;
  margin-bottom: 0.75rem;
}

.message {
  font-size: 0.9375rem;
  color: var(--faneqo-muted);
  line-height: 1.6;
  max-width: 360px;
  font-weight: 400;
}

.form {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (min-width: 480px) {
  .form {
    flex-direction: row;
    max-width: 480px;
  }
}

@media (min-width: 768px) {
  .form {
    max-width: 520px;
  }
}

.input-wrapper {
  flex: 1;
  position: relative;
}

.email-label {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.submit-btn__busy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
}

.email-input {
  width: 100%;
  padding: 1rem 1.25rem;
  background: var(--faneqo-obsidian);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.875rem;
  color: var(--faneqo-text);
  font-size: 0.9375rem;
  transition: border-color 0.2s, background 0.2s;
  font-weight: 500;
}

.email-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

.email-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.email-input:focus {
  outline: none;
  border-color: rgba(57, 213, 255, 0.62);
  background: #08090e;
}

.email-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input-wrapper.has-error .email-input {
  border-color: rgba(239, 68, 68, 0.5);
}

.input-wrapper.is-success .email-input {
  border-color: rgba(98, 242, 157, 0.4);
  background: rgba(98, 242, 157, 0.08);
}

.success-box {
  width: 100%;
  padding: 0.875rem 1rem;
  background: rgba(98, 242, 157, 0.08);
  border: 1px solid rgba(98, 242, 157, 0.32);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--faneqo-success);
  font-weight: 600;
  font-size: 0.9375rem;
}

.success-icon {
  width: 20px;
  height: 20px;
}

.submit-btn {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: 1rem 2rem;
  background: var(--faneqo-fan-cta, #0E0B14);
  border: 1px solid rgba(139, 108, 255, 0.36);
  border-radius: 0.875rem;
  color: var(--faneqo-text);
  font-weight: 700;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s, background 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 160px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.submit-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(90deg, #8B6CFF, #4CA6FF);
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.42;
  pointer-events: none;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(76, 166, 255, 0.52);
  background: #12101C;
}

.submit-btn:hover:not(:disabled)::before {
  opacity: 0.7;
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 1;
  cursor: not-allowed;
  background: var(--faneqo-fan-cta, #0E0B14);
  border-color: rgba(139, 108, 255, 0.22);
}

.submit-btn:disabled::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  animation: shimmer-disabled 2s ease-in-out infinite;
}

@keyframes shimmer-disabled {
  0%, 100% { left: -100%; }
  50% { left: 100%; }
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  margin-top: 0.5rem;
  color: #f87171;
  font-size: 0.8125rem;
}

.privacy-note {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 1rem;
  color: var(--faneqo-muted);
  font-size: 0.8125rem;
}

.lock-icon {
  width: 12px;
  height: 12px;
}

/* Check-in Prompt */
.checkin-prompt {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.checkin-question {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  margin: 0 0 0.75rem;
}

.checkin-btn {
  padding: 0.625rem 1.25rem;
  background: var(--faneqo-surface);
  border: 1px solid rgba(76, 166, 255, 0.32);
  border-radius: 0.5rem;
  color: var(--faneqo-text);
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: border-color 0.2s;
}

.checkin-btn:hover:not(:disabled) {
  border-color: rgba(57, 213, 255, 0.5);
}

.checkin-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner.small {
  width: 14px;
  height: 14px;
}

/* Check-in Success */
.checkin-success {
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(98, 242, 157, 0.08);
  border: 1px solid rgba(98, 242, 157, 0.28);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.checkin-icon {
  font-size: 1.25rem;
}

.checkin-text {
  color: var(--faneqo-success);
  font-weight: 600;
  font-size: 0.875rem;
}

/* Post-Signup Check-In Prompt */
.post-signup-checkin {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(76, 166, 255, 0.16);
}

.checkin-prompt-content {
  text-align: center;
  padding: 1.5rem;
  background: var(--faneqo-raised);
  border: 1px solid rgba(76, 166, 255, 0.18);
  border-radius: 1rem;
}

.prompt-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
  position: relative;
  display: inline-block;
}

.prompt-icon::after {
  content: '';
  position: absolute;
  inset: -8px;
  background: radial-gradient(circle, rgba(57, 213, 255, 0.18) 0%, transparent 70%);
  border-radius: 50%;
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

.prompt-title {
  color: white;
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.prompt-subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  margin: 0 0 1.5rem 0;
  line-height: 1.4;
}

.prompt-checkin-btn {
  padding: 0.75rem 1.5rem;
  background: var(--faneqo-surface);
  border: 1px solid rgba(76, 166, 255, 0.35);
  border-radius: 0.75rem;
  color: var(--faneqo-text);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s;
}

.prompt-checkin-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(57, 213, 255, 0.5);
}

.prompt-checkin-btn:active {
  transform: translateY(0);
}

.capture-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-width: 0;
}

/*
 * Artist Page visual only. Does not change submit / state / API behavior.
 */
.fan-capture-section--artist {
  overflow: visible;
}

.fan-capture-section--artist .fan-capture-card,
.fan-capture-section--artist .fq-fan-card {
  position: relative;
  background:
    radial-gradient(ellipse 90% 42% at 50% -6%, rgba(139, 108, 255, 0.08) 0%, transparent 58%),
    radial-gradient(ellipse 46% 28% at 82% 0%, rgba(139, 108, 255, 0.07) 0%, transparent 64%),
    #0B0C10;
  border: 1px solid rgba(139, 108, 255, 0.3);
  border-radius: 1rem;
  box-shadow: inset 0 1px 0 rgba(186, 168, 255, 0.2);
  overflow: hidden;
}

.fan-capture-section--artist .fan-capture-card::before,
.fan-capture-section--artist .fq-fan-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 11%;
  right: 11%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(139, 108, 255, 0.34) 18%,
    rgba(167, 139, 255, 0.52) 50%,
    rgba(139, 108, 255, 0.26) 80%,
    transparent 100%
  );
  opacity: 0.78;
  pointer-events: none;
  z-index: 2;
}

.fan-capture-section--artist .fan-capture-card:focus-within,
.fan-capture-section--artist .fq-fan-card:focus-within {
  border-color: rgba(139, 108, 255, 0.44);
  box-shadow: inset 0 1px 0 rgba(186, 168, 255, 0.28);
}

.fan-capture-section--artist .fan-capture-card:focus-within::before,
.fan-capture-section--artist .fq-fan-card:focus-within::before {
  opacity: 1;
}

.fan-capture-section--artist .accent-line,
.fan-capture-section--artist .fq-fan-edge {
  display: none;
}

.fan-capture-section--artist .fan-capture-card.is-joined {
  border-color: rgba(139, 108, 255, 0.36);
  box-shadow: inset 0 1px 0 rgba(186, 168, 255, 0.22);
}

.fan-capture-section--artist.is-artist-joined {
  padding-bottom: 0.5rem;
}

.fan-capture-section--artist .fan-capture-card.is-joined .card-content {
  padding: 1.375rem 1.25rem 1.5rem;
}

.fan-capture-section--artist .artist-joined {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-width: 0;
  text-align: center;
}

.fan-capture-section--artist .artist-joined__title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  margin: 0;
  font-size: 1.375rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: #F7F9FC;
}

.fan-capture-section--artist .artist-joined__icon {
  width: 1.05rem;
  height: 1.05rem;
  flex: 0 0 auto;
  color: rgba(186, 168, 255, 0.92);
}

.fan-capture-section--artist .artist-joined__line {
  margin: 0.7rem 0 0;
  font-size: 0.9375rem;
  font-weight: 560;
  line-height: 1.4;
  color: rgba(247, 249, 252, 0.88);
  overflow-wrap: break-word;
}

.fan-capture-section--artist .artist-joined__support {
  margin: 0.5rem 0 0;
  max-width: 17rem;
  font-size: 0.8125rem;
  font-weight: 450;
  line-height: 1.45;
  color: rgba(247, 249, 252, 0.62);
}

.fan-capture-section--artist .card-content {
  position: relative;
  z-index: 1;
  align-items: stretch;
  padding: 1.2rem 1.15rem 1.05rem;
}

.fan-capture-section--artist .icon-wrapper,
.fan-capture-section--artist .icon-glow {
  display: none;
}

.fan-capture-section--artist .text-content {
  margin-bottom: 0;
}

.fan-capture-section--artist .value-line {
  width: 100%;
  margin: 0.75rem 0 1.05rem;
  text-align: center;
  font-size: 0.8125rem;
  font-weight: 450;
  letter-spacing: 0.025em;
  line-height: 1.35;
  color: rgba(226, 220, 248, 0.66);
  pointer-events: none;
  user-select: none;
}

.fan-capture-section--artist .headline {
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: -0.028em;
  line-height: 1.2;
  margin-bottom: 0.35rem;
  color: #F7F9FC;
}

.fan-capture-section--artist .message {
  font-size: 0.9375rem;
  line-height: 1.45;
  max-width: 26rem;
  color: rgba(247, 249, 252, 0.64);
}

.fan-capture-section--artist .form {
  flex-direction: column;
  width: 100%;
  max-width: none;
  min-width: 0;
  gap: 0.7rem;
}

.fan-capture-section--artist .email-input,
.fan-capture-section--artist .fq-fan-input {
  min-height: 44px;
  padding: 0.75rem 1rem;
  font-size: 16px;
  border-radius: 0.75rem;
  background: #08090d;
  border-color: rgba(247, 249, 252, 0.16);
  box-shadow: inset 0 1px 0 rgba(247, 249, 252, 0.045);
}

.fan-capture-section--artist .email-input::placeholder,
.fan-capture-section--artist .fq-fan-input::placeholder {
  color: rgba(247, 249, 252, 0.46);
  font-style: normal;
}

.fan-capture-section--artist .email-input:focus,
.fan-capture-section--artist .fq-fan-input:focus {
  border-color: rgba(139, 108, 255, 0.62);
  background:
    linear-gradient(180deg, rgba(139, 108, 255, 0.06) 0%, transparent 46%),
    #07080c;
  box-shadow:
    inset 0 1px 0 rgba(186, 168, 255, 0.14),
    0 0 0 2px rgba(139, 108, 255, 0.2);
}

.fan-capture-section--artist .submit-btn,
.fan-capture-section--artist .fq-fan-cta {
  width: 100%;
  min-width: 0;
  min-height: 44px;
  padding: 0.75rem 1.1rem;
  border-radius: 0.75rem;
  background: linear-gradient(180deg, #ffffff 0%, #ece8f6 100%);
  border: 1px solid rgba(186, 168, 255, 0.42);
  color: #0c0d12;
  font-size: 0.875rem;
  font-weight: 750;
  letter-spacing: 0.02em;
  text-transform: none;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.84),
    inset 0 -1px 0 rgba(139, 108, 255, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.18);
  transition:
    background 0.38s ease,
    border-color 0.38s ease,
    color 0.28s ease,
    box-shadow 0.38s ease,
    transform 0.16s ease;
}

.fan-capture-section--artist .submit-btn::before {
  content: none;
  display: none;
}

.fan-capture-section--artist .submit-btn:not(:disabled)::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 42%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.48),
    rgba(186, 168, 255, 0.28),
    rgba(255, 255, 255, 0.4),
    transparent
  );
  transform: translateX(-130%) skewX(-18deg);
  animation:
    fan-cta-awaken 0.9s ease-out 1,
    fan-cta-sheen 8.8s ease-in-out 1.5s infinite;
  pointer-events: none;
}

.fan-capture-section--artist .submit-btn:disabled,
.fan-capture-section--artist .fq-fan-cta:disabled {
  opacity: 1;
  cursor: not-allowed;
  background:
    linear-gradient(180deg, rgba(139, 108, 255, 0.1) 0%, rgba(247, 249, 252, 0.02) 42%, transparent 72%),
    #14141c;
  border-color: rgba(139, 108, 255, 0.22);
  color: rgba(247, 249, 252, 0.7);
  box-shadow:
    inset 0 1px 0 rgba(186, 168, 255, 0.14),
    inset 0 -1px 0 rgba(0, 0, 0, 0.28);
}

.fan-capture-section--artist .submit-btn:disabled:hover,
.fan-capture-section--artist .fq-fan-cta:disabled:hover,
.fan-capture-section--artist .submit-btn:disabled:active,
.fan-capture-section--artist .fq-fan-cta:disabled:active {
  transform: none;
  background:
    linear-gradient(180deg, rgba(139, 108, 255, 0.1) 0%, rgba(247, 249, 252, 0.02) 42%, transparent 72%),
    #14141c;
  border-color: rgba(139, 108, 255, 0.22);
  color: rgba(247, 249, 252, 0.7);
}

.fan-capture-section--artist .submit-btn:disabled::after {
  content: '';
  display: block;
  position: absolute;
  top: -40%;
  left: 0;
  width: 55%;
  height: 180%;
  background: linear-gradient(
    108deg,
    transparent 8%,
    rgba(247, 249, 252, 0.015) 36%,
    rgba(139, 108, 255, 0.1) 50%,
    rgba(247, 249, 252, 0.03) 64%,
    transparent 92%
  );
  transform: translateX(-70%) rotate(12deg);
  animation: fan-cta-frost 14s ease-in-out infinite;
  pointer-events: none;
  opacity: 0.62;
}

.fan-capture-section--artist .fan-capture-card:focus-within .submit-btn:disabled::after,
.fan-capture-section--artist .fq-fan-card:focus-within .submit-btn:disabled::after {
  opacity: 0.92;
}

.fan-capture-section--artist .submit-btn[aria-busy='true'],
.fan-capture-section--artist .fq-fan-cta[aria-busy='true'],
.fan-capture-section--artist .submit-btn:disabled[aria-busy='true'],
.fan-capture-section--artist .fq-fan-cta:disabled[aria-busy='true'] {
  cursor: wait;
  background: linear-gradient(180deg, #ffffff 0%, #ece8f6 100%);
  border-color: rgba(186, 168, 255, 0.42);
  color: #0c0d12;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.84),
    inset 0 -1px 0 rgba(139, 108, 255, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.18);
}

.fan-capture-section--artist .submit-btn[aria-busy='true']::after {
  content: none;
  display: none;
  animation: none;
}

.fan-capture-section--artist .submit-btn:hover:not(:disabled),
.fan-capture-section--artist .fq-fan-cta:hover:not(:disabled) {
  transform: none;
  background: linear-gradient(180deg, #ffffff 0%, #f4f1fb 100%);
  border-color: rgba(186, 168, 255, 0.55);
  color: #0c0d12;
}

.fan-capture-section--artist .submit-btn:active:not(:disabled) {
  transform: scale(0.985);
  background: #dfe2e8;
}

.fan-capture-section--artist .submit-btn:focus-visible {
  outline: 2px solid rgba(139, 108, 255, 0.7);
  outline-offset: 2px;
}

@keyframes fan-cta-awaken {
  0% {
    transform: translateX(-130%) skewX(-18deg);
    opacity: 0;
  }
  32% {
    opacity: 0.78;
  }
  100% {
    transform: translateX(190%) skewX(-18deg);
    opacity: 0;
  }
}

@keyframes fan-cta-sheen {
  0%, 80% {
    transform: translateX(-130%) skewX(-18deg);
    opacity: 0;
  }
  86% {
    opacity: 0.5;
  }
  94%, 100% {
    transform: translateX(190%) skewX(-18deg);
    opacity: 0;
  }
}

@keyframes fan-cta-frost {
  0%, 100% {
    transform: translateX(-70%) rotate(12deg);
  }
  50% {
    transform: translateX(95%) rotate(12deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .fan-capture-section--artist .submit-btn:not(:disabled)::after,
  .fan-capture-section--artist .submit-btn:disabled::after {
    content: none;
    display: none;
    animation: none;
  }

  .fan-capture-section--artist .submit-btn:active:not(:disabled) {
    transform: none;
  }
}

.fan-capture-section--artist .loading-spinner {
  border-color: rgba(12, 13, 18, 0.22);
  border-top-color: #0c0d12;
}

.fan-capture-section--artist .success-box {
  min-height: 44px;
  background:
    linear-gradient(180deg, rgba(247, 249, 252, 0.05) 0%, transparent 52%),
    rgba(139, 108, 255, 0.1);
  border-color: rgba(139, 108, 255, 0.32);
  box-shadow: inset 0 1px 0 rgba(247, 249, 252, 0.08);
  color: #F7F9FC;
}

.fan-capture-section--artist .privacy-note {
  justify-content: center;
  margin-top: 0.8rem;
  font-size: 0.75rem;
  color: rgba(247, 249, 252, 0.32);
}

.fan-capture-section--artist .lock-icon {
  color: rgba(139, 108, 255, 0.4);
}

@media (min-width: 480px) {
  .fan-capture-section--artist .form {
    flex-direction: column;
    max-width: none;
  }
}

@media (min-width: 768px) {
  .fan-capture-section--artist .card-content {
    padding: 1.25rem 1.35rem 1.15rem;
  }

  .fan-capture-section--artist .lead-block,
  .fan-capture-section--artist .text-content,
  .fan-capture-section--artist .message,
  .fan-capture-section--artist .value-line {
    text-align: left;
    align-items: flex-start;
    max-width: none;
  }

  .fan-capture-section--artist .value-line {
    width: auto;
    margin: 0.7rem 0 0;
  }

  .fan-capture-section--artist .form {
    flex-direction: row;
    align-items: stretch;
    max-width: none;
  }

  .fan-capture-section--artist .submit-btn,
  .fan-capture-section--artist .fq-fan-cta {
    width: auto;
    flex: 0 0 auto;
    min-width: 9.75rem;
  }

  .fan-capture-section--artist .privacy-note {
    justify-content: flex-start;
  }

  .fan-capture-section--artist .artist-joined,
  .fan-capture-section--artist .artist-joined__title {
    align-items: flex-start;
    justify-content: flex-start;
    text-align: left;
  }
}

@media (min-width: 1024px) {
  .fan-capture-section--artist .card-content {
    padding: 1.7rem 1.9rem 1.45rem;
  }

  .fan-capture-section--artist .capture-row {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(22rem, 1.1fr);
    gap: 1.15rem 2.35rem;
    align-items: center;
  }

  .fan-capture-section--artist .text-content {
    margin-bottom: 0;
  }

  .fan-capture-section--artist .headline {
    margin-bottom: 0.45rem;
  }

  .fan-capture-section--artist .message {
    max-width: 28rem;
  }

  .fan-capture-section--artist .value-line {
    margin-top: 0.9rem;
  }

  .fan-capture-section--artist .privacy-note {
    margin-top: 1.1rem;
  }

  .fan-capture-section--artist .fan-capture-card.is-joined .card-content {
    padding: 1.5rem 1.75rem 1.6rem;
  }

  .fan-capture-section--artist .artist-joined,
  .fan-capture-section--artist .artist-joined__title {
    align-items: flex-start;
    justify-content: flex-start;
    text-align: left;
  }

  .fan-capture-section--artist .artist-joined__support {
    max-width: 22rem;
  }

  .fan-capture-section--artist .fan-capture-card.is-joined .capture-row {
    gap: 1.15rem 2.35rem;
  }
}

/*
 * Design lab visual variant only (.fan-capture-section--lab).
 * Production Fan List styles above stay unchanged until explicit promotion.
 */
.fan-capture-section--lab {
  width: 100%;
  max-width: none;
  margin-top: 0;
}

@media (min-width: 768px) {
  .fan-capture-section--lab {
    max-width: none;
    margin-left: 0;
    margin-right: 0;
  }
}

.fan-capture-section--lab .lab-kicker {
  margin: 0 0 1rem;
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.52);
}

.fan-capture-section--lab .fan-capture-card,
.fan-capture-section--lab .fq-fan-card {
  background: #191a22;
  background-image: none;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 1rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.fan-capture-section--lab .fan-capture-card.is-joined {
  border-color: rgba(255, 255, 255, 0.16);
}

.fan-capture-section--lab .card-content {
  align-items: stretch;
  text-align: left;
  padding: 1.05rem 1.1rem 0.95rem;
}

.fan-capture-section--lab .lead-block {
  display: block;
  width: 100%;
  text-align: left;
  margin-bottom: 0.9rem;
}

.fan-capture-section--lab .text-content {
  margin-bottom: 0;
}

.fan-capture-section--lab .headline {
  font-size: 1.0625rem;
  font-weight: 700;
  letter-spacing: -0.018em;
  line-height: 1.25;
  margin-bottom: 0.28rem;
  color: #f4f6f8;
}

.fan-capture-section--lab .message {
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.45;
  max-width: none;
  color: rgba(255, 255, 255, 0.55);
}

.fan-capture-section--lab .form {
  max-width: none;
  width: 100%;
  gap: 0.55rem;
  flex-direction: column;
}

.fan-capture-section--lab .email-input,
.fan-capture-section--lab .fq-fan-input {
  padding: 0.82rem 0.95rem;
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  border-radius: 0.75rem;
  background: #121318;
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #f4f6f8;
  transition: border-color 180ms ease, background 180ms ease;
}

.fan-capture-section--lab .email-input::placeholder,
.fan-capture-section--lab .fq-fan-input::placeholder {
  color: rgba(255, 255, 255, 0.38);
  font-style: normal;
}

.fan-capture-section--lab .email-input:focus,
.fan-capture-section--lab .fq-fan-input:focus {
  outline: none;
  border-color: rgba(57, 213, 255, 0.55);
  background: #101218;
  box-shadow: none;
}

.fan-capture-section--lab .email-input:focus-visible,
.fan-capture-section--lab .fq-fan-input:focus-visible {
  outline: none;
}

.fan-capture-section--lab .input-wrapper.has-error .email-input {
  border-color: rgba(248, 113, 113, 0.7);
  box-shadow: none;
}

.fan-capture-section--lab .submit-btn,
.fan-capture-section--lab .fq-fan-cta {
  width: 100%;
  min-width: 0;
  min-height: 2.85rem;
  padding: 0.82rem 1.1rem;
  border-radius: 0.75rem;
  font-size: 0.78rem;
  font-weight: 750;
  letter-spacing: 0.08em;
  color: #0c0d12;
  background: #eceef2;
  border: 1px solid transparent;
  box-shadow: none;
  transition: background-color 180ms ease, transform 180ms ease;
}

.fan-capture-section--lab .submit-btn::before {
  display: none;
}

.fan-capture-section--lab .submit-btn:hover:not(:disabled),
.fan-capture-section--lab .fq-fan-cta:hover:not(:disabled) {
  transform: none;
  background: #ffffff;
  border-color: transparent;
  color: #0c0d12;
}

.fan-capture-section--lab .submit-btn:active:not(:disabled) {
  transform: none;
  background: #dfe2e8;
}

.fan-capture-section--lab .submit-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
  color: #0c0d12;
}

.fan-capture-section--lab .submit-btn:disabled::after {
  content: none;
  animation: none;
}

.fan-capture-section--lab .submit-btn:focus-visible {
  outline: 2px solid rgba(57, 213, 255, 0.7);
  outline-offset: 2px;
}

.fan-capture-section--lab .loading-spinner {
  border-color: rgba(12, 13, 18, 0.2);
  border-top-color: #0c0d12;
}

.fan-capture-section--lab .error-message {
  margin-top: 0.45rem;
  font-size: 0.8125rem;
  color: #fca5a5;
  text-align: left;
}

.fan-capture-section--lab .privacy-note {
  justify-content: flex-start;
  margin-top: 0.7rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.42);
}

.fan-capture-section--lab .lock-icon {
  width: 11px;
  height: 11px;
  opacity: 0.7;
}

.fan-capture-section--lab .lab-result {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  gap: 0.2rem;
  padding: 0.1rem 0;
}

.fan-capture-section--lab .lab-result__title {
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 700;
  color: #f4f6f8;
  letter-spacing: -0.018em;
}

.fan-capture-section--lab .lab-result__detail {
  margin: 0;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.45;
}

.fan-capture-section--lab .lab-result.is-already .lab-result__title {
  color: #f4f6f8;
}

@media (min-width: 640px) {
  .fan-capture-section--lab .card-content {
    padding: 1.15rem 1.2rem 1.05rem;
  }

  .fan-capture-section--lab .form {
    flex-direction: row;
    align-items: stretch;
    gap: 0.5rem;
  }

  .fan-capture-section--lab .submit-btn,
  .fan-capture-section--lab .fq-fan-cta {
    width: auto;
    flex: 0 0 auto;
    min-width: 10.5rem;
  }
}

/*
 * Public artist closing composition.
 * The parent panel owns the atmosphere. This block owns identity, type, and the signup.
 */
.fan-capture-section--close {
  margin-top: 0;
  max-width: none;
}

.fan-capture-section--artist.fan-capture-section--close .fan-capture-card,
.fan-capture-section--artist.fan-capture-section--close .fq-fan-card {
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  overflow: visible;
}

.fan-capture-section--artist.fan-capture-section--close .fan-capture-card::before,
.fan-capture-section--artist.fan-capture-section--close .fq-fan-card::before,
.fan-capture-section--artist.fan-capture-section--close .fan-capture-card:focus-within::before {
  content: none;
  display: none;
}

.fan-capture-section--artist.fan-capture-section--close .fan-capture-card:focus-within,
.fan-capture-section--artist.fan-capture-section--close .fq-fan-card:focus-within,
.fan-capture-section--artist.fan-capture-section--close .fan-capture-card.is-joined {
  border: 0;
  box-shadow: none;
  background: transparent;
}

.fan-capture-section--artist.fan-capture-section--close .card-content,
.fan-capture-section--artist.fan-capture-section--close .fan-capture-card.is-joined .card-content {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-areas:
    "avatar copy"
    "form form";
  align-items: center;
  column-gap: 0.85rem;
  row-gap: 0.95rem;
  padding: 0;
  text-align: left;
}

.fan-capture-section--artist.fan-capture-section--close.is-artist-joined .card-content {
  grid-template-areas: "avatar copy";
  row-gap: 0;
}

.fan-capture-section--artist.fan-capture-section--close .capture-row,
.fan-capture-section--artist.fan-capture-section--close .lead-block {
  display: contents;
}

.fan-capture-section--artist.fan-capture-section--close .close-avatar {
  grid-area: avatar;
  align-self: start;
  width: 4.5rem;
  height: 4.5rem;
  margin-top: 0.1rem;
  padding: 0;
  border-radius: 999px;
  background: transparent;
  box-shadow: none;
}

.fan-capture-section--artist.fan-capture-section--close .close-avatar img {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: cover;
  background: #16141c;
}

.fan-capture-section--artist.fan-capture-section--close .close-avatar__mark {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: #16141c;
  color: rgba(247, 244, 239, 0.88);
  font-size: 0.95rem;
  font-weight: 650;
  letter-spacing: 0.04em;
}

.fan-capture-section--artist.fan-capture-section--close .text-content,
.fan-capture-section--artist.fan-capture-section--close .artist-joined {
  grid-area: copy;
  margin: 0;
  min-width: 0;
  text-align: left;
  align-items: flex-start;
}

.fan-capture-section--artist.fan-capture-section--close .close-eyebrow {
  margin: 0 0 0.4rem;
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: 0.16em;
  line-height: 1;
  text-transform: uppercase;
  color: rgba(198, 184, 255, 0.88);
}

.fan-capture-section--artist.fan-capture-section--close .headline {
  margin: 0;
  color: #f6f3ee;
  font-size: 1.35rem;
  font-weight: 650;
  letter-spacing: -0.034em;
  line-height: 1.08;
}

.fan-capture-section--artist.fan-capture-section--close .headline__lead {
  display: block;
  margin-bottom: 0.16rem;
  color: rgba(246, 243, 238, 0.74);
  font-size: 0.98rem;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.fan-capture-section--artist.fan-capture-section--close .headline__name {
  display: block;
  color: #f7f4ef;
  font-size: clamp(1.7rem, 6.6vw, 2.15rem);
  font-weight: 650;
  letter-spacing: -0.04em;
  line-height: 0.98;
  overflow-wrap: break-word;
}

.fan-capture-section--artist.fan-capture-section--close .message,
.fan-capture-section--artist.fan-capture-section--close .artist-joined__line,
.fan-capture-section--artist.fan-capture-section--close .artist-joined__support {
  max-width: 28rem;
  text-align: left;
}

.fan-capture-section--artist.fan-capture-section--close .message {
  margin: 0.55rem 0 0;
  color: rgba(246, 243, 238, 0.7);
  font-size: 0.9375rem;
  line-height: 1.45;
}

.fan-capture-section--artist.fan-capture-section--close .value-line {
  display: none;
}

.fan-capture-section--artist.fan-capture-section--close .close-teaser {
  margin-top: 0.9rem;
  min-width: 0;
}

.fan-capture-section--artist.fan-capture-section--close .close-teaser__label {
  margin: 0 0 0.45rem;
  color: rgba(246, 243, 238, 0.42);
  font-size: 0.625rem;
  font-weight: 650;
  letter-spacing: 0.16em;
  line-height: 1;
  text-transform: uppercase;
}

.fan-capture-section--artist.fan-capture-section--close .close-teaser__strip {
  display: flex;
  align-items: stretch;
  gap: 0.4rem;
  max-width: 16.25rem;
}

.fan-capture-section--artist.fan-capture-section--close .close-teaser__link {
  display: block;
  flex: 1 1 0;
  min-width: 0;
  max-width: 5.15rem;
  aspect-ratio: 4 / 5;
  border-radius: 0.45rem;
  overflow: hidden;
  background: #16141c;
}

.fan-capture-section--artist.fan-capture-section--close .close-teaser__link:focus-visible {
  outline: 2px solid rgba(246, 243, 238, 0.85);
  outline-offset: 2px;
}

.fan-capture-section--artist.fan-capture-section--close .close-teaser__link img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 38%;
  transform: scale(1);
  transition: transform 220ms ease;
}

@media (hover: hover) and (pointer: fine) {
  .fan-capture-section--artist.fan-capture-section--close .close-teaser__link:hover img {
    transform: scale(1.045);
  }
}

.fan-capture-section--artist.fan-capture-section--close .artist-joined,
.fan-capture-section--artist.fan-capture-section--close .artist-joined__title {
  align-items: flex-start;
  justify-content: flex-start;
  text-align: left;
}

.fan-capture-section--artist.fan-capture-section--close .artist-joined__title {
  font-size: 1.45rem;
}

.fan-capture-section--artist.fan-capture-section--close .artist-joined__support {
  max-width: 18rem;
}

.fan-capture-section--artist.fan-capture-section--close .form {
  grid-area: form;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  max-width: none;
  min-width: 0;
  gap: 0.55rem;
}

.fan-capture-section--artist.fan-capture-section--close .input-wrapper {
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
}

.fan-capture-section--artist.fan-capture-section--close .email-input,
.fan-capture-section--artist.fan-capture-section--close .fq-fan-input {
  min-height: 48px;
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.9rem;
  background: #07080d;
  border: 1px solid rgba(246, 243, 238, 0.16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  font-size: 16px;
}

.fan-capture-section--artist.fan-capture-section--close .email-input::placeholder,
.fan-capture-section--artist.fan-capture-section--close .fq-fan-input::placeholder {
  color: rgba(246, 243, 238, 0.42);
  font-style: normal;
}

.fan-capture-section--artist.fan-capture-section--close .email-input:focus,
.fan-capture-section--artist.fan-capture-section--close .fq-fan-input:focus,
.fan-capture-section--artist.fan-capture-section--close .email-input:focus-visible,
.fan-capture-section--artist.fan-capture-section--close .fq-fan-input:focus-visible {
  border-color: rgba(186, 168, 255, 0.85);
  background: #07080d;
  box-shadow: 0 0 0 3px rgba(139, 108, 255, 0.22);
  outline: none;
}

.fan-capture-section--artist.fan-capture-section--close .input-wrapper.has-error .email-input,
.fan-capture-section--artist.fan-capture-section--close .input-wrapper.has-error .fq-fan-input {
  border-color: rgba(248, 113, 113, 0.9);
  box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.14);
}

.fan-capture-section--artist.fan-capture-section--close .form .error-message {
  margin: 0;
  text-align: left;
  color: #fca5a5;
  font-size: 0.8125rem;
}

.fan-capture-section--artist.fan-capture-section--close .submit-btn,
.fan-capture-section--artist.fan-capture-section--close .fq-fan-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  text-decoration: none;
  cursor: pointer;
  width: 100%;
  flex: 0 0 auto;
  min-width: 0;
  min-height: 48px;
  border-radius: 0.9rem;
  background: #f4f1ea;
  border: 1px solid transparent;
  color: #14151c;
  font-size: 0.9375rem;
  font-weight: 680;
  letter-spacing: -0.01em;
  text-transform: none;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65);
}

.fan-capture-section--artist.fan-capture-section--close .submit-btn__label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.fan-capture-section--artist.fan-capture-section--close .submit-btn__arrow {
  width: 0.95rem;
  height: 0.95rem;
}

.fan-capture-section--artist.fan-capture-section--close .submit-btn::before,
.fan-capture-section--artist.fan-capture-section--close .submit-btn::after,
.fan-capture-section--artist.fan-capture-section--close .submit-btn:disabled::after,
.fan-capture-section--artist.fan-capture-section--close .submit-btn:not(:disabled)::after {
  content: none;
  display: none;
  animation: none;
}

.fan-capture-section--artist.fan-capture-section--close .submit-btn:disabled:not([aria-busy='true']),
.fan-capture-section--artist.fan-capture-section--close .fq-fan-cta:disabled:not([aria-busy='true']) {
  opacity: 0.42;
  cursor: not-allowed;
  background: #f4f1ea;
  border-color: transparent;
  color: #14151c;
  box-shadow: none;
}

.fan-capture-section--artist.fan-capture-section--close .submit-btn:hover:not(:disabled),
.fan-capture-section--artist.fan-capture-section--close .fq-fan-cta:hover:not(:disabled) {
  background: #fffcf7;
  color: #14151c;
  transform: none;
}

.fan-capture-section--artist.fan-capture-section--close .submit-btn:focus-visible {
  outline: 2px solid rgba(198, 184, 255, 0.9);
  outline-offset: 2px;
}

.fan-capture-section--artist.fan-capture-section--close .privacy-note {
  justify-content: flex-start;
  margin: 0.15rem 0 0;
  color: rgba(246, 243, 238, 0.62);
  font-size: 0.8125rem;
}

.fan-capture-section--artist.fan-capture-section--close .lock-icon {
  color: rgba(198, 184, 255, 0.7);
}

.fan-capture-section--artist.fan-capture-section--close .error-message,
.fan-capture-section--artist.fan-capture-section--close .post-signup-checkin,
.fan-capture-section--artist.fan-capture-section--close .checkin-success {
  grid-column: 1 / -1;
  margin-top: 0;
  text-align: left;
}

@container artist-close (min-width: 40rem) {
  .fan-capture-section--artist.fan-capture-section--close .card-content,
  .fan-capture-section--artist.fan-capture-section--close .fan-capture-card.is-joined .card-content {
    grid-template-columns: auto minmax(0, 1fr) minmax(17.5rem, 23rem);
    grid-template-areas: "avatar copy form";
    column-gap: 1.35rem;
    row-gap: 0;
    align-items: center;
  }

  .fan-capture-section--artist.fan-capture-section--close.is-artist-joined .card-content {
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-areas: "avatar copy";
  }

  .fan-capture-section--artist.fan-capture-section--close .close-avatar {
    width: 5.25rem;
    height: 5.25rem;
  }

  .fan-capture-section--artist.fan-capture-section--close .headline__lead {
    font-size: 1.05rem;
  }

  .fan-capture-section--artist.fan-capture-section--close .headline__name {
    font-size: clamp(2.15rem, 3.1vw, 2.85rem);
  }

  .fan-capture-section--artist.fan-capture-section--close .form {
    flex-direction: column;
    align-self: center;
    gap: 0.55rem;
  }

  .fan-capture-section--artist.fan-capture-section--close .submit-btn,
  .fan-capture-section--artist.fan-capture-section--close .fq-fan-cta {
    width: 100%;
  }

  .fan-capture-section--artist.fan-capture-section--close .form .privacy-note {
    margin-top: 0.2rem;
    justify-content: flex-start;
    text-align: left;
  }

  .fan-capture-section--artist.fan-capture-section--close .card-content:has(.close-teaser) {
    align-items: start;
  }

  .fan-capture-section--artist.fan-capture-section--close .card-content:has(.close-teaser) .form {
    align-self: start;
    margin-top: 0.15rem;
  }
}

/* Phone composition only. Desktop stays on the min-width rules above. */
@container artist-close (max-width: 39.99rem) {
  .fan-capture-section--artist.fan-capture-section--close .card-content,
  .fan-capture-section--artist.fan-capture-section--close .fan-capture-card.is-joined .card-content {
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-areas: none;
    column-gap: 0.85rem;
    row-gap: 0;
    align-items: center;
  }

  .fan-capture-section--artist.fan-capture-section--close .close-avatar {
    grid-area: auto;
    grid-column: 1;
    grid-row: 1;
    align-self: start;
    width: 3.75rem;
    height: 3.75rem;
    margin-top: 0.12rem;
  }

  .fan-capture-section--artist.fan-capture-section--close .text-content {
    display: contents;
  }

  .fan-capture-section--artist.fan-capture-section--close .close-identity {
    grid-column: 2;
    grid-row: 1;
    align-self: center;
    min-width: 0;
  }

  .fan-capture-section--artist.fan-capture-section--close .close-eyebrow {
    margin-bottom: 0.28rem;
    font-size: 0.6875rem;
    letter-spacing: 0.14em;
  }

  .fan-capture-section--artist.fan-capture-section--close .headline__lead {
    margin-bottom: 0.12rem;
    font-size: 0.875rem;
  }

  .fan-capture-section--artist.fan-capture-section--close .headline__name {
    font-size: 1.85rem;
    line-height: 1.05;
    letter-spacing: -0.038em;
    text-wrap: balance;
  }

  .fan-capture-section--artist.fan-capture-section--close .message {
    grid-column: 1 / -1;
    grid-row: 2;
    max-width: none;
    margin: 1.3rem 0 0;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .fan-capture-section--artist.fan-capture-section--close .close-teaser {
    grid-column: 1 / -1;
    grid-row: 3;
    margin-top: 1rem;
  }

  .fan-capture-section--artist.fan-capture-section--close .close-teaser__label {
    margin-bottom: 0.4rem;
    color: rgba(246, 243, 238, 0.5);
    font-size: 0.6875rem;
    letter-spacing: 0.14em;
  }

  .fan-capture-section--artist.fan-capture-section--close .close-teaser__strip {
    max-width: none;
    gap: 0.4rem;
  }

  .fan-capture-section--artist.fan-capture-section--close .close-teaser__link {
    max-width: 6.4rem;
    border-radius: 0.5rem;
  }

  .fan-capture-section--artist.fan-capture-section--close .close-teaser__link:active img {
    transform: scale(1.035);
  }

  .fan-capture-section--artist.fan-capture-section--close .form {
    grid-column: 1 / -1;
    grid-row: 3;
    margin-top: 1.25rem;
    gap: 0.65rem;
  }

  .fan-capture-section--artist.fan-capture-section--close .card-content:has(.close-teaser) .form {
    grid-row: 4;
    margin-top: 1.15rem;
  }

  .fan-capture-section--artist.fan-capture-section--close .email-input,
  .fan-capture-section--artist.fan-capture-section--close .fq-fan-input {
    min-height: 52px;
    border-radius: 0.8rem;
    padding: 0.75rem 1rem;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 16px;
  }

  .fan-capture-section--artist.fan-capture-section--close .submit-btn,
  .fan-capture-section--artist.fan-capture-section--close .fq-fan-cta {
    min-height: 52px;
    border-radius: 0.8rem;
  }

  .fan-capture-section--artist.fan-capture-section--close .submit-btn:active:not(:disabled),
  .fan-capture-section--artist.fan-capture-section--close .fq-fan-cta:active:not(:disabled) {
    background: #e6e1d6;
  }

  .fan-capture-section--artist.fan-capture-section--close .privacy-note {
    justify-content: center;
    width: 100%;
    margin-top: 0.15rem;
    text-align: center;
  }

  .fan-capture-section--artist.fan-capture-section--close .form .error-message {
    min-height: 1.15rem;
  }
}

@container artist-close (max-width: 22rem) {
  .fan-capture-section--artist.fan-capture-section--close .headline__name {
    font-size: 1.55rem;
    line-height: 1.06;
  }

  .fan-capture-section--artist.fan-capture-section--close .close-teaser__link {
    max-width: none;
  }
}

@media (min-width: 768px) {
  .fan-capture-section--close {
    max-width: none;
    margin-left: 0;
    margin-right: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fan-capture-section--artist.fan-capture-section--close .submit-btn:active:not(:disabled) {
    transform: none;
  }

  .fan-capture-section--artist.fan-capture-section--close .close-teaser__link img,
  .fan-capture-section--artist.fan-capture-section--close .close-teaser__link:active img {
    transition: none;
    transform: none;
  }
}

</style>
