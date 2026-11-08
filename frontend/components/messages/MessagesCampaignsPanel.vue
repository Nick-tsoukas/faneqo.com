<template>
  <div class="fq-camps">
    <div v-if="loading && !campaigns.length" class="fq-camps__skel" role="status" aria-label="Loading sent messages">
      <div v-for="n in 4" :key="n" class="fq-camps__skel-row">
        <span class="fq-camps__skel-lines">
          <span class="fq-camps__skel-line fq-camps__skel-line--w" />
          <span class="fq-camps__skel-line" />
        </span>
        <span class="fq-camps__skel-side" />
      </div>
    </div>
    <div v-else-if="error && !campaigns.length" class="fq-camps__empty">
      <h2>{{ errorCopy.heading }}</h2>
      <p>{{ errorCopy.body }}</p>
      <button type="button" class="fq-camps__ghost" @click="$emit('retry')">Try again</button>
    </div>
    <div v-else-if="!campaigns.length" class="fq-camps__empty">
      <h2>{{ emptyCopy.heading }}</h2>
      <p>{{ emptyCopy.body }}</p>
      <MessagesAudienceActions
        class="fq-camps__actions"
        @all-fans="$emit('compose-all')"
        @show="$emit('compose-show')"
      />
    </div>
    <div v-else class="fq-camps__ready">
      <section v-for="group in groups" :key="group.key" class="fq-camps__group">
        <h2 v-if="group.label" class="fq-camps__day">{{ group.label }}</h2>
        <ul class="fq-camps__list">
          <li v-for="campaign in group.items" :key="campaign.id">
            <NuxtLink :to="`/messages/${campaign.id}`" class="fq-camps__card fq-go">
              <span class="fq-camps__main">
                <span class="fq-camps__subject">{{ rowTitle(campaign) }}</span>
                <span class="fq-camps__show">{{ audienceLine(campaign) }}</span>
                <span v-if="audienceTitle(campaign)" class="fq-camps__night">{{ audienceTitle(campaign) }}</span>
                <span class="fq-camps__reach">{{ metaLine(campaign) }}</span>
              </span>
              <span class="fq-camps__aside">
                <span class="fq-camps__date">{{ formatCampaignWhen(campaign) }}</span>
                <span class="fq-camps__status" :class="statusClass(campaign.status)">
                  <component
                    :is="statusIcon(campaign.status)"
                    :size="13"
                    :stroke-width="2.1"
                    aria-hidden="true"
                  />
                  {{ formatStatusLabel(campaign.status) }}
                </span>
                <span v-if="showProgress(campaign)" class="fq-camps__progress">
                  {{ campaign.sentCount }} / {{ campaign.recipientCount }} sent
                </span>
              </span>
              <span class="fq-camps__chevron fq-arrow" aria-hidden="true">
                <component :is="icons.chevronRight" :size="18" :stroke-width="1.75" />
              </span>
            </NuxtLink>
          </li>
        </ul>
      </section>
    </div>
    <div v-if="hasMore" class="fq-camps__more">
      <button type="button" class="fq-camps__ghost" :disabled="loadingMore" @click="$emit('more')">
        {{ loadingMore ? 'Loading…' : 'Load more' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import MessagesAudienceActions from '~/components/messages/MessagesAudienceActions.vue'
import { faneqoIcons } from '~/utils/messages/faneqoIcons'
import {
  groupSentByDay,
  sentAudienceLine,
  sentAudienceTitle,
  sentEmptyCopy,
  sentErrorCopy,
  sentMetaLine,
  sentRowTitle,
  sentStatusKind,
} from '~/utils/messages/sentPresentation'

const props = defineProps({
  campaigns: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  loadingMore: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  hasMore: { type: Boolean, default: false },
  formatStatusLabel: { type: Function, required: true },
  formatCampaignWhen: { type: Function, required: true },
})

const rowTitle = sentRowTitle
const audienceLine = sentAudienceLine
const audienceTitle = sentAudienceTitle
const metaLine = sentMetaLine
const emptyCopy = sentEmptyCopy()
const errorCopy = sentErrorCopy()
const groups = computed(() => groupSentByDay(props.campaigns))

defineEmits(['retry', 'more', 'compose-all', 'compose-show'])

const icons = faneqoIcons

function showProgress(campaign) {
  if (campaign?.status !== 'sending') return false
  const total = Number(campaign.recipientCount)
  const sent = Number(campaign.sentCount)
  return Number.isFinite(total) && total > 0 && Number.isFinite(sent)
}

function statusClass(status) {
  return `is-${sentStatusKind(status)}`
}

function statusIcon(status) {
  const kind = sentStatusKind(status)
  if (kind === 'ok') return icons.circleCheck
  if (kind === 'live') return icons.loader
  if (kind === 'queued') return icons.clock
  if (kind === 'partial') return icons.alert
  if (kind === 'fail') return icons.circleAlert
  return icons.clock
}
</script>

<style scoped>
.fq-camps {
  flex: 1;
  height: 100%;
  min-height: 0;
  overflow: auto;
}

.fq-camps__skel,
.fq-camps__empty {
  min-height: 100%;
}

.fq-camps__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.4rem 1.25rem 2rem;
  text-align: center;
  color: var(--fq-text-secondary, rgba(255, 255, 255, 0.55));
}

.fq-camps__empty h2 {
  margin: 0;
  color: var(--fq-text-primary, #F5F5F6);
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.fq-camps__empty p {
  margin: 0.55rem auto 0;
  max-width: 26rem;
  font-size: 0.875rem;
  line-height: 1.5;
}

.fq-camps__actions {
  width: min(22rem, 100%);
  margin: 1.15rem auto 0;
}

.fq-camps__ready {
  max-width: 46rem;
  margin: 0;
  padding: 0.15rem 0 1.25rem;
}

.fq-camps__day {
  margin: 0;
  padding: 0.95rem 0.85rem 0.35rem;
  color: var(--fq-text-muted, rgba(255, 255, 255, 0.38));
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.fq-camps__list {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.fq-camps__list > li + li {
  border-top: 1px solid var(--fq-border, rgba(255, 255, 255, 0.07));
}

.fq-camps__card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 1.125rem;
  align-items: start;
  gap: 0.35rem 1rem;
  padding: 0.85rem 0.85rem;
  border-radius: 0;
  border: 0;
  background: transparent;
  text-decoration: none;
  color: inherit;
  min-height: 44px;
  transition: background 0.16s ease;
}

.fq-camps__card:hover {
  background: var(--fq-surface-hover, #14161B);
}

.fq-camps__card:focus-visible {
  outline: 2px solid var(--fq-accent-focus, #39D5FF);
  outline-offset: 2px;
}

.fq-camps__main {
  display: flex;
  flex-direction: column;
  gap: 0.16rem;
  min-width: 0;
}

.fq-camps__subject {
  color: var(--fq-text-primary, #F5F5F6);
  font-size: 0.98rem;
  font-weight: 650;
  letter-spacing: -0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fq-camps__show {
  color: var(--fq-text-secondary, rgba(255, 255, 255, 0.58));
  font-size: 0.8125rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fq-camps__night {
  color: var(--fq-text-secondary, rgba(255, 255, 255, 0.5));
  font-size: 0.78rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fq-camps__reach {
  color: var(--fq-text-muted, rgba(255, 255, 255, 0.38));
  font-size: 0.75rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fq-camps__aside {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.18rem;
  flex-shrink: 0;
  padding-top: 0.12rem;
}

.fq-camps__progress {
  color: var(--fq-text-muted, rgba(255, 255, 255, 0.4));
  font-size: 0.75rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.fq-camps__date {
  color: var(--fq-text-muted, rgba(255, 255, 255, 0.38));
  font-size: 0.75rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.fq-camps__card .fq-camps__chevron {
  color: rgba(255, 255, 255, 0.26);
  opacity: 1;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  align-self: center;
  transition: color 155ms ease;
}

.fq-camps__card:hover .fq-camps__chevron,
.fq-camps__card:focus-visible .fq-camps__chevron {
  color: var(--fq-text-primary, #F5F5F6);
}

.fq-camps__status {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  flex-shrink: 0;
  padding: 0;
  border-radius: 0;
  font-size: 0.75rem;
  font-weight: 500;
}

.fq-camps__status.is-ok {
  background: transparent;
  color: var(--fq-text-secondary, rgba(255, 255, 255, 0.58));
}

.fq-camps__status.is-ok :deep(svg) {
  color: var(--fq-state-success, #45E3AE);
}

.fq-camps__status.is-live,
.fq-camps__status.is-partial,
.fq-camps__status.is-fail {
  font-weight: 700;
}

.fq-camps__status.is-live {
  background: transparent;
  color: var(--fq-state-progress, #23C7C3);
}

.fq-camps__status.is-live :deep(svg) {
  animation: fq-camps-spin 0.9s linear infinite;
}

@keyframes fq-camps-spin {
  to { transform: rotate(360deg); }
}

.fq-camps__status.is-queued,
.fq-camps__status.is-muted {
  background: transparent;
  color: var(--fq-text-secondary, rgba(255, 255, 255, 0.58));
}

.fq-camps__status.is-partial {
  background: transparent;
  color: #fcd34d;
}

.fq-camps__status.is-fail {
  background: transparent;
  color: var(--fq-state-error, #fca5a5);
}

.fq-camps__ghost {
  min-height: 44px;
  padding: 0.65rem 1.1rem;
  border-radius: 0.8rem;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
}

.fq-camps__ghost:hover:not(:disabled) {
  border-color: var(--fq-border-strong, rgba(255, 255, 255, 0.11));
  background: rgba(255, 255, 255, 0.04);
  color: var(--fq-text-primary, #F5F5F6);
}

.fq-camps__more {
  display: flex;
  justify-content: center;
  margin: 1rem 0 0;
}

.fq-camps__skel {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin: 0;
  padding: 0.35rem 0 1rem;
}

.fq-camps__skel-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem 1.05rem;
}

.fq-camps__skel-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.fq-camps__skel-line,
.fq-camps__skel-side {
  display: block;
  height: 0.55rem;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.06);
}

.fq-camps__skel-line--w {
  width: 58%;
}

.fq-camps__skel-side {
  width: 4.5rem;
  flex-shrink: 0;
}

@media (max-width: 719px) {
  .fq-camps__card {
    grid-template-columns: minmax(0, 1fr) 1.125rem;
    grid-template-areas:
      "main chevron"
      "aside aside";
    gap: 0.35rem 0.75rem;
  }

  .fq-camps__main { grid-area: main; }
  .fq-camps__chevron { grid-area: chevron; align-self: start; margin-top: 0.2rem; }

  .fq-camps__aside {
    grid-area: aside;
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.2rem 0.55rem;
    padding-top: 0;
  }

  .fq-camps__subject,
  .fq-camps__show,
  .fq-camps__night,
  .fq-camps__reach {
    white-space: normal;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fq-camps__card,
  .fq-camps__chevron {
    transition: none;
  }
  .fq-camps__status.is-live :deep(svg) {
    animation: none;
  }
}
</style>
