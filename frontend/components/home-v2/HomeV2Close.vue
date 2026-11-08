<template>
  <section class="v2-ask" aria-labelledby="v2-ask-title">
    <h2 id="v2-ask-title" class="v2-ask__title">
      <span>Your next fan</span>
      shouldn’t disappear after tonight.
    </h2>
    <NuxtLink to="/signup" class="v2-ask__cta">Start free</NuxtLink>
    <p class="v2-ask__note">Free. No card.</p>
  </section>

  <section id="faq" class="v2-faq" aria-label="Questions">
    <details v-for="(item, i) in faqs" :key="i" class="v2-faq__item">
      <summary>{{ item.q }}</summary>
      <p>{{ item.a }}</p>
    </details>
  </section>

  <footer class="v2-foot">
    <div class="v2-foot__row">
      <div class="v2-foot__brand">
        <img src="/faneqo-logo.png" alt="Faneqo" width="128" height="32" loading="lazy" decoding="async">
        <span>© {{ year }}</span>
      </div>
      <nav class="v2-foot__nav" aria-label="Legal">
        <NuxtLink to="/privacypolicy">Privacy</NuxtLink>
        <NuxtLink to="/termsofservice">Terms</NuxtLink>
        <NuxtLink to="/contact">Contact</NuxtLink>
      </nav>
    </div>
  </footer>
</template>

<script setup>
const year = new Date().getFullYear()
const faqs = [
  {
    q: 'Is Faneqo free?',
    a: 'Yes. You can create a free Faneqo account and launch a free artist page. Every new account also includes 30 days of Pro features.',
  },
  {
    q: 'Is this a Linktree alternative? Can I keep my links?',
    a: 'Yes — for musicians who want more than a list of links. Add Spotify, Apple Music, YouTube, socials, merch, tickets, and your website. Fans get one place. You keep the relationship.',
  },
  {
    q: 'Do I own my fan list?',
    a: 'Yes. Fans who join from your artist page, QR codes, and shows belong to your list. You can reach them again.',
  },
]
</script>

<style scoped>
.v2-ask {
  position: relative;
  z-index: 10;
  padding: 3.4rem 1.25rem 3.6rem;
  background: #050506;
  color: #f5f5f6;
}

.v2-ask__title {
  margin: 0;
  max-width: 14ch;
  font-size: clamp(2.25rem, 9vw, 3rem);
  font-weight: 800;
  line-height: 0.92;
  letter-spacing: -0.05em;
}

.v2-ask__title span {
  display: block;
}

.v2-ask__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  margin-top: 1.35rem;
  padding: 0.7rem 1.4rem;
  border-radius: 0.65rem;
  font-size: 0.95rem;
  font-weight: 700;
  background: #45d6a7;
  color: #06251f;
}

.v2-ask__note {
  margin: 0.55rem 0 0;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.36);
}

.v2-faq {
  padding: 0.2rem 1.25rem 2.4rem;
  background: #050506;
}

.v2-faq__item {
  width: min(100%, 32rem);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.v2-faq__item:last-child {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.v2-faq__item summary {
  cursor: pointer;
  padding: 0.85rem 0;
  font-size: 0.88rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.58);
  list-style: none;
}

.v2-faq__item summary::-webkit-details-marker {
  display: none;
}

.v2-faq__item p {
  margin: 0 0 0.9rem;
  font-size: 0.86rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.42);
}

.v2-foot {
  padding: 1.15rem 1.25rem 1.8rem;
  background: #050506;
  color: rgba(255, 255, 255, 0.34);
}

.v2-foot__row {
  width: min(100%, 1180px);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.7rem;
}

.v2-foot__brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 0.72rem;
}

.v2-foot__brand img {
  height: 1.45rem;
  width: auto;
}

.v2-foot__nav {
  display: flex;
  gap: 1.05rem;
  font-size: 0.75rem;
}

.v2-foot__nav a:hover {
  color: #fff;
}

@media (min-width: 1024px) {
  .v2-ask {
    padding: 3.8rem 1.5rem 4.2rem;
  }

  .v2-ask__title {
    max-width: 14ch;
    font-size: clamp(2.7rem, 4vw, 3.5rem);
  }

  .v2-faq {
    padding: 0.2rem 1.5rem 3.2rem;
  }

  .v2-foot {
    padding: 1.2rem 1.5rem 1.9rem;
  }

  .v2-foot__row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
