<template>
  <div class="improved-home bg-black text-white overflow-x-hidden">
    
    <!-- Top Nav -->
    <nav class="relative z-50 border-b border-white/5 backdrop-blur-md bg-black/40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="#" class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center font-bold">M</div>
          <span class="font-bold text-lg">MusicBizQR</span>
        </a>
        <div class="hidden md:flex items-center gap-8 text-sm text-white/70">
          <a href="#features" class="hover:text-white transition">Features</a>
          <a href="#how" class="hover:text-white transition">How It Works</a>
          <a href="#pricing" class="hover:text-white transition">Pricing</a>
          <NuxtLink to="/demo" class="hover:text-white transition">Demo</NuxtLink>
        </div>
        <div class="flex items-center gap-3">
          <NuxtLink to="/login" class="hidden sm:inline text-sm text-white/70 hover:text-white transition">Sign In</NuxtLink>
          <NuxtLink to="/signup" class="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-pink-500/20">Start Free</NuxtLink>
        </div>
      </div>
    </nav>

    <!-- 1. HERO -->
    <section class="relative z-10 px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-24">
      <div class="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <!-- Hero Text -->
        <div class="text-center lg:text-left">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 mb-6">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Built for artists, bands, and live shows
          </div>
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
            Bands Don't Need More Links.<br />
            <span class="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">They Need Fans</span><br />
            They Can Reach Again.
          </h1>
          <p class="mt-6 text-lg text-white/70 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            MusicBizQR helps artists turn every scan, click, and show into a fan relationship — with a free artist page, fan list, QR code, and analytics built for music.
          </p>
          <div class="mt-8 flex flex-col sm:flex-row items-center gap-3 lg:justify-start justify-center">
            <NuxtLink to="/signup" class="cta-primary group">
              Create Your Free Artist Page
              <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
            </NuxtLink>
            <NuxtLink to="/demo" class="cta-secondary">See Live Demo</NuxtLink>
          </div>
          <p class="mt-5 text-sm text-white/50">
            Free account. 30 days of Pro included. Keep your page even if you do not upgrade.
          </p>
        </div>

        <!-- Hero Visual: Demo Artist Profile + Floating cards -->
        <div class="relative flex justify-center lg:justify-end">
          <!-- Floating mini-cards -->
          <div class="hidden md:block absolute -left-4 top-12 z-20 floating-card">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              </div>
              <div>
                <p class="text-xs font-semibold text-white">New fan joined</p>
                <p class="text-[10px] text-white/60">via show QR scan</p>
              </div>
            </div>
          </div>

          <div class="hidden md:block absolute -right-2 top-1/3 z-20 floating-card" style="animation-delay: 1s;">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-pink-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              </div>
              <div>
                <p class="text-xs font-semibold text-white">Fan came back</p>
                <p class="text-[10px] text-white/60">clicked Spotify after joining</p>
              </div>
            </div>
          </div>

          <div class="hidden md:block absolute -left-6 bottom-20 z-20 floating-card" style="animation-delay: 2s;">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z"/></svg>
              </div>
              <div>
                <p class="text-xs font-semibold text-white">Tonight's show is working</p>
                <p class="text-[10px] text-white/60">12 scans · 4 new fans</p>
              </div>
            </div>
          </div>

          <div class="hidden md:block absolute -right-4 bottom-10 z-20 floating-card" style="animation-delay: 3s;">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/></svg>
              </div>
              <div>
                <p class="text-xs font-semibold text-white">Support received</p>
                <p class="text-[10px] text-white/60">$20 tip from artist page</p>
              </div>
            </div>
          </div>

          <DemoArtistProfileShowcase />
        </div>
      </div>
    </section>

    <!-- 2. PROBLEM -->
    <section class="relative z-10 px-4 sm:px-6 lg:px-8 py-20 border-t border-white/5">
      <div class="max-w-5xl mx-auto text-center">
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
          Your artist page should do more than<br class="hidden sm:block" />
          <span class="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">send people away.</span>
        </h2>
        <p class="mt-6 text-lg text-white/70 max-w-3xl mx-auto leading-relaxed">
          Most music links send fans to Spotify, Instagram, YouTube, or ticket pages — and then the moment disappears. MusicBizQR gives artists one beautiful home for every fan interaction, helping you build a fan list, track engagement, and grow relationships from every show, post, flyer, and QR scan.
        </p>

        <div class="mt-12 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <!-- Generic -->
          <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <p class="text-xs uppercase tracking-wider text-white/40 mb-3">Generic link page</p>
            <p class="text-white/80 font-medium leading-relaxed">
              Fan clicks <span class="text-white/40">→</span> leaves <span class="text-white/40">→</span> disappears
            </p>
          </div>
          <!-- MBQ -->
          <div class="p-6 rounded-2xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/30">
            <p class="text-xs uppercase tracking-wider text-pink-300 mb-3">MusicBizQR</p>
            <p class="text-white font-medium leading-relaxed">
              Fan scans <span class="text-pink-400">→</span> joins your list <span class="text-pink-400">→</span> supports you <span class="text-pink-400">→</span> you can reach them again
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. HOW IT WORKS -->
    <section id="how" class="relative z-10 px-4 sm:px-6 lg:px-8 py-20 border-t border-white/5">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-14">
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            <span class="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">Build. Share. Grow.</span>
          </h2>
          <p class="mt-4 text-white/60 text-lg">Three steps from first scan to fans you can reach again.</p>
        </div>
        <div class="grid md:grid-cols-3 gap-6">
          <div v-for="step in steps" :key="step.num" class="step-card group">
            <div class="text-5xl font-black bg-gradient-to-br from-pink-400 to-purple-500 bg-clip-text text-transparent mb-4">{{ step.num }}</div>
            <h3 class="text-xl font-bold text-white mb-2">{{ step.title }}</h3>
            <p class="text-white/60 text-sm leading-relaxed">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. ARTIST PAGE SHOWCASE -->
    <section id="features" class="relative z-10 px-4 sm:px-6 lg:px-8 py-24 border-t border-white/5">
      <div class="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p class="text-sm uppercase tracking-wider text-pink-400 font-semibold mb-4">Artist Page</p>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Your music's home base —<br />
            <span class="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">built to grow fans.</span>
          </h2>
          <p class="mt-6 text-lg text-white/70 leading-relaxed">
            Give fans one beautiful place to hear your music, watch your videos, find your shows, follow your socials, join your fan list, support the artist, and come back when it matters.
          </p>
          <ul class="mt-8 space-y-3">
            <li v-for="feat in pageFeatures" :key="feat" class="flex items-start gap-3">
              <div class="w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
              </div>
              <span class="text-white/80">{{ feat }}</span>
            </li>
          </ul>
        </div>
        <div class="flex justify-center">
          <DemoArtistProfileShowcase :compact="true" />
        </div>
      </div>
    </section>

    <!-- 5. FAN INTELLIGENCE -->
    <section class="relative z-10 px-4 sm:px-6 lg:px-8 py-24 border-t border-white/5">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-14 max-w-3xl mx-auto">
          <p class="text-sm uppercase tracking-wider text-emerald-400 font-semibold mb-4">Fan Intelligence</p>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Build a fan list <span class="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">you can actually use.</span>
          </h2>
          <p class="mt-6 text-lg text-white/70 leading-relaxed">
            See who joined, where they came from, and who is starting to engage — from your artist page, QR codes, shows, and campaigns.
          </p>
        </div>
        <div class="flex justify-center">
          <DemoFanIntelligenceShowcase />
        </div>
      </div>
    </section>

    <!-- 6. SHOW + QR -->
    <section class="relative z-10 px-4 sm:px-6 lg:px-8 py-24 border-t border-white/5">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-14 max-w-3xl mx-auto">
          <p class="text-sm uppercase tracking-wider text-cyan-400 font-semibold mb-4">Live Shows</p>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Every show is a chance to <span class="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">grow your fanbase.</span>
          </h2>
          <p class="mt-6 text-lg text-white/70 leading-relaxed">
            Put one QR code on the merch table, flyer, poster, or stage screen. Fans scan, land on your artist page, join your list, stream your music, save your page, support the band, or grab tickets. After the show, you can see what happened.
          </p>
        </div>

        <!-- Flow diagram -->
        <div class="flex flex-wrap items-center justify-center gap-3 mb-10">
          <div v-for="(node, i) in showFlow" :key="node" class="flex items-center gap-3">
            <div class="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm font-medium text-white/90">{{ node }}</div>
            <svg v-if="i < showFlow.length - 1" class="w-4 h-4 text-white/30 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-5xl mx-auto">
          <div v-for="card in showCards" :key="card.label" class="p-4 rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 text-center">
            <div class="text-2xl font-bold bg-gradient-to-br from-pink-400 to-purple-400 bg-clip-text text-transparent">{{ card.value }}</div>
            <div class="text-xs text-white/60 mt-1">{{ card.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 7. ANALYTICS -->
    <section class="relative z-10 px-4 sm:px-6 lg:px-8 py-24 border-t border-white/5">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-14 max-w-3xl mx-auto">
          <p class="text-sm uppercase tracking-wider text-purple-400 font-semibold mb-4">Analytics</p>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Know what fans do <span class="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">after they click.</span>
          </h2>
          <p class="mt-6 text-lg text-white/70 leading-relaxed">
            Track scans, clicks, fan growth, top sources, cities, music/video engagement, and the moments that are creating real fans.
          </p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div v-for="stat in analyticsStats" :key="stat.label" class="analytics-card">
            <div class="flex items-center justify-between mb-3">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center" :class="stat.bg">
                <span v-html="stat.icon" :class="stat.color"></span>
              </div>
              <span class="text-xs text-emerald-400 font-semibold">{{ stat.delta }}</span>
            </div>
            <div class="text-2xl font-bold text-white">{{ stat.value }}</div>
            <div class="text-xs text-white/50 mt-0.5">{{ stat.label }}</div>
            <!-- Mini bar -->
            <div class="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div class="h-full rounded-full" :class="stat.bar" :style="{ width: stat.fill }"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 8. COMPARISON -->
    <section class="relative z-10 px-4 sm:px-6 lg:px-8 py-24 border-t border-white/5">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-14 max-w-3xl mx-auto">
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Generic link pages stop at the click.<br />
            <span class="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">MusicBizQR helps you grow after it.</span>
          </h2>
        </div>

        <div class="grid md:grid-cols-2 gap-6">
          <div class="p-8 rounded-2xl bg-white/[0.02] border border-white/10">
            <p class="text-xs uppercase tracking-wider text-white/40 mb-4">Generic link page</p>
            <ul class="space-y-3">
              <li v-for="item in genericList" :key="item" class="flex items-center gap-3 text-white/60">
                <svg class="w-4 h-4 text-white/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                {{ item }}
              </li>
            </ul>
          </div>
          <div class="p-8 rounded-2xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/30 relative">
            <div class="absolute -top-3 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-xs font-bold">RECOMMENDED</div>
            <p class="text-xs uppercase tracking-wider text-pink-300 mb-4">MusicBizQR</p>
            <ul class="space-y-3">
              <li v-for="item in mbqList" :key="item" class="flex items-center gap-3 text-white">
                <div class="w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                </div>
                {{ item }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- 9. PRICING -->
    <section id="pricing" class="relative z-10 px-4 sm:px-6 lg:px-8 py-24 border-t border-white/5">
      <div class="max-w-5xl mx-auto">
        <div class="text-center mb-14">
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Start free. Try Pro. <span class="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">Keep your page.</span>
          </h2>
          <p class="mt-5 text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            Create your free MusicBizQR account and get 30 days of Pro included. After the trial, Pro features lock unless you upgrade — but your account and free artist page stay active.
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <!-- Free -->
          <div class="pricing-card">
            <div class="flex items-baseline gap-2 mb-2">
              <h3 class="text-2xl font-bold text-white">Free</h3>
              <span class="text-white/40 text-sm">forever</span>
            </div>
            <p class="text-white/60 text-sm mb-6">For artists who need a beautiful home base.</p>
            <div class="text-5xl font-black mb-6">$0</div>
            <ul class="space-y-2.5 mb-8 text-sm">
              <li v-for="f in freeFeatures" :key="f" class="flex items-center gap-2 text-white/80">
                <svg class="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                {{ f }}
              </li>
            </ul>
            <NuxtLink to="/signup" class="cta-secondary w-full justify-center">Create Free Account</NuxtLink>
          </div>

          <!-- Pro -->
          <div class="pricing-card pricing-pro">
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-xs font-bold whitespace-nowrap">30 DAYS FREE</div>
            <div class="flex items-baseline gap-2 mb-2">
              <h3 class="text-2xl font-bold text-white">Pro</h3>
              <span class="px-2 py-0.5 rounded text-xs bg-pink-500/20 text-pink-300">most popular</span>
            </div>
            <p class="text-white/60 text-sm mb-6">For artists ready to grow from every scan, click, and show.</p>
            <div class="flex items-baseline gap-1 mb-6">
              <span class="text-5xl font-black bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">$7</span>
              <span class="text-white/50">/month</span>
            </div>
            <ul class="space-y-2.5 mb-8 text-sm">
              <li v-for="f in proFeatures" :key="f" class="flex items-center gap-2 text-white">
                <svg class="w-4 h-4 text-pink-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                {{ f }}
              </li>
            </ul>
            <NuxtLink to="/signup" class="cta-primary w-full justify-center">Start Free 30-Day Pro Trial</NuxtLink>
          </div>
        </div>
        <p class="text-center mt-8 text-sm text-white/50">
          Every new account gets 30 days of Pro included. No credit card required to start.
        </p>
      </div>
    </section>

    <!-- 10. FAQ -->
    <section class="relative z-10 px-4 sm:px-6 lg:px-8 py-24 border-t border-white/5">
      <div class="max-w-3xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Frequently asked
          </h2>
        </div>
        <div class="space-y-3">
          <details v-for="(item, i) in faqs" :key="i" class="faq-item group">
            <summary class="flex items-center justify-between cursor-pointer p-5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition">
              <span class="font-semibold text-white">{{ item.q }}</span>
              <svg class="w-5 h-5 text-white/40 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </summary>
            <div class="px-5 pt-3 pb-5 text-white/70 leading-relaxed">{{ item.a }}</div>
          </details>
        </div>
      </div>
    </section>

    <!-- 11. FINAL CTA -->
    <section class="relative z-10 px-4 sm:px-6 lg:px-8 py-24 border-t border-white/5">
      <div class="max-w-4xl mx-auto text-center relative">
        <div class="absolute inset-0 bg-gradient-to-r from-pink-600/20 via-purple-600/20 to-cyan-500/20 blur-3xl rounded-full"></div>
        <div class="relative">
          <h2 class="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Ready to turn clicks into <span class="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">fans you can reach again?</span>
          </h2>
          <p class="mt-6 text-lg text-white/70 max-w-2xl mx-auto">
            Launch your free artist page, share your QR, build your fan list, and try Pro free for 30 days.
          </p>
          <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <NuxtLink to="/signup" class="cta-primary text-base">Create Your Free Artist Page</NuxtLink>
            <NuxtLink to="/demo" class="cta-secondary text-base">See Live Demo</NuxtLink>
          </div>
          <p class="mt-5 text-sm text-white/50">
            Free account. 30 days of Pro included. Built for artists, bands, and live shows.
          </p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="relative z-10 border-t border-white/5 px-4 sm:px-6 lg:px-8 py-10">
      <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/50">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs">M</div>
          <span>© {{ new Date().getFullYear() }} MusicBizQR</span>
        </div>
        <div class="flex items-center gap-6">
          <NuxtLink to="/privacypolicy" class="hover:text-white transition">Privacy</NuxtLink>
          <NuxtLink to="/termsofservice" class="hover:text-white transition">Terms</NuxtLink>
          <NuxtLink to="/contact" class="hover:text-white transition">Contact</NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import DemoArtistProfileShowcase from '@/components/marketing/DemoArtistProfileShowcase.vue'
import DemoFanIntelligenceShowcase from '@/components/marketing/DemoFanIntelligenceShowcase.vue'

useHead({
  title: 'MusicBizQR | Music Smart Links, QR Codes & Fan Growth for Artists',
  meta: [
    {
      name: 'description',
      content: 'Create a free artist page with music links, QR codes, fan list tools, support buttons, and analytics. MusicBizQR helps bands turn scans, clicks, and shows into fans they can reach again.'
    },
    { property: 'og:title', content: 'MusicBizQR | Smart Links, QR Codes & Fan Growth for Artists' },
    { property: 'og:description', content: 'A free artist page, fan list, QR code, and analytics built for music. Turn every scan, click, and show into a fan you can reach again.' },
    { property: 'og:type', content: 'website' }
  ]
})

const steps = [
  { num: '01', title: 'Build your artist page', desc: 'Add music, videos, socials, shows, merch, support buttons, and your fan list.' },
  { num: '02', title: 'Share one QR or link everywhere', desc: 'Use it at shows, on posters, merch tables, stage screens, TikTok, Instagram, and flyers.' },
  { num: '03', title: 'Grow fans you can reach again', desc: 'Collect fan emails, track clicks, see who is engaging, and understand what is creating real fan growth.' }
]

const pageFeatures = [
  'Music & streaming links',
  'Videos and featured tracks',
  'Social links and follow flow',
  'Fan list signup',
  'Support / tip module',
  'Save, share, and QR-ready'
]

const showFlow = [
  'Show QR',
  'Fan scans',
  'Artist page opens',
  'Fan joins / supports',
  'Analytics updates'
]

const showCards = [
  { value: '12', label: 'Scans tonight' },
  { value: '4', label: 'New fans joined' },
  { value: 'Spotify', label: 'Top action' },
  { value: 'Show Mode', label: 'Source' },
  { value: '$20', label: 'Support received' }
]

const analyticsStats = [
  {
    label: 'QR scans',
    value: '342',
    delta: '+18%',
    fill: '78%',
    bg: 'bg-pink-500/15',
    color: 'text-pink-400',
    bar: 'bg-gradient-to-r from-pink-500 to-pink-400',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm4 0h2v2h-2v-2z"/></svg>'
  },
  {
    label: 'Fan growth',
    value: '127',
    delta: '+23',
    fill: '64%',
    bg: 'bg-emerald-500/15',
    color: 'text-emerald-400',
    bar: 'bg-gradient-to-r from-emerald-500 to-cyan-400',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>'
  },
  {
    label: 'Top source',
    value: 'Show QR',
    delta: '+42%',
    fill: '85%',
    bg: 'bg-cyan-500/15',
    color: 'text-cyan-400',
    bar: 'bg-gradient-to-r from-cyan-500 to-blue-400',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>'
  },
  {
    label: 'Music plays',
    value: '1.2K',
    delta: '+9%',
    fill: '52%',
    bg: 'bg-purple-500/15',
    color: 'text-purple-400',
    bar: 'bg-gradient-to-r from-purple-500 to-pink-400',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z"/></svg>'
  }
]

const genericList = [
  'Holds links',
  'Sends fans away',
  'Basic clicks only',
  'Built for everyone',
  'No show context',
  'No fan list intelligence',
  'No music-first fan journey'
]

const mbqList = [
  'Music-first artist page',
  'Dynamic QR code',
  'Fan list',
  'Support / tip module',
  'Fan activity tracking',
  'Show-ready tools',
  'Analytics built for artists',
  'Fans you can reach again'
]

const freeFeatures = [
  'Free artist page',
  'Music and social links',
  'Fan list basics',
  'Shareable URL',
  'Core profile tools',
  'Keep your page active'
]

const proFeatures = [
  'Dynamic QR tools',
  'Advanced fan list tools',
  'Fan intelligence',
  'Analytics dashboard',
  'Show / campaign tracking',
  'Support / tip tools',
  'More customization'
]

const faqs = [
  { q: 'Is MusicBizQR free?', a: 'Yes. You can create a free MusicBizQR account, build a free artist page, and keep it active even if you never upgrade.' },
  { q: 'Do I need a credit card?', a: 'No credit card required to start. You only add payment details if you decide to continue Pro after the 30-day trial.' },
  { q: 'What happens after the 30-day Pro trial?', a: 'Pro features lock unless you upgrade. Your account and free artist page stay active either way.' },
  { q: 'Can I keep my artist page if I do not upgrade?', a: 'Yes. Your free artist page stays live forever, even after the Pro trial ends.' },
  { q: 'How is this different from Linktree?', a: 'MusicBizQR is built for music. You get a music-first artist page, dynamic QR code, fan list with engagement tracking, support/tip tools, and analytics built for artists — not a generic creator link.' },
  { q: 'Can I use MusicBizQR at shows?', a: 'Yes. Print one QR code on posters, flyers, the merch table, or a stage screen. Fans scan, land on your artist page, and join your list. After the show you can see what happened.' },
  { q: 'Can fans join my fan list?', a: 'Yes. Fans can join your list directly from your artist page. You see who joined, where they came from, and what they did.' },
  { q: 'Can fans support or tip the artist?', a: 'Yes. The support module lets fans tip or support you directly from your artist page.' },
  { q: 'Can I see where fans came from?', a: 'Yes. Every fan is tagged with a source — Show QR, Band Page, Poster QR, Show Mode, and more.' },
  { q: 'Can I import or export my fan list?', a: 'Yes. You can import existing fans via CSV and export your list any time.' }
]
</script>

<style scoped>
.improved-home {
  min-height: 100vh;
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

/* Floating cards */
.floating-card {
  padding: 0.75rem 1rem;
  background: rgba(20, 20, 25, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.875rem;
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5);
}


/* Step cards */
.step-card {
  position: relative;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.25rem;
  transition: all 0.3s;
}
.step-card:hover {
  border-color: rgba(236, 72, 153, 0.3);
  transform: translateY(-4px);
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.08), rgba(168, 85, 247, 0.04));
}

/* Analytics card */
.analytics-card {
  padding: 1.25rem;
  background: linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  transition: all 0.2s;
}
.analytics-card:hover {
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

/* Pricing cards */
.pricing-card {
  position: relative;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.5rem;
  transition: all 0.3s;
}
.pricing-card:hover {
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-4px);
}
.pricing-pro {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.08), rgba(168, 85, 247, 0.06));
  border-color: rgba(236, 72, 153, 0.3);
  box-shadow: 0 20px 60px -20px rgba(236, 72, 153, 0.3);
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
