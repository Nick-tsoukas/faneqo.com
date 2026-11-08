<template>
  <div class="v2-signal" aria-hidden="true">
    <span class="fq-signal-pulse"></span>
    <span class="fq-signal-trace"></span>
  </div>
</template>

<style scoped>
.v2-signal {
  position: absolute;
  left: 50%;
  top: 0;
  z-index: 2;
  width: 1px;
  height: 3.4rem;
  pointer-events: none;
  transform: translateX(-50%);
}

.fq-signal-pulse {
  position: absolute;
  left: 50%;
  top: 0;
  width: 6px;
  height: 6px;
  margin-left: -3px;
  border-radius: 99px;
  border: 1px solid #45d6a7;
  opacity: 0;
  will-change: transform, opacity;
}

.fq-signal-trace {
  position: absolute;
  left: 50%;
  top: 4px;
  width: 1px;
  height: 100%;
  background: linear-gradient(180deg, #45d6a7, rgba(35, 199, 195, 0.15));
  opacity: 0.55;
  transform: scaleY(0);
  transform-origin: top center;
  will-change: transform, opacity;
}
</style>
