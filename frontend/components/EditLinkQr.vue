<template>
  <div class="container-mdc">
    <p class="title text-center">Edit QR Details </p>
    <div class="mb-6">
        <img :src="props.q_image" class="mx-auto" alt="">
    </div>
    <form @submit.prevent="updateLink">
      <div class="mdc-text-field mdc-text-field--filled">
        <input
          id="link"
          v-model="formData.name"
          type="text"
          class="mdc-text-field__input"
          placeholder="name"
        />
        <label for="link" class="mdc-floating-label">Name</label>
        <span class="mdc-line-ripple"></span>
        <img
          src="@/assets/cancel-icon.svg"
          alt="Cancel Icon"
          class="cancel-icon"
          @click="clearInputName"
        />
      </div>
      <div class="mdc-text-field mdc-text-field--filled">
        <input
          id="link"
          v-model="formData.link"
          type="text"
          class="mdc-text-field__input"
          placeholder="Link"
        />
        <label for="link" class="mdc-floating-label">Link</label>
        <span class="mdc-line-ripple"></span>
        <img
          src="@/assets/cancel-icon.svg"
          alt="Cancel Icon"
          class="cancel-icon"
          @click="clearInput"
        />
      </div>
      <div class="mdc-text-field mdc-text-field--filled mb-4">
        <select v-model="formData.q_type" placeholder="externalURL" class="mdc-text-field__input">
          <option value="" disabled>Select QR Code Type</option>
          <option value="externalURL">External URL</option>
          <option value="Band Page">Band Page</option>
        </select>
        <label for="q_type" class="mdc-floating-label">QR Code Type</label>
        <span class="mdc-line-ripple"></span>
      </div>
      
      <button type="submit" class="mdc-button mdc-button--raised">Update Link</button>
    </form>

  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRuntimeConfig } from '#app'

const config = useRuntimeConfig()
const baseUrl = (config.public?.baseUrl || 'https://musicbizqr.com').replace(/\/+$/,'')

const router = useRouter()
const { findOne, update } = useStrapi()

/* ---------- Props from parent ---------- */
const props = defineProps({
  name: { type: String, default: 'Default Title' },
  qr:   { type: Object,  default: null },
  url:  { type: String,  default: '' },
  q_image: { type: String, default: 'https://via.placeholder.com/300' },
  q_type: { type: String, default: '' },
  link:  { type: String, default: '' },
  qrId:  { type: Number, required: true }
})

/* ---------- Helpers ---------- */
const normalizeLink = (val) => {
  if (!val) return ''
  const s = String(val).trim()
  if (/^https?:\/\//i.test(s)) return s
  if (/^www\./i.test(s)) return `https://${s}`
  return `https://www.${s}`
}

const isDirectQrUrl = (u) => /\/directqr\?id=/.test(String(u || ''))

/* ---------- Form state ---------- */
const formData = ref({
  name:  props.name || '',
  link:  props.link || '',
  q_type: props.q_type || 'externalURL', // sensible default
})

/* Keep form in sync if parent props change */
watch(() => props.name, (v) => { formData.value.name  = v ?? '' })
watch(() => props.link, (v) => { formData.value.link  = v ?? '' })
watch(() => props.q_type, (v) => { formData.value.q_type = v || 'externalURL' })

/* ---------- Derived + loaded data ---------- */
const existing = ref(null)       // full Strapi record
const existingUrl = ref(props.url || '')
const existingSlugId = ref(null)

/* Load current QR (to get slugId or derive it) */
onMounted(async () => {
  try {
    const res = await findOne('qrs', props.qrId, { populate: '*' })
    existing.value = res?.data || null
    const a = existing.value?.attributes || {}
    existingSlugId.value = a.slugId || a.slug || String(existing.value?.id || '')
    existingUrl.value = a.url || props.url || ''

    // If parent only provided a raw link for very old items, keep it visible:
    if (!formData.value.link && a.link) formData.value.link = a.link
    if (!formData.value.name && a.name) formData.value.name = a.name
    if (!formData.value.q_type && a.q_type) formData.value.q_type = a.q_type
  } catch (e) {
    // non-blocking
    // console.warn('Failed to fetch QR for edit:', e)
  }
})

/* ---------- Submit (repair + update) ---------- */
const updating = ref(false)

const updateLink = async () => {
  try {
    updating.value = true

    // Always keep external destination in `link`
    const safeLink = normalizeLink(formData.value.link)

    // Ensure we have a slug id to point the QR to
    const slug = existingSlugId.value || String(props.qrId)

    // FORCE the QR's scannable URL to go through /directqr
    const directUrl = `${baseUrl}/directqr?id=${encodeURIComponent(slug)}`

    // If this is an older record whose url points directly to an external site,
    // this will REPAIR it by rewriting url -> /directqr?id=slug and storing
    // the destination in `link`.
    const payload = {
      name: formData.value.name || '',
      q_type: formData.value.q_type || 'externalURL',
      link: safeLink || null,
      url: directUrl,
      // also persist slugId if your content-type has it
      ...(existingSlugId.value ? {} : { slugId: slug }),
    }

    await update('qrs', props.qrId, payload)
    router.push('/dashboard')
  } catch (error) {
    console.error('There was an error:', error)
    alert(error?.message || 'Failed to update QR')
  } finally {
    updating.value = false
  }
}

/* ---------- Expose to template (if needed for disabled states) ---------- */
const isUpdating = computed(() => updating.value)
</script>


<style scoped>
/* Basic Container Styling */
.container-mdc {
  max-width: 500px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Title Styling */
.title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: #333;
}

/* Material Design Text Field Styling */
.mdc-text-field {
  position: relative;
  margin-bottom: 1.5rem;
  display: inline-block;
  width: 100%;
}

.mdc-text-field__input {
  font-size: 1rem;
  line-height: 1.5;
  padding: 0.75rem 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;
  width: 100%;
}

.mdc-floating-label {
  position: absolute;
  z-index: 99999;
  top: 0.75rem;
  left: 0.5rem;
  padding-left: 0.2em;
  padding-right: 0.2em;
  font-size: 1rem;
  background: white;
  line-height: 1;
  color: #aaa;
  pointer-events: none;
  transition: transform 0.2s, color 0.2s;
}

.mdc-text-field__input:focus + .mdc-floating-label,
.mdc-text-field__input:not(:placeholder-shown) + .mdc-floating-label {
  transform: translateY(-1.5rem);
  color: #6200ee;
}

.mdc-line-ripple {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #6200ee;
  transform: scaleX(0);
  transition: transform 0.2s;
}

.mdc-text-field__input:focus ~ .mdc-line-ripple {
  transform: scaleX(1);
}

/* Button Styling */
.mdc-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.0892857143em;
  color: #fff;
  background-color: #6200ee;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.mdc-button:hover {
  background-color: #3700b3;
}

.mdc-button:focus {
  outline: none;
}

.cancel-icon {
  position: absolute;
  top: 50%;
  right: 1rem;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  cursor: pointer;
}
</style>
