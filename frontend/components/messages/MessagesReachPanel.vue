<template>
  <div class="msg-reach">
    <p class="msg-reach__kicker">Your conversations</p>
    <h2>{{ heading }}</h2>
    <p class="msg-reach__lede">{{ lede }}</p>
    <button type="button" class="msg-reach__private" @click="$emit('private')">
      Start a conversation
      <span aria-hidden="true">→</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  heading: { type: String, default: 'Choose a conversation' },
  lede: { type: String, default: 'Choose a fan from the Inbox, or start a private conversation.' },
})

defineEmits(['private'])
</script>

<style scoped>
.msg-reach {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 22rem;
  margin: 0 auto;
  padding: 0.25rem 0.25rem 0.5rem;
}

.msg-reach__kicker {
  margin: 0;
  color: var(--fq-text-muted, rgba(255, 255, 255, 0.42));
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.msg-reach h2 {
  margin: 0.35rem 0 0;
  color: var(--fq-text-primary, #F5F5F6);
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.msg-reach__lede {
  margin: 0.4rem 0 0;
  color: var(--fq-text-secondary, rgba(255, 255, 255, 0.58));
  font-size: 0.875rem;
  line-height: 1.5;
}

.msg-reach__private {
  margin-top: 1.05rem;
  min-height: 44px;
  padding: 0.35rem 0.5rem;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.9rem;
  font-weight: 650;
  cursor: pointer;
}

.msg-reach__private:hover,
.msg-reach__private:focus-visible {
  color: #fff;
}

.msg-reach__private:focus-visible {
  outline: 2px solid var(--fq-accent-focus, #39D5FF);
  outline-offset: 3px;
  border-radius: 0.4rem;
}
</style>
