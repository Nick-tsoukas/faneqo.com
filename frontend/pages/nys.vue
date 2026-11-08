<template>
  <div class="min-h-screen bg-black text-white">
    <!-- Hero Section -->
    <section class="relative min-h-screen flex items-center justify-center overflow-hidden">
      <!-- Background gradient -->
      <div class="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-emerald-900/20" />
      
      <!-- NYC skyline silhouette overlay -->
      <div class="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black to-transparent" />
      
      <!-- Content -->
      <div class="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
        <!-- Badge -->
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-8">
          <span class="text-2xl">🗽</span>
          <span class="text-sm font-medium text-white/90">Made for NYS Artists</span>
        </div>
        
        <!-- Main headline -->
        <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
          <span class="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-violet-500 to-emerald-400">
            MusicBizQR
          </span>
        </h1>
        
        <p class="text-xl md:text-2xl text-white/80 font-medium mb-4">
          One QR. Every platform. Real-time analytics.
        </p>
        
        <p class="text-lg text-white/60 max-w-2xl mx-auto mb-10">
          Create a smart link page for your music, print one QR code that you can update anytime, 
          and track what fans do after they scan.
        </p>
        
        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <NuxtLink
            to="/signup"
            class="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-purple-500/25"
          >
            Get Started Free
          </NuxtLink>
          <NuxtLink
            to="/demo"
            class="w-full sm:w-auto px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-lg transition-all"
          >
            See Demo
          </NuxtLink>
        </div>
        
        <!-- Feature highlights -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div class="text-3xl mb-2">🎵</div>
            <h3 class="font-semibold text-white mb-1">All Your Links</h3>
            <p class="text-sm text-white/60">Spotify, Apple Music, YouTube, SoundCloud & more</p>
          </div>
          <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div class="text-3xl mb-2">📊</div>
            <h3 class="font-semibold text-white mb-1">Track Scans</h3>
            <p class="text-sm text-white/60">See who's scanning and what they click</p>
          </div>
          <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div class="text-3xl mb-2">🎫</div>
            <h3 class="font-semibold text-white mb-1">Sell Tickets</h3>
            <p class="text-sm text-white/60">Add shows, merch, and tip jars</p>
          </div>
        </div>
      </div>
    </section>
    
    <!-- How It Works -->
    <section class="py-20 px-6 bg-gradient-to-b from-black to-[#0a0a0a]">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-3xl md:text-4xl font-bold text-center mb-12">
          How It Works
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center">
            <div class="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold text-purple-400">1</span>
            </div>
            <h3 class="font-semibold text-lg mb-2">Create Your Page</h3>
            <p class="text-white/60 text-sm">Add your music links, bio, and upcoming shows</p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold text-pink-400">2</span>
            </div>
            <h3 class="font-semibold text-lg mb-2">Get Your QR</h3>
            <p class="text-white/60 text-sm">Download and print on flyers, stickers, merch</p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold text-emerald-400">3</span>
            </div>
            <h3 class="font-semibold text-lg mb-2">Track Results</h3>
            <p class="text-white/60 text-sm">See analytics and update your links anytime</p>
          </div>
        </div>
      </div>
    </section>
    
    <!-- NYC Specific Section -->
    <section class="py-20 px-6 bg-[#0a0a0a]">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-3xl md:text-4xl font-bold mb-6">
          Built for the New York State Music Scene
        </h2>
        <p class="text-lg text-white/70 max-w-2xl mx-auto mb-10">
          Whether you're playing NYC clubs, Buffalo venues, or Albany stages — 
          MusicBizQR helps you connect with fans and grow your audience.
        </p>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-12">
          <div class="p-4 rounded-xl bg-white/5 border border-white/10">
            <div class="text-2xl mb-1">🎤</div>
            <div class="text-sm text-white/70">Venues</div>
          </div>
          <div class="p-4 rounded-xl bg-white/5 border border-white/10">
            <div class="text-2xl mb-1">📀</div>
            <div class="text-sm text-white/70">Labels</div>
          </div>
          <div class="p-4 rounded-xl bg-white/5 border border-white/10">
            <div class="text-2xl mb-1">🎸</div>
            <div class="text-sm text-white/70">Bands</div>
          </div>
          <div class="p-4 rounded-xl bg-white/5 border border-white/10">
            <div class="text-2xl mb-1">🎧</div>
            <div class="text-sm text-white/70">DJs</div>
          </div>
        </div>
        
        <!-- Final CTA -->
        <NuxtLink
          to="/signup"
          class="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-purple-500/25"
        >
          Start Free Today
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </NuxtLink>
      </div>
    </section>
    
    <!-- Footer -->
    <footer class="py-8 px-6 border-t border-white/10">
      <div class="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="text-white/50 text-sm">
          © {{ new Date().getFullYear() }} MusicBizQR. All rights reserved.
        </div>
        <div class="flex items-center gap-6">
          <NuxtLink to="/privacypolicy" class="text-white/50 hover:text-white text-sm transition">Privacy</NuxtLink>
          <NuxtLink to="/termsofservice" class="text-white/50 hover:text-white text-sm transition">Terms</NuxtLink>
          <NuxtLink to="/contact" class="text-white/50 hover:text-white text-sm transition">Contact</NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false
})

useSeoMeta({
  title: 'MusicBizQR NYS - Smart Links for New York Artists',
  description: 'Create a smart link page for your music, print one QR code, and track what fans do after they scan. Built for New York State artists.',
  ogTitle: 'MusicBizQR NYS - Smart Links for New York Artists',
  ogDescription: 'One QR. Every platform. Real-time analytics. Made for the New York State music scene.',
  ogImage: '/og-nys.png',
  twitterCard: 'summary_large_image'
})
</script>
