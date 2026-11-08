<template>
  <div class="min-h-screen bg-black text-white pt-[var(--header-height)] overflow-x-hidden">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div class="mb-8">
        <NuxtLink
          :to="dashboardPath"
          class="inline-flex items-center gap-1.5 text-sm text-white/45 hover:text-white/75 transition-colors mb-4"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </NuxtLink>
        <h1 class="text-3xl font-semibold text-white tracking-tight">Team Access</h1>
        <p class="text-white/55 mt-2 max-w-xl leading-relaxed">
          Invite people to help manage this artist page without sharing your login.
        </p>
        <p v-if="bandName" class="text-white/80 text-sm mt-3 font-medium">{{ bandName }}</p>
      </div>

      <!-- Forbidden / hard error -->
      <div
        v-if="forbidden"
        class="rounded-2xl border border-amber-500/20 bg-[#0f0f12] p-6 mb-6"
      >
        <p class="text-amber-100/90 text-sm leading-relaxed">{{ pageError }}</p>
        <NuxtLink to="/dashboard" class="inline-block mt-4 text-sm text-violet-300 hover:text-violet-200">
          Back to dashboard
        </NuxtLink>
      </div>

      <template v-else>
        <!-- Role guide -->
        <section class="rounded-2xl border border-white/10 bg-[#0f0f12] p-5 mb-6">
          <div class="grid gap-3 sm:grid-cols-3">
            <div>
              <span class="role-chip role-owner">Owner</span>
              <p class="text-white/40 text-xs mt-2 leading-relaxed">
                Full access, billing, payouts, team control, and fan messaging.
              </p>
            </div>
            <div>
              <span class="role-chip role-manager">Manager</span>
              <p class="text-white/40 text-xs mt-2 leading-relaxed">
                Can edit the artist page, events, links, Show Mode, and analytics. No billing, team, or fan emails.
              </p>
            </div>
            <div>
              <span class="role-chip role-viewer">Viewer</span>
              <p class="text-white/40 text-xs mt-2 leading-relaxed">
                Read-only dashboard and analytics. Cannot edit artist data.
              </p>
            </div>
          </div>
        </section>

        <!-- Invite form -->
        <section id="invite" class="rounded-2xl border border-white/10 bg-[#0f0f12] p-6 mb-6 scroll-mt-24">
          <h2 class="text-lg font-medium text-white mb-1">Invite team member</h2>
          <p class="text-white/45 text-sm mb-5 leading-relaxed">
            Send an invite to someone who helps with this artist page. They’ll sign up or log in with that same email (invite emails don’t include a password).
          </p>

          <form class="space-y-4" @submit.prevent="submitInvite">
            <div>
              <label class="block text-xs uppercase tracking-wider text-white/40 mb-1.5">Email</label>
              <input
                v-model="inviteEmail"
                type="email"
                required
                autocomplete="email"
                placeholder="name@example.com"
                class="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
              />
            </div>
            <div>
              <label class="block text-xs uppercase tracking-wider text-white/40 mb-1.5">Role</label>
              <select
                v-model="inviteRole"
                class="w-full rounded-xl bg-[#16161a] border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/60"
              >
                <option value="manager">Manager</option>
                <option value="viewer">Viewer</option>
              </select>
              <p class="text-white/40 text-xs mt-2 leading-relaxed">
                <span v-if="inviteRole === 'manager'">
                  Manager — artist page, events, Show Mode, analytics. Not billing, team, or fan messaging.
                </span>
                <span v-else>
                  Viewer — read-only analytics and dashboard.
                </span>
              </p>
            </div>

            <p v-if="inviteError" class="text-red-300 text-sm">{{ inviteError }}</p>
            <p v-if="inviteSuccess" class="text-emerald-300 text-sm">{{ inviteSuccess }}</p>
            <p v-if="inviteWarning" class="text-amber-200/90 text-sm">{{ inviteWarning }}</p>

            <button
              type="submit"
              :disabled="inviting || loading"
              class="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium py-3 px-5 transition-colors"
            >
              {{ inviting ? 'Sending…' : 'Send invite' }}
            </button>
          </form>
        </section>

        <!-- Members -->
        <section class="rounded-2xl border border-white/10 bg-[#0f0f12] p-6 mb-6">
          <h2 class="text-lg font-medium text-white mb-4">Current members</h2>
          <div v-if="loading" class="text-white/45 text-sm py-4">Loading team…</div>
          <div v-else-if="!members.length" class="text-white/45 text-sm py-2">No team members yet.</div>
          <ul v-else class="divide-y divide-white/5">
            <li
              v-for="member in members"
              :key="member.id"
              class="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div class="min-w-0">
                <p class="text-white font-medium truncate">{{ member.email || member.username || 'Member' }}</p>
                <div class="flex flex-wrap items-center gap-2 mt-1.5">
                  <span class="role-chip" :class="roleChipClass(member.role)">{{ roleLabel(member.role) }}</span>
                  <span class="text-white/35 text-xs capitalize">{{ member.status }}</span>
                  <span v-if="member.acceptedAt" class="text-white/30 text-xs">
                    Joined {{ formatDate(member.acceptedAt) }}
                  </span>
                </div>
              </div>
              <div
                v-if="member.role !== 'owner'"
                class="flex flex-wrap items-center gap-2 self-start sm:self-center"
              >
                <select
                  class="rounded-lg bg-[#16161a] border border-white/10 px-2 py-1.5 text-sm text-white disabled:opacity-40"
                  :value="member.role"
                  :disabled="roleUpdatingId === member.id"
                  @change="changeRole(member, $event.target.value)"
                >
                  <option value="manager">Manager</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  type="button"
                  class="text-sm text-red-300/90 hover:text-red-200 disabled:opacity-40"
                  :disabled="removingId === member.id"
                  @click="removeMember(member)"
                >
                  {{ removingId === member.id ? 'Removing…' : 'Remove' }}
                </button>
              </div>
            </li>
          </ul>
        </section>

        <!-- Pending invites -->
        <section class="rounded-2xl border border-white/10 bg-[#0f0f12] p-6">
          <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
            <h2 class="text-lg font-medium text-white">Pending invites</h2>
            <p class="text-white/35 text-xs">Invites expire after 14 days.</p>
          </div>
          <div v-if="loading" class="text-white/45 text-sm py-4">Loading…</div>
          <div v-else-if="!pendingInvites.length" class="text-white/45 text-sm py-2">No pending invites.</div>
          <ul v-else class="divide-y divide-white/5">
            <li
              v-for="invite in pendingInvites"
              :key="invite.id"
              class="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div class="min-w-0">
                <p class="text-white font-medium truncate">{{ invite.email }}</p>
                <div class="flex flex-wrap items-center gap-2 mt-1.5">
                  <span class="role-chip" :class="roleChipClass(invite.role)">{{ roleLabel(invite.role) }}</span>
                  <span class="text-white/35 text-xs capitalize">{{ invite.status }}</span>
                  <span v-if="invite.createdAt" class="text-white/30 text-xs">
                    Sent {{ formatDate(invite.createdAt) }}
                  </span>
                  <span v-if="invite.expiresAt" class="text-white/30 text-xs">
                    Expires {{ formatDate(invite.expiresAt) }}
                  </span>
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-3 self-start sm:self-center">
                <button
                  type="button"
                  class="text-sm text-violet-300 hover:text-violet-200 disabled:opacity-40"
                  :disabled="resendingId === invite.id"
                  @click="resendInvite(invite)"
                >
                  {{ resendingId === invite.id ? 'Sending…' : 'Resend' }}
                </button>
                <button
                  type="button"
                  class="text-sm text-amber-200/90 hover:text-amber-100 disabled:opacity-40"
                  :disabled="revokingId === invite.id"
                  @click="revokeInvite(invite)"
                >
                  {{ revokingId === invite.id ? 'Canceling…' : 'Cancel' }}
                </button>
              </div>
            </li>
          </ul>
        </section>

        <p v-if="pageError && !forbidden" class="mt-6 text-red-300 text-sm">{{ pageError }}</p>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useBandTeam } from '~/composables/useBandTeam';
import { dashboardPathForBand } from '~/utils/ui/dashboardWorkspace';

definePageMeta({
  middleware: 'auth',
});

useSeoMeta({
  title: 'Team Access',
});

const route = useRoute();
const bandId = computed(() => route.params.bandId);
/** Return to the workspace this page was opened from, not the artist picker. */
const dashboardPath = computed(() => dashboardPathForBand(bandId.value));

const {
  getBandTeam,
  inviteBandMember,
  resendBandInvite,
  revokeBandInvite,
  updateBandMemberRole,
  removeBandMember,
} = useBandTeam();

const loading = ref(true);
const pageError = ref('');
const forbidden = ref(false);
const members = ref([]);
const pendingInvites = ref([]);
const bandName = ref('');

const inviteEmail = ref('');
const inviteRole = ref('manager');
const inviting = ref(false);
const inviteError = ref('');
const inviteSuccess = ref('');
const inviteWarning = ref('');
const revokingId = ref(null);
const resendingId = ref(null);
const removingId = ref(null);
const roleUpdatingId = ref(null);

const ALLOWED_INVITE_ROLES = ['manager', 'viewer'];

function roleLabel(role) {
  if (role === 'owner') return 'Owner';
  if (role === 'manager') return 'Manager';
  if (role === 'viewer') return 'Viewer';
  return role;
}

function roleChipClass(role) {
  if (role === 'owner') return 'role-owner';
  if (role === 'manager') return 'role-manager';
  return 'role-viewer';
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

async function loadTeam() {
  if (!bandId.value) {
    pageError.value = 'Missing band.';
    forbidden.value = true;
    loading.value = false;
    return;
  }
  loading.value = true;
  pageError.value = '';
  forbidden.value = false;
  try {
    const data = await getBandTeam(bandId.value);
    members.value = data?.members || [];
    pendingInvites.value = data?.pendingInvites || [];
  } catch (err) {
    const status = err?.statusCode || err?.status;
    const msg = err?.data?.message || err?.message || 'Unable to load team.';
    pageError.value = msg;
    if (status === 403 || status === 401) {
      forbidden.value = true;
      pageError.value = 'Only the band owner can manage Team Access.';
    }
  } finally {
    loading.value = false;
  }
}

async function submitInvite() {
  inviteError.value = '';
  inviteSuccess.value = '';
  inviteWarning.value = '';

  const email = inviteEmail.value.trim();
  if (!email) {
    inviteError.value = 'Enter an email address.';
    return;
  }
  if (!ALLOWED_INVITE_ROLES.includes(inviteRole.value)) {
    inviteError.value = 'Role must be manager or viewer.';
    return;
  }

  inviting.value = true;
  try {
    await inviteBandMember(bandId.value, {
      email,
      role: inviteRole.value,
    });
    inviteSuccess.value = `Invite sent to ${email}.`;
    inviteEmail.value = '';
    await loadTeam();
  } catch (err) {
    const code = typeof err?.data?.error === 'string' ? err.data.error : null;
    const msg = err?.data?.message || err?.data?.error?.message || 'Could not send invite.';
    if (code === 'email_failed') {
      inviteWarning.value =
        msg || 'Invite email could not be sent. Please try again shortly.';
      await loadTeam();
    } else {
      inviteError.value = msg;
    }
  } finally {
    inviting.value = false;
  }
}

async function changeRole(member, nextRole) {
  if (member.role === 'owner' || !ALLOWED_INVITE_ROLES.includes(nextRole)) return;
  if (nextRole === member.role) return;
  roleUpdatingId.value = member.id;
  pageError.value = '';
  try {
    await updateBandMemberRole(bandId.value, member.id, nextRole);
    await loadTeam();
  } catch (err) {
    pageError.value = err?.data?.message || 'Could not update role.';
  } finally {
    roleUpdatingId.value = null;
  }
}

async function resendInvite(invite) {
  resendingId.value = invite.id;
  pageError.value = '';
  try {
    await resendBandInvite(bandId.value, invite.id);
    inviteSuccess.value = `Invite resent to ${invite.email}.`;
    await loadTeam();
  } catch (err) {
    pageError.value = err?.data?.message || 'Could not resend invite.';
  } finally {
    resendingId.value = null;
  }
}

async function revokeInvite(invite) {
  if (!confirm(`Cancel the invite to ${invite.email}?`)) return;
  revokingId.value = invite.id;
  pageError.value = '';
  try {
    await revokeBandInvite(bandId.value, invite.id);
    await loadTeam();
  } catch (err) {
    pageError.value = err?.data?.message || 'Could not cancel invite.';
  } finally {
    revokingId.value = null;
  }
}

async function removeMember(member) {
  if (member.role === 'owner') return;
  const label = member.email || member.username || 'this member';
  if (!confirm(`Remove ${label} from Team Access? They will lose access immediately.`)) return;
  removingId.value = member.id;
  pageError.value = '';
  try {
    await removeBandMember(bandId.value, member.id);
    await loadTeam();
  } catch (err) {
    pageError.value = err?.data?.message || 'Could not remove member.';
  } finally {
    removingId.value = null;
  }
}

onMounted(async () => {
  try {
    const client = useStrapiClient();
    const token = useStrapiToken();
    const res = await client(`/bands/${bandId.value}`, {
      headers: { Authorization: `Bearer ${token.value}` },
    });
    bandName.value =
      res?.data?.attributes?.name ||
      res?.data?.name ||
      res?.name ||
      '';
  } catch {
    // non-fatal
  }
  await loadTeam();
});
</script>

<style scoped>
.role-chip {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid transparent;
}
.role-owner {
  color: #e9d5ff;
  background: rgba(124, 58, 237, 0.18);
  border-color: rgba(167, 139, 250, 0.35);
}
.role-manager {
  color: #f5d0fe;
  background: rgba(192, 38, 211, 0.14);
  border-color: rgba(232, 121, 249, 0.3);
}
.role-viewer {
  color: #d1d5db;
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
}
</style>
