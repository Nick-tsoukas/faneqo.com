<template>
  <div class="billing-consent" data-testid="billing-consent">
    <p class="billing-consent__terms" :id="termsId" data-testid="billing-consent-terms">{{ terms.summary }}</p>
    <label class="billing-consent__check">
      <input
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        :aria-describedby="termsId"
        data-testid="billing-consent-checkbox"
        @change="$emit('update:modelValue', $event.target.checked)"
      />
      <span>I agree to these billing terms.</span>
    </label>
    <p v-if="notice" class="billing-consent__notice" role="alert">{{ notice }}</p>
  </div>
</template>

<script setup>
// Billing A: the server's own terms and an UNCHECKED box. The action that
// charges stays disabled until it's ticked; the server re-checks the terms.
import { useId } from 'vue'

defineProps({
  terms: { type: Object, required: true },
  modelValue: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  notice: { type: String, default: '' },
})
defineEmits(['update:modelValue'])
const termsId = `billing-consent-${useId()}`
</script>

<style scoped>
.billing-consent {
  display: grid;
  gap: 0.6rem;
  margin-top: 0.75rem;
}
.billing-consent__terms {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: rgba(245, 245, 246, 0.72);
  margin: 0;
}
.billing-consent__check {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  min-height: 44px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #f5f5f6;
  cursor: pointer;
}
.billing-consent__check input {
  width: 20px;
  height: 20px;
  margin-top: 1px;
  flex: none;
  accent-color: #f5f5f6;
}
.billing-consent__notice {
  font-size: 0.8125rem;
  color: #fca5a5;
  margin: 0;
}
</style>
