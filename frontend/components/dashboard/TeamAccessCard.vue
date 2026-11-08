<template>
  <section class="team-access-card mb-8 overflow-hidden">
    <!-- Collapsed: one-line bar — still discoverable, not in the way -->
    <div v-if="collapsed" class="card-compact">
      <div class="compact-left min-w-0">
        <span class="compact-title">Team Access</span>
        <span class="badge">For teams</span>
        <span v-if="!loading && !loadError && !isEmpty" class="compact-meta">
          {{ managerCount }} manager{{ managerCount === 1 ? '' : 's' }}
          <template v-if="pendingCount"> · {{ pendingCount }} pending</template>
        </span>
        <span v-else-if="!loading && isEmpty" class="compact-meta">No team members yet</span>
      </div>
      <div class="compact-actions">
        <NuxtLink :to="ctaPath" class="cta-compact">
          {{ isEmpty && !loadError ? 'Invite' : 'Manage' }}
        </NuxtLink>
        <button type="button" class="toggle-btn" @click="expand">
          Expand
        </button>
      </div>
    </div>

    <!-- Expanded full card -->
    <div v-else class="card-inner">
      <div class="card-header">
        <div class="min-w-0 flex-1">
          <div class="title-row">
            <h2 class="card-title">Team Access</h2>
            <span class="badge">For teams</span>
          </div>
          <p v-if="bandName" class="band-name">{{ bandName }}</p>
          <p class="card-body">
            Invite managers, bandmates, or staff to help manage this artist page without sharing your login.
          </p>
          <p class="card-note">
            Managers can edit the page and run shows. Billing, team control, and fan emails stay with you.
          </p>
        </div>
        <button type="button" class="toggle-btn header-toggle" @click="minimize">
          Minimize
        </button>
      </div>

      <div class="card-states">
        <template v-if="loading">
          <div class="preview-row">
            <span class="chip chip-owner">Owner</span>
            <span class="chip muted">Loading…</span>
          </div>
          <NuxtLink :to="teamPath" class="cta-primary">Manage Team</NuxtLink>
        </template>

        <template v-else-if="loadError">
          <div class="preview-row">
            <span class="chip chip-owner">Owner</span>
            <span class="chip muted">Owner control</span>
          </div>
          <NuxtLink :to="teamPath" class="cta-primary">Manage Team</NuxtLink>
        </template>

        <template v-else-if="isEmpty">
          <p class="card-meta">No team members yet.</p>
          <NuxtLink :to="invitePath" class="cta-primary">Invite Team Member</NuxtLink>
        </template>

        <template v-else>
          <div class="preview-row">
            <span class="chip chip-owner">Owner</span>
            <span class="chip">Managers: {{ managerCount }}</span>
            <span class="chip muted">Pending: {{ pendingCount }}</span>
          </div>
          <NuxtLink :to="teamPath" class="cta-primary">Manage Team</NuxtLink>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useBandTeam } from '~/composables/useBandTeam';

const STORAGE_PREFIX = 'faneqo_team_access_card_collapsed';

const props = defineProps({
  bandId: {
    type: [Number, String],
    required: true,
  },
  bandName: {
    type: String,
    default: '',
  },
});

const { getBandTeam } = useBandTeam();

const collapsed = ref(false);
const loading = ref(true);
const loadError = ref(false);
const summary = ref({
  managerCount: 0,
  viewerCount: 0,
  pendingInviteCount: 0,
  memberCount: 0,
});

const storageKey = computed(() => `${STORAGE_PREFIX}:${props.bandId}`);
const teamPath = computed(() => `/dashboard/team/${props.bandId}`);
const invitePath = computed(() => `/dashboard/team/${props.bandId}#invite`);
const managerCount = computed(() => summary.value.managerCount || 0);
const viewerCount = computed(() => summary.value.viewerCount || 0);
const pendingCount = computed(() => summary.value.pendingInviteCount || 0);
const isEmpty = computed(() => {
  const members = summary.value.memberCount || 0;
  const pending = summary.value.pendingInviteCount || 0;
  return members <= 1 && pending === 0 && managerCount.value === 0 && viewerCount.value === 0;
});
const ctaPath = computed(() => (isEmpty.value && !loadError.value ? invitePath.value : teamPath.value));

function readCollapsed() {
  if (!process.client || !props.bandId) return false;
  try {
    return localStorage.getItem(storageKey.value) === '1';
  } catch {
    return false;
  }
}

function writeCollapsed(value) {
  if (!process.client || !props.bandId) return;
  try {
    localStorage.setItem(storageKey.value, value ? '1' : '0');
  } catch {
    // ignore
  }
}

function minimize() {
  collapsed.value = true;
  writeCollapsed(true);
}

function expand() {
  collapsed.value = false;
  writeCollapsed(false);
}

async function loadSummary() {
  if (!props.bandId) {
    loading.value = false;
    loadError.value = true;
    return;
  }
  collapsed.value = readCollapsed();
  loading.value = true;
  loadError.value = false;
  try {
    const data = await getBandTeam(props.bandId);
    summary.value = data?.summary || {
      managerCount: 0,
      viewerCount: 0,
      pendingInviteCount: (data?.pendingInvites || []).length,
      memberCount: (data?.members || []).length,
    };
    if (!data?.summary && data?.members) {
      summary.value = {
        memberCount: data.members.length,
        managerCount: data.members.filter((m) => m.role === 'manager').length,
        viewerCount: data.members.filter((m) => m.role === 'viewer').length,
        pendingInviteCount: (data.pendingInvites || []).length,
      };
    }
  } catch {
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(loadSummary);
watch(() => props.bandId, loadSummary);
</script>

<style scoped>
.team-access-card {
  width: 100%;
  max-width: 100%;
}
.card-compact {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-radius: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #0f0f12;
  padding: 0.85rem 1rem;
}
.compact-left {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}
.compact-title {
  font-size: 0.95rem;
  font-weight: 650;
  color: #fff;
}
.compact-meta {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.45);
}
.compact-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
}
.cta-compact {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.6rem;
  background: #7c3aed;
  color: #fff;
  font-weight: 600;
  font-size: 0.8rem;
  padding: 0.45rem 0.8rem;
}
.cta-compact:hover {
  background: #6d28d9;
}
.toggle-btn {
  border-radius: 0.6rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.78rem;
  font-weight: 550;
  padding: 0.45rem 0.75rem;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.toggle-btn:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.28);
}
.header-toggle {
  flex-shrink: 0;
  align-self: flex-start;
}
.card-inner {
  border-radius: 1rem;
  border: 1px solid rgba(167, 139, 250, 0.22);
  background:
    linear-gradient(120deg, rgba(124, 58, 237, 0.14) 0%, transparent 38%),
    linear-gradient(165deg, rgba(192, 38, 211, 0.08) 0%, transparent 50%),
    #0f0f12;
  padding: 1.35rem 1.35rem 1.25rem;
}
.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}
.title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem;
}
.card-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.02em;
  line-height: 1.2;
}
.badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.22rem 0.55rem;
  border-radius: 999px;
  color: #f5d0fe;
  background: rgba(192, 38, 211, 0.16);
  border: 1px solid rgba(232, 121, 249, 0.35);
}
.band-name {
  margin-top: 0.35rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.72);
}
.card-body {
  margin-top: 0.55rem;
  max-width: 38rem;
  font-size: 0.92rem;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.58);
}
.card-note {
  margin-top: 0.45rem;
  max-width: 38rem;
  font-size: 0.75rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.34);
}
.card-states {
  margin-top: 1.2rem;
  padding-top: 1.05rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
}
.card-meta {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.55);
}
.preview-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  min-width: 0;
}
.chip {
  display: inline-flex;
  align-items: center;
  font-size: 0.68rem;
  font-weight: 650;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0.28rem 0.65rem;
  border-radius: 999px;
  color: #f3e8ff;
  background: rgba(124, 58, 237, 0.14);
  border: 1px solid rgba(167, 139, 250, 0.28);
}
.chip-owner {
  color: #fff;
  background: rgba(192, 38, 211, 0.18);
  border-color: rgba(232, 121, 249, 0.38);
}
.chip.muted {
  color: rgba(255, 255, 255, 0.68);
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.12);
}
.cta-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  background: #7c3aed;
  color: #fff;
  font-weight: 650;
  font-size: 0.9rem;
  padding: 0.75rem 1.15rem;
  transition: background 0.15s ease;
  white-space: nowrap;
}
.cta-primary:hover {
  background: #6d28d9;
}

@media (max-width: 640px) {
  .card-inner {
    padding: 1.2rem 1.1rem 1.1rem;
  }
  .cta-primary {
    width: 100%;
  }
  .card-states {
    align-items: stretch;
  }
  .compact-actions {
    width: 100%;
  }
  .cta-compact,
  .toggle-btn {
    flex: 1;
    justify-content: center;
  }
}
</style>
