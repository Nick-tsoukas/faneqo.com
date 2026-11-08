<template>
  <!--
    Retired from Messages home. Tab-scoped New Message / Email Fans
    replaced this chooser so Floating UI is not used for the primary CTA.
    Keep for reference; emoji/actions still use useFaneqoFloating.
  -->
  <div class="fq-new">
    <button
      ref="triggerRef"
      type="button"
      class="fq-new__btn"
      aria-haspopup="menu"
      :aria-expanded="open"
      aria-label="New"
      @click="toggle"
    >
      <component :is="icons.plus" :size="18" :stroke-width="2.2" aria-hidden="true" />
      <span>New</span>
    </button>

    <ClientOnly>
      <Motion
        v-if="open"
        :style="floatingStyles"
        v-bind="popoverMotion(reduced)"
        class="fq-new__pop"
        role="menu"
        aria-label="New communication"
      >
        <div ref="floatingRef" class="fq-new__menu">
          <button type="button" role="menuitem" class="fq-new__item" @click="pick('dm')">
            <span class="fq-new__icon" aria-hidden="true">
              <component :is="icons.message" :size="18" :stroke-width="1.75" />
            </span>
            <span>
              <strong>Direct Message</strong>
              <em>Talk privately with one Faneqo fan</em>
            </span>
          </button>
          <button type="button" role="menuitem" class="fq-new__item" @click="pick('email')">
            <span class="fq-new__icon" aria-hidden="true">
              <component :is="icons.mail" :size="18" :stroke-width="1.75" />
            </span>
            <span>
              <strong>Email Fans</strong>
              <em>Send an update to your fan list</em>
            </span>
          </button>
        </div>
      </Motion>
    </ClientOnly>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { Motion } from 'motion-v'
import { usePreferredReducedMotion } from '@vueuse/core'
import { useFaneqoFloating } from '~/composables/useFaneqoFloating'
import { faneqoIcons } from '~/utils/messages/faneqoIcons'
import { popoverMotion } from '~/utils/ui/motionTokens'

const emit = defineEmits(['direct-message', 'email-fans'])

const icons = faneqoIcons
const reduced = computed(() => usePreferredReducedMotion().value === 'reduce')
const triggerRef = ref(null)

const { open, floatingRef, floatingStyles, setOpen, referenceRef } = useFaneqoFloating({
  placement: 'bottom-end',
  offset: 8,
})

watch(triggerRef, (el) => {
  referenceRef.value = el
}, { immediate: true })

watch(open, async (isOpen) => {
  if (!isOpen) return
  await nextTick()
  floatingRef.value?.querySelector('[role="menuitem"]')?.focus()
})

function toggle() {
  setOpen(!open.value)
}

function pick(kind) {
  setOpen(false)
  if (kind === 'dm') emit('direct-message')
  else emit('email-fans')
}

defineExpose({ close: () => setOpen(false) })
</script>

<style scoped>
.fq-new {
  position: relative;
}

.fq-new__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 44px;
  padding: 0.55rem 0.95rem;
  border: 0;
  border-radius: 0.9rem;
  color: var(--fq-ink-on-accent, #04140F);
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  background: var(--fq-accent-gradient, linear-gradient(90deg, #4CA6FF 0%, #39D5FF 50%, #45E3AE 100%));
}

.fq-new__btn:focus-visible {
  outline: 2px solid var(--fq-accent-focus, #39D5FF);
  outline-offset: 2px;
}

.fq-new__pop {
  z-index: 70;
}

.fq-new__menu {
  min-width: 17.5rem;
  padding: 0.4rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #121214;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
}

.fq-new__item {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  width: 100%;
  text-align: left;
  padding: 0.7rem 0.65rem;
  border: 0;
  border-radius: 0.75rem;
  background: transparent;
  color: #fff;
  cursor: pointer;
}

.fq-new__item:hover,
.fq-new__item:focus-visible {
  background: rgba(255, 255, 255, 0.06);
  outline: none;
}

.fq-new__icon {
  display: grid;
  place-items: center;
  width: 2.15rem;
  height: 2.15rem;
  border-radius: 0.7rem;
  background: var(--fq-accent-cyan-soft, rgba(57, 213, 255, 0.14));
  color: var(--fq-accent-cyan, #39D5FF);
  flex-shrink: 0;
}

.fq-new__item strong {
  display: block;
  font-size: 0.9rem;
  font-weight: 700;
}

.fq-new__item em {
  display: block;
  margin-top: 0.12rem;
  font-style: normal;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.48);
}
</style>
