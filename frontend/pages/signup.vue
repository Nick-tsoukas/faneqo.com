<template>
  <AuthShell>
    <h1 class="auth-title">Create your artist account</h1>

    <form method="post" novalidate @submit.prevent="handleSignup">
      <p v-if="errorMessage" class="auth-error" role="alert">{{ errorMessage }}</p>

      <AuthField
        id="email"
        v-model="formData.email"
        type="email"
        label="Email"
        autocomplete="email"
        inputmode="email"
        enterkeyhint="next"
        placeholder="you@example.com"
        required
      />

      <div class="absolute -left-[9999px]" aria-hidden="true">
        <label for="website">Website</label>
        <input
          id="website"
          v-model="formData.website"
          type="text"
          tabindex="-1"
          autocomplete="off"
        />
      </div>

      <AuthField
        id="password"
        v-model="formData.password"
        type="password"
        label="Password"
        autocomplete="new-password"
        enterkeyhint="go"
        placeholder="At least 6 characters"
        required
        minlength="6"
        password-toggle
      />

      <p id="signup-billing-terms" class="signup-terms" data-testid="signup-billing-terms">{{ SIGNUP_TERMS }}</p>

      <button type="submit" class="auth-cta" :disabled="loading" :aria-busy="loading" aria-describedby="signup-billing-terms">
        <AuthSubmitMark :busy="loading" />
        <span>{{ loading ? "Creating account…" : "Create account" }}</span>
      </button>
    </form>

    <p class="auth-or" role="separator">or</p>

    <AuthSocialButton :disabled="loading" @click="handleGoogleLogin" />

    <p class="auth-switch">
      Already have an account?
      <NuxtLink :to="loginTo">Sign in</NuxtLink>
    </p>
  </AuthShell>
</template>

<script setup>
import { computed, ref } from "vue";
import { useSignup } from "~/composables/useSignup";
import { authAccountSwitchTo, firstReturnQuery, sanitizeAuthReturnTo } from "~/utils/auth/safeAuthReturnTo";
import { safeFanPostAuthRedirect } from "~/utils/passport/fanPassport";
import AuthShell from "~/components/auth/AuthShell.vue";
import AuthField from "~/components/auth/AuthField.vue";
import AuthSocialButton from "~/components/auth/AuthSocialButton.vue";
import AuthSubmitMark from "~/components/auth/AuthSubmitMark.vue";
import { SIGNUP_TERMS } from "~/utils/billing/billingTerms";

definePageMeta({
  layout: "auth",
  robots: "noindex, nofollow",
  sitemap: false,
});

useHead({
  title: "Create your artist account",
  meta: [{ name: "robots", content: "noindex, nofollow" }],
});

const { loginWithGoogle } = useFirebase();
const router = useRouter();
const route = useRoute();
const { login } = useStrapiAuth();

const { registerUser } = useSignup();
const loading = ref(false);
const errorMessage = ref("");
const { reportConversion } = useMetaTracking()
const loginTo = computed(() => authAccountSwitchTo("/login", route.query));

const formData = ref({
  email: "",
  password: "",
  website: "", // Honeypot field - if filled, it's a bot
});

function resolvePostSignupPath() {
  const { postAuthInviteRedirect, activateInviteFromRedirectParam } = useBandTeam();
  return (
    activateInviteFromRedirectParam(route.query.redirect) ||
    postAuthInviteRedirect() ||
    safeFanPostAuthRedirect(route.query.redirect) ||
    sanitizeAuthReturnTo(firstReturnQuery(route.query), { fallback: null }) ||
    "/dashboard"
  );
}

const trackSignupCompleted = async (email) => {
  const registration = {
    content_name: "Faneqo account",
    status: "success",
  }
  const trial = {
    content_name: "Faneqo Pro trial",
    currency: "USD",
  }
  await reportConversion({
    eventName: "CompleteRegistration",
    eventKey: "signup_completed",
    email,
    customData: registration,
  })
  await reportConversion({
    eventName: "StartTrial",
    eventKey: "trial_started",
    email,
    customData: trial,
  })
};

const handleGoogleLogin = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    // Warm invite flow from ?redirect= so useFirebase postAuthInviteRedirect works.
    const { activateInviteFromRedirectParam } = useBandTeam();
    activateInviteFromRedirectParam(route.query.redirect);
    await loginWithGoogle(); // all logic handled inside
  } catch (err) {
    console.error("[Google Signup Error]", err);
    errorMessage.value = "Something went wrong signing in with Google. Please try again.";
    loading.value = false;
  }
};

const handleSignup = async () => {
  // Check honeypot - if filled, silently reject (it's a bot)
  if (formData.value.website) {
    console.log("[handleSignup] Bot detected via honeypot");
    // Fake success to not alert the bot
    loading.value = true;
    await new Promise(resolve => setTimeout(resolve, 2000));
    await router.push("/signupSuccess");
    return;
  }

  loading.value = true;
  errorMessage.value = "";
  console.log("[handleSignup] payload →", JSON.stringify(formData.value));

  // Trim so invite email-match isn't broken by accidental spaces.
  const email = String(formData.value.email || "").trim();
  const password = formData.value.password;
  formData.value.email = email;

  try {
    // Default name = email
    const name = email;

    // 3️⃣ Register user & start 30-day trial in one call
    await registerUser(name, email, password);
    await trackSignupCompleted(email);

    // Registration does not return a session. Sign in with the password
    // they just chose, then open the workspace (or the invite they came from).
    const destination = resolvePostSignupPath();
    try {
      await login({ identifier: email, password });
      if (!useStrapiUser().value) {
        throw new Error("session_missing");
      }
      await router.push(destination);
    } catch (loginErr) {
      console.error("Post-signup login failed", loginErr);
      const { inviteAuthPath } = useBandTeam();
      const tokenMatch = String(destination).match(/[?&]token=([^&]+)/);
      const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;
      alert(
        token
          ? "Account created. Sign in with that email and password to finish your invite."
          : "Account created. Sign in with that email and password to continue."
      );
      await router.push(token ? inviteAuthPath("/login", token) : loginTo.value);
    }
  } catch (err) {
    console.error("Signup failed", err);
    errorMessage.value = err.message || "Signup failed. Please try again.";
    loading.value = false;
  }
};
</script>

<style scoped>
/* Billing terms sit with the form, before either signup button. Quiet, readable, never hidden. */
.signup-terms {
  margin: -0.15rem 0 0;
  color: rgba(245, 245, 246, 0.62);
  font-size: 0.8125rem;
  line-height: 1.5;
}
</style>
