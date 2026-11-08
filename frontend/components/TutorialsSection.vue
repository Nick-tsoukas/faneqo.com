<script setup>
const props = defineProps({
  heading: { type: String, default: '🎥 Video Tutorials' },
  id: { type: String, default: 'videos' },
  videos: {
    type: Array,
    default: () => [],
  },
  gridClass: {
    type: String,
    default: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6',
  },
})
</script>

<template>
  <section :id="id" class="relative bg-black py-16 overflow-hidden">
    <div class="pointer-events-none absolute inset-0 -z-10">
      <div class="absolute -top-24 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full bg-violet-500/12 blur-3xl"></div>
      <div class="absolute -bottom-28 right-[-120px] h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-3xl"></div>
    </div>

    <div class="max-w-6xl mx-auto px-6">
      <div class="flex items-center justify-center">
        <span class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold tracking-wide text-white/85">
          <span class="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.35)]"></span>
          Video Tutorials
        </span>
      </div>

      <h2 class="mt-4 text-4xl md:text-5xl font-extrabold text-center tracking-tight">
        <span class="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-violet-500 to-emerald-400">
          {{ heading }}
        </span>
      </h2>

      <div class="mt-10" :class="gridClass">
        <VideoCard
          v-for="(v, i) in videos"
          :key="v.id + '-' + i"
          :video-id="v.id"
          :title="v.title"
          :thumb="v.thumb"
        />
      </div>
    </div>
  </section>
</template>
