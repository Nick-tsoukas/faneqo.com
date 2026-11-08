<template>
  <MessagesHome :conversation-id="conversationId" />
</template>

<script setup>
import MessagesHome from '~/components/messages/MessagesHome.vue'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const conversationId = computed(() => route.params.conversationId)

useHead({
  title: 'Messages',
})
</script>
