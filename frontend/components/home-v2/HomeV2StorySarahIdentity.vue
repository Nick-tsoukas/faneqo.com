<template>
  <div class="v2-sarah" :class="variantClass">
    <div class="v2-sarah__avatar" aria-hidden="true">{{ fan.initials }}</div>
    <div class="v2-sarah__copy">
      <p class="v2-sarah__name">{{ fan.name }}</p>
      <p v-if="variant === 'show'" class="v2-sarah__meta">{{ fan.city }}</p>
      <p v-else class="v2-sarah__meta">
        {{ fan.city }} · {{ fan.showsLabel }}
        <span class="v2-sarah__joined">{{ fan.joinedLabel }}</span>
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  fan: { type: Object, required: true },
  variant: {
    type: String,
    default: 'show',
    validator: (v) => ['show', 'list'].includes(v),
  },
})

const variantClass = computed(() =>
  props.variant === 'list' ? 'v2-sarah--list' : 'v2-sarah--show'
)
</script>

<style scoped>
.v2-sarah {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  pointer-events: none;
}

.v2-sarah--show {
  flex-direction: row;
  gap: 0.7rem;
  text-align: left;
  width: 100%;
}

.v2-sarah--list {
  width: 100%;
  text-align: left;
}

.v2-sarah__avatar {
  position: relative;
  display: flex;
  height: 2.75rem;
  width: 2.75rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid rgba(57, 213, 255, 0.42);
  background: rgba(57, 213, 255, 0.1);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #39d5ff;
}

.v2-sarah--show .v2-sarah__avatar {
  height: 4.1rem;
  width: 4.1rem;
  border-width: 1.5px;
  font-size: 0.95rem;
}

.v2-sarah--show .v2-sarah__name {
  font-size: 1.28rem;
}

.v2-sarah__name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #f5f5f6;
}

.v2-sarah__meta {
  margin: 0.15rem 0 0;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.42);
}

.v2-sarah--show .v2-sarah__meta {
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.v2-sarah__joined {
  display: block;
  margin-top: 0.12rem;
  color: #45d6a7;
}
</style>
