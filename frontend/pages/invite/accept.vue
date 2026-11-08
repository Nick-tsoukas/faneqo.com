<template>
  <div class="min-h-screen bg-black text-white pt-[var(--header-height)] overflow-x-hidden">
    <div class="max-w-lg mx-auto px-4 py-12">
      <div class="rounded-2xl border border-white/10 bg-[#0f0f12] p-8 shadow-xl">
        <p class="text-xs uppercase tracking-[0.18em] text-violet-400/80 mb-3">Team Access</p>
        <h1 class="text-2xl font-semibold text-white mb-2">{{ pageTitle }}</h1>
        <p v-if="state !== 'wrong_email'" class="text-white/55 text-sm leading-relaxed mb-8">
          You’ve been invited to join a Faneqo artist page.
        </p>

        <!-- Loading -->
        <div v-if="state === 'loading'" class="flex flex-col items-center gap-4 py-8">
          <div class="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p class="text-white/60 text-sm">{{ loadingMessage }}</p>
        </div>

        <!-- Missing token -->
        <div v-else-if="state === 'missing_token'" class="space-y-4">
          <p class="text-red-300 text-sm">This invite link is missing or incomplete.</p>
          <button
            type="button"
            class="inline-block text-sm text-violet-300 hover:text-violet-200"
            @click="continueToDashboard"
          >
            Continue to Dashboard
          </button>
        </div>

        <!-- Need auth -->
        <div v-else-if="state === 'need_auth'" class="space-y-5">
          <p class="text-white/70 text-sm leading-relaxed">
            Invites don’t include a password. Use the <strong class="text-white/90">exact email this invite was sent to</strong>.
          </p>
          <ol class="text-white/55 text-sm leading-relaxed space-y-2 list-decimal list-inside">
            <li>If you’re new to Faneqo → <span class="text-white/80">Sign up</span> and choose your own password</li>
            <li>If you already have an account → <span class="text-white/80">Log in</span> with that email</li>
            <li>We’ll bring you back here and finish the invite</li>
          </ol>
          <div class="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              class="flex-1 text-center rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 px-4 transition-colors"
              @click="goSignup"
            >
              Sign up
            </button>
            <button
              type="button"
              class="flex-1 text-center rounded-xl border border-white/15 hover:border-white/30 text-white font-medium py-3 px-4 transition-colors"
              @click="goLogin"
            >
              Log in
            </button>
          </div>
          <button
            type="button"
            class="text-sm text-white/40 hover:text-white/70"
            @click="continueToDashboard"
          >
            Not now — Continue to Dashboard
          </button>
        </div>

        <!-- Wrong email / wrong account -->
        <div v-else-if="state === 'wrong_email'" class="space-y-5 -mt-2">
          <p class="text-white/70 text-sm leading-relaxed">
            <template v-if="invitedEmail">
              This invitation was sent to <span class="text-white font-medium">{{ invitedEmail }}</span>.
              Please sign in with that account.
            </template>
            <template v-else>
              This invite can only be accepted by the email address that received it. Sign out, then sign up or log in with the invited email.
            </template>
          </p>
          <p class="text-white/45 text-sm leading-relaxed">
            No password was sent in the invite email. If this is a new Faneqo account, create one using the invited email address.
          </p>
          <div class="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              class="flex-1 text-center rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 px-4 transition-colors"
              @click="switchAccount"
            >
              Switch account
            </button>
            <button
              type="button"
              class="flex-1 text-center rounded-xl border border-white/15 hover:border-white/30 text-white font-medium py-3 px-4 transition-colors"
              @click="continueToDashboard"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>

        <!-- Expired / revoked / invalid -->
        <div v-else-if="state === 'expired' || state === 'revoked' || state === 'invalid'" class="space-y-4">
          <p class="text-red-300 text-sm leading-relaxed">{{ errorMessage }}</p>
          <button
            type="button"
            class="inline-block text-sm text-violet-300 hover:text-violet-200"
            @click="continueToDashboard"
          >
            Continue to Dashboard
          </button>
        </div>

        <!-- Generic error -->
        <div v-else-if="state === 'error'" class="space-y-4">
          <p class="text-red-300 text-sm leading-relaxed">{{ errorMessage }}</p>
          <div class="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              class="rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 px-5 transition-colors"
              :disabled="accepting"
              @click="attemptAccept"
            >
              Try again
            </button>
            <button
              type="button"
              class="rounded-xl border border-white/15 hover:border-white/30 text-white font-medium py-3 px-5 transition-colors"
              @click="continueToDashboard"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>

        <!-- Success -->
        <div v-else-if="state === 'success'" class="space-y-5">
          <p class="text-emerald-300 text-sm leading-relaxed">
            You’re now connected to this artist page{{ successBandName ? ` — ${successBandName}` : '' }}.
            Some team permissions are being rolled out in stages.
          </p>
          <NuxtLink
            to="/dashboard"
            class="inline-flex rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 px-5 transition-colors"
          >
            Continue to Dashboard
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import {
  clearPendingInviteToken,
  deactivateInviteRedirect,
  hasActiveInviteRedirect,
  inviteAuthPath,
  readPendingInviteToken,
  storePendingInviteToken,
  useBandTeam,
} from '~/composables/useBandTeam';
import { refreshWorkspaceAccess } from '~/composables/useWorkspaceBand';

useSeoMeta({
  title: 'Accept Team Invite',
});

const route = useRoute();
const router = useRouter();
const user = useStrapiUser();
const { acceptInvite } = useBandTeam();

const state = ref('loading');
const loadingMessage = ref('Checking your invite…');
const errorMessage = ref('Something went wrong. Please try again.');
const accepting = ref(false);
const successBandName = ref('');
const invitedEmail = ref('');
/** Token from URL kept for Switch account after we clear localStorage on wrong_email. */
const urlTokenBackup = ref('');
let redirectTimer = null;

const pageTitle = computed(() => {
  if (state.value === 'wrong_email') return 'You’re signed in with a different account';
  if (state.value === 'success') return 'You’re connected';
  return 'Accept your invite';
});

const inviteToken = computed(() => {
  const q = route.query.token;
  if (Array.isArray(q)) return q[0] || '';
  if (typeof q === 'string' && q) return q;
  if (urlTokenBackup.value) return urlTokenBackup.value;
  // Fallback after auth when query was dropped but localStorage kept the token.
  return readPendingInviteToken() || '';
});

function mapApiError(err) {
  const status = err?.statusCode || err?.status;
  const raw = err?.data?.error;
  const code = typeof raw === 'string' ? raw : null;
  const message =
    err?.data?.message ||
    (typeof raw === 'object' && raw ? raw.message : null) ||
    err?.data?.data?.message;

  // Session missing / expired — keep active invite flow and ask them to auth again.
  if (status === 401 || code === 'unauthorized') {
    if (inviteToken.value) storePendingInviteToken(inviteToken.value);
    state.value = 'need_auth';
    return;
  }
  if (
    code === 'wrong_email' ||
    /another email/i.test(message || '') ||
    /invitation was sent to/i.test(message || '')
  ) {
    // Stop hijacking future normal logins; keep URL token for Switch account only.
    urlTokenBackup.value = inviteToken.value || urlTokenBackup.value;
    invitedEmail.value =
      err?.data?.data?.invitedEmail ||
      err?.data?.invitedEmail ||
      '';
    clearPendingInviteToken();
    state.value = 'wrong_email';
    return;
  }
  if (code === 'expired') {
    clearPendingInviteToken();
    state.value = 'expired';
    errorMessage.value = message || 'This invite has expired.';
    return;
  }
  if (code === 'revoked') {
    clearPendingInviteToken();
    state.value = 'revoked';
    errorMessage.value = message || 'This invite was revoked.';
    return;
  }
  if (code === 'invalid_token') {
    clearPendingInviteToken();
    state.value = 'invalid';
    errorMessage.value = message || 'This invite link is invalid or has already been used.';
    return;
  }
  // Transient error: allow retry on this page, but don't hijack later logins.
  deactivateInviteRedirect();
  state.value = 'error';
  errorMessage.value = message || 'Something went wrong accepting this invite.';
}

async function attemptAccept() {
  if (accepting.value) return;
  if (!inviteToken.value) {
    clearPendingInviteToken();
    state.value = 'missing_token';
    return;
  }
  if (!user.value) {
    storePendingInviteToken(inviteToken.value);
    state.value = 'need_auth';
    return;
  }

  accepting.value = true;
  state.value = 'loading';
  loadingMessage.value = 'Accepting your invite…';

  try {
    const data = await acceptInvite(inviteToken.value);
    clearPendingInviteToken();
    successBandName.value = data?.band?.name || '';
    // New team access, same user and token: refresh so the workspace sees it
    refreshWorkspaceAccess().catch(() => {});
    state.value = 'success';
    redirectTimer = setTimeout(() => {
      router.push('/dashboard');
    }, 1600);
  } catch (err) {
    mapApiError(err);
  } finally {
    accepting.value = false;
  }
}

function goSignup() {
  const token = inviteToken.value;
  if (token) storePendingInviteToken(token);
  router.push(inviteAuthPath('/signup', token));
}

function goLogin() {
  const token = inviteToken.value;
  if (token) storePendingInviteToken(token);
  router.push(inviteAuthPath('/login', token));
}

function continueToDashboard() {
  clearPendingInviteToken();
  urlTokenBackup.value = '';
  router.push('/dashboard');
}

async function switchAccount() {
  const token = inviteToken.value || urlTokenBackup.value;
  // Clear storage so a failed switch can't hijack later normal logins.
  clearPendingInviteToken();
  try {
    const { logout } = useStrapiAuth();
    await logout();
  } catch {
    // still send them to login even if logout fails
  }
  router.push(inviteAuthPath('/login', token) || '/login');
}

onMounted(() => {
  const q = route.query.token;
  const fromQuery = Array.isArray(q) ? q[0] : q;
  if (typeof fromQuery === 'string' && fromQuery) {
    urlTokenBackup.value = fromQuery;
    storePendingInviteToken(fromQuery);
  } else if (hasActiveInviteRedirect()) {
    // Returning from auth with an active/fresh stored token (URL token dropped).
    storePendingInviteToken(readPendingInviteToken());
  } else {
    // Bare /invite/accept with stale/legacy token must not revive hijack.
    clearPendingInviteToken();
    state.value = 'missing_token';
    return;
  }
  attemptAccept();
});

onBeforeUnmount(() => {
  if (redirectTimer) clearTimeout(redirectTimer);
});

watch(
  () => user.value?.id,
  (id, prev) => {
    // Retry after login. Do not auto-retry wrong_email (storage cleared; use Switch account).
    if (id && id !== prev && state.value === 'need_auth') {
      attemptAccept();
    }
  }
);
</script>
