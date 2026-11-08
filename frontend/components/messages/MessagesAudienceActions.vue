<template>
  <div class="msg-audience" role="group" aria-label="Message your fans">
    <button type="button" class="msg-audience__btn msg-audience__btn--primary" @click="$emit('all-fans')">
      Message all fans
    </button>
    <button type="button" class="msg-audience__btn msg-audience__btn--show" @click="$emit('show')">
      Message a show
    </button>
  </div>
</template>

<script setup>
defineEmits(['all-fans', 'show'])
</script>

<style scoped>
.msg-audience {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.msg-audience__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0.55rem 0.7rem;
  border-radius: 0.75rem;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: -0.015em;
  cursor: pointer;
  text-align: center;
}

@media (min-width: 900px) {
  .msg-audience {
    width: min(100%, 28rem);
    gap: 0.65rem;
  }

  .msg-audience__btn {
    min-height: 48px;
    padding: 0.7rem 1rem;
    border-radius: 0.9rem;
    font-size: 0.94rem;
  }
}

.msg-audience__btn--primary {
  border: 0;
  color: #0A0B0E;
  background: #F5F5F6;
}

.msg-audience__btn--show {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: var(--fq-text-primary, #F5F5F6);
  transition: border-color 0.16s ease, background 0.16s ease;
}

.msg-audience__btn--show:hover {
  border-color: rgba(255, 255, 255, 0.2);
  background: var(--fq-surface-hover, #14161B);
}

.msg-audience__btn--primary:hover {
  background: #fff;
}

.msg-audience__btn:focus-visible {
  outline: 2px solid var(--fq-accent-focus, #39D5FF);
  outline-offset: 2px;
}

.msg-audience__btn:active {
  transform: scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .msg-audience__btn:active {
    transform: none;
  }
}
</style>
