<script setup lang="ts">
import { computed, ref } from "vue";
import { useRuntimeConfig } from "#imports";
import { authAccountSwitchTo } from "~/utils/auth/safeAuthReturnTo";
import AuthShell from "~/components/auth/AuthShell.vue";
import AuthField from "~/components/auth/AuthField.vue";
import AuthSubmitMark from "~/components/auth/AuthSubmitMark.vue";

definePageMeta({
  layout: "auth",
  robots: "noindex, nofollow",
  sitemap: false,
});

useHead({
  title: "Reset your password",
  meta: [{ name: "robots", content: "noindex, nofollow" }],
});

const config = useRuntimeConfig();
const strapiBaseUrl = config.public.strapiUrl;

const route = useRoute();
const loginTo = computed(() => authAccountSwitchTo("/login", route.query));
const email = ref("");
const loading = ref(false);
const successMessage = ref("");
const errorMessage = ref("");

const submitForgotPassword = async () => {
  errorMessage.value = "";
  successMessage.value = "";
  if (!email.value) {
    errorMessage.value = "Please enter your email.";
    return;
  }

  loading.value = true;
  try {
    await $fetch(`${strapiBaseUrl}/api/auth/forgot-password`, {
      method: "POST",
      body: { email: email.value },
    });

    successMessage.value =
      "If an account exists for that email, we’ve sent a reset link.";
  } catch (err: any) {
    console.error("[forgot-password]", err);
    errorMessage.value =
      "We couldn’t send the reset email. Please check the address and try again.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <AuthShell>
    <h1 class="auth-title">Reset your password</h1>
    <p class="auth-quiet" style="text-align: left; margin: 0.85rem 0 1.5rem">
      Enter the email for your artist account and we’ll send a reset link.
    </p>

    <form novalidate @submit.prevent="submitForgotPassword">
      <p v-if="errorMessage" class="auth-error" role="alert">{{ errorMessage }}</p>
      <p v-if="successMessage" class="auth-success" role="status">{{ successMessage }}</p>

      <AuthField
        id="email"
        v-model="email"
        type="email"
        label="Email"
        autocomplete="email"
        inputmode="email"
        enterkeyhint="go"
        placeholder="you@example.com"
      />

      <button type="submit" class="auth-cta" :disabled="loading" :aria-busy="loading">
        <AuthSubmitMark :busy="loading" />
        <span>{{ loading ? "Sending…" : "Send reset link" }}</span>
      </button>
    </form>

    <p class="auth-switch">
      Remembered it?
      <NuxtLink :to="loginTo">Sign in</NuxtLink>
    </p>
  </AuthShell>
</template>
