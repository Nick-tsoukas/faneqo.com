<template>
  <section class="show-messaging">
    <header class="show-messaging__head">
      <div>
        <p class="show-messaging__kicker">After the show</p>
        <h3>Reach the room again</h3>
        <p>Choose the audience here, then write and review everything in the same Messages composer.</p>
      </div>
      <span class="show-messaging__badge">Private fan outreach</span>
    </header>

    <div v-if="loading" class="show-messaging__state" role="status">Checking your reach…</div>
    <div v-else-if="error" class="show-messaging__state" role="alert">
      <span>{{ error }}</span>
      <button type="button" @click="load">Try again</button>
    </div>
    <template v-else>
      <div class="show-messaging__reach">
        <div>
          <strong>{{ inbox?.recipientCount || 0 }}</strong>
          <span>Faneqo Inbox</span>
          <small>Separate private conversation per fan</small>
        </div>
        <div>
          <strong>{{ email?.recipientCount || 0 }}</strong>
          <span>Email</span>
          <small>Subscribed checked-in fans</small>
        </div>
      </div>

      <p v-if="coolingCopy" class="show-messaging__cooldown">{{ coolingCopy }}</p>

      <div class="show-messaging__actions">
        <NuxtLink :to="composePath" class="show-messaging__primary">
          <MessageCircle :size="18" :stroke-width="1.75" aria-hidden="true" />
          Message attendees
        </NuxtLink>
        <NuxtLink to="/messages?tab=sent" class="show-messaging__secondary">View sent messages →</NuxtLink>
      </div>
      <p class="show-messaging__truth">
        Email protects each recipient with a 24-hour cooldown. Faneqo Inbox can reach the same fan again, and every reply stays in the same private conversation.
      </p>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { MessageCircle } from '@lucide/vue'

const props = defineProps({
  recapId: { type: [Number, String], required: true },
  autoOpen: { type: Boolean, default: false },
})

const route = useRoute()
const { getMessagePreview } = useShowRecaps()
const loading = ref(true)
const error = ref('')
const inbox = ref(null)
const email = ref(null)

const composePath = computed(() => ({
  path: '/messages/compose',
  query: {
    audienceType: 'show_attendees',
    recapId: String(props.recapId),
    channel: 'in_app',
    from: route.path,
  },
}))

const coolingCopy = computed(() => {
  const emailCooling = Number(email.value?.cooldownCount || 0)
  if (!emailCooling) return ''
  return `${emailCooling} cooling down for Email`
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [inboxPreview, emailPreview] = await Promise.all([
      getMessagePreview(props.recapId, 'in_app'),
      getMessagePreview(props.recapId, 'email'),
    ])
    if (!inboxPreview && !emailPreview) throw new Error('Reach is unavailable right now.')
    inbox.value = inboxPreview
    email.value = emailPreview
  } catch (err) {
    error.value = err?.message || 'Couldn’t check this audience.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (props.autoOpen) {
    await navigateTo(composePath.value)
    return
  }
  await load()
})
</script>

<style scoped>
.show-messaging {
  margin: 1.25rem 0;
  padding: 1.1rem;
  border: 1px solid rgba(255,255,255,.09);
  border-radius: 1rem;
  background: linear-gradient(145deg, rgba(57,255,20,.055), rgba(145,0,255,.055));
  color: #fff;
}
.show-messaging__head { display:flex; justify-content:space-between; gap:1rem; align-items:flex-start; }
.show-messaging__kicker { margin:0 0 .2rem; color:#6de6ff; font-size:.67rem; font-weight:800; letter-spacing:.12em; text-transform:uppercase; }
.show-messaging h3 { margin:0; font-size:1.15rem; }
.show-messaging__head p:last-child { max-width:34rem; margin:.35rem 0 0; color:rgba(255,255,255,.52); font-size:.8rem; line-height:1.45; }
.show-messaging__badge { flex:none; padding:.28rem .5rem; border-radius:999px; background:rgba(255,255,255,.06); color:rgba(255,255,255,.58); font-size:.66rem; }
.show-messaging__reach { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.7rem; margin-top:1rem; }
.show-messaging__reach > div { display:grid; gap:.12rem; padding:.8rem; border:1px solid rgba(255,255,255,.07); border-radius:.85rem; background:rgba(0,0,0,.24); }
.show-messaging__reach strong { font-size:1.35rem; }
.show-messaging__reach span { font-weight:700; font-size:.82rem; }
.show-messaging__reach small { color:rgba(255,255,255,.42); font-size:.69rem; }
.show-messaging__actions { display:flex; gap:.6rem; margin-top:1rem; flex-wrap:wrap; }
.show-messaging__primary,.show-messaging__secondary { display:inline-flex; min-height:44px; align-items:center; padding:.6rem .9rem; border-radius:.75rem; text-decoration:none; font-weight:750; font-size:.82rem; }
.show-messaging__primary { background:linear-gradient(135deg,#39ff14,#b044ff); color:#07120a; }
.show-messaging__secondary { border:1px solid rgba(255,255,255,.12); color:#fff; }
.show-messaging__truth,.show-messaging__cooldown,.show-messaging__state { margin:.75rem 0 0; color:rgba(255,255,255,.46); font-size:.72rem; line-height:1.45; }
.show-messaging__cooldown { color:#fbbf24; }
.show-messaging__state button { margin-left:.5rem; color:#6de6ff; }
@media(max-width:560px){.show-messaging__head{display:block}.show-messaging__badge{display:inline-block;margin-top:.65rem}.show-messaging__reach{grid-template-columns:1fr}}
</style>

