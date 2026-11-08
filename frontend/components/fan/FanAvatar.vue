<template>
  <span class="fan-avatar" :style="{ '--fan-avatar-size': `${size}px` }">
    <img
      v-if="resolvedUrl && !broken"
      class="fan-avatar__img"
      :src="resolvedUrl"
      alt=""
      @error="broken = true"
    />
    <span v-else-if="initials" class="fan-avatar__initials" aria-hidden="true">{{ initials }}</span>
    <component
      v-else
      :is="icons.user"
      :size="Math.round(size * 0.42)"
      :stroke-width="1.6"
      aria-hidden="true"
    />
  </span>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { resolveFanAvatarUrl } from '~/utils/fan/fanProfileIdentity'
import { faneqoIcons } from '~/utils/messages/faneqoIcons'

/**
 * Presentational fan avatar. Interaction (pick / change / remove) lives in
 * FanAvatarControl so this can stay a quiet mark on /fan and in the editor.
 */
const props = defineProps({
  avatarUrl: { type: String, default: null },
  initials: { type: String, default: '' },
  size: { type: Number, default: 40 },
})

const config = useRuntimeConfig()
const icons = faneqoIcons
const broken = ref(false)

const resolvedUrl = computed(() => (
  resolveFanAvatarUrl(props.avatarUrl, config.public.strapiUrl)
))

watch(() => props.avatarUrl, () => {
  broken.value = false
})
</script>

<style scoped>
.fan-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: var(--fan-avatar-size, 40px);
  height: var(--fan-avatar-size, 40px);
  border-radius: 50%;
  overflow: hidden;
  /* Fan/echo cyan → emerald. Not the inbox signal green. */
  background: linear-gradient(145deg, rgba(57, 213, 255, 0.2), rgba(69, 227, 174, 0.16));
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.09);
  color: rgba(216, 251, 239, 0.75);
}

.fan-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.fan-avatar__initials {
  font-size: calc(var(--fan-avatar-size, 40px) * 0.36);
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1;
  color: #d8fbef;
}
</style>
