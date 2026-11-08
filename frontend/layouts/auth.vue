<template>
  <div class="auth-layout">
    <Head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    </Head>
    <div class="auth-layout__nav hidden lg:block">
      <Header />
    </div>
    <slot />
    <ClientOnly>
      <NetworkStatus />
    </ClientOnly>
  </div>
</template>

<script setup>
useHead({
  titleTemplate: (titleChunk) => {
    const title = String(titleChunk || '').trim()
    if (!title) return 'Faneqo'
    return /faneqo/i.test(title) ? title : `${title} | Faneqo`
  },
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>

<style scoped>
.auth-layout {
  min-height: 100dvh;
  background: #050506;
  overscroll-behavior-x: auto;
  touch-action: pan-x pan-y;
}
</style>

<style>
/* Auth desktop reuses Header. Search must stay quieter than the stage. */
@media (min-width: 1024px) {
  .auth-layout .header-search {
    border-color: rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.035);
    box-shadow: none;
    color: rgba(245, 245, 246, 0.55);
  }

  .auth-layout .header-search__label {
    color: rgba(245, 245, 246, 0.55);
  }

  .auth-layout .header-search__icon {
    color: rgba(245, 245, 246, 0.42);
    filter: none;
  }

  .auth-layout .header-search__kbd {
    border-color: rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.28);
    color: rgba(245, 245, 246, 0.38);
  }

  .auth-layout .header-search:hover,
  .auth-layout .header-search:focus-visible {
    border-color: rgba(255, 255, 255, 0.16);
    background: rgba(255, 255, 255, 0.055);
    box-shadow: none;
  }
}
</style>
