<template>
  <Teleport to="body">
    <div v-if="open" class="fq-gcon" @click.self="cancel">
      <div
        ref="panel"
        class="fq-gcon__panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="headingId"
        :aria-describedby="body ? bodyId : undefined"
        @keydown="onKeydown"
      >
        <h2 :id="headingId" class="fq-gcon__title">{{ heading }}</h2>
        <p v-if="body" :id="bodyId" class="fq-gcon__body">{{ body }}</p>
        <div class="fq-gcon__actions">
          <button type="button" class="fq-gcon__cancel" :disabled="busy" @click="cancel">
            {{ cancelLabel }}
          </button>
          <button
            ref="confirmBtn"
            type="button"
            class="fq-gcon__confirm"
            :class="{ 'is-danger': danger }"
            :disabled="busy"
            @click="emit('confirm')"
          >
            {{ busy ? busyLabel : confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { onKeyStroke } from '@vueuse/core'
import { lockOverlayScroll, unlockOverlayScroll } from '~/utils/ui/overlayScrollLock'

const props = defineProps({
  open: { type: Boolean, default: false },
  heading: { type: String, required: true },
  body: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirm' },
  cancelLabel: { type: String, default: 'Cancel' },
  busyLabel: { type: String, default: 'Working…' },
  busy: { type: Boolean, default: false },
  danger: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'cancel'])
const uid = useId()
const headingId = `fq-gcon-title-${uid}`
const bodyId = `fq-gcon-body-${uid}`
const confirmBtn = ref(null)
const panel = ref(null)
const lockId = `fq-gcon-${uid}`
let restoreFocusTo = null

function cancel() {
  /* Never close during irreversible work. */
  if (props.busy) return
  emit('cancel')
}

onKeyStroke('Escape', () => {
  if (props.open) cancel()
})

/* Focus stays inside the decision until the decision is made. */
function onKeydown(evt) {
  if (evt.key !== 'Tab' || !panel.value) return
  const focusable = [...panel.value.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    .filter((el) => !el.disabled && el.getAttribute('aria-hidden') !== 'true')
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (evt.shiftKey && document.activeElement === first) {
    evt.preventDefault()
    last.focus()
  } else if (!evt.shiftKey && document.activeElement === last) {
    evt.preventDefault()
    first.focus()
  }
}

function release() {
  unlockOverlayScroll(lockId)
  const target = restoreFocusTo
  restoreFocusTo = null
  if (target?.isConnected) target.focus?.()
}

watch(() => props.open, async (isOpen) => {
  if (!isOpen) {
    release()
    return
  }
  restoreFocusTo = typeof document !== 'undefined' ? document.activeElement : null
  lockOverlayScroll(lockId)
  await nextTick()
  confirmBtn.value?.focus?.()
})

onBeforeUnmount(() => {
  unlockOverlayScroll(lockId)
})
</script>

<style scoped>
.fq-gcon {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 1.1rem;
  background: rgba(4, 5, 6, 0.78);
  backdrop-filter: blur(3px);
}
.fq-gcon__panel {
  width: min(100%, 26rem);
  padding: 1.35rem 1.3rem 1.15rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.9rem;
  background: #111318;
  box-shadow: 0 24px 56px rgba(0, 0, 0, 0.5);
  color: #f5f5f6;
}
.fq-gcon__title {
  margin: 0;
  font-size: 1.18rem;
  font-weight: 640;
  letter-spacing: -0.025em;
  line-height: 1.25;
}
.fq-gcon__body {
  margin: 0.6rem 0 0;
  color: rgba(245, 245, 246, 0.62);
  font-size: 0.9rem;
  line-height: 1.5;
}
.fq-gcon__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.3rem;
}
.fq-gcon__cancel,
.fq-gcon__confirm {
  min-height: 44px;
  padding: 0 1rem;
  border: 0;
  border-radius: 0.55rem;
  font-size: 0.87rem;
  font-weight: 620;
  cursor: pointer;
}
.fq-gcon__cancel {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: rgba(245, 245, 246, 0.78);
}
.fq-gcon__cancel:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.05);
}
.fq-gcon__confirm {
  background: #f5f5f6;
  color: #08090a;
}
.fq-gcon__confirm:hover:not(:disabled) {
  background: #ffffff;
}
.fq-gcon__confirm.is-danger {
  background: #e5484d;
  color: #ffffff;
}
.fq-gcon__confirm.is-danger:hover:not(:disabled) {
  background: #f2555a;
}
.fq-gcon__cancel:disabled,
.fq-gcon__confirm:disabled {
  opacity: 0.5;
  cursor: default;
}
.fq-gcon__cancel:focus-visible,
.fq-gcon__confirm:focus-visible {
  outline: 2px solid #f5f5f6;
  outline-offset: 2px;
}
</style>
