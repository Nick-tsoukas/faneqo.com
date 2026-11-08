<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute, useRouter, useRuntimeConfig } from "#imports";
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
  title: "Choose a new password",
  meta: [{ name: "robots", content: "noindex, nofollow" }],
});

const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();
const strapiBaseUrl = config.public.strapiUrl;

const loginTo = computed(() => authAccountSwitchTo("/login", route.query));
const code = computed(() => route.query.code as string | undefined);

const password = ref("");
const passwordConfirmation = ref("");
const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const submitResetPassword = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  if (!code.value) {
    errorMessage.value =
      "Invalid or missing reset code. Please use the link from your email.";
    return;
  }

  if (!password.value || !passwordConfirmation.value) {
    errorMessage.value = "Please fill out both password fields.";
    return;
  }

  if (password.value !== passwordConfirmation.value) {
    errorMessage.value = "Passwords do not match.";
    return;
  }

  loading.value = true;
  try {
    await $fetch(`${strapiBaseUrl}/api/auth/reset-password`, {
      method: "POST",
      body: {
        code: code.value,
        password: password.value,
        passwordConfirmation: passwordConfirmation.value,
      },
    });

    successMessage.value = "Your password has been reset successfully.";
    setTimeout(() => {
      router.push("/login");
    }, 1500);
  } catch (err: any) {
    console.error("[reset-password]", err);
    errorMessage.value =
      "We couldn’t reset your password. The link may have expired or been used already.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <AuthShell>
    <h1 class="auth-title">Choose a new password</h1>

    <form novalidate @submit.prevent="submitResetPassword">
      <p v-if="!code" class="auth-error" role="alert">
        Missing reset code. Please use the reset link from your email.
      </p>
      <p v-if="errorMessage" class="auth-error" role="alert">{{ errorMessage }}</p>
      <p v-if="successMessage" class="auth-success" role="status">{{ successMessage }}</p>

      <AuthField
        id="password"
        v-model="password"
        type="password"
        label="New password"
        autocomplete="new-password"
        enterkeyhint="next"
        placeholder="New password"
        password-toggle
      />

      <AuthField
        id="passwordConfirmation"
        v-model="passwordConfirmation"
        type="password"
        label="Confirm password"
        autocomplete="new-password"
        enterkeyhint="go"
        placeholder="Confirm new password"
        password-toggle
      />

      <button type="submit" class="auth-cta" :disabled="loading || !code" :aria-busy="loading">
        <AuthSubmitMark :busy="loading" />
        <span>{{ loading ? "Resetting…" : "Reset password" }}</span>
      </button>
    </form>

    <p class="auth-switch">
      Back to
      <NuxtLink :to="loginTo">Sign in</NuxtLink>
    </p>
  </AuthShell>
</template>
