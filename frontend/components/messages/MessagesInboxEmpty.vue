<template>
  <Motion class="msg-empty" role="status" v-bind="enter">
    <aside class="msg-empty__rail">
      <p class="msg-empty__rail-copy">No conversations yet</p>
    </aside>
    <div class="msg-empty__main">
      <h2>No conversations yet</h2>
      <p>Replies from fans and private conversations will appear here.</p>
      <button type="button" class="msg-empty__private" @click="$emit('private')">
        Start a private conversation
      </button>
    </div>
  </Motion>
</template>

<script setup>
import { computed } from 'vue'
import { Motion } from 'motion-v'
import { usePreferredReducedMotion } from '@vueuse/core'
import { motionTokens } from '~/utils/ui/motionTokens'

defineEmits(['private'])

const reduced = computed(() => usePreferredReducedMotion().value === 'reduce')
const enter = computed(() => {
  if (reduced.value) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: motionTokens.micro,
    }
  }
  return {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: motionTokens.standard,
  }
})
</script>

<style scoped>
.msg-empty {
  display: grid;
  grid-template-columns: minmax(17.5rem, 21.25rem) minmax(0, 1fr);
  flex: 1;
  height: 100%;
  min-height: 0;
  width: 100%;
}

.msg-empty__rail {
  display: flex;
  align-items: flex-start;
  background: var(--fq-surface, #0B0C10);
  border-right: 1px solid var(--fq-border, rgba(255, 255, 255, 0.07));
  padding: 1.1rem 1rem;
}

.msg-empty__rail-copy {
  margin: 0;
  color: var(--fq-text-muted, rgba(255, 255, 255, 0.38));
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1.4;
}

.msg-empty__main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  text-align: center;
  max-width: var(--fq-msg-canvas, 52rem);
  width: 100%;
  margin: 0 auto;
  padding: 14vh 1.25rem 2rem;
}

.msg-empty__main h2 {
  margin: 0;
  color: var(--fq-text-primary, #F5F5F6);
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.msg-empty__main p {
  margin: 0.45rem 0 0;
  max-width: 22rem;
  color: var(--fq-text-secondary, rgba(255, 255, 255, 0.58));
  font-size: 0.875rem;
  line-height: 1.5;
}

.msg-empty__private {
  margin-top: 1.1rem;
  min-height: 44px;
  padding: 0.35rem 0.5rem;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.9rem;
  font-weight: 650;
  cursor: pointer;
}

.msg-empty__private:hover,
.msg-empty__private:focus-visible {
  color: #fff;
}

.msg-empty__private:focus-visible {
  outline: 2px solid var(--fq-accent-focus, #39D5FF);
  outline-offset: 3px;
  border-radius: 0.4rem;
}

@media (max-width: 899px) {
  .msg-empty {
    grid-template-columns: 1fr;
  }

  .msg-empty__rail {
    display: none;
  }

  .msg-empty__main {
    padding-top: 2.5rem;
  }
}
</style>
