<template>
  <MessagesHome />
</template>

<script setup>
import MessagesHome from '~/components/messages/MessagesHome.vue'

definePageMeta({
  middleware: 'auth',
})

useHead({
  title: 'Messages',
})
</script>
