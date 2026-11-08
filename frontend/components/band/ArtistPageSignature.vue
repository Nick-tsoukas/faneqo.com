<template>
  <footer class="artist-signature">
    <div class="artist-signature__inner">
      <NuxtLink to="/" class="artist-signature__mark" aria-label="Faneqo">
        <img src="/faneqo-wordmark-editorial.png?v=2" alt="" width="3398" height="901" />
      </NuxtLink>

      <nav class="artist-signature__nav" aria-label="Faneqo">
        <div class="artist-signature__links">
          <NuxtLink to="/signup">Create your artist page</NuxtLink>
          <NuxtLink to="/contact">Contact</NuxtLink>
        </div>
        <div class="artist-signature__legal">
          <NuxtLink to="/privacypolicy">Privacy</NuxtLink>
          <NuxtLink to="/termsofservice">Terms</NuxtLink>
        </div>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.artist-signature {
  background: transparent;
  color: #f6f3ee;
}

.artist-signature__inner {
  width: min(100%, 48rem);
  margin-inline: auto;
  padding: 1.85rem calc(0.75rem + 1.5rem) calc(1.75rem + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.85rem;
}

.artist-signature__mark {
  display: block;
  width: 7.5rem;
  line-height: 0;
  flex: none;
  border-radius: 0.2rem;
}

.artist-signature__mark img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
}

.artist-signature__nav {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
}

.artist-signature__links,
.artist-signature__legal {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 1.35rem;
}

.artist-signature__nav a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0.2rem 0;
  border-radius: 0.25rem;
  color: rgba(246, 243, 238, 0.74);
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: -0.011em;
  line-height: 1.2;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
}

.artist-signature__legal a {
  color: rgba(246, 243, 238, 0.58);
}

.artist-signature__nav a:hover {
  color: #f7f4ef;
}

.artist-signature__mark:focus-visible,
.artist-signature__nav a:focus-visible {
  outline: 2px solid #67e8f9;
  outline-offset: 3px;
}

@media (min-width: 640px) {
  .artist-signature__inner {
    padding-inline: calc(1rem + 1.5rem);
  }
}

@media (min-width: 768px) {
  .artist-signature__inner {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 2.5rem;
    padding-top: 2.5rem;
    padding-bottom: calc(2.5rem + env(safe-area-inset-bottom, 0px));
  }

  .artist-signature__mark {
    width: 8.25rem;
    transform: translateY(3px);
  }

  .artist-signature__nav {
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    gap: 1.5rem;
    margin-left: auto;
  }

  .artist-signature__nav a {
    font-size: 0.875rem;
  }
}

@media (min-width: 1024px) {
  .artist-signature__inner {
    width: min(100%, clamp(52rem, 68vw, 62rem));
  }
}
</style>
