<template>
  <div class="band-style-classic w-full bg-black rounded-xl overflow-hidden">
    <!-- Hero Section -->
    <div class="relative w-full h-48 md:h-64">
      <img 
        :src="neonPoster" 
        alt="Neon Avenue" 
        class="absolute inset-0 w-auto m-auto h-full object-cover"
      />
    </div>

    <!-- Band Name -->
    <div class="text-center text-white text-3xl font-bold mt-4">
      Neon Avenue
    </div>

    <!-- Bio & Tagline -->
    <div class="flex justify-center mt-4 px-4">
      <div class="text-center text-white max-w-5xl">
        <p class="text-lg leading-tight">
          Indie pop for night drives and neon signs.
        </p>
        <p class="text-lg leading-tight mt-2 text-purple-400">
          New single out now — tap play below.
        </p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="w-full px-4 mt-6 pb-6">
      <!-- Featured Song -->
      <section class="mt-6">
        <h2 class="text-2xl font-bold text-white mb-4">
          Featured Song
        </h2>
        <div class="bg-white/5 border border-white/10 rounded-lg p-4">
          <div class="flex items-center gap-4">
            <div class="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
              <img :src="neonPoster" alt="Album art" class="w-full h-full object-cover" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-white font-semibold">Turns Me On</div>
              <div class="text-white/50 text-sm">New Single</div>
            </div>
            <button class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
              <svg class="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <!-- Featured Video -->
      <section class="mt-8">
        <h2 class="text-2xl font-bold text-white mb-4">
          Featured Video
        </h2>
        <div class="relative aspect-video rounded-lg overflow-hidden bg-black">
          <img :src="neonPoster" alt="Video thumbnail" class="absolute inset-0 w-full h-full object-cover opacity-60" />
          <div class="absolute inset-0 bg-black/30"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border border-white/15">
              <svg class="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <!-- Streaming Links -->
      <section class="mt-8">
        <h2 class="text-2xl font-bold text-white mb-4">Streaming Links</h2>
        <div class="space-y-3">
          <button class="w-full border border-white bg-transparent text-white flex items-center gap-3 font-semibold px-4 py-3 rounded-md hover:bg-white/5 transition">
            <img :src="spotifyIcon" alt="Spotify" class="w-7 h-7" />
            <span class="text-lg">Spotify</span>
          </button>
          <button class="w-full border border-white bg-transparent text-white flex items-center gap-3 font-semibold px-4 py-3 rounded-md hover:bg-white/5 transition">
            <img :src="appleMusicIcon" alt="Apple Music" class="w-7 h-7" />
            <span class="text-lg">Apple Music</span>
          </button>
          <button class="w-full border border-white bg-transparent text-white flex items-center gap-3 font-semibold px-4 py-3 rounded-md hover:bg-white/5 transition">
            <img :src="youtubeIcon" alt="YouTube" class="w-7 h-7" />
            <span class="text-lg">YouTube</span>
          </button>
        </div>
      </section>

      <!-- Social Links -->
      <section class="mt-8">
        <h2 class="text-2xl font-bold text-white mb-4">Social Media</h2>
        <div class="space-y-3">
          <button class="w-full border border-white bg-transparent text-white flex items-center gap-3 font-semibold px-4 py-3 rounded-md hover:bg-white/5 transition">
            <img :src="instagramIcon" alt="Instagram" class="w-7 h-7" />
            <span class="text-lg">Instagram</span>
          </button>
          <button class="w-full border border-white bg-transparent text-white flex items-center gap-3 font-semibold px-4 py-3 rounded-md hover:bg-white/5 transition">
            <img :src="tiktokIcon" alt="TikTok" class="w-7 h-7" />
            <span class="text-lg">TikTok</span>
          </button>
        </div>
      </section>

      <!-- Upcoming Shows -->
      <section class="mt-8">
        <h2 class="text-2xl font-bold text-white mb-4">Upcoming Events</h2>
        <div class="border border-white/70 bg-black/10 rounded-2xl p-4">
          <div class="text-white/70 text-sm font-semibold">Next Show</div>
          <div class="text-2xl font-bold text-white mt-1">Los Angeles, CA</div>
          <div class="text-white/85 mt-1 font-semibold">The Troubadour</div>
          <div class="text-white/60 text-sm mt-1">Feb 21, 2026</div>
          <button class="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition">
            Get Tickets
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import neonPoster from '@/assets/neonposter.png'
import spotifyIcon from '@/assets/spotify.svg'
import appleMusicIcon from '@/assets/apple.svg'
import youtubeIcon from '@/assets/youtube-icon.svg'
import instagramIcon from '@/assets/instagramfree.png'
import tiktokIcon from '@/assets/tiktok.png'
</script>

<style scoped>
.band-style-classic {
  box-shadow: 
    0 0 60px rgba(139, 92, 246, 0.1),
    0 25px 50px -12px rgba(0, 0, 0, 0.5);
}
</style>
