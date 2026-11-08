<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
const isTH = ref(false)

// detect Thailand on client (fast + simple via browser locale)
onMounted(() => {
  const locale = navigator.language || navigator.languages[0]
  if (locale?.toLowerCase().startsWith("th")) {
    isTH.value = true
    document.documentElement.classList.add("th-font") // add class to <html>
  }
})

useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;600;700&display=swap'
    },

    // Icons (apple-touch-icon is declared centrally in nuxt.config.ts)
    { rel: 'icon', type: 'image/x-icon', href: '/faneqo-favicon.ico' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/faneqo-favicon-32.png' },
    { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/faneqo-favicon-16.png' },
    { rel: 'android-chrome', sizes: '512x512', href: '/faneqo-icon-512.png' },
    { rel: 'android-chrome', sizes: '192x192', href: '/faneqo-icon-192.png' }
  ]
})
</script>

<style>
/* Default font (global) */
html, body {
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif;
}

/* ✅ Only applies if user is from Thailand */
html.th-font {
  font-family: 'Noto Sans Thai', system-ui, -apple-system, 'Segoe UI',
    Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif;
}
</style>
