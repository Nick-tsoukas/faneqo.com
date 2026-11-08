<template>
  <div class="improved-home bg-black text-white overflow-x-hidden pt-[var(--header-height)]">
    <!-- Cinematic background: desktop only, deferred until idle (not on critical path) -->
    <div class="fixed inset-0 pointer-events-none z-0 hidden lg:block">
      <ClientOnly>
        <LazyCinematicArtistWorld hydrate-on-idle class="w-full h-full" />
      </ClientOnly>
    </div>

    <!-- Main Header -->
    <Header />

    <!-- 1. HERO — mobile is copy-only + short; desktop keeps fuller CTA treatment -->
    <section class="relative z-10 bg-black px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 lg:pt-16 pb-8 sm:pb-10 lg:pb-20" style="background: #000;">
      <div class="max-w-7xl mx-auto">
        <div class="grid lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-6 sm:gap-8 lg:gap-14 items-center">
          <!-- Hero Text — mobile editorial left axis; desktop stays left in the copy column -->
          <div class="order-1 text-left">
            <div class="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 mb-5">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Built for artists, bands, and live shows
            </div>
            <h1 class="home-hero-h1">
              <HomePhraseReveal>
                <span class="home-hero-thought">
                  Bands don't need <span class="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">more links.</span>
                </span>
              </HomePhraseReveal>
              <HomePhraseReveal :delay="HOME_TYPE_DELAY.thought2">
                <span class="home-hero-thought">
                  They need <span class="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">fans they can reach again.</span>
                </span>
              </HomePhraseReveal>
            </h1>
            <!-- Mobile: one short line. Desktop: fuller product sentence. -->
            <Motion
              as="p"
              class="home-hero-support mt-5 max-w-[32ch] text-left text-[0.9375rem] leading-[1.55] text-white/70 text-pretty sm:max-w-xl sm:text-lg sm:leading-relaxed lg:hidden"
              v-bind="supportMotion"
            >
              Your band’s page, fan list, shows, and support — in one place.
            </Motion>
            <Motion
              as="p"
              class="mt-5 hidden max-w-xl text-left text-base leading-relaxed text-white/70 sm:text-lg lg:block"
              v-bind="supportMotion"
            >
              Create a music-first artist page with songs, videos, fan capture, QR codes, Show Mode, and real fan analytics.
            </Motion>
            <div class="mt-7 hidden lg:flex flex-col sm:flex-row items-center gap-3 lg:justify-start justify-center">
              <NuxtLink to="/signup" class="cta-primary group">
                Start free
                <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
              </NuxtLink>
              <NuxtLink to="/badflower" class="cta-secondary">See how it works</NuxtLink>
            </div>
            <p class="mt-4 text-sm text-white/50 hidden lg:block">
              Free account. Pro included for 30 days. Keep your page either way.
            </p>

            <!-- Proof Chips — desktop only -->
            <div class="mt-6 hidden lg:flex flex-wrap items-center gap-2 justify-center lg:justify-start">
              <span class="proof-chip">Free artist page</span>
              <span class="proof-chip">Fan list included</span>
              <span class="proof-chip">Built for musicians</span>
            </div>
          </div>

          <!-- Hero Visual: desktop only — CSS hidden below lg; mobile uses Mockup #2 -->
          <div class="home-hero-mockup relative hidden justify-center order-2 lg:flex">
            <!-- Glow behind profile -->
            <div class="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-cyan-500/10 rounded-[2rem] blur-3xl scale-110 opacity-60 pointer-events-none"></div>

            <!-- Floating mini-cards -->
            <div class="absolute -left-16 top-8 z-20 floating-card">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                </div>
                <div>
                  <p class="text-[11px] font-semibold text-white">New fan joined</p>
                  <p class="text-[10px] text-white/50">via show QR scan</p>
                </div>
              </div>
            </div>

            <div class="absolute -right-14 top-1/4 z-20 floating-card" style="animation-delay: 1.2s;">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                  <svg class="w-3.5 h-3.5 text-pink-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </div>
                <div>
                  <p class="text-[11px] font-semibold text-white">Fan came back</p>
                  <p class="text-[10px] text-white/50">clicked Spotify after joining</p>
                </div>
              </div>
            </div>

            <div class="absolute -left-12 bottom-1/4 z-20 floating-card" style="animation-delay: 2.4s;">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <svg class="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z"/></svg>
                </div>
                <div>
                  <p class="text-[11px] font-semibold text-white">Tonight's show</p>
                  <p class="text-[10px] text-white/50">12 scans · 4 new fans</p>
                </div>
              </div>
            </div>

            <div class="absolute -right-10 bottom-16 z-20 floating-card" style="animation-delay: 3.6s;">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <svg class="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/></svg>
                </div>
                <div>
                  <p class="text-[11px] font-semibold text-white">Support received</p>
                  <p class="text-[10px] text-white/50">$20 from artist page</p>
                </div>
              </div>
            </div>

            <!-- Scaled-down profile container -->
            <div class="hero-profile-container relative z-10 w-full max-w-[340px] sm:max-w-[360px] lg:max-w-[380px] xl:max-w-[400px]">
              <DemoArtistProfileShowcase
                :artist="demoArtist"
                :compact="true"
                :animated="false"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section divider — desktop only; mobile flows straight into Artist Page -->
    <div class="relative z-10 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent hidden lg:block"></div>

    <!-- 2. ARTIST PAGE SHOWCASE - Full product reveal (tight under mobile hero) -->
    <section id="features" class="relative z-10 px-4 sm:px-6 lg:px-8 pt-6 pb-10 sm:pt-8 sm:pb-14 lg:py-24 overflow-hidden">
      <!-- Section background glow -->
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[160px]"></div>
      </div>

      <div class="max-w-7xl mx-auto relative">
        <!-- Section header — mobile left axis; desktop stays centered over the phone -->
        <div class="home-section-head mb-4 max-w-3xl sm:mb-6 lg:mb-10">
          <HomeTypeReveal>
            <p class="home-kicker mb-2 text-pink-400 lg:mb-3">Artist Page</p>
          </HomeTypeReveal>
          <HomeTypeReveal :delay="HOME_TYPE_DELAY.sectionHeading">
            <h2 class="home-section-title">
              Your band’s
              <span class="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">headquarters.</span>
            </h2>
          </HomeTypeReveal>
        </div>

        <!-- Product showcase with callout labels -->
        <div class="relative flex justify-start lg:justify-center">
          <!-- Callout labels - desktop only -->
          <div class="hidden lg:block absolute left-0 top-16 z-20">
            <div class="space-y-6">
              <div class="showcase-callout">
                <div class="showcase-callout-dot bg-pink-500"></div>
                <span>Music</span>
              </div>
              <div class="showcase-callout">
                <div class="showcase-callout-dot bg-purple-500"></div>
                <span>Video</span>
              </div>
              <div class="showcase-callout">
                <div class="showcase-callout-dot bg-emerald-500"></div>
                <span>Fan list</span>
              </div>
            </div>
          </div>

          <div class="hidden lg:block absolute right-0 top-16 z-20">
            <div class="space-y-6">
              <div class="showcase-callout">
                <span>Support</span>
                <div class="showcase-callout-dot bg-cyan-500"></div>
              </div>
              <div class="showcase-callout">
                <span>Show Mode</span>
                <div class="showcase-callout-dot bg-pink-400"></div>
              </div>
            </div>
          </div>

          <!-- Product frame -->
          <div class="home-hq-mockup relative w-full max-w-[420px] sm:max-w-[440px] lg:max-w-[500px]">
            <!-- Glow ring -->
            <div class="absolute -inset-6 bg-gradient-to-b from-pink-500/15 via-purple-500/10 to-transparent rounded-[3rem] blur-2xl pointer-events-none"></div>
            <!--
              Mobile: this phone is the primary visual (hero phone is desktop-only) → priority.
              Desktop: hero phone already owns LCP → keep this lazy so it doesn't double-fetch.
            -->
            <DemoArtistProfileShowcase
              :artist="demoArtist"
              :compact="false"
              :animated="true"
              priority
            />
          </div>
        </div>

        <!-- Mobile feature chips -->
        <div class="lg:hidden mt-8 flex flex-wrap items-center justify-start gap-2">
          <span v-for="feat in pageFeatures" :key="feat" class="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">
            {{ feat }}
          </span>
        </div>
      </div>
    </section>

    <!-- Section divider gradient -->
    <div class="relative z-10 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

    <!-- 2b. SHOW MODE LOOP — below fold; hydrate when near viewport -->
    <LazyHomeShowModeMessagingSection hydrate-on-visible />

    <!-- Section divider gradient -->
    <div class="relative z-10 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

    <!-- 3. FAN INTELLIGENCE — product story before artist social proof -->
    <section id="fan-intelligence" class="relative z-10 bg-black px-4 sm:px-6 lg:px-8 py-14 sm:py-16 lg:py-20">
      <div class="relative z-10 mx-auto max-w-7xl">
        <HomeTypeReveal class="home-section-head mb-6 max-w-3xl sm:mb-8">
          <p class="home-kicker mb-2 text-emerald-400 sm:mb-3">
            Fan Intelligence
          </p>
          <h2 class="home-section-title">
            Build a fan list
            <span class="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              you can actually use.
            </span>
          </h2>
        </HomeTypeReveal>
        <div class="w-full max-w-3xl lg:mx-auto">
          <DemoFanIntelligenceShowcase mode="marketing" />
        </div>
      </div>
    </section>

    <!-- Section divider gradient -->
    <div class="relative z-10 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

    <!-- 3b. MESSAGING — presentational DM / campaigns demo; hydrate when near viewport -->
    <LazyHomeMessagingShowcaseSection hydrate-on-visible />

    <!-- Section divider gradient -->
    <div class="relative z-10 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

    <!-- 4. REAL ARTIST SHOWCASE — deferred JS + client-only artist fetches -->
    <LazyHomeRealArtistShowcase hydrate-on-visible />

    <!-- Section divider gradient -->
    <div class="relative z-10 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

    <!-- 5. FINAL CTA -->
    <section class="relative z-10 overflow-hidden min-h-[380px] sm:min-h-[440px]">
      <NuxtImg
        src="~/assets/aisix.png"
        alt=""
        class="absolute inset-0 w-full h-full object-cover object-[70%_25%] sm:object-[68%_20%] lg:object-[65%_15%]"
        aria-hidden="true"
        format="webp"
        quality="70"
        sizes="100vw"
        loading="lazy"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/50"></div>
      <div class="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>
      <div class="absolute inset-0 bg-gradient-to-r from-pink-900/20 via-purple-900/15 to-cyan-900/10"></div>

      <div class="relative z-10 px-4 sm:px-6 lg:px-8 py-24 lg:py-28">
        <div class="max-w-6xl mx-auto">
          <div class="home-section-head max-w-2xl">
            <h2 class="home-section-title drop-shadow-lg lg:text-6xl">
              Your band could be <span class="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">next.</span>
            </h2>
            <p class="home-section-body mt-5 text-base leading-relaxed text-white/75 drop-shadow-sm sm:text-lg">
              Free to start. No card required.
            </p>
            <div class="mt-8 flex justify-start lg:justify-center">
              <NuxtLink to="/signup" class="cta-primary text-base group">
                Create your artist page
                <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section divider gradient -->
    <div class="relative z-10 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

    <!-- 6. FAQ -->
    <section id="faq" class="relative z-10 px-4 sm:px-6 lg:px-8 py-16 lg:py-20 bg-black">
      <div class="max-w-3xl mx-auto">
        <div class="home-section-head mb-10">
          <h2 class="home-section-title lg:text-4xl">
            Frequently asked
          </h2>
        </div>
        <div class="space-y-3">
          <details v-for="(item, i) in faqs" :key="i" class="faq-item group">
            <summary class="flex items-center justify-between cursor-pointer p-5 rounded-xl bg-white/[0.08] border border-white/15 hover:bg-white/[0.12] transition">
              <span class="font-semibold text-white pr-4">{{ item.q }}</span>
              <svg class="w-5 h-5 text-white/40 transition-transform group-open:rotate-180 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </summary>
            <div class="px-5 pt-3 pb-5 text-white/80 leading-relaxed bg-white/[0.03] rounded-b-xl">{{ item.a }}</div>
          </details>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="relative z-10 bg-black border-t border-white/5 px-4 sm:px-6 lg:px-8 py-10">
      <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/50">
        <div class="flex items-center gap-3">
          <img src="/faneqo-logo.png" alt="Faneqo — Your Band's Headquarters." class="h-10 w-auto" width="160" height="40" loading="lazy" decoding="async" />
          <span>© {{ new Date().getFullYear() }}</span>
        </div>
        <div class="flex items-center gap-6">
          <NuxtLink to="/privacypolicy" class="hover:text-white transition">Privacy</NuxtLink>
          <NuxtLink to="/termsofservice" class="hover:text-white transition">Terms</NuxtLink>
          <NuxtLink to="/contact" class="hover:text-white transition">Contact</NuxtLink>
        </div>
      </div>
      <!-- SEO footer copy -->
      <div class="max-w-7xl mx-auto mt-6 pt-6 border-t border-white/5">
        <p class="text-xs text-white/30 max-w-3xl leading-relaxed">
          Faneqo is a music smart link and QR code platform built for artists who want more than clicks. Create a free artist page for your music, links, videos, shows, fan list, and QR code. Built as a Linktree alternative for musicians, Faneqo helps bands grow fans they can reach again.
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, watchEffect } from 'vue'
import { Motion } from 'motion-v'
import { usePreferredReducedMotion } from '@vueuse/core'
import Header from '@/components/Header.vue'
import DemoArtistProfileShowcase from '@/components/marketing/DemoArtistProfileShowcase.vue'
import DemoFanIntelligenceShowcase from '@/components/marketing/DemoFanIntelligenceShowcase.vue'
import { useHomepageDemoArtist } from '~/composables/useHomepageDemoArtist'
import { HOME_TYPE_DELAY, homeSupportMotion, isHomeTypeReduced } from '@/utils/ui/homeTypeMotion'
// Below-fold sections use Nuxt Lazy* + hydrate-on-visible/idle (auto-imported).

definePageMeta({
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

const typePreference = usePreferredReducedMotion()
const supportMotion = computed(() => homeSupportMotion(isHomeTypeReduced(typePreference.value)))

// Homepage phone demo — swap artist via config/homepageDemo.js → artistSlug
const { demoArtist, demoMeta } = useHomepageDemoArtist()
if (import.meta.dev) {
  watchEffect(() => {
    const m = demoMeta.value
    if (m && !m.slugResolved) {
      console.warn('[homepage-demo] Live slug not resolved:', m)
    }
  })
}

const faqs = [
  { q: 'Is Faneqo free?', a: 'Yes. You can create a free Faneqo account and launch a free artist page. Every new account also includes 30 days of Pro features.' },
  { q: 'Is Faneqo a Linktree alternative?', a: 'Yes — for musicians who want more than a list of links. Basic link pages hold links and send fans away. Faneqo is built for artists: music-first pages, QR codes, fan list tools, support buttons, Show Mode, and fan analytics.' },
  { q: 'Can I use my existing links?', a: 'Yes. Add your Spotify, Apple Music, YouTube, socials, merch, tickets, and website links to your artist page. Fans get one place to stream, follow, join your list, and support the band.' },
  { q: 'How does Show Mode work?', a: 'At the show, fans scan your QR and check in. They get a shareable check-in badge, join your fan list, and you can message everyone who was in the room after the show — thank them, drop merch, or announce the next date.' },
  { q: 'Do I own my fan list?', a: 'Yes. Fans who join from your artist page, QR codes, and shows belong to your list. You can see who joined, where they came from, and who is engaging — so you can reach them again.' },
  { q: 'Can fans support or pay the band through Faneqo?', a: 'Yes. The support module lets fans tip or support you directly from your artist page. You keep what fans give.' }
]

useHead({
  title: 'Classic homepage (reference) · Faneqo',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
    { name: 'googlebot', content: 'noindex, nofollow' },
  ],
  noscript: [
    { innerHTML: '<style>.home-phrase-inner,.home-type-reveal{transform:none!important;opacity:1!important}</style>' }
  ],
})

const pageFeatures = [
  'Music',
  'Video',
  'Fan list',
  'Support',
  'Show Mode'
]
</script>

<style scoped>
.improved-home {
  min-height: 100vh;
}

.home-hero-h1 {
  max-width: none;
  font-size: 2.125rem;
  font-weight: 800;
  line-height: 0.98;
  letter-spacing: -0.035em;
  text-align: left;
}

.home-hero-thought {
  display: block;
}

.home-hero-h1 :deep(.home-phrase-mask + .home-phrase-mask) {
  margin-top: 0.12em;
}

@media (min-width: 640px) {
  .home-hero-h1 {
    font-size: 3rem;
    line-height: 1.08;
    letter-spacing: -0.025em;
  }
}

@media (min-width: 1024px) {
  .home-hero-h1 {
    font-size: 3.5rem;
  }
}

@media (min-width: 1280px) {
  .home-hero-h1 {
    font-size: 3.75rem;
  }
}

/* CTA Buttons */
.cta-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(to right, #ec4899, #a855f7);
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 0.95rem;
  color: white;
  transition: all 0.2s;
  box-shadow: 0 10px 30px -10px rgba(236, 72, 153, 0.5);
}
.cta-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 40px -10px rgba(236, 72, 153, 0.6);
}

.cta-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 0.95rem;
  color: white;
  transition: all 0.2s;
}
.cta-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

/* Proof Chips */
.proof-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 9999px;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.60);
  white-space: nowrap;
}

/* Floating cards */
.floating-card {
  padding: 0.625rem 0.875rem;
  background: rgba(15, 15, 20, 0.90);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 0.75rem;
  box-shadow: 0 8px 30px -8px rgba(0, 0, 0, 0.6);
  animation: floatBounce 7s ease-in-out infinite;
}

@keyframes floatBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@media (prefers-reduced-motion: reduce) {
  .floating-card {
    animation: none;
  }
}

/* Hero profile container */
.hero-profile-container {
  transform: perspective(1200px) rotateY(-1deg);
  transition: transform 0.4s ease;
}
.hero-profile-container:hover {
  transform: perspective(1200px) rotateY(0deg);
}

/* Mockup #1: clip the partial preview — never a nested scrollbar. */
.home-hero-mockup :deep(.demo-artist-showcase),
.home-hero-mockup :deep(.demo-wake-clip) {
  overflow-x: hidden;
  overflow-y: hidden;
  overscroll-behavior: none;
}

/*
  Mockup #2: full artist page in document flow.
  Kill wake-up clip height / overflow-y-auto if those classes leak.
*/
.home-hq-mockup,
.home-hq-mockup :deep(.demo-artist-showcase),
.home-hq-mockup :deep(.demo-wake-clip) {
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
  overscroll-behavior: auto;
}

/* Headquarters mockup only: hero photo taller than the 16:9 video block. */
.home-hq-mockup :deep(.demo-page-hero) {
  min-height: 26rem;
  max-height: 40rem;
}

@media (min-width: 640px) {
  .home-hq-mockup :deep(.demo-page-hero) {
    min-height: 28rem;
    max-height: 44rem;
  }
}

/* Showcase callouts */
.showcase-callout {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.80);
  white-space: nowrap;
}
.showcase-callout-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* FAQ */
.faq-item {
  transition: all 0.2s;
}
.faq-item[open] summary {
  background: rgba(236, 72, 153, 0.08);
  border-color: rgba(236, 72, 153, 0.25);
}
.faq-item summary::-webkit-details-marker {
  display: none;
}

</style>
