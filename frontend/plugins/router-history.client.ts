// /plugins/router-history.client.js
import { defineNuxtPlugin, useRouter } from '#app'
import { ref } from 'vue'

export default defineNuxtPlugin(({ provide }) => {
  const historyStack = ref([])

  const router = useRouter()
  router.beforeEach((to, from) => {
    // only record if we really changed pages
    if (from.fullPath !== to.fullPath && from.name) {
      historyStack.value.push(from)
    }
  })

  provide('historyStack', historyStack)
})
