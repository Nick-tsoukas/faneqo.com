<template>
  <div class="mx-auto max-w-5xl pt-[var(--header-height)]" >
    <ClientOnly>
      <EditQrCode />
    </ClientOnly>
  </div>
</template>

<script setup>
const route = useRoute();
</script>
