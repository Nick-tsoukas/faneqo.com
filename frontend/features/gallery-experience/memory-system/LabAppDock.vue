<template>
  <nav class="fq-gd-dock" aria-label="App navigation, simulated">
    <p class="fq-gd-dock__note">Lab shell · not production nav</p>
    <div class="fq-gd-dock__row">
      <span
        v-for="item in items"
        :key="item.id"
        class="fq-gd-dock__item"
        :class="{ 'is-active': item.id === 'gallery' }"
        :aria-current="item.id === 'gallery' ? 'page' : undefined"
      >
        {{ item.label }}
      </span>
    </div>
  </nav>
</template>

<script setup>
const items = [
  { id: 'home', label: 'Home' },
  { id: 'messages', label: 'Messages' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'artist', label: 'Artist' },
]
</script>
