<template>
  <div
    class="fq-matte"
    :class="{ 'is-reduced': reduced }"
    :style="cssVars"
    aria-hidden="true"
  >
    <div class="fq-matte__void" />
    <div class="fq-matte__top" />
    <div class="fq-matte__bottom" />
    <div class="fq-matte__left" />
    <div class="fq-matte__right" />
    <div class="fq-matte__haze" />
    <div class="fq-matte__highlight" />
    <div class="fq-matte__falloff" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { DEFAULT_STAGE_TUNING } from '../core/presentationState'
import { matteStageStyle } from './matteStageField'

const props = defineProps({
  field: { type: Object, default: null },
  tuning: { type: Object, default: () => ({ ...DEFAULT_STAGE_TUNING }) },
  opacity: { type: Number, default: 1 },
  reduced: { type: Boolean, default: false },
})

const cssVars = computed(() => matteStageStyle(props.field, props.tuning, props.opacity))
</script>

<style scoped>
.fq-matte {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  background: #000;
  opacity: var(--fq-matte-opacity, 1);
}
.fq-matte__void,
.fq-matte__top,
.fq-matte__bottom,
.fq-matte__left,
.fq-matte__right,
.fq-matte__haze,
.fq-matte__highlight,
.fq-matte__falloff {
  position: absolute;
  pointer-events: none;
}
.fq-matte__void {
  inset: 0;
  background: var(--fq-deep, #000);
  opacity: calc(0.55 + var(--fq-darkness, 0.86) * 0.45);
}
.fq-matte__top {
  left: -20%;
  right: -20%;
  top: -28%;
  height: 72%;
  background: radial-gradient(
    ellipse 70% 58% at 50% 38%,
    var(--fq-top) 0%,
    transparent 72%
  );
  opacity: calc(var(--fq-intensity, 0.38) * 0.34);
  transform: scale(calc(0.9 + var(--fq-spread, 0.36) * 0.28));
  transform-origin: 50% 20%;
}
.fq-matte__bottom {
  left: -18%;
  right: -18%;
  bottom: -32%;
  height: 62%;
  background: radial-gradient(
    ellipse 80% 55% at 50% 78%,
    var(--fq-bottom) 0%,
    transparent 70%
  );
  opacity: calc(var(--fq-intensity, 0.38) * 0.22);
}
.fq-matte__left {
  width: 70%;
  height: 140%;
  left: calc(-38% + var(--fq-spread, 0.36) * 4%);
  top: -18%;
  background: radial-gradient(
    ellipse 58% 48% at 42% 46%,
    var(--fq-left) 0%,
    transparent 72%
  );
  opacity: calc(var(--fq-intensity, 0.38) * 0.30);
  transform: scale(calc(0.88 + var(--fq-spread, 0.36) * 0.32));
  transform-origin: 22% 48%;
}
.fq-matte__right {
  width: 70%;
  height: 140%;
  right: calc(-36% + var(--fq-spread, 0.36) * 4%);
  left: auto;
  top: -16%;
  background: radial-gradient(
    ellipse 56% 48% at 60% 50%,
    var(--fq-right) 0%,
    transparent 72%
  );
  opacity: calc(var(--fq-intensity, 0.38) * 0.28);
  transform: scale(calc(0.88 + var(--fq-spread, 0.36) * 0.32));
  transform-origin: 78% 52%;
}
.fq-matte__haze {
  width: 120%;
  height: 120%;
  left: calc(var(--fq-hx, 0.5) * 100% - 60%);
  top: calc(var(--fq-hy, 0.4) * 100% - 60%);
  background: radial-gradient(
    ellipse 42% 36% at 50% 50%,
    var(--fq-haze) 0%,
    transparent 68%
  );
  opacity: calc(var(--fq-intensity, 0.38) * 0.12);
}
.fq-matte__highlight {
  width: 78%;
  height: 78%;
  left: calc(var(--fq-hx, 0.5) * 100% - 39%);
  top: calc(var(--fq-hy, 0.4) * 100% - 39%);
  background: radial-gradient(
    circle at 50% 50%,
    var(--fq-highlight) 0%,
    transparent 58%
  );
  opacity: calc(var(--fq-intensity, 0.38) * 0.16);
}
.fq-matte__falloff {
  inset: 0;
  background: radial-gradient(
    ellipse 58% 52% at 50% 46%,
    transparent 18%,
    #000 100%
  );
  opacity: calc(0.28 + var(--fq-darkness, 0.86) * 0.42);
}
.fq-matte.is-reduced .fq-matte__top,
.fq-matte.is-reduced .fq-matte__left,
.fq-matte.is-reduced .fq-matte__right,
.fq-matte.is-reduced .fq-matte__haze {
  transform: none;
}
@media (prefers-reduced-motion: reduce) {
  .fq-matte__top,
  .fq-matte__left,
  .fq-matte__right,
  .fq-matte__haze {
    transform: none;
  }
}
</style>
