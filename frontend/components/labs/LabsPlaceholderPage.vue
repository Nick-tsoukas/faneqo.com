<template>
  <LabsShell :title="title">
    <p class="labs-empty">{{ body }}</p>
  </LabsShell>
</template>

<script setup>
import LabsShell from '@/components/labs/LabsShell.vue'

defineProps({
  title: { type: String, required: true },
  body: { type: String, required: true },
})
</script>

<style scoped>
.labs-empty {
  color: #9aa6b5;
  line-height: 1.5;
}
</style>
