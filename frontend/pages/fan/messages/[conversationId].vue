<template>
  <FanMessagesHome :conversation-id="conversationId" />
</template>

<script setup>
import FanMessagesHome from '~/components/messages/FanMessagesHome.vue'

const route = useRoute()
const conversationId = computed(() => route.params.conversationId)

useHead({
  title: 'Messages',
})
</script>
