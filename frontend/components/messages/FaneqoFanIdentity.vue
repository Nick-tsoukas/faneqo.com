<template>
  <div class="fq-id" :class="[`is-${size}`]">
    <img
      v-if="resolvedAvatar && !broken"
      :src="resolvedAvatar"
      alt=""
      class="fq-id__avatar"
      @error="broken = true"
    />
    <span
      v-else
      class="fq-id__avatar"
      :class="fallbackName ? 'is-mark' : 'is-init'"
      aria-hidden="true"
    >{{ fallbackName ? '' : shownInitials }}</span>
    <div class="fq-id__text">
      <p class="fq-id__name">{{ name }}</p>
      <p v-if="context" class="fq-id__context">{{ context }}</p>
    </div>
    <div v-if="$slots.trailing" class="fq-id__trailing">
      <slot name="trailing" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { resolveFanAvatarUrl } from '~/utils/fan/fanProfileIdentity'
import { fanInitials, isFallbackFanDisplay } from '~/utils/messages/fanIdentity'

const props = defineProps({
  name: { type: String, default: 'Faneqo fan' },
  context: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  initials: { type: String, default: '' },
  size: { type: String, default: 'md' },
})

const config = useRuntimeConfig()
const broken = ref(false)
const resolvedAvatar = computed(() =>
  resolveFanAvatarUrl(props.avatarUrl, config.public.strapiUrl)
)
const shownInitials = computed(() => props.initials || fanInitials(props.name) || 'F')
const fallbackName = computed(() => isFallbackFanDisplay(props.name))

watch(() => props.avatarUrl, () => {
  broken.value = false
})
</script>

<style scoped>
.fq-id {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
}

.fq-id__avatar {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  object-fit: cover;
  flex-shrink: 0;
}

.fq-id__avatar.is-init,
.fq-id__avatar.is-mark {
  display: grid;
  place-items: center;
  background: #14161B;
  color: rgba(255, 255, 255, 0.78);
  border: 1px solid var(--fq-border, rgba(255, 255, 255, 0.07));
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.fq-id__avatar.is-mark {
  background:
    radial-gradient(circle at 50% 42%, rgba(255, 255, 255, 0.16), transparent 42%),
    #121318;
}

.fq-id.is-sm .fq-id__avatar {
  width: 36px;
  height: 36px;
}

.fq-id__text {
  min-width: 0;
  flex: 1;
}

.fq-id__name {
  margin: 0;
  color: #fff;
  font-size: 0.94rem;
  font-weight: 650;
  letter-spacing: -0.015em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fq-id__context {
  margin: 0.12rem 0 0;
  color: var(--fq-text-muted, rgba(255, 255, 255, 0.42));
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fq-id__trailing {
  margin-left: auto;
  flex-shrink: 0;
}
</style>
