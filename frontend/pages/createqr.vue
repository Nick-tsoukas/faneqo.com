
<script  setup>

const route = useRoute()
const type = route.query.type
</script>

<template >

<div class="pt-[var(--header-height)]">
  
    <ClientOnly  >
      <QrCode />
    </ClientOnly>
  </div>

</template>



