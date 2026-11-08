<template>
  <div class="auth-field">
    <div class="auth-field__label-row">
      <label :for="id" class="auth-field__label">{{ label }}</label>
      <slot name="action" />
    </div>
    <div class="auth-field__control">
      <input
        :id="id"
        class="auth-field__input"
        :class="{ 'is-invalid': invalid, 'auth-field__input--toggle': passwordToggle }"
        :type="resolvedType"
        :name="name || id"
        :value="modelValue"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :enterkeyhint="enterkeyhint"
        :autocapitalize="autocapitalize"
        :spellcheck="spellcheck"
        :required="required"
        :minlength="minlength"
        :aria-invalid="invalid ? 'true' : undefined"
        :aria-describedby="describedBy"
        v-bind="inputAttrs"
        @focus="onFocus"
        @input="$emit('update:modelValue', $event.target.value)"
      />
      <button
        v-if="passwordToggle"
        type="button"
        class="auth-field__reveal"
        :aria-label="revealed ? 'Hide password' : 'Show password'"
        @click="revealed = !revealed"
      >
        <svg v-if="!revealed" class="auth-field__reveal-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" stroke="currentColor" stroke-width="1.6" />
          <circle cx="12" cy="12" r="2.6" stroke="currentColor" stroke-width="1.6" />
        </svg>
        <svg v-else class="auth-field__reveal-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 3l18 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          <path d="M10.6 6.3A9.4 9.4 0 0112 6c6 0 9.5 7 9.5 7a16.6 16.6 0 01-3.2 4.1M6.6 6.7A16 16 0 002.5 12s3.5 7 9.5 7c1.4 0 2.7-.3 3.8-.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        </svg>
      </button>
    </div>
    <p v-if="error" :id="errorId" class="auth-field__error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  modelValue: { type: [String, Number], default: '' },
  type: { type: String, default: 'text' },
  name: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  autocomplete: { type: String, default: undefined },
  inputmode: { type: String, default: undefined },
  enterkeyhint: { type: String, default: undefined },
  autocapitalize: { type: String, default: 'none' },
  spellcheck: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  minlength: { type: [String, Number], default: undefined },
  passwordToggle: { type: Boolean, default: false },
  invalid: { type: Boolean, default: false },
  error: { type: String, default: '' },
  inputAttrs: { type: Object, default: () => ({}) },
})

defineEmits(['update:modelValue'])

const revealed = ref(false)
const errorId = computed(() => `${props.id}-error`)
const describedBy = computed(() => (props.error ? errorId.value : undefined))
const resolvedType = computed(() => {
  if (!props.passwordToggle) return props.type
  return revealed.value ? 'text' : 'password'
})

function onFocus(event) {
  const el = event?.target
  if (!el || typeof el.scrollIntoView !== 'function') return
  el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
}
</script>

<style scoped>
.auth-field {
  margin: 0 0 1.15rem;
  scroll-margin-top: 72px;
}

.auth-field__label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 28px;
  margin-bottom: 0.32rem;
}

.auth-field__label {
  color: rgba(245, 245, 246, 0.78);
  font-size: 0.8125rem;
  font-weight: 600;
}

.auth-field__control {
  position: relative;
}

.auth-field__input {
  width: 100%;
  height: 52px;
  padding: 0 1rem;
  border: 1px solid rgba(255, 255, 255, 0.075);
  border-radius: 14px;
  background: #0f1115;
  color: #f5f5f6;
  font: inherit;
  font-size: 1rem;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.auth-field__input--toggle {
  padding-right: 48px;
}

.auth-field__input::placeholder {
  color: rgba(245, 245, 246, 0.3);
}

.auth-field__input:hover {
  border-color: rgba(255, 255, 255, 0.12);
}

.auth-field__input:focus {
  border-color: rgba(255, 255, 255, 0.18);
  outline: none;
  box-shadow: 0 0 0 1px rgba(192, 132, 252, 0.22);
}

.auth-field__input.is-invalid {
  border-color: rgba(252, 165, 165, 0.55);
}

.auth-field__input:focus-visible {
  outline: 1px solid rgba(192, 132, 252, 0.45);
  outline-offset: 1px;
}

.auth-field__reveal {
  position: absolute;
  top: 50%;
  right: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  transform: translateY(-50%);
  padding: 0;
  border: 0;
  background: transparent;
  color: rgba(245, 245, 246, 0.42);
  cursor: pointer;
  transition: color 0.16s ease;
}

.auth-field__reveal:hover,
.auth-field__reveal:active,
.auth-field__reveal:focus-visible {
  color: rgba(245, 245, 246, 0.82);
}

.auth-field__reveal:focus-visible {
  outline: 1px solid rgba(192, 132, 252, 0.45);
  outline-offset: 0;
  border-radius: 10px;
}

.auth-field__reveal-icon {
  width: 18px;
  height: 18px;
}

.auth-field__error {
  margin: 0.45rem 0 0;
  color: #fca5a5;
  font-size: 0.8125rem;
  line-height: 1.4;
}

.auth-field__input:-webkit-autofill,
.auth-field__input:-webkit-autofill:hover,
.auth-field__input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 30px #0f1115 inset !important;
  -webkit-text-fill-color: #f5f5f6 !important;
  caret-color: #f5f5f6 !important;
}

@media (min-width: 1024px) {
  .auth-field__input:focus {
    border-color: rgba(192, 132, 252, 0.58);
    box-shadow: none;
  }

  .auth-field__input:focus-visible {
    outline: 1px solid rgba(192, 132, 252, 0.7);
    outline-offset: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-field__input {
    transition: none;
  }
}
</style>
