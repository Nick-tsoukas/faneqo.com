// plugins/vue-quill.client.ts
import { defineNuxtPlugin } from '#app'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

export default defineNuxtPlugin((nuxtApp) => {
  // nuxtApp.vueApp is the actual Vue application instance
  nuxtApp.vueApp.component('QuillEditor', QuillEditor)
})