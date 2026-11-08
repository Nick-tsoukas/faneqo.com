<template>
  <div class="show-growth-mini">
    <!-- Show card -->
    <div class="show-card">
      <div class="show-badge">Tonight</div>
      <div class="show-venue">The Basement East</div>
      <div class="show-city">Nashville</div>

      <div class="show-stats">
        <div class="stat">
          <div class="stat-value">217</div>
          <div class="stat-label">QR scans</div>
        </div>
        <div class="stat">
          <div class="stat-value">38</div>
          <div class="stat-label">New fans</div>
        </div>
        <div class="stat">
          <div class="stat-value">24</div>
          <div class="stat-label">Check-ins</div>
        </div>
      </div>
    </div>

    <!-- Live feed -->
    <div class="live-feed">
      <div class="live-header">
        <span class="live-dot" />
        <span>Live Activity</span>
      </div>
      <div class="feed-items">
        <div class="feed-item">
          <span class="feed-name">Maya</span>
          <span class="feed-action">checked in</span>
        </div>
        <div class="feed-item">
          <span class="feed-name">Chris</span>
          <span class="feed-action">joined list</span>
        </div>
        <div class="feed-item">
          <span class="feed-name">Elena</span>
          <span class="feed-action">clicked merch</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.show-growth-mini {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  gap: 1.25rem;
}

.show-card {
  width: 100%;
  max-width: 280px;
  padding: 1.25rem;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(236, 72, 153, 0.1));
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 1.25rem;
  text-align: center;
}

.show-badge {
  display: inline-block;
  padding: 0.375rem 1rem;
  background: rgba(168, 85, 247, 0.2);
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 2rem;
  font-size: 0.625rem;
  font-weight: 700;
  color: #a855f7;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.75rem;
}

.show-venue {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
}

.show-city {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.25rem;
}

.show-stats {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.stat {
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
  line-height: 1;
}

.stat-label {
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 0.25rem;
}

.live-feed {
  width: 100%;
  max-width: 280px;
  padding: 1rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 1rem;
}

.live-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.625rem;
  font-weight: 700;
  color: #10b981;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.75rem;
}

.live-dot {
  width: 6px;
  height: 6px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

.feed-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.feed-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.feed-name {
  font-weight: 700;
  color: white;
}

.feed-action {
  color: rgba(255, 255, 255, 0.5);
}
</style>
