<template>
  <section
    class="show-loop relative z-10 overflow-hidden px-4 sm:px-6 lg:px-8"
    :class="refined ? 'py-12 sm:py-14 lg:py-20 show-loop--refined' : 'py-20 lg:py-28'"
  >
    <!-- Stage atmosphere -->
    <div class="pointer-events-none absolute inset-0" aria-hidden="true">
      <div class="absolute inset-0 bg-[#050508]"></div>
      <div class="absolute -top-24 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-fuchsia-600/20 blur-[140px]"></div>
      <div
        v-if="!refined"
        class="absolute bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-emerald-500/10 blur-[110px]"
      ></div>
      <div
        v-else
        class="absolute bottom-0 left-0 h-[280px] w-[280px] rounded-full bg-purple-700/12 blur-[110px]"
      ></div>
      <div class="absolute inset-0 opacity-[0.07] mix-blend-soft-light stage-grain"></div>
    </div>

    <div class="relative mx-auto max-w-7xl">
      <!-- Top story row -->
      <div class="grid items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 xl:gap-20">
        <!-- Copy -->
        <div class="home-section-head home-section-head--flush order-1">
          <HomeTypeReveal>
            <p
              v-if="refined"
              class="home-kicker mb-3 text-pink-400/90"
            >
              Live Show Mode
            </p>
            <div
              v-else
              class="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5"
            >
              <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span class="home-kicker text-emerald-300">Live Show Mode</span>
            </div>

            <h2
              class="home-section-title"
              :class="refined ? 'show-title-refined' : 'lg:text-[2.85rem] xl:text-5xl'"
            >
              Turn every show into
              <span class="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                fans you can reach again.
              </span>
            </h2>

            <p
              v-if="!refined"
              class="home-section-body mt-5 text-base leading-relaxed text-white/70 sm:text-lg"
            >
              Turn on Show Mode. Fans check in from their phones, get a shareable
              <span class="text-white">I Was There</span> badge, and land on your list —
              so after the show you can
              <span class="text-white">Message the Room</span>.
            </p>
          </HomeTypeReveal>

          <!-- Compact loop strip -->
          <ol
            v-if="!refined"
            class="mt-8 grid grid-cols-2 gap-2 sm:gap-3 lg:max-w-xl"
          >
            <li
              v-for="(step, index) in steps"
              :key="step.id"
              class="loop-step rounded-xl border px-3 py-3 text-left sm:px-3.5"
              :class="step.payoff ? 'loop-step--payoff' : 'border-white/10 bg-white/[0.03]'"
            >
              <div class="mb-1.5 flex items-center gap-2">
                <span
                  class="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                  :class="step.numClass"
                >
                  {{ index + 1 }}
                </span>
                <span
                  v-if="step.live"
                  class="text-[10px] font-bold uppercase tracking-wider text-emerald-300"
                >Live</span>
                <span
                  v-if="step.payoff"
                  class="text-[10px] font-bold uppercase tracking-wider text-pink-300"
                >Payoff</span>
              </div>
              <p class="text-[13px] font-semibold text-white sm:text-sm">{{ step.title }}</p>
              <p class="mt-0.5 text-[11px] leading-snug text-white/50 sm:text-xs">{{ step.body }}</p>
            </li>
          </ol>
          <ol
            v-else
            class="mt-6 hidden grid-cols-2 gap-2 sm:grid lg:max-w-xl"
          >
            <li
              v-for="(step, index) in steps"
              :key="step.id"
              class="loop-step rounded-xl border px-3.5 py-3 text-left"
              :class="step.payoff ? 'loop-step--payoff' : 'border-white/10 bg-white/[0.03]'"
            >
              <p class="text-sm font-semibold text-white">{{ index + 1 }}. {{ step.title }}</p>
            </li>
          </ol>

          <!-- Desktop CTAs -->
          <div class="mt-8 hidden flex-col items-start gap-3 sm:flex-row lg:flex">
            <NuxtLink to="/signup" class="loop-cta-primary group">
              Start free
              <svg class="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </NuxtLink>
            <NuxtLink v-if="!refined" to="#fan-intelligence" class="loop-cta-secondary">
              See fan intelligence
            </NuxtLink>
          </div>
          <p v-if="!refined" class="mt-4 hidden text-sm text-white/45 lg:block">
            No Mailchimp. No spreadsheet. No lost fan list.
          </p>
        </div>

        <!-- Badge stage -->
        <div class="order-2 relative mx-auto w-full max-w-[400px] lg:mx-0 lg:max-w-none">
          <div class="badge-stage relative mx-auto aspect-square w-full" :class="refined ? 'max-w-[460px]' : 'max-w-[420px]'">
            <!-- Glow behind badge -->
            <div
              class="pointer-events-none absolute inset-[-8%] rounded-[2rem] blur-3xl"
              :class="refined
                ? 'bg-gradient-to-br from-fuchsia-500/28 via-purple-600/14 to-transparent'
                : 'bg-gradient-to-br from-fuchsia-500/30 via-purple-600/15 to-emerald-400/20'"
              aria-hidden="true"
            ></div>

            <!-- Floating proof chips -->
            <div v-if="!refined" class="badge-chip badge-chip--top left-0 top-[8%] hidden sm:flex lg:-left-6">
              <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              42 check-ins
            </div>
            <div v-if="!refined" class="badge-chip badge-chip--mid right-0 top-[28%] hidden sm:flex lg:-right-4">
              19 new emails
            </div>
            <div v-if="!refined" class="badge-chip badge-chip--bottom left-2 bottom-[14%] hidden sm:flex lg:-left-8">
              86 QR scans
            </div>

            <figure class="badge-frame relative z-10 overflow-hidden rounded-[1.35rem] border border-white/12 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]">
              <img
                src="/marketing/show-checkin-badge.png"
                alt="Faneqo Show Mode check-in badge — Verified Attendee, I Was There"
                width="1080"
                height="1080"
                loading="lazy"
                decoding="async"
                class="block h-auto w-full"
              />
            </figure>

            <p v-if="!refined" class="relative z-10 mt-4 text-center text-xs font-medium tracking-wide text-white/45">
              Fans get a shareable check-in badge the second they join the night.
            </p>
          </div>
        </div>
      </div>

      <!-- Message the Room payoff band — animated product demo -->
      <div class="message-band mt-12 overflow-hidden rounded-2xl border border-pink-400/25 sm:mt-14">
        <div class="relative grid gap-7 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center lg:gap-10 xl:gap-12">
          <div class="pointer-events-none absolute inset-0 bg-gradient-to-r from-pink-500/15 via-fuchsia-500/10 to-purple-600/10" aria-hidden="true"></div>

          <div class="relative order-2 text-left lg:order-1">
            <div class="mb-3 inline-flex flex-wrap items-center justify-start gap-2">
              <span class="rounded-full bg-pink-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-pink-300">
                Message the Room
              </span>
              <span
                v-if="!refined"
                class="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300/90"
              >
                Everyone who checked in
              </span>
            </div>
            <h3 class="text-xl font-bold text-white sm:text-2xl lg:text-[1.65rem] lg:leading-tight">
              After the show, message the whole room.
            </h3>
            <p
              v-if="!refined"
              class="mt-2.5 max-w-[34ch] text-sm leading-relaxed text-white/60 text-pretty sm:text-[15px] lg:max-w-xl"
            >
              Thank them. Drop a merch link. Announce the next date — one message to the fans who were
              actually there. No Mailchimp. No spreadsheet.
            </p>
            <div class="mt-5 flex flex-wrap justify-start gap-2">
              <span class="stat-pill">42 in the room</span>
              <span class="stat-pill">Reach them again</span>
            </div>
          </div>

          <div class="relative order-1 lg:order-2">
            <MessageTheRoomDemo />
          </div>
        </div>
      </div>

      <!-- Mobile CTAs -->
      <div class="mt-8 flex flex-col items-center gap-3 lg:hidden">
        <NuxtLink to="/signup" class="loop-cta-primary group w-full max-w-sm justify-center">
          Start free
          <svg class="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>
        <template v-if="!refined">
          <NuxtLink to="#fan-intelligence" class="loop-cta-secondary w-full max-w-sm justify-center">
            See fan intelligence
          </NuxtLink>
          <p class="text-center text-sm text-white/45">
            No Mailchimp. No spreadsheet. No lost fan list.
          </p>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup>
/**
 * Show Mode product story — check-in badge + animated Message the Room demo.
 * No API calls. Badge image is a real generated Show Mode share asset.
 */
import MessageTheRoomDemo from '@/components/home/MessageTheRoomDemo.vue'

defineProps({
  /** Homepage V2 editorial polish. Production `/` leaves this false. */
  refined: {
    type: Boolean,
    default: false,
  },
})

const steps = [
  {
    id: 'live',
    title: 'Show Mode on',
    body: 'Your artist page becomes a live check-in surface.',
    live: true,
    numClass: 'bg-emerald-500/20 text-emerald-300',
  },
  {
    id: 'checkin',
    title: 'Fans check in',
    body: "They join tonight's list and get an I Was There badge.",
    numClass: 'bg-fuchsia-500/20 text-fuchsia-300',
  },
  {
    id: 'recap',
    title: 'Show Recap',
    body: 'See check-ins, new emails, scans, and fan actions.',
    numClass: 'bg-purple-500/20 text-purple-300',
  },
  {
    id: 'message',
    title: 'Message the Room',
    body: 'Follow up with everyone who was actually there.',
    payoff: true,
    numClass: 'bg-pink-500/25 text-pink-300',
  },
]
</script>

<style scoped>
.show-loop {
  background: #050508;
}

.show-title-refined {
  font-size: clamp(2.2rem, 8.4vw, 3.35rem);
  line-height: 0.92;
  letter-spacing: -0.048em;
}

.stage-grain {
  background-image: radial-gradient(rgba(255, 255, 255, 0.35) 0.5px, transparent 0.5px);
  background-size: 3px 3px;
}

.loop-step--payoff {
  border-color: rgba(244, 114, 182, 0.35);
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.16), rgba(168, 85, 247, 0.1));
  box-shadow: 0 0 28px -12px rgba(236, 72, 153, 0.55);
}

.badge-frame {
  background: #0a0a0f;
  transform: translateZ(0);
}

.badge-chip {
  position: absolute;
  z-index: 20;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.7rem;
  border-radius: 9999px;
  background: rgba(10, 10, 16, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.82);
  font-size: 11px;
  font-weight: 600;
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 30px -12px rgba(0, 0, 0, 0.8);
}

.badge-chip--top {
  animation: chipFloat 6.5s ease-in-out infinite;
}

.badge-chip--mid {
  animation: chipFloat 7.2s ease-in-out infinite;
  animation-delay: 0.8s;
}

.badge-chip--bottom {
  animation: chipFloat 6.8s ease-in-out infinite;
  animation-delay: 1.4s;
}

@keyframes chipFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

.message-band {
  background: rgba(8, 8, 14, 0.85);
  box-shadow: 0 20px 60px -30px rgba(236, 72, 153, 0.45);
}

.stat-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.7rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.35);
  color: rgba(255, 255, 255, 0.75);
  font-size: 11px;
  font-weight: 600;
}

.loop-cta-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(to right, #ec4899, #a855f7);
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 0.95rem;
  color: #fff;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 10px 30px -10px rgba(236, 72, 153, 0.5);
}

.loop-cta-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 40px -10px rgba(236, 72, 153, 0.6);
}

.loop-cta-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 0.95rem;
  color: #fff;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.loop-cta-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

@media (prefers-reduced-motion: reduce) {
  .animate-pulse,
  .badge-chip--top,
  .badge-chip--mid,
  .badge-chip--bottom {
    animation: none;
  }

  .loop-cta-primary:hover,
  .loop-cta-secondary:hover {
    transform: none;
  }
}
</style>
