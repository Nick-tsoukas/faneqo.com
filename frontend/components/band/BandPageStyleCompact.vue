<template>
  <div class="band-style-compact w-full">
    <!-- Hero Image with Real Poster -->
    <div class="relative aspect-[16/10] rounded-t-2xl overflow-hidden">
      <img 
        :src="neonPoster" 
        alt="Neon Avenue" 
        class="absolute inset-0 w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      
      <!-- Live Badges Row -->
      <div class="absolute top-3 left-3 right-3 flex items-center gap-2 flex-wrap">
        <!-- Live Badge -->
        <div class="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-white">
          <span class="relative flex h-2 w-2">
            <span class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
            <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
          </span>
          Live
        </div>
        <!-- On Tour Badge -->
        <div class="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-purple-300">
          <span>🚐</span>
          <span>On tour</span>
        </div>
        <!-- New Release Badge -->
        <div class="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-emerald-300">
          <span>🔥</span>
          <span>New release</span>
        </div>
      </div>

      <!-- Artist Info Overlay -->
      <div class="absolute bottom-0 left-0 right-0 p-5">
        <h2 class="text-3xl font-bold text-white tracking-tight">Neon Avenue</h2>
        <p class="text-white/70 text-sm mt-1">Indie pop for night drives and neon signs</p>
      </div>
    </div>

    <!-- Content -->
    <div class="bg-gradient-to-b from-black/95 to-black border-x border-b border-white/10 rounded-b-2xl p-5 space-y-5">
      <!-- Featured Song with Audio Player Look -->
      <div class="bg-white/5 border border-white/10 rounded-xl p-4">
        <div class="flex items-center gap-4">
          <div class="relative w-14 h-14 rounded-lg overflow-hidden shrink-0">
            <img :src="neonPoster" alt="Album art" class="w-full h-full object-cover" />
            <div class="absolute inset-0 flex items-center justify-center bg-black/40">
              <div class="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <svg class="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-white font-semibold truncate">Turns Me On</div>
            <div class="text-white/60 text-sm">New Single • 3:24</div>
            <!-- Progress bar -->
            <div class="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
              <div class="h-full w-1/3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Featured Video -->
      <div class="relative aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/10">
        <img :src="neonPoster" alt="Video thumbnail" class="absolute inset-0 w-full h-full object-cover opacity-60" />
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
            <svg class="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        <div class="absolute bottom-2 left-2 right-2">
          <div class="text-white font-semibold text-sm">Live at The Echo</div>
          <div class="text-white/60 text-xs">2:14 highlight</div>
        </div>
      </div>

      <!-- Streaming Links -->
      <div>
        <h3 class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Listen Now</h3>
        <div class="grid grid-cols-2 gap-2">
          <button class="flex items-center gap-3 px-4 py-3 bg-[#1DB954]/10 border border-[#1DB954]/30 rounded-xl hover:bg-[#1DB954]/20 transition group">
            <img :src="spotifyIcon" alt="Spotify" class="w-6 h-6" />
            <span class="text-white text-sm font-medium">Spotify</span>
          </button>
          <button class="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition group">
            <img :src="appleMusicIcon" alt="Apple Music" class="w-6 h-6" />
            <span class="text-white text-sm font-medium">Apple</span>
          </button>
          <button class="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition group">
            <img :src="youtubeIcon" alt="YouTube" class="w-6 h-6" />
            <span class="text-white text-sm font-medium">YouTube</span>
          </button>
          <button class="flex items-center gap-3 px-4 py-3 bg-orange-500/10 border border-orange-500/20 rounded-xl hover:bg-orange-500/20 transition group">
            <img :src="soundcloudIcon" alt="SoundCloud" class="w-6 h-6" />
            <span class="text-white text-sm font-medium">SoundCloud</span>
          </button>
        </div>
      </div>

      <!-- Social Links -->
      <div>
        <h3 class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Follow</h3>
        <div class="flex gap-2">
          <button class="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/20 rounded-xl hover:from-purple-500/20 hover:to-pink-500/20 transition">
            <img :src="instagramIcon" alt="Instagram" class="w-5 h-5" />
            <span class="text-white text-sm">Instagram</span>
          </button>
          <button class="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition">
            <img :src="tiktokIcon" alt="TikTok" class="w-5 h-5" />
            <span class="text-white text-sm">TikTok</span>
          </button>
          <button class="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition">
            <img :src="twitterIcon" alt="X" class="w-5 h-5" />
            <span class="text-white text-sm">X</span>
          </button>
        </div>
      </div>

      <!-- Upcoming Show -->
      <div class="bg-gradient-to-br from-purple-500/10 to-violet-500/5 border border-purple-400/20 rounded-xl p-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-purple-300 text-xs font-semibold uppercase tracking-wider">Next Show</div>
            <div class="text-white font-bold text-lg mt-1">Los Angeles, CA</div>
            <div class="text-white/70 text-sm">The Troubadour • Feb 21</div>
          </div>
          <button class="px-4 py-2 bg-purple-500/20 border border-purple-400/40 rounded-lg text-purple-200 text-sm font-semibold hover:bg-purple-500/30 transition">
            Tickets
          </button>
        </div>
      </div>

      <!-- Tip Section -->
      <div class="bg-gradient-to-r from-pink-500/10 to-violet-500/10 border border-pink-400/20 rounded-xl p-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-white font-bold">Tip the Band</div>
            <div class="text-white/60 text-sm">Support the tour</div>
          </div>
          <div class="flex gap-2">
            <button class="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm font-medium hover:bg-white/20 transition">$5</button>
            <button class="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm font-medium hover:bg-white/20 transition">$10</button>
            <button class="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-violet-500 rounded-lg text-white text-sm font-semibold hover:from-pink-400 hover:to-violet-400 transition">$20</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import neonPoster from '@/assets/neonposter.png'
import spotifyIcon from '@/assets/spotify.svg'
import appleMusicIcon from '@/assets/apple.svg'
import youtubeIcon from '@/assets/youtube-icon.svg'
import soundcloudIcon from '@/assets/soundcloudlast.png'
import instagramIcon from '@/assets/instagramfree.png'
import tiktokIcon from '@/assets/tiktok.png'
import twitterIcon from '@/assets/twitter.png'
</script>

<style scoped>
.band-style-compact {
  box-shadow: 
    0 0 80px rgba(139, 92, 246, 0.15),
    0 25px 60px -12px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
</style>
