<template>
  <div class="min-h-screen text-white px-6 py-10 pt-[var(--header-height)]">
    <div class="max-w-2xl mx-auto p-8 rounded-2xl" style="background: var(--fq-surface); border: 1px solid var(--fq-border);">
      <h1 class="text-3xl font-semibold mb-8">Account Settings</h1>

      <form @submit.prevent="updateAccount" class="space-y-6">
        <div>
          <label class="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            v-model="email"
            required
            class="form-input w-full rounded-xl px-4 py-3 focus:outline-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">New Password</label>
          <input
            type="password"
            v-model="password"
            placeholder="Leave blank to keep current password"
            class="form-input w-full rounded-xl px-4 py-3 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          class="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 rounded-xl transition-all"
        >
          Update Account
        </button>
      </form>

      <!-- My Bands & Access -->
      <div class="mt-12 border-t pt-8" style="border-color: var(--fq-border);">
        <h2 class="text-2xl font-semibold mb-2">My Bands &amp; Access</h2>
        <p class="text-gray-400 text-sm mb-2">
          See the artist pages you own or have been invited to help with.
        </p>
        <p class="text-gray-500 text-xs mb-6 leading-relaxed">
          Manage invites from your Dashboard → Team Access. Managers can edit the artist page; billing and fan messaging stay with the owner.
        </p>

        <div v-if="accessLoading" class="text-gray-500 text-sm">Loading…</div>
        <div v-else-if="accessError" class="text-gray-500 text-sm">{{ accessError }}</div>
        <div v-else class="space-y-6">
          <div>
            <h3 class="text-xs uppercase tracking-wider text-gray-500 mb-3">Owned</h3>
            <ul v-if="ownedBands.length" class="space-y-2">
              <li
                v-for="band in ownedBands"
                :key="`owned-${band.bandId}`"
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl px-4 py-3 fq-account-row"
              >
                <div class="min-w-0">
                  <p class="text-white font-medium truncate">{{ band.name }}</p>
                  <span class="inline-flex mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-violet-200/90 bg-violet-500/15 border border-violet-400/25 rounded-full px-2 py-0.5">
                    Owner
                  </span>
                </div>
                <div class="flex flex-wrap gap-3 shrink-0">
                  <NuxtLink
                    :to="dashboardPathForBand(band.bandId)"
                    class="text-sm text-violet-300 hover:text-violet-200"
                  >
                    Open Dashboard
                  </NuxtLink>
                  <NuxtLink
                    :to="`/dashboard/team/${band.bandId}`"
                    class="text-sm text-white/50 hover:text-white/80"
                  >
                    Manage Team
                  </NuxtLink>
                </div>
              </li>
            </ul>
            <p v-else class="text-gray-500 text-sm">No owned artist pages yet.</p>
          </div>

          <div>
            <h3 class="text-xs uppercase tracking-wider text-gray-500 mb-3">Team Access</h3>
            <ul v-if="teamBands.length" class="space-y-2">
              <li
                v-for="band in teamBands"
                :key="`team-${band.bandId}`"
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl px-4 py-3 fq-account-row"
              >
                <div class="min-w-0">
                  <p class="text-white font-medium truncate">{{ band.name }}</p>
                  <span class="inline-flex mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/70 bg-white/5 border border-white/10 rounded-full px-2 py-0.5 capitalize">
                    {{ band.role }}
                  </span>
                </div>
                <div class="flex flex-wrap gap-3 shrink-0">
                  <NuxtLink
                    :to="dashboardPathForBand(band.bandId)"
                    class="text-sm text-violet-300 hover:text-violet-200"
                  >
                    Open Dashboard
                  </NuxtLink>
                  <NuxtLink
                    :to="band.slug ? `/${band.slug}` : '/'"
                    class="text-sm text-white/45 hover:text-white/70"
                  >
                    {{ band.slug ? 'Artist page' : 'Open Faneqo' }}
                  </NuxtLink>
                </div>
              </li>
            </ul>
            <p v-else class="text-gray-500 text-sm">No Team Access yet.</p>
          </div>
        </div>
      </div>

      <div v-if="isAmbassador" class="mt-12 border-t pt-8" style="border-color: var(--fq-border);">
        <h2 class="text-2xl font-semibold mb-2">Subscription Status</h2>
        <p class="text-gray-300">Plan: {{ ambassadorPlan }}</p>
        <p class="text-gray-300">Status: {{ ambassadorStatus }}</p>
      </div>

      <div v-else-if="billingData" class="mt-12 border-t pt-8" style="border-color: var(--fq-border);">
        <h2 class="text-2xl font-semibold mb-2">Subscription Status</h2>

        <p class="text-gray-300">
          Plan: {{ planLabel }}
        </p>

        <p class="text-gray-300">
          Status:
          <span
            :class="{ 'text-red-400 font-semibold': isPastDue }"
            class="capitalize"
          >
            {{ displayStatus }}
          </span>
        </p>

        <p v-if="showTrialEnds" class="text-gray-300">
          Trial Ends: {{ format(new Date(billingData.trialEndsAt), 'PPP') }}
        </p>
        <p v-if="renewalCopy" class="text-gray-300">
          {{ renewalCopy }}
        </p>
      </div>

      <div
        v-else-if="billingLoading"
        class="mt-12 border-t pt-8"
        style="border-color: var(--fq-border);"
        data-testid="account-billing-loading"
      >
        <h2 class="text-2xl font-semibold mb-2">Subscription Status</h2>
        <p class="text-gray-400 text-sm">Loading billing…</p>
      </div>

      <div
        v-else-if="billingUnavailable"
        class="mt-12 border-t pt-8"
        style="border-color: var(--fq-border);"
      >
        <h2 class="text-2xl font-semibold mb-2">Subscription Status</h2>
        <p class="text-gray-400 text-sm">
          Billing information is temporarily unavailable.
        </p>
      </div>

      <div v-if="!isAmbassador" class="mt-8">
        <!-- Read before the click: what the billing page can charge, and how to cancel (C3). -->
        <!-- Billing A: where the billing page can charge (trial without a card, past due), the
             server's terms and an unticked box come first; elsewhere the C3 terms stay. -->
        <div v-if="portalConsent.needsConsent.value" class="mb-4 max-w-xl" data-testid="account-billing-consent">
          <BillingConsent
            v-model="portalConsent.agreed.value"
            :terms="portalConsent.terms.value"
            :notice="portalConsent.notice.value"
          />
        </div>
        <div v-else-if="billingTerms.length" class="mb-4 max-w-xl space-y-1" data-testid="account-billing-terms">
          <p v-for="line in billingTerms" :key="line" class="text-sm text-gray-400 leading-relaxed">{{ line }}</p>
        </div>
        <button
          @click="goToBillingPortal()"
          :disabled="!portalConsent.ready.value"
          :class="{ 'opacity-50 cursor-not-allowed': !portalConsent.ready.value }"
          class="bg-pink-600 hover:bg-pink-700 text-white font-medium py-3 px-6 rounded-xl transition-all"
          data-testid="account-billing-button"
        >
          {{ isPastDue ? 'Pay Invoice' : 'Manage Billing Info' }}
        </button>
        <!-- Cancelling never needs consent (Stripe's cancellation flow). -->
        <button
          v-if="portalConsent.needsConsent.value && portalConsent.terms.value?.canCancel"
          type="button"
          class="block mt-3 text-sm text-gray-400 underline underline-offset-2 hover:text-white"
          data-testid="account-cancel-membership"
          @click="goToBillingPortal({ intent: 'cancel' })"
        >
          Cancel membership instead
        </button>
        <p v-if="cancelMessage" class="mt-3 text-sm text-gray-300" role="status" data-testid="account-cancel-done">{{ cancelMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { format } from 'date-fns';
import { formatAccountRenewalCopy } from '~/utils/billing/accountBillingDisplay';
import { accountBillingTerms, priceLabelFrom } from '~/utils/billing/billingTerms';
import { loadAccountBilling } from '~/utils/billing/accountBillingLoad';
import BillingConsent from '~/components/billing/BillingConsent.vue';
import { useBillingConsent } from '~/composables/useBillingConsent';
import {
  ambassadorPlanLabel,
  ambassadorStatusLabel,
  isAmbassadorBilling,
  isBillingExemptLifetimePro,
} from '~/utils/billing/artistEntitlement';
import { dashboardPathForBand } from '~/utils/ui/dashboardWorkspace';

definePageMeta({
  middleware: 'auth',
});

const user   = useStrapiUser();
const token  = useStrapiToken();
const client = useStrapiClient();

const email       = ref('');
const password    = ref('');
const billingData = ref<any>(null);
const billingUnavailable = ref(false);
const billingLoading = ref(true);

const ownedBands = ref<Array<{ bandId: number | string; name: string; slug?: string; role: string }>>([]);
const teamBands = ref<Array<{ bandId: number | string; name: string; slug?: string; role: string }>>([]);
const accessLoading = ref(false);
const accessError = ref('');

// derive statuses
const strapiStatus = computed(() => user.value?.subscriptionStatus || '');
const stripeStatus = computed(() => billingData.value?.subscription?.status || '');
const normalizedStatus = computed(() => {
  if (strapiStatus.value === 'pastDue') return 'pastDue';
  return stripeStatus.value || strapiStatus.value || '';
});
const isAmbassador = computed(() =>
  isAmbassadorBilling(billingData.value) || isBillingExemptLifetimePro(user.value)
);
const ambassadorPlan = ambassadorPlanLabel();
const ambassadorStatus = ambassadorStatusLabel();
const renewalCopy = computed(() =>
  isAmbassador.value ? null : formatAccountRenewalCopy(billingData.value)
);
// Before the billing button: what it can charge, and how to cancel (C3).
const billingTerms = computed(() =>
  accountBillingTerms({
    status: normalizedStatus.value,
    priceLabel: priceLabelFrom(billingData.value?.subscription?.price),
    hasPaymentMethod: billingData.value?.hasPaymentMethod ?? null,
    billingExempt: isAmbassador.value,
  })
);
const isTrialing = computed(() => normalizedStatus.value === 'trialing');
const isPastDue = computed(() =>
  normalizedStatus.value === 'past_due' || normalizedStatus.value === 'pastDue'
);
const displayStatus = computed(() => {
  if (isPastDue.value) return 'Past Due';
  if (!normalizedStatus.value) return 'Unknown';
  return normalizedStatus.value.charAt(0).toUpperCase() + normalizedStatus.value.slice(1);
});

const planLabel = computed(() =>
  billingData.value?.subscription?.plan?.nickname || (isTrialing.value ? 'Trial' : 'Monthly')
);

const showTrialEnds = computed(() => {
  if (!isTrialing.value) return false;
  const t = billingData.value?.trialEndsAt;
  if (!t) return false;
  const d = new Date(t);
  return !Number.isNaN(d.getTime()) && d.getTime() > Date.now();
});

// Billing A: the server's portal terms (consent only where the portal can charge).
const portalConsent = useBillingConsent('portal');

onMounted(async () => {
  if (user.value) email.value = user.value.email;
  await Promise.all([fetchBillingInfo(), fetchBandAccess(), isAmbassador.value ? null : portalConsent.load()]);
});

async function fetchBandAccess() {
  accessLoading.value = true;
  accessError.value = '';
  try {
    const { getMyBandAccess } = useBandTeam();
    const data = await getMyBandAccess();
    ownedBands.value = data?.owned || [];
    teamBands.value = data?.teamAccess || [];
  } catch (e) {
    console.error('Band access fetch error', e);
    accessError.value = 'Unable to load band access right now.';
  } finally {
    accessLoading.value = false;
  }
}

// Same authenticated call as the dashboard. (useFetch inside onMounted never
// sent this request in production; see utils/billing/accountBillingLoad.js.)
async function fetchBillingInfo() {
  billingUnavailable.value = false;
  billingLoading.value = true;
  const result = await loadAccountBilling(
    () => client('/stripe/billing', { headers: { Authorization: `Bearer ${token.value}` } }),
    { billingExemptUser: isBillingExemptLifetimePro(user.value) }
  );
  billingData.value = result.billingData;
  billingUnavailable.value = result.billingUnavailable;
  billingLoading.value = false;
  if (result.billingUnavailable) console.error('Billing fetch error');
  if (!result.billingData || isAmbassadorBilling(result.billingData) || isBillingExemptLifetimePro(user.value)) return;
  if (user.value && normalizedStatus.value) {
    user.value.subscriptionStatus = normalizedStatus.value;
  }
}

async function updateAccount() {
  const updates: Record<string, string> = {
    email:    email.value,
    username: email.value,
  };
  if (password.value) updates.password = password.value;

  try {
    await client(`/users/${user.value.id}`, {
      method: 'PUT',
      body:   updates,
      headers: { Authorization: `Bearer ${token.value}` },
    });
    alert('Account updated!');
  } catch (e) {
    console.error('Update error', e);
    alert('Failed to update account');
  }
}

const cancelMessage = ref('');

async function goToBillingPortal({ intent }: { intent?: 'cancel' } = {}) {
  if (intent !== 'cancel' && !portalConsent.ready.value) return;
  // Cancelling happens on the server (no portal, so no card form); one confirmation, no consent.
  if (intent === 'cancel' && !window.confirm('Cancel Faneqo Pro? It stays on until the end of your current trial or billing period and won’t renew after that. Any balance that’s already due may still be collected.')) return;
  try {
    const consent = intent === 'cancel' ? null : portalConsent.payload();
    const res: any = await client('stripe/create-billing-portal-session', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value}` },
      body: intent === 'cancel' ? { intent } : consent ? { consent } : {},
    });
    if (res?.canceled) {
      cancelMessage.value = 'Your membership won’t renew. Pro stays on until the end of your current trial or billing period. Any balance that’s already due may still be collected.';
      await fetchBillingInfo();
      await portalConsent.load();
    } else if (res?.url) {
      window.location.href = res.url;
    } else {
      alert('Unable to open billing portal');
    }
  } catch (e: any) {
    console.error('Portal error', e);
    // Consent missing or stale: show the server's current terms again, unticked.
    if (portalConsent.handleRefusal(e)) return;
    alert('Error opening billing portal');
  }
}
</script>

<style scoped>
.form-input {
  background: var(--fq-surface-raised, #111217);
  border: 1px solid var(--fq-border, rgba(255, 255, 255, 0.07));
  color: var(--fq-text-primary, #F5F5F6);
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.form-input:focus {
  border-color: rgba(57, 255, 20, 0.45);
  box-shadow: 0 0 0 1px rgba(57, 255, 20, 0.16);
}

.fq-account-row {
  background: var(--fq-surface-raised, #111217);
  border: 1px solid var(--fq-border, rgba(255, 255, 255, 0.07));
}
</style>
