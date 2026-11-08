<template>
  <div class="aw-root">
    <slot />
  </div>
</template>

<script setup>
useHead({
  htmlAttrs: { class: 'aw-html' },
  bodyAttrs: { class: 'aw-body' },
})
</script>

<style>
.aw-html,
.aw-body {
  background: #050506;
}
.aw-root {
  min-height: 100dvh;
  background: #050506;
  color: #f5f5f6;
}
</style>
