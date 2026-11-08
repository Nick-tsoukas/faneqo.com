<template>
  <div class="min-h-screen bg-[#121212] pt-[var(--header-height)] text-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h2 class="text-3xl font-bold">Contact Us</h2>
        <p class="mt-2 text-sm text-gray-400">
          Send a note and we'll get back to you soon.
        </p>
      </div>
      <address class="not-italic text-center">
        <p class="text-[1.05rem] font-semibold tracking-tight text-white">Pat Rogers</p>
        <p class="mt-1.5 text-sm text-[#9aa6b5]">Available for questions</p>
        <div class="mt-3 flex flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-3">
          <a href="mailto:pat@faneqo.com" class="text-sm text-white/85 transition-colors hover:text-white">pat@faneqo.com</a>
          <span class="hidden text-white/35 sm:inline" aria-hidden="true">·</span>
          <a href="tel:+18285826489" class="text-sm text-white/85 transition-colors hover:text-white">(828) 582-6489</a>
        </div>
      </address>
      <form class="space-y-6" @submit.prevent="submitForm">
        <div class="space-y-4">
          <!-- Honeypot field - hidden from humans, bots will fill it -->
          <div class="absolute -left-[9999px]" aria-hidden="true">
            <label for="company">Company</label>
            <input
              id="company"
              v-model="form.company"
              type="text"
              tabindex="-1"
              autocomplete="off"
            />
          </div>

          <div>
            <label for="name" class="block text-sm font-medium mb-1">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              autocomplete="name"
              required
              v-model="form.name"
              placeholder="Your name"
              class="w-full bg-[#1e1e1e] border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label for="email" class="block text-sm font-medium mb-1">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autocomplete="email"
              required
              v-model="form.email"
              placeholder="Your email"
              class="w-full bg-[#1e1e1e] border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label for="message" class="block text-sm font-medium mb-1">Message</label>
            <textarea
              id="message"
              name="message"
              rows="4"
              required
              v-model="form.message"
              placeholder="Your message"
              class="w-full bg-[#1e1e1e] border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
            ></textarea>
          </div>
        </div>
        <div>
          <button
            type="submit"
            class="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 rounded-xl transition-all"
          >
            Send Message
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const form = ref({
  name: '',
  email: '',
  message: '',
  company: '', // Honeypot field - if filled, it's a bot
});

const submitForm = async () => {
  // Check honeypot - if filled, silently reject (it's a bot)
  if (form.value.company) {
    console.log('[Contact] Bot detected via honeypot');
    // Fake success to not alert the bot
    await new Promise(resolve => setTimeout(resolve, 1500));
    alert('✅ Your message has been sent!');
    form.value = { name: '', email: '', message: '', company: '' };
    return;
  }

  try {
    const res = await $fetch('/api/contact', {
      method: 'POST',
      body: { name: form.value.name, email: form.value.email, message: form.value.message }
    })
    if (res.success) {
      alert('✅ Your message has been sent!')
      form.value = { name: '', email: '', message: '', company: '' }
    }
  } catch (err) {
    console.error('Contact error:', err)
    alert(err.data?.message || '❌ Failed to send—it might be a server error.')
  }
}

</script>
