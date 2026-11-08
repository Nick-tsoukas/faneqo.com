<template>
  <div v-if="path" class="share-tonight" :class="`share-tonight--${variant}`">
    <!-- Action-row variant: a media action on a dark raised surface, not a form button. -->
    <NuxtLink v-if="variant === 'row'" :to="path" class="share-row">
      <span class="share-row__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
          <rect x="3" y="5" width="18" height="14" rx="2.5" stroke-linejoin="round" />
          <circle cx="8.75" cy="10" r="1.6" />
          <path d="M3.6 17.2l4.6-4.2a2 2 0 0 1 2.7 0l3.1 2.9 2-1.8a2 2 0 0 1 2.7 0l1.8 1.6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
      <span class="share-row__text">
        <span class="share-row__title">Share photos from tonight</span>
        <span v-if="hint" class="share-row__hint">{{ hint }}</span>
      </span>
      <span class="share-row__chevron" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
    </NuxtLink>

    <template v-else>
      <NuxtLink :to="path" class="share-tonight__btn">
        Share photos from tonight
      </NuxtLink>
      <p v-if="hint" class="share-tonight__hint">{{ hint }}</p>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { buildSharePhotosPath } from '~/utils/updates/sharePhotosFromRecap'

const props = defineProps({
  recap: { type: Object, default: null },
  from: { type: String, default: '' },
  hint: { type: String, default: 'Turn tonight into something fans can come back to.' },
  /** 'solid' keeps the original standalone button. 'row' is the dashboard action row. */
  variant: { type: String, default: 'solid' },
})

const path = computed(() => buildSharePhotosPath(props.recap, { from: props.from }))
</script>

<style scoped>
.share-tonight {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.share-tonight__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0.7rem 1rem;
  background: #f7f9fc;
  color: #050608;
  font-size: 0.92rem;
  font-weight: 750;
  letter-spacing: -0.02em;
  text-decoration: none;
  text-align: center;
}
.share-tonight__hint {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.45;
  color: rgba(247, 249, 252, 0.5);
}

/* Row variant */
.share-tonight--row {
  gap: 0;
}

.share-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 62px;
  padding: 12px 14px;
  border-radius: 13px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  background: linear-gradient(180deg, #14161c 0%, #0e1015 100%);
  text-decoration: none;
  overflow: hidden;
  transition: border-color 0.21s ease, background 0.21s ease, transform 0.21s ease;
}

/* Restrained brand wash, only on hover. */
.share-row::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  opacity: 0;
  background: radial-gradient(120% 160% at 6% 50%, rgba(145, 0, 255, 0.16) 0%, rgba(255, 0, 255, 0.06) 42%, transparent 72%);
  transition: opacity 0.21s ease;
}

.share-row:hover,
.share-row:focus-visible {
  border-color: rgba(255, 255, 255, 0.18);
  transform: translateY(-1px);
}

.share-row:hover::after,
.share-row:focus-visible::after {
  opacity: 1;
}

.share-row:focus-visible {
  outline: 2px solid rgba(57, 255, 20, 0.55);
  outline-offset: 2px;
}

.share-row__icon {
  position: relative;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f5f5f6;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(140deg, rgba(145, 0, 255, 0.26) 0%, rgba(255, 0, 255, 0.14) 100%);
}

.share-row__icon svg {
  width: 20px;
  height: 20px;
}

.share-row__text {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.share-row__title {
  font-size: 14.5px;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: #f5f5f6;
}

.share-row__hint {
  font-size: 12px;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.5);
}

.share-row__chevron {
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.34);
  transition: color 0.21s ease, transform 0.21s ease;
}

.share-row__chevron svg {
  width: 17px;
  height: 17px;
}

.share-row:hover .share-row__chevron {
  color: rgba(255, 255, 255, 0.7);
  transform: translateX(2px);
}

@media (max-width: 420px) {
  .share-row {
    gap: 10px;
    padding: 11px 12px;
  }

  .share-row__icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
  }

  .share-row__title {
    font-size: 14px;
  }

  .share-row__hint {
    font-size: 11.5px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .share-row,
  .share-row__chevron {
    transition: none;
  }
  .share-row:hover,
  .share-row:focus-visible {
    transform: none;
  }
  .share-row:hover .share-row__chevron {
    transform: none;
  }
}
</style>
