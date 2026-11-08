<template>
  <section class="nrm">
    <div class="nrm__head">
      <h2>Recordings</h2>
    </div>

    <div v-if="!rows.length" class="nrm__empty">
      <button type="button" class="nrm__lead" @click="openCreate">
        Add something from the stage.
      </button>
      <p>Share a live track, video, or recording from this Night.</p>
      <button type="button" class="nrm__add" @click="openCreate">Add recording</button>
    </div>

    <template v-else>
      <NightRecordingList
        :recordings="rows"
        :artist-name="artistName"
        :busy="busy"
        :fresh-id="freshId"
        @edit="openEdit"
        @remove="removeRow"
        @move="moveRow"
      />
      <button
        v-if="rows.length < max"
        type="button"
        class="nrm__more"
        :disabled="busy"
        @click="openCreate"
      >
        Add recording
      </button>
    </template>

    <p v-if="error" class="nrm__error" role="alert">{{ error }}</p>

    <NightRecordingComposer
      v-if="composing"
      :recap-id="recapId"
      :recording="draft"
      :local-only="localOnly"
      @close="composing = false"
      @saved="onSaved"
    />
  </section>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'
import NightRecordingComposer from '~/components/nights/NightRecordingComposer.vue'
import NightRecordingList from '~/components/nights/NightRecordingList.vue'
import {
  NIGHT_RECORDING_MAX,
  humanizeRecordingError,
  presentNightRecordings,
} from '~/utils/nights/nightRecordings'

const props = defineProps({
  recapId: { type: [Number, String], default: null },
  artistName: { type: String, default: '' },
  initialRecordings: { type: Array, default: null },
  localOnly: { type: Boolean, default: false },
})

const emit = defineEmits(['update:recordings'])
const { listForNight, updateRecording, removeRecording } = useNightRecordings()

const rows = ref(presentNightRecordings(props.initialRecordings || []))
const composing = ref(false)
const draft = ref(null)
const busy = ref(false)
const error = ref('')
const freshId = ref(null)
const max = NIGHT_RECORDING_MAX

watch(() => props.initialRecordings, (next) => {
  if (Array.isArray(next)) rows.value = presentNightRecordings(next)
})

onMounted(() => {
  if (!props.localOnly && props.recapId) load()
})

async function load() {
  if (props.localOnly || !props.recapId) return
  try {
    rows.value = presentNightRecordings(await listForNight(props.recapId))
    emit('update:recordings', rows.value)
  } catch (err) {
    error.value = humanizeRecordingError(err)
  }
}

function openCreate() {
  draft.value = { showRecapId: props.recapId }
  composing.value = true
}

function openEdit(row) {
  draft.value = { ...row, showRecapId: props.recapId }
  composing.value = true
}

function onSaved(row) {
  composing.value = false
  if (!row) return
  const next = rows.value.filter((item) => Number(item.id) !== Number(row.id))
  next.push(row)
  rows.value = presentNightRecordings(next)
  freshId.value = row.id
  emit('update:recordings', rows.value)
  nextTick(() => {
    const reduce = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(`nrl-${row.id}`)?.scrollIntoView({
      block: 'nearest',
      behavior: reduce ? 'auto' : 'smooth',
    })
  })
}

async function removeRow(row) {
  error.value = ''
  if (props.localOnly) {
    rows.value = rows.value.filter((item) => Number(item.id) !== Number(row.id))
    emit('update:recordings', rows.value)
    return
  }
  busy.value = true
  try {
    await removeRecording(row.id)
    rows.value = rows.value.filter((item) => Number(item.id) !== Number(row.id))
    emit('update:recordings', rows.value)
  } catch (err) {
    error.value = humanizeRecordingError(err)
  } finally {
    busy.value = false
  }
}

async function moveRow(row, direction) {
  const list = presentNightRecordings(rows.value)
  const index = list.findIndex((item) => Number(item.id) === Number(row.id))
  const swap = list[index + direction]
  if (index < 0 || !swap) return
  const orderA = Number.isInteger(row.sortOrder) ? row.sortOrder : index
  const orderB = Number.isInteger(swap.sortOrder) ? swap.sortOrder : index + direction
  error.value = ''
  if (props.localOnly) {
    row.sortOrder = orderB
    swap.sortOrder = orderA
    rows.value = presentNightRecordings(list)
    emit('update:recordings', rows.value)
    return
  }
  busy.value = true
  try {
    const [updatedA, updatedB] = await Promise.all([
      updateRecording(row.id, { sortOrder: orderB }),
      updateRecording(swap.id, { sortOrder: orderA }),
    ])
    rows.value = presentNightRecordings(
      list.map((item) => {
        if (Number(item.id) === Number(updatedA.id)) return updatedA
        if (Number(item.id) === Number(updatedB.id)) return updatedB
        return item
      }),
    )
    emit('update:recordings', rows.value)
  } catch (err) {
    error.value = humanizeRecordingError(err)
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.nrm { min-width: 0; }
.nrm__head h2 {
  margin: 0 0 1.05rem;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(245, 245, 246, 0.72);
}
.nrm__empty p {
  margin: 0.35rem 0 0;
  color: rgba(245, 245, 246, 0.62);
}
.nrm__lead {
  display: block;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: #f5f5f6;
  font: inherit;
  font-size: 1.2rem;
  font-weight: 650;
  line-height: 1.35;
  text-align: left;
  cursor: pointer;
}
.nrm__add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  margin-top: 0.85rem;
  padding: 0 1.1rem;
  border: 0;
  border-radius: 14px;
  background: #f3f3f4;
  color: #08090a;
  font: inherit;
  font-weight: 650;
  cursor: pointer;
}
.nrm__more {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-top: 0.55rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: #f5f5f6;
  font: inherit;
  font-weight: 650;
  cursor: pointer;
}
.nrm__error { margin: 0.7rem 0 0; color: #fca5a5; }
.nrm__lead:focus-visible,
.nrm__add:focus-visible,
.nrm__more:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}
</style>
