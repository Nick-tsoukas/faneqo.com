<script setup>
import { useFirebase } from "@/composables/useFirebase";
import { useFanLogin } from "~/composables/useFanLogin";
import { isFanOrientedReturnTo, sanitizeFanReturnTo } from "~/utils/fan/safeFanReturnTo";
import { safeFanPostAuthRedirect } from "~/utils/passport/fanPassport";
import { resolveLoginGatewayMode } from "~/utils/ui/appShell";
import { authAccountSwitchTo, firstReturnQuery, sanitizeAuthReturnTo } from "~/utils/auth/safeAuthReturnTo";
import AuthShell from "~/components/auth/AuthShell.vue";
import AuthModeSwitch from "~/components/auth/AuthModeSwitch.vue";
import AuthField from "~/components/auth/AuthField.vue";
import AuthSocialButton from "~/components/auth/AuthSocialButton.vue";
import AuthSubmitMark from "~/components/auth/AuthSubmitMark.vue";
import { GOOGLE_NEW_ACCOUNT_TERMS } from "~/utils/billing/billingTerms";
import { computed, ref } from "vue";

definePageMeta({
  layout: "auth",
  robots: "noindex, nofollow",
  sitemap: false,
});

useHead({
  title: "Sign in",
  meta: [{ name: "robots", content: "noindex, nofollow" }],
});

const { loginWithGoogle } = useFirebase();
const { login } = useStrapiAuth();
const router = useRouter();
const route = useRoute();

const { values, defineField } = useForm();
const [email, emailAttrs] = defineField("email");
const [password, passwordAttrs] = defineField("password");

const loading = ref(false);
const errorMessage = ref("");

const {
  email: fanEmail,
  step: fanStep,
  sending: fanSending,
  error: fanError,
  emailMasked: fanEmailMasked,
  resent: fanResent,
  send: sendFanLink,
  editEmail: editFanEmail,
} = useFanLogin();
const intendedFanReturnTo = computed(() =>
  sanitizeFanReturnTo(route.query.redirect, { fallback: null })
);
const loginMode = ref(resolveLoginGatewayMode({
  as: route.query.as,
  redirectIsFan: isFanOrientedReturnTo(route.query.redirect),
}));
const isFanMode = computed(() => loginMode.value === "fan");
const signupTo = computed(() => authAccountSwitchTo("/signup", route.query));
const forgotTo = computed(() => authAccountSwitchTo("/forgot-password", route.query));

function setLoginMode(mode) {
  loginMode.value = mode;
  if (mode === "fan" && !fanEmail.value && email.value) {
    fanEmail.value = String(email.value || "").trim();
  }
  const query = { ...route.query };
  if (mode === "fan") query.as = "fan";
  else delete query.as;
  router.replace({ path: "/login", query });
}

function submitFanLink() {
  sendFanLink({ returnTo: intendedFanReturnTo.value });
}

function resendFanLink() {
  sendFanLink({ resend: true, returnTo: intendedFanReturnTo.value });
}

function resolvePostLoginPath() {
  const { postAuthInviteRedirect, activateInviteFromRedirectParam } = useBandTeam();
  return (
    activateInviteFromRedirectParam(route.query.redirect) ||
    postAuthInviteRedirect() ||
    safeFanPostAuthRedirect(route.query.redirect) ||
    sanitizeAuthReturnTo(firstReturnQuery(route.query), { fallback: null }) ||
    "/dashboard"
  );
}

const handleGoogleLogin = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    await loginWithGoogle({ postLoginPath: resolvePostLoginPath() });
  } catch (err) {
    console.error("[Google Login Error]", err);
    errorMessage.value = "Something went wrong signing in with Google. Please try again.";
    loading.value = false;
  }
};

const loginUser = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    const identifier = String(values.email || "").trim();
    await login({ identifier, password: values.password });
    if (!useStrapiUser().value) {
      errorMessage.value = "Signed in, but your session could not be loaded. Please try again.";
      loading.value = false;
      return;
    }
    await router.push(resolvePostLoginPath());
  } catch (error) {
    console.log(error);
    errorMessage.value = "Invalid email or password. Please try again.";
    loading.value = false;
  }
};
</script>

<template>
  <AuthShell>
    <h1 class="auth-title">Sign in</h1>

    <AuthModeSwitch :model-value="loginMode" @update:model-value="setLoginMode" />

    <template v-if="!isFanMode">
      <form method="post" novalidate @submit.prevent="loginUser">
        <p v-if="errorMessage" class="auth-error" role="alert">{{ errorMessage }}</p>

        <AuthField
          id="email"
          v-model="email"
          type="email"
          label="Email"
          autocomplete="email"
          inputmode="email"
          enterkeyhint="next"
          placeholder="you@example.com"
          :input-attrs="emailAttrs"
        />

        <AuthField
          id="password"
          v-model="password"
          type="password"
          label="Password"
          autocomplete="current-password"
          enterkeyhint="go"
          placeholder="••••••••••"
          password-toggle
          :input-attrs="passwordAttrs"
        >
          <template #action>
            <NuxtLink :to="forgotTo" class="auth-forgot">Forgot?</NuxtLink>
          </template>
        </AuthField>

        <button type="submit" class="auth-cta" :disabled="loading" :aria-busy="loading">
          <AuthSubmitMark :busy="loading" />
          <span>{{ loading ? "Signing in…" : "Sign in" }}</span>
        </button>
      </form>

      <p class="auth-or" role="separator">or</p>

      <AuthSocialButton :disabled="loading" aria-describedby="login-google-terms" @click="handleGoogleLogin" />
      <!-- Google here creates an account and trial for a new email, so new artists see the terms before the click. -->
      <p id="login-google-terms" class="login-google-terms" data-testid="login-google-terms">{{ GOOGLE_NEW_ACCOUNT_TERMS }}</p>

      <p class="auth-switch">
        New to Faneqo?
        <NuxtLink :to="signupTo">Create account</NuxtLink>
      </p>
    </template>

    <form v-else-if="fanStep === 'form'" method="post" novalidate @submit.prevent="submitFanLink">
      <p v-if="fanError" class="auth-error" role="alert">{{ fanError }}</p>
      <AuthField
        id="fan-gateway-email"
        v-model="fanEmail"
        type="email"
        label="Email"
        autocomplete="email"
        inputmode="email"
        enterkeyhint="go"
        placeholder="you@example.com"
      />
      <button type="submit" class="auth-cta" :disabled="fanSending" :aria-busy="fanSending">
        <AuthSubmitMark :busy="fanSending" />
        <span>{{ fanSending ? "Sending…" : "Email me a sign-in link" }}</span>
      </button>
      <p class="auth-quiet">No password needed.</p>
    </form>

    <div v-else role="status" aria-live="polite">
      <h2 class="auth-title">Check your email</h2>
      <p class="auth-quiet" style="text-align: left; margin-top: 0.85rem">
        We sent a secure Faneqo sign-in link to
        <span style="color: #f5f5f6; font-weight: 600">{{ fanEmailMasked || "your email" }}</span>.
      </p>
      <p v-if="fanResent" class="auth-success">Link sent again.</p>
      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem 1.25rem; margin-top: 1.5rem">
        <button type="button" class="auth-ghost" :disabled="fanSending" @click="resendFanLink">
          {{ fanSending ? "Sending…" : "Resend link" }}
        </button>
        <button type="button" class="auth-ghost" :disabled="fanSending" @click="editFanEmail">
          Use a different email
        </button>
      </div>
    </div>
  </AuthShell>
</template>

<style scoped>
.login-google-terms {
  margin: 0.65rem 0 0;
  color: rgba(245, 245, 246, 0.56);
  font-size: 0.75rem;
  line-height: 1.5;
  text-align: center;
}
</style>
