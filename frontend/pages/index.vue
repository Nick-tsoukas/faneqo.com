<template>
  <!-- Production homepage. Old layout lives at /home-classic (noindex). -->
  <HomeV2Page />
</template>

<script setup>
import HomeV2Page from '@/components/home-v2/HomeV2Page.vue'
import { applyHomepageSeo } from '~/utils/home/homepageContent'

definePageMeta({ layout: false })

applyHomepageSeo()
</script>

<!--
  Homepage document scroll restore.
  Global html/body use height 100% plus overflow-x hidden, which makes BODY
  the real scroller while window.scrollY stays 0 — section motion then
  never sees progress.
-->
<style>
html.home-v2-route,
html.home-v2-route body {
  height: auto;
  min-height: 100%;
  overflow-x: clip;
  overflow-y: visible;
}
</style>
