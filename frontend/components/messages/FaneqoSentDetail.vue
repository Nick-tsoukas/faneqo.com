<template>
  <div class="fq-sent" :class="{ 'is-embedded': embedded }">
    <NuxtLink :to="backTo" class="fq-sent__back">
      <component :is="icons.back" :size="18" :stroke-width="1.75" aria-hidden="true" />
      Sent messages
    </NuxtLink>

    <div v-if="loading" class="fq-sent__boot" role="status">Opening message…</div>

    <div v-else-if="error" class="fq-sent__empty">
      <h2>{{ error }}</h2>
      <NuxtLink :to="backTo" class="fq-sent__ghost">Back to Sent messages</NuxtLink>
    </div>

    <template v-else-if="campaign">
      <header class="fq-sent__head">
        <p class="fq-sent__kicker">{{ headerTitle }}</p>
        <p class="fq-sent__when">
          <span class="fq-sent__status" :class="`is-${statusKind}`">{{ statusLabel }}</span>
          <span v-if="when"> · {{ when }}</span>
        </p>
      </header>

      <div class="fq-sent__layout">
        <section class="fq-sent__received" aria-label="What fans received">
          <p class="fq-sent__label">What fans received</p>

          <div class="fq-sent__message">
            <p v-if="body && !gallery" class="fq-sent__body">{{ body }}</p>
            <FaneqoGalleryMessageCard
              v-if="gallery"
              :gallery="gallery"
              :caption="body"
              preview
              viewer-role="artist"
              @open="onOpenGallery"
            />
          </div>
        </section>

        <aside class="fq-sent__rail">
          <section class="fq-sent__block">
            <p class="fq-sent__label">Delivery</p>
            <p class="fq-sent__sent">{{ delivery.sentLabel }}</p>
            <p v-if="delivery.rest" class="fq-sent__rest">{{ delivery.rest }}</p>
            <p v-if="channelLabel" class="fq-sent__channel">{{ channelLabel }}</p>
            <p v-if="delivery.hint" class="fq-sent__hint">{{ delivery.hint }}</p>
          </section>

          <nav v-if="actions.primary" class="fq-sent__actions">
            <NuxtLink :to="actions.primary.to" class="fq-sent__continue">
              {{ actions.primary.label }}
              <span aria-hidden="true"> →</span>
            </NuxtLink>
            <NuxtLink v-if="actions.secondary" :to="actions.secondary.to" class="fq-sent__quiet">
              {{ actions.secondary.label }}
              <span aria-hidden="true"> →</span>
            </NuxtLink>
          </nav>
        </aside>
      </div>
    </template>

    <FaneqoMediaLightbox
      :open="!!lightbox"
      :items="lightbox?.items || []"
      :start-index="lightbox?.index || 0"
      :title="gallery?.title || 'Gallery'"
      @close="lightbox = null"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import FaneqoGalleryMessageCard from '~/components/messages/FaneqoGalleryMessageCard.vue'
import FaneqoMediaLightbox from '~/components/media/FaneqoMediaLightbox.vue'
import { faneqoIcons } from '~/utils/messages/faneqoIcons'
import {
  sentChannelLabel,
  sentDeliverySummary,
  sentHeaderTitle,
  sentNextActions,
  sentStatusKind,
  sentStatusLabel,
} from '~/utils/messages/sentPresentation'

const props = defineProps({
  campaign: { type: Object, default: null },
  gallery: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  backTo: { type: [String, Object], required: true },
  when: { type: String, default: '' },
  bandId: { type: [String, Number], default: null },
  embedded: { type: Boolean, default: false },
})

const icons = faneqoIcons
const lightbox = ref(null)

const body = computed(() => String(props.campaign?.bodyText || '').trim())
const headerTitle = computed(() => sentHeaderTitle(props.campaign || {}))
const statusLabel = computed(() => sentStatusLabel(props.campaign?.status))
const statusKind = computed(() => sentStatusKind(props.campaign?.status))
const delivery = computed(() => sentDeliverySummary(props.campaign || {}))
const channelLabel = computed(() => sentChannelLabel(props.campaign || {}))
const actions = computed(() => sentNextActions(props.campaign || {}, {
  bandId: props.bandId,
  gallery: props.gallery,
}))

function onOpenGallery(payload = {}) {
  const items = Array.isArray(payload.items) ? payload.items : []
  if (!items.length) return
  lightbox.value = {
    items,
    index: Number.isFinite(Number(payload.index)) ? Number(payload.index) : 0,
  }
}
</script>

<style scoped>
.fq-sent {
  min-height: 100dvh;
  padding: calc(var(--header-height, 70px) + 1rem) 1rem calc(1.5rem + env(safe-area-inset-bottom, 0px));
  background: var(--fq-app-bg, #050506);
  color: var(--fq-text-primary, #F5F5F6);
}

.fq-sent__back {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  min-height: 44px;
  color: var(--fq-text-secondary, rgba(255, 255, 255, 0.55));
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
}

.fq-sent__back:hover,
.fq-sent__back:focus-visible {
  color: #F5F5F6;
}

.fq-sent__back:focus-visible {
  outline: 2px solid var(--fq-accent-focus, #39D5FF);
  outline-offset: 3px;
  border-radius: 0.4rem;
}

.fq-sent__boot,
.fq-sent__empty {
  padding: 4rem 1rem;
  text-align: center;
  color: var(--fq-text-secondary, rgba(255, 255, 255, 0.55));
}

.fq-sent__empty h2 {
  margin: 0 0 1rem;
  color: #F5F5F6;
  font-size: 1.1rem;
  font-weight: 650;
}

.fq-sent__ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0.55rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.75rem;
  color: #F5F5F6;
  font-size: 0.88rem;
  font-weight: 650;
  text-decoration: none;
}

.fq-sent__head {
  max-width: 68rem;
  margin: 0.35rem 0 1.35rem;
}

.fq-sent__kicker {
  margin: 0;
  color: #F5F5F6;
  font-size: 1.15rem;
  font-weight: 650;
  letter-spacing: -0.025em;
  line-height: 1.25;
}

.fq-sent__when {
  margin: 0.35rem 0 0;
  color: var(--fq-text-muted, rgba(255, 255, 255, 0.38));
  font-size: 0.8rem;
}

.fq-sent__status {
  font-weight: 650;
  color: var(--fq-text-secondary, rgba(255, 255, 255, 0.58));
}

.fq-sent__status.is-live {
  color: var(--fq-state-progress, #23C7C3);
}

.fq-sent__status.is-partial {
  color: #fcd34d;
}

.fq-sent__status.is-fail {
  color: var(--fq-state-error, #fca5a5);
}

.fq-sent__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2rem 3rem;
  max-width: 68rem;
}

.fq-sent__label {
  margin: 0 0 0.75rem;
  color: var(--fq-text-muted, rgba(255, 255, 255, 0.38));
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.fq-sent__body {
  margin: 0;
  max-width: 36rem;
  color: #F5F5F6;
  font-size: 1.05rem;
  font-weight: 450;
  letter-spacing: -0.015em;
  line-height: 1.55;
  white-space: pre-wrap;
}

.fq-sent__rail {
  max-width: 22rem;
}

.fq-sent__sent {
  margin: 0;
  color: #F5F5F6;
  font-size: 1.35rem;
  font-weight: 650;
  letter-spacing: -0.03em;
}

.fq-sent__rest,
.fq-sent__channel {
  margin: 0.28rem 0 0;
  color: var(--fq-text-secondary, rgba(255, 255, 255, 0.55));
  font-size: 0.84rem;
}

.fq-sent__hint {
  margin: 0.65rem 0 0;
  color: var(--fq-text-muted, rgba(255, 255, 255, 0.38));
  font-size: 0.75rem;
  line-height: 1.45;
}

.fq-sent__actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
  margin-top: 1.35rem;
}

.fq-sent__continue,
.fq-sent__quiet {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: #F5F5F6;
  font-size: 0.9rem;
  font-weight: 650;
  text-decoration: none;
}

.fq-sent__quiet {
  color: var(--fq-text-secondary, rgba(255, 255, 255, 0.55));
  font-weight: 500;
}

.fq-sent__continue:hover,
.fq-sent__quiet:hover,
.fq-sent__continue:focus-visible,
.fq-sent__quiet:focus-visible {
  color: #fff;
}

.fq-sent__continue:focus-visible,
.fq-sent__quiet:focus-visible {
  outline: 2px solid var(--fq-accent-focus, #39D5FF);
  outline-offset: 3px;
  border-radius: 0.35rem;
}

.fq-sent.is-embedded {
  min-height: auto;
  padding: 0.25rem 0 2rem;
}

@media (min-width: 900px) {
  .fq-sent__layout {
    grid-template-columns: minmax(0, 1fr) minmax(16rem, 20rem);
    align-items: start;
  }

  .fq-sent__kicker {
    font-size: 1.35rem;
  }

  .fq-sent__body {
    font-size: 1.12rem;
    line-height: 1.58;
  }
}
</style>
