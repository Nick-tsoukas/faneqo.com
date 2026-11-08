<template>
  <div class="artist-hub-mini">
    <!-- Phone mockup -->
    <div class="phone-mockup">
      <div class="phone-screen">
        <!-- Hero -->
        <div class="artist-hero">
          <div class="artist-image">
            <div class="gradient-bg" />
            <div class="artist-info">
              <div class="genre">Alternative Rock · Nashville</div>
              <div class="artist-name">The Midnight Static</div>
            </div>
          </div>
        </div>

        <!-- Join Fan List CTA -->
        <div class="fan-list-cta">
          <div class="cta-title">Join Fan List</div>
          <div class="cta-sub">Get updates + exclusive drops</div>
          <button class="join-btn">Join Now</button>
        </div>

        <!-- Links -->
        <div class="links">
          <div class="link-btn spotify">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 12.75c-.23.61-.73 1.12-1.34 1.35-.61.23-1.28.16-1.84-.19-.28-.19-.54-.42-.77-.67-.23.25-.49.48-.77.67-.56.35-1.23.42-1.84.19-.61-.23-1.11-.74-1.34-1.35-.23-.61-.16-1.28.19-1.84.35-.56.97-.91 1.66-.91.35 0 .68.09.98.26.3.17.55.41.74.69.19-.28.44-.52.74-.69.3-.17.63-.26.98-.26.69 0 1.31.35 1.66.91.35.56.42 1.23.19 1.84z"/>
            </svg>
            <span>Listen on Spotify</span>
          </div>
          <div class="link-btn">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Watch Video</span>
          </div>
          <div class="link-btn">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Tour Dates</span>
          </div>
          <div class="link-btn">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span>Merch</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.artist-hub-mini {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
}

.phone-mockup {
  width: 100%;
  max-width: 260px;
  background: #000;
  border-radius: 2rem;
  padding: 0.5rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

.phone-screen {
  background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%);
  border-radius: 1.5rem;
  overflow: hidden;
}

.artist-hero {
  position: relative;
  height: 140px;
}

.gradient-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #3b82f6 100%);
}

.artist-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
}

.genre {
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.artist-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: white;
  margin-top: 0.25rem;
}

.fan-list-cta {
  padding: 1rem;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(236, 72, 153, 0.1));
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.cta-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
}

.cta-sub {
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.25rem;
}

.join-btn {
  width: 100%;
  margin-top: 0.75rem;
  padding: 0.625rem;
  background: linear-gradient(135deg, #a855f7, #ec4899);
  border: none;
  border-radius: 0.75rem;
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
}

.links {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.link-btn {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.875rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
}

.link-btn.spotify {
  background: rgba(29, 185, 84, 0.1);
  border-color: rgba(29, 185, 84, 0.2);
  color: #1ed760;
}

.link-btn svg {
  flex-shrink: 0;
}
</style>
