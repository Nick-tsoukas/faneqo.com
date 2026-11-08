<template>
  <article ref="root" class="fq-talk" aria-labelledby="fq-talk-title">
    <div class="fq-stage">
      <div class="fq-talk__story">
        <h2 id="fq-talk-title" class="fq-talk__title">
          <span>Keep the</span>
          <span>conversation</span>
          <em>going.</em>
        </h2>
        <p class="fq-talk__lede">
          The morning after, the artist can write to everyone who checked in. Each fan reads it, and can answer, in a private conversation.
        </p>
      </div>

      <!-- The message is the hero: the real composer, written to "People who were there" -->
      <div class="fq-talk__thread">
        <section class="fq-msg" aria-label="Message from Five Finger Death Punch">
          <header class="fq-msg__to">
            <img :src="'/images/deck-slide-02/ffdp-band-original.jpg'" alt="" width="1242" height="1233">
            <div>
              <p class="fq-msg__from">Five Finger Death Punch</p>
              <p class="fq-msg__audience">To <strong>People who were there</strong></p>
            </div>
          </header>

          <p class="fq-msg__text">
            <span>Thank you for last night. You were louder than the PA.</span> <span>The photos are up — go find yourself in the crowd.</span>
          </p>

          <div class="fq-msg__gallery">
            <div class="fq-msg__thumbs">
              <img :src="'/images/deck-flagship/ffdp-gallery/04.jpg'" alt="" width="800" height="1000">
              <img :src="'/images/deck-flagship/ffdp-gallery/06.jpg'" alt="" width="667" height="1000">
              <img :src="'/images/deck-flagship/ffdp-gallery/11.jpg'" alt="" width="714" height="1000">
            </div>
            <div>
              <p class="fq-msg__kicker">Gallery</p>
              <p class="fq-msg__gallery-title">Five Finger Death Punch</p>
              <p class="fq-msg__gallery-meta">15 photos</p>
            </div>
          </div>

          <footer class="fq-msg__foot">
            <p>Each fan receives this in their private conversation.</p>
          </footer>
        </section>

        <div class="fq-reply" aria-label="A fan replies">
          <span class="fq-reply__avatar" aria-hidden="true">SM</span>
          <div>
            <p class="fq-reply__name">Sarah M.</p>
            <p class="fq-reply__text">Third photo, front row, that’s me. Best night of my year.</p>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
import { ref } from 'vue'
import { useSceneMotion, revealLines, arrive } from './motion/useSceneMotion.js'
// Audience wording, delivery line and gallery attachment follow the real
// artist composer (utils/messages/composerPresentation.js). The message text
// and the fan reply are written for this example.

// A conversation, in the order it happens: the artist writes, the gallery
// arrives with the message, and after a beat one fan answers. Illustrative
// only: nothing is sent, and there is no live typing or presence state.
const root = ref(null)
useSceneMotion(root, (tl, { q }) => {
  revealLines(tl, q('.fq-talk__title span, .fq-talk__title em'), 0, { stagger: 0.12 })
  arrive(tl, q('.fq-talk__lede'), 0.7, { y: 12 })

  // A · the artist reaches out
  arrive(tl, q('.fq-msg'), 0.45, { y: 44, duration: 1.0, ease: 'expo.out' })
  arrive(tl, q('.fq-msg__to'), 0.9, { y: 10 })
  tl.from(q('.fq-msg__text span'), { autoAlpha: 0, duration: 0.9, ease: 'power1.out', stagger: 0.85 }, 1.25)

  // B · the gallery arrives with it
  arrive(tl, q('.fq-msg__gallery'), 3.2, { y: 18, duration: 0.7 })
  tl.from(q('.fq-msg__thumbs img'), { autoAlpha: 0, scale: 0.9, y: 10, duration: 0.6, ease: 'expo.out', stagger: 0.14, clearProps: 'transform' }, 3.35)
  arrive(tl, q('.fq-msg__gallery > div:last-child'), 3.6, { x: -10, y: 0 })
  arrive(tl, q('.fq-msg__foot'), 4.0, { y: 0, duration: 0.6 })

  // C · after a beat, one fan answers
  arrive(tl, q('.fq-reply__avatar, .fq-reply__name'), 5.0, { y: 8, stagger: 0.08, duration: 0.5 })
  tl.from(q('.fq-reply__text'), {
    autoAlpha: 0,
    y: 20,
    scale: 0.94,
    transformOrigin: '0% 0%',
    duration: 0.75,
    ease: 'expo.out',
    clearProps: 'transform',
  }, 5.45)
})
</script>

<style scoped>
.fq-talk {
  --u: calc(min(100cqw, 177.78cqh) / 1920);
  --paper: #ece8e1;
  --ink: #16141a;
  --muted: #67625b;
  --hair: rgba(22, 20, 26, 0.1);
  --serif: 'DM Serif Display', 'Iowan Old Style', Georgia, serif;
  box-sizing: border-box;
  container-type: size;
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--paper);
  color: var(--ink);
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.fq-talk *, .fq-talk *::before, .fq-talk *::after { box-sizing: border-box; }
:where(.fq-talk) :where(p, h2) { margin: 0; }
.fq-talk img { display: block; }

.fq-stage {
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(1920 * var(--u));
  height: calc(1080 * var(--u));
  transform: translate(-50%, -50%);
}

.fq-talk__story {
  position: absolute;
  left: calc(128 * var(--u));
  top: calc(262 * var(--u));
  width: calc(560 * var(--u));
}

.fq-talk__title {
  font-family: var(--serif);
  font-size: calc(100 * var(--u));
  font-weight: 400;
  letter-spacing: -0.024em;
  line-height: 0.98;
}

.fq-talk__title span,
.fq-talk__title em { display: block; }
.fq-talk__title em { font-style: italic; }

.fq-talk__lede {
  margin-top: calc(44 * var(--u));
  max-width: calc(440 * var(--u));
  color: var(--muted);
  font-size: calc(20 * var(--u));
  line-height: 1.62;
}

/* ---------- The thread ---------- */
.fq-talk__thread {
  position: absolute;
  left: calc(772 * var(--u));
  top: calc(150 * var(--u));
  width: calc(1020 * var(--u));
}

.fq-msg {
  padding: calc(44 * var(--u)) calc(52 * var(--u)) calc(36 * var(--u));
  border-radius: calc(30 * var(--u));
  background: #fbfaf7;
  box-shadow: inset 0 0 0 1px rgba(22, 20, 26, 0.06), 0 calc(30 * var(--u)) calc(70 * var(--u)) calc(-40 * var(--u)) rgba(42, 34, 24, 0.28);
}

.fq-msg__to {
  display: flex;
  align-items: center;
  gap: calc(16 * var(--u));
}

.fq-msg__to img {
  width: calc(52 * var(--u));
  height: calc(52 * var(--u));
  border-radius: 999px;
  object-fit: cover;
  object-position: 50% 12%;
}

.fq-msg__from {
  font-size: calc(18 * var(--u));
  font-weight: 700;
}

.fq-msg__audience {
  margin-top: calc(2 * var(--u));
  color: var(--muted);
  font-size: calc(15 * var(--u));
}

.fq-msg__audience strong { color: var(--ink); font-weight: 600; }

.fq-msg__text {
  margin-top: calc(34 * var(--u));
  font-size: calc(50 * var(--u));
  font-weight: 500;
  letter-spacing: -0.022em;
  line-height: 1.3;
  text-wrap: pretty;
}

.fq-msg__gallery {
  display: flex;
  align-items: center;
  gap: calc(22 * var(--u));
  margin-top: calc(34 * var(--u));
  padding: calc(14 * var(--u));
  border-radius: calc(20 * var(--u));
  background: #f1ede6;
}

.fq-msg__thumbs {
  display: flex;
  gap: calc(6 * var(--u));
}

.fq-msg__thumbs img {
  width: calc(96 * var(--u));
  height: calc(120 * var(--u));
  object-fit: cover;
  object-position: 50% 25%;
  border-radius: calc(10 * var(--u));
}

.fq-msg__kicker {
  color: var(--muted);
  font-size: calc(12 * var(--u));
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.fq-msg__gallery-title {
  margin-top: calc(6 * var(--u));
  font-size: calc(20 * var(--u));
  font-weight: 700;
}

.fq-msg__gallery-meta {
  margin-top: calc(2 * var(--u));
  color: var(--muted);
  font-size: calc(15 * var(--u));
}

.fq-msg__foot {
  margin-top: calc(28 * var(--u));
  padding-top: calc(20 * var(--u));
  border-top: 1px solid var(--hair);
  color: var(--muted);
  font-size: calc(15 * var(--u));
}

/* The fan answers, privately */
.fq-reply {
  display: flex;
  align-items: flex-start;
  gap: calc(14 * var(--u));
  width: calc(600 * var(--u));
  margin: calc(26 * var(--u)) 0 0 auto;
}

.fq-reply__avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: calc(44 * var(--u));
  height: calc(44 * var(--u));
  border-radius: 999px;
  background: linear-gradient(135deg, #ff6fc4, #8b6cff);
  color: #fff;
  font-size: calc(14 * var(--u));
  font-weight: 700;
}

.fq-reply__name {
  color: var(--muted);
  font-size: calc(13 * var(--u));
  font-weight: 600;
}

.fq-reply__text {
  margin-top: calc(6 * var(--u));
  padding: calc(16 * var(--u)) calc(22 * var(--u));
  border-radius: calc(6 * var(--u)) calc(22 * var(--u)) calc(22 * var(--u)) calc(22 * var(--u));
  background: var(--ink);
  color: #f4f1eb;
  font-size: calc(20 * var(--u));
  line-height: 1.4;
}

/* ---------- Phone ---------- */
@media (max-width: 900px), (max-aspect-ratio: 5/4) {
  .fq-talk { --u: 1px; overflow-x: hidden; overflow-y: auto; }

  .fq-stage {
    position: relative;
    left: auto;
    top: auto;
    width: 100%;
    max-width: 34rem;
    height: auto;
    margin-inline: auto;
    padding: calc(2.5rem + env(safe-area-inset-top, 0px)) 1.25rem calc(6.5rem + env(safe-area-inset-bottom, 0px));
    transform: none;
  }

  .fq-talk__story,
  .fq-talk__thread { position: relative; left: auto; top: auto; width: auto; }

  .fq-talk__title { font-size: clamp(3rem, 14vw, 4.2rem); }
  .fq-talk__lede { margin-top: 1.25rem; font-size: 1.0625rem; }

  .fq-talk__thread { margin-top: 2.25rem; }
  .fq-msg { padding: 1.4rem 1.25rem 1.2rem; border-radius: 1.4rem; }
  .fq-msg__to img { width: 2.6rem; height: 2.6rem; }
  .fq-msg__from { font-size: 0.95rem; }
  .fq-msg__audience { font-size: 0.8125rem; }
  .fq-msg__text { margin-top: 1.1rem; font-size: 1.3rem; }
  .fq-msg__gallery { gap: 0.8rem; margin-top: 1.1rem; padding: 0.6rem; border-radius: 1rem; }
  .fq-msg__thumbs img { width: 3rem; height: 3.75rem; border-radius: 0.5rem; }
  .fq-msg__thumbs img:nth-child(3) { display: none; }
  .fq-msg__kicker { font-size: 0.625rem; }
  .fq-msg__gallery-title { font-size: 0.95rem; }
  .fq-msg__gallery-meta { font-size: 0.8125rem; }
  .fq-msg__foot { margin-top: 1rem; padding-top: 0.8rem; font-size: 0.8125rem; }

  .fq-reply { width: auto; margin-top: 1rem; margin-left: 2rem; gap: 0.6rem; }
  .fq-reply__avatar { width: 2.25rem; height: 2.25rem; font-size: 0.75rem; }
  .fq-reply__name { font-size: 0.75rem; }
  .fq-reply__text { font-size: 1rem; padding: 0.75rem 1rem; }
}
</style>
