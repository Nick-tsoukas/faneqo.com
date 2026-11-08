<template>
  <section class="relative overflow-hidden ">
    <div class="flex w-full">
      <!-- Wrapper for infinite scrolling -->
      <div ref="scrollContainer" class="flex w-screen animate-scroll space-x-6">
        <template v-for="n in 2" :key="n">
          <div
            v-for="icon in icons"
            :key="icon.name + n"
            class="h-20 w-20 md:w-28 md:h-28 flex items-center justify-center"
          >
            <Icon :icon="icon.icon" class="h-20 w-20 md:w-28 md:h-28 text-purple-900" />
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup>
import { Icon } from "@iconify/vue";

// Icons array
const icons = [
 
  { name: "Spotify", icon: "mdi:spotify" },
  { name: "Apple Music", icon: "mdi:apple" },
  { name: "YouTube", icon: "mdi:youtube" },
  { name: "Twitch", icon: "mdi:twitch" },
  { name: "Instagram", icon: "mdi:instagram" },
  { name: "Twitter", icon: "mdi:twitter" },
  { name: "Facebook", icon: "mdi:facebook" },
  { name: "SoundCloud", icon: "mdi:soundcloud" },
  { name: "Spotify", icon: "mdi:spotify" },
  { name: "Apple Music", icon: "mdi:apple" },
  { name: "YouTube", icon: "mdi:youtube" },
  { name: "Twitch", icon: "mdi:twitch" },
  { name: "Instagram", icon: "mdi:instagram" },
  { name: "Twitter", icon: "mdi:twitter" },
  { name: "Facebook", icon: "mdi:facebook" },
  { name: "SoundCloud", icon: "mdi:soundcloud" },
];
</script>

<style>
@keyframes scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

/* Default (Desktop) */
.animate-scroll {
  display: flex;
  white-space: nowrap;
  animation: scroll 15s linear infinite;
}

/* Faster Speed on Mobile */
@media (max-width: 768px) {
  .animate-scroll {
    animation-duration: 8s; /* Reduce duration for faster effect */
  }
}

</style>
