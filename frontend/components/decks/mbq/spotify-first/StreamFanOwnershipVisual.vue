<template>
  <div class="stream-ownership-visual">
    <!-- Old way vs New way -->
    <div class="comparison">
      <!-- Old Way -->
      <div class="way old-way">
        <div class="way-label">Old Way</div>
        <div class="way-flow">
          <div class="flow-item fan">Fan</div>
          <div class="flow-arrow">→</div>
          <div class="flow-item platform">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 12.75c-.23.61-.73 1.12-1.34 1.35-.61.23-1.28.16-1.84-.19-.28-.19-.54-.42-.77-.67-.23.25-.49.48-.77.67-.56.35-1.23.42-1.84.19-.61-.23-1.11-.74-1.34-1.35-.23-.61-.16-1.28.19-1.84.35-.56.97-.91 1.66-.91.35 0 .68.09.98.26.3.17.55.41.74.69.19-.28.44-.52.74-.69.3-.17.63-.26.98-.26.69 0 1.31.35 1.66.91.35.56.42 1.23.19 1.84z"/>
            </svg>
            <span>Spotify</span>
          </div>
          <div class="flow-arrow fade">→</div>
          <div class="flow-item ghost">👻</div>
        </div>
        <div class="way-result lost">Lost forever</div>
      </div>

      <!-- Divider -->
      <div class="divider" />

      <!-- MBQ Way -->
      <div class="way mbq-way">
        <div class="way-label new">MBQ Way</div>
        <div class="way-flow">
          <div class="flow-item fan">Fan</div>
          <div class="flow-arrow highlight">→</div>
          <div class="flow-item mbq">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <span>MBQ Hub</span>
          </div>
          <div class="flow-arrow highlight">→</div>
          <div class="flow-item captured">
            <div class="captured-fan">Maya R.</div>
            <div class="captured-badge">✓ Captured</div>
          </div>
        </div>
        <div class="way-result kept">Relationship owned</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stream-ownership-visual {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.comparison {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 320px;
}

.way {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.way-label {
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: rgba(255, 255, 255, 0.4);
}

.way-label.new {
  color: #a855f7;
}

.way-flow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 1rem;
}

.old-way .way-flow {
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.15);
}

.mbq-way .way-flow {
  background: rgba(168, 85, 247, 0.1);
  border: 1px solid rgba(168, 85, 247, 0.25);
}

.flow-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.625rem;
  font-weight: 600;
}

.flow-item.fan {
  color: rgba(255, 255, 255, 0.8);
}

.flow-item.platform {
  padding: 0.5rem 0.75rem;
  background: rgba(29, 185, 84, 0.15);
  border-radius: 0.5rem;
  color: #1ed760;
}

.flow-item.platform svg {
  width: 20px;
  height: 20px;
}

.flow-item.ghost {
  font-size: 1.25rem;
  opacity: 0.5;
  animation: ghost-fade 2s ease-in-out infinite;
}

@keyframes ghost-fade {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.2; }
}

.flow-item.mbq {
  padding: 0.5rem 0.75rem;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.1));
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 0.5rem;
  color: #a855f7;
  animation: mbq-glow 2s ease-in-out infinite;
}

@keyframes mbq-glow {
  0%, 100% { box-shadow: 0 0 10px rgba(168, 85, 247, 0.3); }
  50% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.5); }
}

.flow-item.captured {
  padding: 0.5rem 0.75rem;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 0.5rem;
}

.captured-fan {
  font-size: 0.625rem;
  font-weight: 700;
  color: white;
}

.captured-badge {
  font-size: 0.5rem;
  color: #10b981;
  text-transform: uppercase;
}

.flow-arrow {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.3);
}

.flow-arrow.fade {
  animation: arrow-fade 2s ease-in-out infinite;
}

@keyframes arrow-fade {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.1; }
}

.flow-arrow.highlight {
  color: #a855f7;
}

.way-result {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.5rem;
  border-radius: 0.5rem;
}

.way-result.lost {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.way-result.kept {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.divider {
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent);
}
</style>
