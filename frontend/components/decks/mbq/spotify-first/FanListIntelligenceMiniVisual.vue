<template>
  <div class="fan-list-mini">
    <!-- Three fan cards -->
    <div class="fans">
      <div class="fan-card warm">
        <div class="fan-avatar">MR</div>
        <div class="fan-info">
          <div class="fan-name">Maya R.</div>
          <div class="fan-tier">Warm Fan</div>
        </div>
        <div class="engagement">
          <div class="engagement-bar">
            <div class="engagement-fill" style="width: 42%" />
          </div>
          <span class="engagement-score">42</span>
        </div>
      </div>

      <div class="fan-card engaged">
        <div class="fan-avatar">CD</div>
        <div class="fan-info">
          <div class="fan-name">Chris D.</div>
          <div class="fan-tier">Engaged</div>
        </div>
        <div class="engagement">
          <div class="engagement-bar">
            <div class="engagement-fill" style="width: 67%" />
          </div>
          <span class="engagement-score">67</span>
        </div>
      </div>

      <div class="fan-card superfan">
        <div class="fan-avatar">EV</div>
        <div class="fan-info">
          <div class="fan-name">Elena V.</div>
          <div class="fan-tier superfan-badge">Superfan Signal</div>
        </div>
        <div class="engagement">
          <div class="engagement-bar">
            <div class="engagement-fill" style="width: 91%" />
          </div>
          <span class="engagement-score">91</span>
        </div>
      </div>
    </div>

    <!-- Activity labels -->
    <div class="activities">
      <div class="activity">Checked in</div>
      <div class="activity">Clicked merch</div>
      <div class="activity">Watched video</div>
    </div>
  </div>
</template>

<style scoped>
.fan-list-mini {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  gap: 1rem;
}

.fans {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 300px;
}

.fan-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
}

.fan-card.warm {
  border-left: 3px solid #3b82f6;
}

.fan-card.engaged {
  border-left: 3px solid #10b981;
}

.fan-card.superfan {
  border-left: 3px solid #f59e0b;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(255, 255, 255, 0.03));
}

.fan-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #a855f7, #ec4899);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.fan-info {
  flex: 1;
  min-width: 0;
}

.fan-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
}

.fan-tier {
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 0.125rem;
}

.fan-tier.superfan-badge {
  color: #f59e0b;
  font-weight: 700;
}

.engagement {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.engagement-bar {
  width: 50px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.engagement-fill {
  height: 100%;
  border-radius: 2px;
}

.fan-card.warm .engagement-fill {
  background: #3b82f6;
}

.fan-card.engaged .engagement-fill {
  background: #10b981;
}

.fan-card.superfan .engagement-fill {
  background: #f59e0b;
}

.engagement-score {
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  min-width: 20px;
  text-align: right;
}

.activities {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.activity {
  padding: 0.375rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 2rem;
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
