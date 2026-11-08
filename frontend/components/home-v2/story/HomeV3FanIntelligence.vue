<template>
  <section id="fan-intelligence" class="home-v2-fi relative z-10 overflow-hidden px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
    <div class="pointer-events-none absolute inset-0" aria-hidden="true">
      <div class="absolute left-[-10%] top-0 h-[28rem] w-[28rem] rounded-full bg-[#4CA6FF]/10 blur-[120px]"></div>
      <div class="absolute right-[-8%] bottom-[-10%] h-[22rem] w-[22rem] rounded-full bg-[#39D5FF]/8 blur-[110px]"></div>
    </div>

    <div class="relative z-10 mx-auto max-w-7xl">
      <!-- The original chapter: the real fan workspace -->
      <HomeTypeReveal class="home-section-head mb-8 max-w-3xl sm:mb-10">
        <p class="home-kicker mb-3 text-[#39D5FF]/90">Your list</p>
        <h2 class="home-section-title fi-title">
          Not emails.
          <span class="fi-title__accent">Fans you can reach.</span>
        </h2>
      </HomeTypeReveal>
      <div class="w-full max-w-4xl lg:mx-auto">
        <DemoFanIntelligenceShowcase mode="marketing" editorial />
      </div>

    </div>
  </section>
</template>

<script setup>
import DemoFanIntelligenceShowcase from '@/components/marketing/DemoFanIntelligenceShowcase.vue'
</script>

<style scoped>
.home-v2-fi { background: #050608; }

.fi-title {
  font-size: clamp(2.35rem, 8.8vw, 3.55rem);
  font-weight: 800;
  line-height: 0.9;
  letter-spacing: -0.05em;
}

.fi-title__accent {
  display: block;
  margin-top: 0.12em;
  background: linear-gradient(90deg, #4ca6ff 0%, #39d5ff 52%, #45e3ae 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

</style>
