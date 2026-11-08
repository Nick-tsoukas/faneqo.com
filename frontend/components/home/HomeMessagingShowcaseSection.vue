<template>
  <section
    id="messaging"
    class="msg-section relative z-10 px-4 sm:px-6 lg:px-8"
    :class="refined ? 'py-20 sm:py-24 lg:py-36 msg-section--refined' : 'overflow-hidden py-14 sm:py-16 lg:py-24'"
    aria-labelledby="messaging-heading"
  >
    <div class="pointer-events-none absolute inset-0" aria-hidden="true">
      <div class="absolute inset-0 bg-[#050508]" />
      <div class="absolute left-1/2 top-[-12%] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[#9100FF]/18 blur-[140px]" />
      <div
        v-if="!refined"
        class="absolute right-[8%] bottom-[-10%] h-[320px] w-[320px] rounded-full bg-[#39FF14]/10 blur-[110px]"
      />
      <div
        v-else
        class="absolute right-[10%] bottom-[-8%] h-[280px] w-[280px] rounded-full bg-[#4CA6FF]/10 blur-[120px]"
      />
      <div
        class="absolute left-[12%] top-[40%] h-[240px] w-[240px] rounded-full blur-[100px]"
        :class="refined ? 'bg-[#39D5FF]/8' : 'bg-fuchsia-600/10'"
      />
    </div>

    <div class="relative mx-auto max-w-7xl">
      <HomeTypeReveal class="home-section-head mb-8 max-w-3xl sm:mb-10 lg:mb-14">
        <p class="home-kicker mb-2 sm:mb-3" :class="refined ? 'text-[#39D5FF]/90' : 'text-emerald-400'">
          {{ refined ? 'Inbox' : 'Stay connected' }}
        </p>
        <h2
          id="messaging-heading"
          class="home-section-title"
          :class="refined ? 'msg-title-refined' : 'lg:text-[2.85rem] xl:text-5xl'"
        >
          <template v-if="refined">
            They can
            <span class="bg-clip-text text-transparent bg-gradient-to-r from-[#4CA6FF] via-[#39D5FF] to-[#45E3AE]">
              write back.
            </span>
          </template>
          <template v-else>
            Turn fans into
            <span class="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-lime-300 to-fuchsia-400">
              real conversations.
            </span>
          </template>
        </h2>
        <p
          v-if="refined"
          class="msg-lede"
        >
          Send the night. Attach the gallery.
          Then Sarah writes back.
        </p>
        <p
          v-if="!refined"
          class="home-section-body mt-4 text-[0.9375rem] leading-relaxed text-white/70 sm:mt-5 sm:text-lg"
        >
          Message fans one-to-one, email your whole list, and share photos from the show — all from Faneqo.
        </p>
        <p
          v-if="!refined"
          class="home-section-body mt-2 hidden text-sm text-white/45 sm:block"
        >
          Know who you're talking to, not just their email address.
        </p>
      </HomeTypeReveal>

      <div class="relative" :class="{ 'msg-demo-scale': refined }">
        <div v-if="refined" class="msg-floats" aria-hidden="true">
          <span class="msg-float msg-float--a">Photos</span>
          <span class="msg-float msg-float--b">Gallery</span>
          <span class="msg-float msg-float--c">Attach</span>
        </div>
        <div
          v-if="!refined"
          class="pointer-events-none absolute -inset-6 hidden rounded-[2.2rem] bg-gradient-to-r from-[#9100FF]/20 via-transparent to-[#39FF14]/15 blur-3xl lg:block"
          aria-hidden="true"
        />
        <div
          v-else
          class="pointer-events-none absolute -inset-6 hidden rounded-[2.2rem] bg-gradient-to-r from-[#4CA6FF]/14 via-transparent to-[#39D5FF]/10 blur-3xl lg:block"
          aria-hidden="true"
        />
        <FaneqoMessagingShowcase :editorial="refined" :photos="photos" />
      </div>

      <!-- The mid-page invitation, placed where the relationship has just paid off -->
      <div v-if="cta" class="msg-invite">
        <NuxtLink to="/signup" class="msg-invite__btn" data-cta="home-messaging-signup">
          Start free
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </NuxtLink>
        <p class="msg-invite__note">Free account. Pro included for 30 days. No card required.</p>
      </div>

      <div
        v-if="!refined"
        class="mt-6 flex flex-wrap items-center justify-start gap-2 sm:mt-7 sm:gap-3 lg:justify-center"
      >
        <div class="msg-chip">
          <span class="msg-chip__kicker">One fan</span>
          <span class="msg-chip__label">Direct Messages</span>
        </div>
        <div class="msg-chip">
          <span class="msg-chip__kicker">Your fan list</span>
          <span class="msg-chip__label">Email Fans</span>
        </div>
      </div>

      <div
        v-if="!refined"
        class="mt-7 flex justify-start sm:mt-8 lg:justify-center"
      >
        <NuxtLink to="/signup" class="msg-cta group">
          Start building your fan list
          <svg class="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup>
/**
 * Homepage messaging chapter: after Fan Intelligence, before artist social proof.
 * Demo is presentational only — see FaneqoMessagingShowcase.
 */
import FaneqoMessagingShowcase from '@/components/home/FaneqoMessagingShowcase.vue'

defineProps({
  /** Homepage V2 editorial polish. Production `/` leaves this false. */
  refined: {
    type: Boolean,
    default: false,
  },
  /** Gallery shared in the demo thread (homepage V3 passes the night's real gallery). */
  photos: {
    type: Array,
    default: null,
  },
  /** Show the signup invitation below the demo (homepage V3). */
  cta: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped>
.msg-chip {
  display: flex;
  flex-direction: column;
  min-width: 8.5rem;
  padding: 0.55rem 0.9rem;
  border-radius: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  text-align: left;
}

.msg-chip__kicker {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.msg-chip__label {
  margin-top: 0.12rem;
  color: #fff;
  font-size: 0.84rem;
  font-weight: 650;
}

.msg-cta {
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

.msg-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 40px -10px rgba(236, 72, 153, 0.6);
}

.msg-title-refined {
  font-size: clamp(2.35rem, 9.2vw, 4.15rem);
  line-height: 0.9;
  letter-spacing: -0.055em;
}

.msg-lede {
  margin: 1.15rem 0 0;
  max-width: 28rem;
  font-size: clamp(1.05rem, 2.2vw, 1.28rem);
  line-height: 1.35;
  letter-spacing: -0.03em;
  color: rgba(154, 166, 181, 0.92);
}

.msg-floats {
  display: none;
}

.msg-float {
  position: absolute;
  z-index: 3;
  padding: 0.48rem 0.78rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(12, 14, 20, 0.78);
  color: #f7f9fc;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  backdrop-filter: blur(14px);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.28),
    0 14px 28px -10px rgba(0, 0, 0, 0.72);
  animation: msg-chip-float 4.4s ease-in-out infinite;
}

.msg-float--a {
  top: 1.1rem;
  right: 1.2rem;
  color: #39d5ff;
}

.msg-float--b {
  top: 42%;
  left: 1.05rem;
  animation-delay: -1.4s;
}

.msg-float--c {
  bottom: 5.6rem;
  right: 1.15rem;
  animation-delay: -2.6s;
  color: #45e3ae;
}

@keyframes msg-chip-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.msg-demo-scale {
  transform: none;
  overflow: visible;
}

.msg-section--refined {
  overflow: visible;
}

@media (min-width: 1024px) {
  .msg-demo-scale {
    max-width: 74rem;
    margin-inline: auto;
  }

  .msg-section--refined .relative {
    position: relative;
  }

  .msg-floats {
    display: block;
    pointer-events: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .msg-cta,
  .msg-cta:hover {
    transform: none;
  }

  .msg-float {
    animation: none;
  }
}

.msg-invite {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.75rem 1.25rem;
  margin-top: 3rem;
}

.msg-invite__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 3.4rem;
  padding: 0 1.7rem;
  border-radius: 0.85rem;
  background: #f7f9fc;
  color: #050508;
  font-size: 1.0625rem;
  font-weight: 750;
  text-decoration: none;
  transition: transform 0.2s ease;
}

.msg-invite__btn:hover { transform: translateY(-2px); }
.msg-invite__btn:focus-visible { outline: 2px solid #39d5ff; outline-offset: 3px; }
.msg-invite__btn svg { width: 1.1rem; height: 1.1rem; fill: none; stroke: currentColor; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
.msg-invite__note { color: rgba(247, 249, 252, 0.55); font-size: 0.875rem; }

@media (prefers-reduced-motion: reduce) {
  .msg-invite__btn { transition: none; }
}
</style>
