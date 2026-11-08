<template>
  <article class="v2-talk" data-rel="talk">
    <div class="v2-talk__object" aria-hidden="true">
      <p class="v2-talk__kicker">{{ demo.talk.kicker }}</p>
      <HomeV2StorySarahIdentity :fan="demo.fan" variant="list" />
      <div class="v2-rel-request">
        <blockquote>{{ demo.talk.quote }}</blockquote>
        <div class="v2-rel-request__acts">
          <span class="is-accept">{{ demo.talk.accept }}</span>
          <span>{{ demo.talk.decline }}</span>
        </div>
      </div>
      <div class="v2-rel-chat">
        <p class="v2-rel-bubble is-artist">{{ demo.talk.artistReply }}</p>
        <p class="v2-rel-typing">Sarah is typing…</p>
        <p class="v2-rel-bubble is-fan v2-rel-sarah-reply">{{ demo.talk.sarahReply }}</p>
      </div>
    </div>
    <h2 class="v2-talk__title">
      {{ demo.copy.talk.title }}
      <span>{{ demo.copy.talk.rest }}</span>
    </h2>
  </article>
</template>

<script setup>
import HomeV2StorySarahIdentity from '@/components/home-v2/HomeV2StorySarahIdentity.vue'

defineProps({
  demo: { type: Object, required: true },
})
</script>

<style scoped>
.v2-talk {
  width: min(100%, 23rem);
  margin: 0;
  padding: 1.2rem 0 3.2rem;
}

.v2-talk__kicker {
  margin: 0 0 0.85rem;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(69, 214, 167, 0.7);
}

.v2-talk__object {
  min-height: 15.5rem;
}

.v2-talk__title {
  margin: 1.8rem 0 0;
  font-size: clamp(2.4rem, 9.2vw, 3.4rem);
  font-weight: 800;
  line-height: 0.9;
  letter-spacing: -0.055em;
}

.v2-talk__title span {
  display: block;
}

.v2-rel-chat {
  opacity: 0;
  visibility: hidden;
}

.v2-rel-request {
  overflow: hidden;
}

.v2-rel-request blockquote {
  margin: 0.85rem 0 1.1rem;
  font-size: 1.28rem;
  line-height: 1.32;
  letter-spacing: -0.03em;
}

.v2-rel-request__acts {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.v2-rel-request__acts span {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2.5rem;
  font-weight: 650;
  color: rgba(255, 255, 255, 0.38);
}

.v2-rel-request__acts .is-accept {
  min-width: 6.4rem;
  padding: 0 1rem;
  border-radius: 0.6rem;
  background: rgba(69, 214, 167, 0.14);
  color: #45d6a7;
}

.v2-rel-bubble {
  max-width: 88%;
  margin: 0.75rem 0 0.4rem;
  padding: 0.65rem 0.8rem;
  border-radius: 0.85rem;
  line-height: 1.38;
  background: #15161c;
}

.v2-rel-bubble.is-fan {
  margin-left: auto;
  background: rgba(69, 214, 167, 0.12);
}

.v2-rel-typing,
.v2-rel-sarah-reply {
  opacity: 0;
  visibility: hidden;
}

.v2-rel-typing {
  margin: 0.35rem 0 0;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.34);
}

@media (min-width: 1024px) {
  .v2-talk {
    padding: 1.2rem 0 3.2rem;
  }
}
</style>
