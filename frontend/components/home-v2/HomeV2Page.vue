<template>
  <div class="improved-home v2-refine bg-black text-white overflow-x-hidden pt-[var(--header-height)]">
    <Header />

    <div class="home-opening">
      <HomeHeroSection
        class="home-opening__thesis"
        :artist="demoArtist"
        show-hero-showcase
      />
      <div class="home-opening__rule" aria-hidden="true"></div>
      <HomeHeadquartersSection
        class="home-opening__product"
        :artist="demoArtist"
        show-hero-showcase
      />
    </div>

    <div class="relative z-10 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

    <!-- After the approved opening: one night, told in order. Moon Dough plays;
         Sarah checks in, lands on the list, the artist sends the night, Sarah
         writes back. Then the workspace, one artist up
         close, and the close. -->
    <HomeV2LiveMoment />

    <HomeV2AfterTheShow
      :artist="nightArtist"
      section-id="fan-list"
      :with-show-night="false"
      venue-name="Nashville"
      :gallery="nightGallery"
      messenger-once
      hide-message-cta
    />

    <div class="relative z-10 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

    <LazyHomeMessagingShowcaseSection hydrate-on-visible refined cta :photos="nightGallery" />

    <!-- A cinematic pause between the product chapters: the night's photographs and the Passport they live in -->
    <HomeV3NightLives />

    <HomeV3FanIntelligence />

    <HomeV3AudienceInsight />

    <div class="relative z-10 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

    <LazyHomeRealArtistShowcase hydrate-on-visible refined />

    <HomeV2Closing />

    <section id="faq" class="relative z-10 px-4 sm:px-6 lg:px-8 py-16 lg:py-24 bg-[#050608]">
      <div class="faq-wrap">
        <div class="faq-intro">
          <p class="home-kicker mb-3 text-[#9AA6B5]">Answers</p>
          <h2 class="faq-title">
            Frequently asked
          </h2>
          <p class="faq-lede">Everything you need before you start.</p>
        </div>
        <div class="faq-stack-col">
        <div class="faq-stack space-y-2.5">
          <div
            v-for="(item, i) in faqs"
            :key="item.q"
            class="faq-item"
            :class="{ 'is-open': openFaq === i }"
          >
            <button
              type="button"
              class="faq-trigger"
              :aria-expanded="openFaq === i"
              :aria-controls="`faq-panel-${i}`"
              @click="toggleFaq(i)"
            >
              <span>{{ item.q }}</span>
              <Motion
                as="span"
                class="faq-chevron"
                :animate="{ rotate: openFaq === i ? 45 : 0 }"
                :transition="{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }"
                aria-hidden="true"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v14M5 12h14"/>
                </svg>
              </Motion>
            </button>
            <div :id="`faq-panel-${i}`" class="faq-answer" :class="{ 'is-open': openFaq === i }">
              <p>{{ item.a }}</p>
            </div>
          </div>
        </div>
        <div class="faq-reach">
          <p class="faq-reach__name">Pat Rogers</p>
          <p class="faq-reach__status">Available for questions</p>
          <p class="faq-reach__links">
            <a href="mailto:pat@faneqo.com">pat@faneqo.com</a>
            <span class="faq-reach__mid" aria-hidden="true">·</span>
            <a href="tel:+18285826489">(828) 582-6489</a>
          </p>
        </div>
        </div>
      </div>
    </section>

    <footer class="home-v2-foot">
      <div class="home-v2-foot__inner">
        <div class="home-v2-foot__brand">
          <img src="/faneqo-wordmark-editorial.png?v=2" alt="Faneqo" class="home-v2-foot__logo" width="3398" height="901" loading="lazy" decoding="async" />
          <p class="home-v2-foot__tag">Your Band's Headquarters.</p>
          <p class="home-v2-foot__line">Built for artists, bands, and the fans who show up.</p>
        </div>

        <nav class="home-v2-foot__nav" aria-label="Footer">
          <div>
            <p class="home-v2-foot__label">Product</p>
            <a href="#features">Artist Pages</a>
            <NuxtLink to="/presentation">Presentation</NuxtLink>
            <a href="#after-the-show">Show Mode</a>
            <a href="#fan-intelligence">Fan Intelligence</a>
            <a href="#messaging">Messages</a>
          </div>
          <div>
            <p class="home-v2-foot__label">Get started</p>
            <NuxtLink to="/signup">Start free</NuxtLink>
            <NuxtLink to="/login">Login</NuxtLink>
          </div>
          <div>
            <p class="home-v2-foot__label">Company</p>
            <p class="home-v2-foot__person">Pat Rogers</p>
            <a href="mailto:pat@faneqo.com">pat@faneqo.com</a>
            <a href="tel:+18285826489">(828) 582-6489</a>
            <NuxtLink to="/contact">Contact</NuxtLink>
          </div>
          <div>
            <p class="home-v2-foot__label">Legal</p>
            <NuxtLink to="/privacypolicy">Privacy</NuxtLink>
            <NuxtLink to="/termsofservice">Terms</NuxtLink>
          </div>
        </nav>
      </div>

      <p class="home-v2-foot__seo">
        Faneqo is a music-first artist page for bands who want fans they can reach again. One place for music, shows, your fan list, and support.
      </p>
      <p class="home-v2-foot__copy">© {{ new Date().getFullYear() }} Faneqo</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, watchEffect } from 'vue'
import { Motion } from 'motion-v'
import Header from '@/components/Header.vue'
import HomeHeroSection from '@/components/home/HomeHeroSection.vue'
import HomeHeadquartersSection from '@/components/home/HomeHeadquartersSection.vue'
import HomeV2LiveMoment from '@/components/home-v2/story/HomeV2LiveMoment.vue'
import HomeV2AfterTheShow from '@/components/home-v2/after-show/HomeV2AfterTheShow.vue'
import HomeV3FanIntelligence from '@/components/home-v2/story/HomeV3FanIntelligence.vue'
import HomeV3NightLives from '@/components/home-v2/story/HomeV3NightLives.vue'
import HomeV3AudienceInsight from '@/components/home-v2/story/HomeV3AudienceInsight.vue'
import HomeV2Closing from '@/components/home-v2/story/HomeV2Closing.vue'
import { useHomepageDemoArtist } from '~/composables/useHomepageDemoArtist'
import { HOMEPAGE_FAQS } from '~/utils/home/homepageContent'

const { demoArtist, demoMeta } = useHomepageDemoArtist()

// The night the story follows: Moon Dough, and the one live photo she has published on Faneqo
const nightArtist = { name: 'Moon Dough' }
const nightGallery = [
  { id: 'md-01', src: '/images/home/moondough-live.jpg', pos: '45% 40%' },
]

if (import.meta.dev) {
  watchEffect(() => {
    const m = demoMeta.value
    if (m && !m.slugResolved) {
      console.warn('[homepage-demo] Live slug not resolved:', m)
    }
  })
}

const faqs = HOMEPAGE_FAQS
const openFaq = ref(-1)

function toggleFaq(index) {
  openFaq.value = openFaq.value === index ? -1 : index
}
</script>

<style scoped>
.improved-home {
  min-height: 100vh;
}

.home-opening {
  display: flex;
  flex-direction: column;
}

.home-opening__thesis {
  display: none;
  order: 1;
}

.home-opening__rule {
  display: none;
  order: 2;
}

.home-opening__product {
  order: 3;
}

.home-opening__rule {
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1), transparent);
}

@media (min-width: 1024px) {
  .home-opening__thesis,
  .home-opening__rule {
    display: block;
  }
}

.v2-refine :deep(.home-section-title) {
  font-size: clamp(2.15rem, 8.2vw, 3.2rem);
  font-weight: 800;
  line-height: 0.94;
  letter-spacing: -0.045em;
}

@media (min-width: 1024px) {
  .v2-refine :deep(.home-section-title) {
    font-size: clamp(2.7rem, 3.8vw, 3.45rem);
    line-height: 0.92;
    letter-spacing: -0.05em;
  }
}

.v2-refine :deep(.home-kicker) {
  font-size: 0.6875rem;
  letter-spacing: 0.18em;
}

.faq-wrap {
  width: min(100%, 72rem);
  margin: 0 auto;
}

.faq-intro {
  margin-bottom: 1.75rem;
}

.faq-lede {
  margin: 0.7rem 0 0;
  max-width: 18rem;
  font-size: 0.95rem;
  line-height: 1.45;
  color: #9aa6b5;
}

.faq-title {
  font-size: clamp(1.9rem, 6vw, 2.55rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  color: #f7f9fc;
}

@media (min-width: 1024px) {
  .faq-wrap {
    display: grid;
    grid-template-columns: minmax(16rem, 22rem) minmax(0, 1fr);
    gap: 3.5rem;
    align-items: start;
  }

  .faq-intro {
    margin-bottom: 0;
    position: sticky;
    top: calc(var(--header-height) + 1.5rem);
  }
}

.faq-item {
  position: relative;
  overflow: hidden;
  border-radius: 0.95rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #111722;
  transition: border-color 0.22s ease;
}

.faq-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, #4ca6ff, #39d5ff, #45e3ae);
  opacity: 0;
  transition: opacity 0.28s ease;
}

.faq-item:hover {
  border-color: rgba(76, 166, 255, 0.18);
}

.faq-item.is-open {
  border-color: rgba(76, 166, 255, 0.28);
}

.faq-item.is-open::before {
  opacity: 0.9;
}

.faq-trigger {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 3.25rem;
  padding: 1.2rem 1.25rem;
  color: #f7f9fc;
  font-size: 1.02rem;
  font-weight: 650;
  text-align: left;
  cursor: pointer;
}

.faq-trigger:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: -2px;
}

.faq-answer {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.faq-answer.is-open {
  grid-template-rows: 1fr;
}

.faq-answer p {
  overflow: hidden;
  margin: 0;
  padding: 0 1.25rem;
  color: #c5ced8;
  font-size: 0.98rem;
  line-height: 1.6;
  opacity: 0;
  transform: translateY(-4px);
  transition:
    opacity 0.22s ease,
    transform 0.22s ease,
    padding-bottom 0.22s ease;
}

.faq-answer.is-open p {
  padding-bottom: 1.25rem;
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .faq-answer {
    transition: none;
  }
}

.faq-chevron {
  display: grid;
  width: 1.1rem;
  height: 1.1rem;
  flex-shrink: 0;
  color: #39d5ff;
  opacity: 0.75;
}

.faq-chevron svg {
  width: 100%;
  height: 100%;
}

.faq-reach {
  margin: 1.85rem 0 0;
  padding-left: 1.25rem;
}

.faq-reach__name,
.faq-reach__status,
.faq-reach__links {
  margin: 0;
}

.faq-reach__name {
  color: #f7f9fc;
  font-size: 1.05rem;
  font-weight: 650;
  letter-spacing: -0.02em;
}

.faq-reach__status {
  margin-top: 0.28rem;
  color: #9aa6b5;
  font-size: 0.95rem;
  line-height: 1.4;
}

.faq-reach__links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.65rem;
  margin-top: 0.72rem;
  font-size: 0.95rem;
}

.faq-reach__mid {
  color: rgba(154, 166, 181, 0.55);
}

.faq-reach a {
  color: rgba(247, 249, 252, 0.88);
}

.faq-reach a:hover {
  color: #fff;
}

.faq-reach a:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
  border-radius: 0.2rem;
}

.home-v2-foot {
  position: relative;
  background: #050608;
  padding: 3.25rem 1.25rem 2.25rem;
}

.home-v2-foot::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 1px;
  background: linear-gradient(90deg, #ff4fd8 0%, #8b6cff 28%, #4ca6ff 58%, #39d5ff 82%, #45e3ae 100%);
  opacity: 0.32;
}

.home-v2-foot__inner {
  width: min(100%, 76rem);
  margin: 0 auto;
  display: grid;
  gap: 2.4rem;
}

.home-v2-foot__brand {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.7rem;
}

.home-v2-foot__logo {
  display: block;
  width: 9.5rem;
  height: auto;
  object-fit: contain;
}

.home-v2-foot__tag {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 750;
  letter-spacing: -0.02em;
  color: #f7f9fc;
}

.home-v2-foot__line {
  margin: 0;
  max-width: 22rem;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #9aa6b5;
}

.home-v2-foot__nav {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.75rem 1.4rem;
}

.home-v2-foot__label {
  margin: 0 0 0.65rem;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #9aa6b5;
}

.home-v2-foot__person {
  margin: 0.15rem 0 0.15rem;
  color: #f7f9fc;
  font-size: 0.95rem;
  font-weight: 650;
}

.home-v2-foot__nav a {
  display: block;
  margin-top: 0.42rem;
  color: rgba(247, 249, 252, 0.78);
  font-size: 0.95rem;
}

.home-v2-foot__nav a:hover {
  color: #fff;
}

.home-v2-foot__nav a:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
  border-radius: 0.2rem;
}

.home-v2-foot__seo {
  width: min(100%, 76rem);
  margin: 2.4rem auto 0;
  max-width: 40rem;
  font-size: 0.9375rem;
  line-height: 1.55;
  color: #9aa6b5;
}

.home-v2-foot__copy {
  width: min(100%, 76rem);
  margin: 1.1rem auto 0;
  font-size: 0.875rem;
  color: rgba(154, 166, 181, 0.85);
}

@media (min-width: 768px) {
  .home-v2-foot__inner {
    grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.35fr);
    align-items: start;
  }

  .home-v2-foot__nav {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (prefers-reduced-motion: reduce) {
  .faq-answer,
  .faq-answer p,
  .faq-item::before {
    transition: none;
  }
}
</style>
