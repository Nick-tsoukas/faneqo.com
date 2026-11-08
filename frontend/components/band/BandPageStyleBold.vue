<template>
  <div class="bg-black rounded-xl overflow-hidden text-white text-xs scale-[0.85] origin-top">
    <!-- Immersive Hero -->
    <div class="relative h-48 overflow-hidden">
      <img :src="neonPoster" alt="Band" class="absolute inset-0 w-full h-full object-cover" />
      <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
      <div class="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-pink-900/20" />
      
      <!-- Live Badges Row -->
      <div class="absolute top-3 left-3 right-3 flex items-center gap-1.5 flex-wrap">
        <!-- Live Badge -->
        <div class="flex items-center gap-1 rounded-full border border-white/20 bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-white">
          <span class="relative flex h-1.5 w-1.5">
            <span class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
            <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          </span>
          Live
        </div>
        <!-- On Tour Badge -->
        <div class="flex items-center gap-1 rounded-full border border-white/20 bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-purple-300">
          <span>🚐</span>
          <span>On tour</span>
        </div>
        <!-- Genre Badge -->
        <div class="px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-[10px]">
          Indie Rock
        </div>
      </div>
      
      <!-- Artist Info -->
      <div class="absolute bottom-0 left-0 right-0 p-4">
        <h2 class="text-2xl font-black tracking-tight">The Velvet Echo</h2>
        <p class="text-white/70 text-[10px] mt-1 line-clamp-2">Blending dreamy synths with raw guitar energy</p>
      </div>
    </div>

    <!-- Sticky Nav Preview -->
    <div class="bg-black/80 backdrop-blur border-b border-white/10 px-3 py-2 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-full bg-purple-500/30 border border-white/20" />
        <span class="font-semibold text-[10px]">The Velvet Echo</span>
      </div>
      <div class="flex gap-1">
        <div class="px-2 py-1 rounded-full bg-purple-600 text-[9px] font-semibold">Follow</div>
        <div class="p-1 rounded-full bg-white/10">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </div>
      </div>
    </div>

    <div class="p-4 space-y-5">
      <!-- Featured Section -->
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <div class="w-0.5 h-4 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
          <span class="font-bold text-sm">Featured</span>
        </div>
        <div class="bg-white/5 border border-white/10 rounded-xl p-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div>
              <div class="font-semibold text-[11px]">Midnight Drive</div>
              <div class="text-white/50 text-[9px]">Featured Track</div>
            </div>
          </div>
        </div>
        <!-- Featured Video -->
        <div class="relative aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/10">
          <img :src="neonPoster" alt="Video thumbnail" class="absolute inset-0 w-full h-full object-cover opacity-50" />
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
              <svg class="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          <div class="absolute bottom-2 left-2">
            <div class="text-white font-semibold text-[10px]">Live at The Echo</div>
            <div class="text-white/60 text-[8px]">2:14 highlight</div>
          </div>
        </div>
      </div>

      <!-- Streaming Bento Grid -->
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <div class="w-0.5 h-4 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full" />
          <span class="font-bold text-sm">Listen</span>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div class="col-span-2 bg-gradient-to-br from-[#1DB954]/20 to-[#1DB954]/5 border border-[#1DB954]/30 rounded-xl p-3 flex items-center gap-3">
            <img :src="spotifyIcon" alt="Spotify" class="w-6 h-6" />
            <div>
              <div class="font-semibold text-[11px]">Spotify</div>
              <div class="text-white/50 text-[9px]">Stream now</div>
            </div>
          </div>
          <div class="bg-white/5 border border-white/10 rounded-xl p-2 flex items-center gap-2">
            <img :src="appleMusicIcon" alt="Apple Music" class="w-5 h-5" />
            <span class="text-[10px]">Apple Music</span>
          </div>
          <div class="bg-white/5 border border-white/10 rounded-xl p-2 flex items-center gap-2">
            <img :src="youtubeIcon" alt="YouTube" class="w-5 h-5" />
            <span class="text-[10px]">YouTube</span>
          </div>
        </div>
      </div>

      <!-- Social Pills -->
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <div class="w-0.5 h-4 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full" />
          <span class="font-bold text-sm">Connect</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <img :src="instagramIcon" alt="Instagram" class="w-4 h-4" />
            <span class="text-[10px]">Instagram</span>
          </div>
          <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <img :src="tiktokIcon" alt="TikTok" class="w-4 h-4" />
            <span class="text-[10px]">TikTok</span>
          </div>
        </div>
      </div>

      <!-- Next Show Card -->
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <div class="w-0.5 h-4 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full" />
          <span class="font-bold text-sm">Live Shows</span>
        </div>
        <div class="bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-400/20 rounded-xl p-3">
          <div class="flex items-center gap-2 mb-2">
            <span class="relative flex h-2 w-2">
              <span class="absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75 animate-ping"></span>
              <span class="relative inline-flex h-2 w-2 rounded-full bg-orange-400"></span>
            </span>
            <span class="text-orange-300 text-[9px] font-semibold">Next Show</span>
          </div>
          <div class="font-bold">Los Angeles, CA</div>
          <div class="text-white/60 text-[10px]">The Fillmore • Mar 8</div>
        </div>
      </div>

      <!-- Support Section -->
      <div class="bg-gradient-to-br from-purple-900/40 via-violet-900/30 to-pink-900/40 border border-purple-400/20 rounded-2xl p-4 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl" />
        <div class="relative text-center">
          <div class="text-lg mb-1">💜</div>
          <div class="font-bold">Support the Band</div>
          <div class="text-white/50 text-[9px] mt-1">Help fuel the music</div>
          <div class="grid grid-cols-3 gap-2 mt-3">
            <div class="py-2 rounded-xl bg-white/10 border border-white/20 font-semibold">$5</div>
            <div class="py-2 rounded-xl bg-white/10 border border-white/20 font-semibold">$10</div>
            <div class="py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-bold relative">
              $20
              <span class="absolute -top-1 -right-1 px-1 py-0.5 bg-yellow-400 text-yellow-900 text-[7px] font-bold rounded-full">Popular</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="grid grid-cols-3 gap-2 pt-2">
        <div class="flex flex-col items-center gap-1 p-3 rounded-xl bg-gradient-to-b from-purple-600/20 to-purple-600/5 border border-purple-500/30">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
          </svg>
          <span class="text-[9px] font-semibold">Follow</span>
        </div>
        <div class="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 border border-white/10">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
          <span class="text-[9px] font-semibold">Save</span>
        </div>
        <div class="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 border border-white/10">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span class="text-[9px] font-semibold">Share</span>
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
import instagramIcon from '@/assets/instagramfree.png'
import tiktokIcon from '@/assets/tiktok.png'
</script>
