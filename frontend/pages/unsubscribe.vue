<template>
  <div class="min-h-screen bg-black text-white flex items-center justify-center px-5 py-20">
    <div class="w-full max-w-md text-center">
      <div v-if="state === 'working'" class="py-10">
        <div class="w-8 h-8 mx-auto border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
        <p class="mt-5 text-white/50 text-sm">Updating your preferences…</p>
      </div>

      <div v-else-if="state === 'done'">
        <div class="text-4xl mb-5">✓</div>
        <h1 class="text-2xl font-bold mb-3">You're unsubscribed</h1>
        <p class="text-white/60 leading-relaxed">
          <template v-if="bandName">{{ bandName }} won't email you again.</template>
          <template v-else>You won't receive these emails again.</template>
          <template v-if="email"><br /><span class="text-white/40 text-sm">{{ email }}</span></template>
        </p>

        <button
          type="button"
          class="mt-8 text-purple-300 hover:text-purple-200 text-sm underline underline-offset-4"
          :disabled="undoing"
          @click="undo"
        >
          {{ undoing ? 'Undoing…' : 'That was a mistake — resubscribe me' }}
        </button>
      </div>

      <div v-else-if="state === 'resubscribed'">
        <div class="text-4xl mb-5">🎧</div>
        <h1 class="text-2xl font-bold mb-3">You're back on the list</h1>
        <p class="text-white/60">
          <template v-if="bandName">{{ bandName }} can reach you again.</template>
          <template v-else>You'll keep getting these emails.</template>
        </p>
      </div>

      <div v-else>
        <div class="text-4xl mb-5">🔗</div>
        <h1 class="text-2xl font-bold mb-3">This link isn't valid</h1>
        <p class="text-white/60 leading-relaxed">
          {{ errorMessage || 'It may have expired or already been used. If you keep getting emails you don\'t want, reply to one and ask to be removed.' }}
        </p>
      </div>

      <NuxtLink to="/" class="mt-10 inline-block text-white/30 hover:text-white/60 text-xs tracking-wide">
        faneqo.com
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const route = useRoute();
const config = useRuntimeConfig();

const state = ref('working');
const email = ref('');
const bandName = ref('');
const errorMessage = ref('');
const undoing = ref(false);

const token = route.query.token;

/**
 * Runs on mount rather than from the mailed link itself: inbox scanners fetch
 * link URLs to check them, so a plain GET would unsubscribe people who never
 * clicked. Scanners don't execute this.
 */
onMounted(async () => {
  if (!token) {
    state.value = 'invalid';
    return;
  }

  try {
    const response = await $fetch(`${config.public.strapiUrl}/api/fans/unsubscribe`, {
      method: 'POST',
      body: { token },
    });

    // API returns 200 even for bad tokens (one-click clients must not retry),
    // so success is in the body rather than the status code.
    if (!response?.success) {
      errorMessage.value = 'This unsubscribe link is no longer valid.';
      state.value = 'invalid';
      return;
    }

    email.value = response?.email || '';
    bandName.value = response?.bandName || '';
    state.value = 'done';
  } catch (err) {
    errorMessage.value = err?.data?.error?.message || '';
    state.value = 'invalid';
  }
});

async function undo() {
  if (undoing.value) return;
  undoing.value = true;

  try {
    await $fetch(`${config.public.strapiUrl}/api/fans/resubscribe`, {
      method: 'POST',
      body: { token },
    });
    state.value = 'resubscribed';
  } catch (err) {
    errorMessage.value = 'Could not resubscribe. Try the link again.';
    state.value = 'invalid';
  } finally {
    undoing.value = false;
  }
}

useHead({
  title: 'Unsubscribe',
  meta: [{ name: 'robots', content: 'noindex' }],
});
</script>
