<template>
  <div class="mobile-viewport">
    <div class="mobile-canvas">
      <div class="mobile-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
// No script needed - this is just a viewport wrapper
</script>

<style scoped>
.mobile-viewport {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
}

.mobile-canvas {
  width: 100%;
  max-width: 420px;
  height: 760px;
  max-height: 80vh;
  background: #000;
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 25px 60px rgba(0, 0, 0, 0.55),
    inset 0 0 0 1px rgba(255, 255, 255, 0.03),
    inset 0 0 28px rgba(255, 255, 255, 0.06);
  overflow: hidden;
  position: relative;
}

.mobile-content {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 100px; /* Space for deck controls */
}

.mobile-content::-webkit-scrollbar {
  width: 4px;
}

.mobile-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.mobile-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.mobile-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
