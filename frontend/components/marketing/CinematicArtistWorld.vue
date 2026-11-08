<template>
  <section class="cinematic-artist-world" aria-hidden="true">

    <!-- ═══════════════════════════════════════════════════════
         LAYER 1 — Deep Atmospheric Image Layer
         Large blurred posters/album art for color + texture
    ═══════════════════════════════════════════════════════ -->
    <div class="world-layer-deep">
      <div class="deep-img deep-img-1"><NuxtImg src="/eventposter1.png" alt="" loading="lazy" format="webp" quality="55" sizes="200px" width="400" height="500" /></div>
      <div class="deep-img deep-img-2"><NuxtImg src="/albumcover3.png" alt="" loading="lazy" format="webp" quality="55" sizes="200px" width="400" height="500" /></div>
      <div class="deep-img deep-img-3"><NuxtImg src="/neonposter.png" alt="" loading="lazy" format="webp" quality="55" sizes="200px" width="400" height="500" /></div>
      <div class="deep-img deep-img-4"><NuxtImg src="/eventposter7.png" alt="" loading="lazy" format="webp" quality="55" sizes="200px" width="400" height="500" /></div>
      <div class="deep-img deep-img-5"><NuxtImg src="/eventposter5.png" alt="" loading="lazy" format="webp" quality="55" sizes="200px" width="400" height="500" /></div>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         LAYER 4 — Glow + Haze (rendered under content layers)
    ═══════════════════════════════════════════════════════ -->
    <div class="world-layer-glow">
      <div class="glow-orb glow-magenta" />
      <div class="glow-orb glow-purple" />
      <div class="glow-orb glow-cyan" />
      <div class="glow-orb glow-emerald" />
      <div class="glow-orb glow-violet" />
    </div>

    <!-- Noise + scanline texture -->
    <div class="world-noise" />
    <div class="world-scanlines" />

    <!-- Sweeping spotlight beam from above -->
    <div class="world-spotlight" />
    <div class="world-spotlight world-spotlight-b" />

    <!-- ═══════════════════════════════════════════════════════
         ATMOSPHERE — drifting waveform ribbons, crowd silhouette,
         floating QR/spark culture pieces
    ═══════════════════════════════════════════════════════ -->
    <div class="world-atmosphere" aria-hidden="true">
      <svg class="atmo-ribbon atmo-ribbon-a" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 100 Q 150 40, 300 100 T 600 100 T 900 100 T 1200 100"
              fill="none" stroke="url(#ribGradA)" stroke-width="1.2" stroke-linecap="round" />
        <defs>
          <linearGradient id="ribGradA" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="rgba(236, 72, 153, 0)" />
            <stop offset="50%" stop-color="rgba(236, 72, 153, 0.55)" />
            <stop offset="100%" stop-color="rgba(168, 85, 247, 0)" />
          </linearGradient>
        </defs>
      </svg>
      <svg class="atmo-ribbon atmo-ribbon-b" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 120 Q 200 70, 400 120 T 800 120 T 1200 120"
              fill="none" stroke="url(#ribGradB)" stroke-width="1" stroke-linecap="round" />
        <defs>
          <linearGradient id="ribGradB" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="rgba(34, 211, 238, 0)" />
            <stop offset="50%" stop-color="rgba(34, 211, 238, 0.45)" />
            <stop offset="100%" stop-color="rgba(52, 211, 153, 0)" />
          </linearGradient>
        </defs>
      </svg>
      <svg class="atmo-ribbon atmo-ribbon-c" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 80 Q 180 130, 360 80 T 720 80 T 1080 80 T 1200 80"
              fill="none" stroke="url(#ribGradC)" stroke-width="0.9" stroke-linecap="round" />
        <defs>
          <linearGradient id="ribGradC" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="rgba(168, 85, 247, 0)" />
            <stop offset="50%" stop-color="rgba(196, 181, 253, 0.5)" />
            <stop offset="100%" stop-color="rgba(236, 72, 153, 0)" />
          </linearGradient>
        </defs>
      </svg>

      <!-- Floating culture sparks (abstract QR / star shapes) -->
      <span class="atmo-spark atmo-spark-1" />
      <span class="atmo-spark atmo-spark-2" />
      <span class="atmo-spark atmo-spark-3" />
      <span class="atmo-spark atmo-spark-4" />
      <span class="atmo-spark atmo-spark-5" />
      <span class="atmo-spark atmo-spark-6" />

      <!-- Crowd silhouette at the bottom edge -->
      <div class="atmo-crowd" />
    </div>

    <!-- ═══════════════════════════════════════════════════════
         LAYER 6 — Isometric Stage Floor
         Perspective grid, glowing nodes, heat zones
    ═══════════════════════════════════════════════════════ -->
    <div class="world-iso">
      <!-- Perspective grid floor -->
      <div class="iso-floor">
        <!-- Glowing node dots at grid intersections -->
        <div class="iso-floor-nodes" />
        <!-- Radial heat zones (under hottest artists) -->
        <div class="iso-floor-heat iso-floor-heat-a" />
        <div class="iso-floor-heat iso-floor-heat-b" />
        <div class="iso-floor-heat iso-floor-heat-c" />
        <!-- Scan pulse rings (concentric expansions on the floor) -->
        <div class="iso-floor-scan iso-floor-scan-a" />
        <div class="iso-floor-scan iso-floor-scan-b" />
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         LAYER 5 — Readability Overlays & Vignette
    ═══════════════════════════════════════════════════════ -->
    <div class="world-overlay-center" />
    <div class="world-overlay-top" />
    <div class="world-overlay-bottom" />
    <div class="world-overlay-left" />
    <div class="world-overlay-right" />
    <div class="world-vignette" />

  </section>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════
   CONTAINER
═══════════════════════════════════════════════════════ */
.cinematic-artist-world {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 720px;
  overflow: hidden;
  background: #020008;
  contain: layout style;
}

/* Simplify on smaller viewports */
@media (max-width: 768px) {
  .world-iso,
  .world-atmosphere,
  .world-data-ticker,
  .world-scanlines,
  .world-noise {
    display: none !important;
  }
  .deep-img {
    opacity: 0.04 !important;
  }
}

/* Landscape phones / short viewports */
@media (max-height: 600px) {
  .world-iso,
  .world-atmosphere,
  .world-data-ticker {
    display: none !important;
  }
}

/* Touch devices — simplify heavy GPU animations */
@media (hover: none) and (pointer: coarse) {
  .world-iso,
  .world-atmosphere,
  .world-data-ticker,
  .world-scanlines,
  .world-noise {
    display: none !important;
  }
  .deep-img {
    opacity: 0.03 !important;
  }
}

/* Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .glow-orb,
  .iso-tile-ring,
  .iso-tile-signals,
  .iso-tile-sheen,
  .iso-floor-scan,
  .atmo-ribbon,
  .atmo-spark,
  .world-spotlight {
    animation: none !important;
  }
}

/* ═══════════════════════════════════════════════════════
   LAYER 1 — Deep Atmospheric Images
═══════════════════════════════════════════════════════ */
.world-layer-deep {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  contain: layout style;
}

.deep-img {
  position: absolute;
  border-radius: 32px;
  overflow: hidden;
  opacity: 0.08;
  filter: blur(6px) brightness(0.5);
}
.deep-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.deep-img-1 {
  width: 480px; height: 380px;
  top: -60px; left: -80px;
}
.deep-img-2 {
  width: 400px; height: 340px;
  top: 45%; right: -50px;
  transform: translateY(-50%);
}
.deep-img-3 {
  width: 340px; height: 440px;
  bottom: -60px; left: 28%;
}
.deep-img-4 {
  width: 320px; height: 300px;
  top: 8%; right: 22%;
}
.deep-img-5 {
  width: 380px; height: 320px;
  bottom: 3%; left: 3%;
}

/* ═══════════════════════════════════════════════════════
   LAYER 4 — Glow Orbs (more vibrant)
═══════════════════════════════════════════════════════ */
.world-layer-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  contain: layout style paint;
}

.glow-orb {
  position: absolute;
  border-radius: 50%;
  will-change: transform;
}

.glow-magenta {
  width: 650px; height: 650px;
  background: radial-gradient(circle, rgba(219, 39, 119, 0.18) 0%, transparent 65%);
  top: -18%; left: 8%;
  animation: orb-float-a 28s ease-in-out infinite alternate;
}
.glow-purple {
  width: 550px; height: 550px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 65%);
  bottom: -12%; right: 12%;
  animation: orb-float-b 36s ease-in-out infinite alternate;
}
.glow-cyan {
  width: 480px; height: 480px;
  background: radial-gradient(circle, rgba(34, 211, 238, 0.12) 0%, transparent 65%);
  top: 30%; left: 48%;
  animation: orb-float-c 24s ease-in-out infinite alternate;
}
.glow-emerald {
  width: 380px; height: 380px;
  background: radial-gradient(circle, rgba(52, 211, 153, 0.1) 0%, transparent 65%);
  bottom: 18%; left: 22%;
  animation: orb-float-a 42s ease-in-out infinite alternate-reverse;
}
.glow-violet {
  width: 420px; height: 420px;
  background: radial-gradient(circle, rgba(167, 139, 250, 0.12) 0%, transparent 65%);
  top: 3%; right: 3%;
  animation: orb-float-b 48s ease-in-out infinite alternate-reverse;
}

@keyframes orb-float-a {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(55px, 40px) scale(1.12); }
}
@keyframes orb-float-b {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(-45px, -30px) scale(1.1); }
}
@keyframes orb-float-c {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(35px, 50px) scale(0.9); }
}

/* Noise texture overlay */
.world-noise {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.2;
  background: repeating-conic-gradient(rgba(255,255,255,0.01) 0% 25%, transparent 0% 50%) 0 0 / 4px 4px;
  mix-blend-mode: overlay;
}

/* Scanline overlay — cyberpunk concert feel */
.world-scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 3px,
    rgba(255, 255, 255, 0.008) 3px,
    rgba(255, 255, 255, 0.008) 4px
  );
  z-index: 1;
}

/* ═══════════════════════════════════════════════════════
   LAYER 5 — Readability Overlays
═══════════════════════════════════════════════════════ */
.world-overlay-center {
  position: absolute;
  inset: 0;
  /* Inverted: dim the edges, let the iso center shine through */
  background: radial-gradient(ellipse at center, transparent 35%, rgba(2, 0, 8, 0.4) 90%);
  pointer-events: none;
  z-index: 6;
}

.world-overlay-top {
  position: absolute;
  inset-inline: 0;
  top: 0;
  height: 180px;
  background: linear-gradient(to bottom, #040112 0%, rgba(4, 1, 18, 0.6) 50%, transparent 100%);
  pointer-events: none;
  z-index: 6;
}
.world-overlay-bottom {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  height: 200px;
  background: linear-gradient(to top, #040112 0%, rgba(4, 1, 18, 0.7) 50%, transparent 100%);
  pointer-events: none;
  z-index: 6;
}
.world-overlay-left {
  position: absolute;
  top: 0; bottom: 0;
  left: 0;
  width: 220px;
  background: linear-gradient(to right, #040112 0%, transparent 100%);
  pointer-events: none;
  z-index: 6;
}
.world-overlay-right {
  position: absolute;
  top: 0; bottom: 0;
  right: 0;
  width: 220px;
  background: linear-gradient(to left, #040112 0%, transparent 100%);
  pointer-events: none;
  z-index: 6;
}
.world-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 6;
  box-shadow: inset 0 0 300px 120px rgba(2, 0, 8, 0.85);
}

/* ═══════════════════════════════════════════════════════
   LAYER 6 — ISOMETRIC PROFILE GRID + DATA LINES
═══════════════════════════════════════════════════════ */
.world-iso {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 4;
  perspective: 1600px;
  perspective-origin: 50% 35%;
  opacity: 0.88;
  contain: layout style;
}

/* Horizon focal glow at the iso vanishing point */
.world-iso::before {
  content: '';
  position: absolute;
  top: 28%;
  left: 50%;
  width: 1100px;
  height: 480px;
  margin-left: -550px;
  background: radial-gradient(ellipse at center,
    rgba(168, 85, 247, 0.28) 0%,
    rgba(236, 72, 153, 0.14) 30%,
    transparent 70%);
  filter: blur(40px);
  pointer-events: none;
  z-index: 0;
  mix-blend-mode: screen;
  opacity: 0.7;
}
@keyframes horizon-pulse {
  from { opacity: 0.55; transform: scale(1); }
  to   { opacity: 0.95; transform: scale(1.08); }
}

/* Perspective grid floor */
.iso-floor {
  position: absolute;
  top: 30%;
  left: 50%;
  width: 2400px;
  height: 1600px;
  margin-left: -1200px;
  /* Perspective grid lines — commented out, may be restored later
  background-image:
    linear-gradient(rgba(168, 85, 247, 0.28) 1px, transparent 1px),
    linear-gradient(90deg, rgba(34, 211, 238, 0.22) 1px, transparent 1px);
  background-size: 90px 90px;
  */
  transform-origin: 50% 0%;
  transform:
    rotateX(64deg)
    rotateZ(-38deg);
  mask-image: radial-gradient(ellipse at center, black 25%, transparent 72%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 25%, transparent 72%);
  will-change: auto;
  opacity: 0.65;
}

/* Isometric tile grid — wider, fewer tiles, bigger gaps = breathing room */
.iso-grid {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1600px;
  height: 760px;
  margin-left: -800px;
  margin-top: -380px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-auto-rows: 220px;
  gap: 64px;
  transform-style: preserve-3d;
  transform-origin: 50% 50%;
  /* subtle scene breath */
  transform:
    translate3d(0, 0, 0)
    rotateX(58deg)
    rotateZ(-38deg)
    scale(var(--scene-breath, 1));
  will-change: auto;
}

/* Slow scene-wide breathing — applied via CSS variable so it composes with scroll transform */
@property --scene-breath {
  syntax: '<number>';
  inherits: true;
  initial-value: 1;
}
@keyframes scene-breath {
  from { --scene-breath: 1; }
  to   { --scene-breath: 1.035; }
}

.iso-tile {
  position: relative;
  transform-style: preserve-3d;
  transform: translateZ(var(--z, 10px));
  will-change: auto;
}

@keyframes iso-float {
  0%   { transform: translateZ(var(--z, 10px)) rotateZ(0deg); }
  50%  { transform: translateZ(calc(var(--z, 10px) + 38px)) rotateZ(1.2deg); }
  100% { transform: translateZ(calc(var(--z, 10px) + 12px)) rotateZ(-1.2deg); }
}

.iso-tile-inner {
  position: relative;
  height: 100%;
  /* Premium gradient border via dual backgrounds (padding-box + border-box) */
  background:
    linear-gradient(180deg, rgba(18, 9, 38, 0.96) 0%, rgba(6, 3, 18, 0.98) 100%) padding-box,
    linear-gradient(140deg,
      rgba(168, 85, 247, 0.6) 0%,
      rgba(236, 72, 153, 0.35) 40%,
      rgba(34, 211, 238, 0.45) 100%) border-box;
  border: 1px solid transparent;
  border-radius: 16px;
  overflow: hidden;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.7),
    0 0 36px rgba(168, 85, 247, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.iso-tile-inner.tone-pink {
  background:
    linear-gradient(180deg, rgba(28, 8, 28, 0.96) 0%, rgba(8, 3, 14, 0.98) 100%) padding-box,
    linear-gradient(140deg, rgba(236, 72, 153, 0.7) 0%, rgba(244, 114, 182, 0.35) 50%, rgba(168, 85, 247, 0.45) 100%) border-box;
  box-shadow: 0 20px 60px rgba(0,0,0,0.7), 0 0 36px rgba(236, 72, 153, 0.3), inset 0 1px 0 rgba(255,255,255,0.08);
}
.iso-tile-inner.tone-cyan {
  background:
    linear-gradient(180deg, rgba(6, 18, 32, 0.96) 0%, rgba(3, 8, 18, 0.98) 100%) padding-box,
    linear-gradient(140deg, rgba(34, 211, 238, 0.7) 0%, rgba(103, 232, 249, 0.35) 50%, rgba(168, 85, 247, 0.4) 100%) border-box;
  box-shadow: 0 20px 60px rgba(0,0,0,0.7), 0 0 36px rgba(34, 211, 238, 0.26), inset 0 1px 0 rgba(255,255,255,0.08);
}
.iso-tile-inner.tone-emerald {
  background:
    linear-gradient(180deg, rgba(6, 22, 18, 0.96) 0%, rgba(3, 12, 8, 0.98) 100%) padding-box,
    linear-gradient(140deg, rgba(52, 211, 153, 0.7) 0%, rgba(110, 231, 183, 0.35) 50%, rgba(34, 211, 238, 0.45) 100%) border-box;
  box-shadow: 0 20px 60px rgba(0,0,0,0.7), 0 0 36px rgba(52, 211, 153, 0.26), inset 0 1px 0 rgba(255,255,255,0.08);
}
.iso-tile-inner.tone-purple {
  background:
    linear-gradient(180deg, rgba(20, 8, 38, 0.96) 0%, rgba(6, 3, 18, 0.98) 100%) padding-box,
    linear-gradient(140deg, rgba(168, 85, 247, 0.7) 0%, rgba(196, 181, 253, 0.35) 50%, rgba(236, 72, 153, 0.45) 100%) border-box;
  box-shadow: 0 20px 60px rgba(0,0,0,0.7), 0 0 36px rgba(168, 85, 247, 0.3), inset 0 1px 0 rgba(255,255,255,0.08);
}

/* Subtle top sheen line — extra polish */
.iso-tile-inner::before {
  content: '';
  position: absolute;
  top: 0; left: 8%; right: 8%;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.9), transparent);
  opacity: 0.45;
  z-index: 3;
}

.iso-tile-img {
  position: relative;
  height: 48%;
  overflow: hidden;
}
.iso-tile-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.95;
}
.iso-tile-img-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom,
    rgba(0,0,0,0.18) 0%,
    transparent 30%,
    rgba(6, 3, 18, 0.55) 75%,
    rgba(6, 3, 18, 0.98) 100%);
  z-index: 1;
}
/* Subtle tone tint to harmonize all cover art with the tile palette */
.iso-tile-img-tint {
  position: absolute;
  inset: 0;
  z-index: 1;
  mix-blend-mode: color;
  opacity: 0.18;
}
.iso-tile-inner.tone-pink    .iso-tile-img-tint { background: #ec4899; }
.iso-tile-inner.tone-cyan    .iso-tile-img-tint { background: #22d3ee; }
.iso-tile-inner.tone-emerald .iso-tile-img-tint { background: #34d399; }
.iso-tile-inner.tone-purple  .iso-tile-img-tint { background: #a855f7; }

/* MBQ verified — refined dark glass pill */
.iso-tile-verified {
  position: absolute;
  top: 7px;
  right: 7px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(8, 4, 22, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  z-index: 2;
}
.iso-tile-inner.tone-pink    .iso-tile-verified { color: #f472b6; border-color: rgba(236, 72, 153, 0.55); }
.iso-tile-inner.tone-cyan    .iso-tile-verified { color: #67e8f9; border-color: rgba(34, 211, 238, 0.55); }
.iso-tile-inner.tone-emerald .iso-tile-verified { color: #6ee7b7; border-color: rgba(52, 211, 153, 0.55); }
.iso-tile-inner.tone-purple  .iso-tile-verified { color: #c4b5fd; border-color: rgba(168, 85, 247, 0.55); }
.iso-tile-verified svg { width: 10px; height: 10px; }

/* LIVE badge — sharper, smaller */
.iso-tile-live {
  position: absolute;
  top: 7px;
  left: 7px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 7px 3px 5px;
  font-size: 7px;
  font-weight: 900;
  letter-spacing: 0.16em;
  color: #fff;
  background: linear-gradient(135deg, #ec4899, #f43f5e);
  border-radius: 4px;
  box-shadow: 0 0 14px rgba(236, 72, 153, 0.7), 0 2px 6px rgba(0,0,0,0.4);
  z-index: 2;
  text-shadow: 0 1px 1px rgba(0,0,0,0.25);
}
.iso-live-pulse {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 8px #fff;
}
@keyframes iso-live-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.3; transform: scale(0.6); }
}

/* Now-playing waveform on cover (bottom-right) */
.iso-tile-wave {
  position: absolute;
  right: 7px;
  bottom: 7px;
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 12px;
  z-index: 2;
  padding: 2px 4px;
  border-radius: 4px;
  background: rgba(6, 3, 18, 0.75);
}
.iso-tile-wave span {
  display: block;
  width: 2px;
  background: currentColor;
  border-radius: 1px;
}
.iso-tile-wave span:nth-child(1) { height: 40%; animation-delay: 0s; }
.iso-tile-wave span:nth-child(2) { height: 80%; animation-delay: 0.18s; }
.iso-tile-wave span:nth-child(3) { height: 55%; animation-delay: 0.36s; }
.iso-tile-wave span:nth-child(4) { height: 95%; animation-delay: 0.54s; }
.iso-tile-inner.tone-pink    .iso-tile-wave { color: #f9a8d4; }
.iso-tile-inner.tone-cyan    .iso-tile-wave { color: #a5f3fc; }
.iso-tile-inner.tone-emerald .iso-tile-wave { color: #6ee7b7; }
.iso-tile-inner.tone-purple  .iso-tile-wave { color: #c4b5fd; }
@keyframes iso-wave {
  from { transform: scaleY(0.35); }
  to   { transform: scaleY(1); }
}

/* Genre tag — refined typography */
.iso-tile-genre {
  position: absolute;
  left: 8px;
  bottom: 7px;
  font-size: 7.5px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  padding: 2.5px 7px;
  border-radius: 3px;
  z-index: 2;
  white-space: nowrap;
}
.iso-tile-genre.tone-pink    { background: rgba(6, 3, 18, 0.7); color: #f9a8d4; border: 1px solid rgba(236, 72, 153, 0.45); }
.iso-tile-genre.tone-cyan    { background: rgba(6, 3, 18, 0.7); color: #a5f3fc; border: 1px solid rgba(34, 211, 238, 0.45); }
.iso-tile-genre.tone-emerald { background: rgba(6, 3, 18, 0.7); color: #6ee7b7; border: 1px solid rgba(52, 211, 153, 0.45); }
.iso-tile-genre.tone-purple  { background: rgba(6, 3, 18, 0.7); color: #c4b5fd; border: 1px solid rgba(168, 85, 247, 0.45); }

/* Body container */
.iso-tile-body {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 9px 10px 10px;
  height: 52%;
}

/* Name row */
.iso-tile-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.iso-tile-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}
.iso-dot-pink { background: #f472b6; box-shadow: 0 0 8px #f472b6; }
.iso-dot-cy   { background: #22d3ee; box-shadow: 0 0 8px #22d3ee; }
.iso-dot-em   { background: #34d399; box-shadow: 0 0 8px #34d399; }
.iso-dot-pu   { background: #a78bfa; box-shadow: 0 0 8px #a78bfa; }
@keyframes iso-dot-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.4; transform: scale(1.3); }
}
.iso-tile-name {
  font-size: 11px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

/* Smart link button row */
.iso-tile-links {
  display: flex;
  gap: 5px;
}
.iso-link {
  flex: 1;
  height: 22px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.78);
  transition: transform 0.3s ease;
  position: relative;
  overflow: hidden;
}
.iso-link svg { width: 11px; height: 11px; }
.iso-link::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}
.iso-link-spotify { color: #34d399; background: rgba(52, 211, 153, 0.12); border-color: rgba(52, 211, 153, 0.28); }
.iso-link-apple   { color: #f9a8d4; background: rgba(236, 72, 153, 0.12); border-color: rgba(236, 72, 153, 0.26); }
.iso-link-yt      { color: #fb7185; background: rgba(244, 63, 94, 0.14); border-color: rgba(244, 63, 94, 0.28); }
.iso-link-qr      { color: #a5f3fc; background: rgba(34, 211, 238, 0.14); border-color: rgba(34, 211, 238, 0.28); }

/* Stat row with sparkline */
.iso-tile-stat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 5px 7px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  margin-top: auto;
}
.iso-stat-text { display: flex; flex-direction: column; gap: 1px; line-height: 1; }
.iso-stat-label {
  font-size: 7px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 700;
}
.iso-stat-val {
  font-size: 11px;
  font-weight: 800;
  color: #fff;
  font-variant-numeric: tabular-nums;
  display: flex;
  align-items: baseline;
  gap: 3px;
}
.iso-stat-val em {
  font-size: 8px;
  font-style: normal;
  font-weight: 700;
  color: #34d399;
}
.iso-spark {
  width: 42px;
  height: 16px;
  flex-shrink: 0;
}
.iso-spark .stat-pink, .iso-stat-val.stat-pink ~ * .iso-spark { color: #f472b6; }
/* Color the sparkline based on tone */
.iso-tile-inner.tone-pink    .iso-spark { color: #f472b6; }
.iso-tile-inner.tone-cyan    .iso-spark { color: #67e8f9; }
.iso-tile-inner.tone-emerald .iso-spark { color: #6ee7b7; }
.iso-tile-inner.tone-purple  .iso-spark { color: #c4b5fd; }

/* Soft accent pulse across each tile */
.iso-tile-pulse {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: 12px;
  background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.08), transparent 50%);
  opacity: 0.28;
}

/* ═══════════════════════════════════════════════════════
   LAYER 7 — LIVE DATA TICKER
═══════════════════════════════════════════════════════ */
.world-data-ticker {
  position: absolute;
  top: 22%;
  right: 5%;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
  opacity: 0.72;
}

.ticker-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px 10px 12px;
  background: rgba(6, 3, 18, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.5),
    0 0 24px rgba(168, 85, 247, 0.1);
  min-width: 200px;
}

.ticker-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
}
.ticker-dot::after {
  content: none;
}
.ticker-dot-emerald { background: #34d399; color: #34d399; box-shadow: 0 0 12px #34d399; }
.ticker-dot-cyan    { background: #22d3ee; color: #22d3ee; box-shadow: 0 0 12px #22d3ee; }
.ticker-dot-magenta { background: #f472b6; color: #f472b6; box-shadow: 0 0 12px #f472b6; }

.ticker-body {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.ticker-label {
  font-size: 8px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
  font-weight: 600;
}
.ticker-value {
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
  display: flex;
  align-items: center;
  gap: 5px;
}
.ticker-value em {
  font-size: 9px;
  color: #34d399;
  font-style: normal;
  line-height: 1;
}

/* ═══════════════════════════════════════════════════════
   SHEEN — sweeps diagonally across every iso tile
═══════════════════════════════════════════════════════ */
.iso-tile-sheen {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: 12px;
  overflow: hidden;
}
.iso-tile-sheen::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -120%;
  width: 80%;
  height: 200%;
  background: linear-gradient(115deg,
    transparent 0%,
    rgba(255, 255, 255, 0.06) 35%,
    rgba(255, 255, 255, 0.22) 50%,
    rgba(255, 255, 255, 0.06) 65%,
    transparent 100%);
  transform: skewX(-12deg);
  opacity: 0;
}
@keyframes iso-sheen-sweep {
  0%, 60%   { transform: translateX(0) skewX(-12deg); opacity: 0; }
  65%       { opacity: 1; }
  100%      { transform: translateX(380%) skewX(-12deg); opacity: 0; }
}

/* ═══════════════════════════════════════════════════════
   SWEEPING SPOTLIGHT BEAMS — concert-feel light cones
═══════════════════════════════════════════════════════ */
.world-spotlight {
  position: absolute;
  top: -10%;
  left: 50%;
  width: 70%;
  height: 130%;
  margin-left: -35%;
  pointer-events: none;
  z-index: 1;
  background: linear-gradient(180deg,
    rgba(236, 72, 153, 0.16) 0%,
    rgba(168, 85, 247, 0.08) 35%,
    transparent 75%);
  clip-path: polygon(48% 0, 52% 0, 100% 100%, 0% 100%);
  filter: blur(28px);
  transform-origin: 50% 0%;
  transform: rotate(-14deg);
  animation: spot-sweep-a 22s ease-in-out infinite alternate;
  mix-blend-mode: screen;
  opacity: 0.55;
}
.world-spotlight-b {
  background: linear-gradient(180deg,
    rgba(34, 211, 238, 0.14) 0%,
    rgba(52, 211, 153, 0.07) 40%,
    transparent 80%);
  animation: spot-sweep-b 28s ease-in-out infinite alternate;
  opacity: 0.45;
}
@keyframes spot-sweep-a {
  from { transform: rotate(-18deg); }
  to   { transform: rotate(14deg); }
}
@keyframes spot-sweep-b {
  from { transform: rotate(20deg); }
  to   { transform: rotate(-16deg); }
}

/* ═══════════════════════════════════════════════════════
   ATMOSPHERE — drifting waveform ribbons + sparks + crowd
═══════════════════════════════════════════════════════ */
.world-atmosphere {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  overflow: hidden;
  contain: layout style;
}

/* Waveform ribbons — soft horizontal music waves drifting */
.atmo-ribbon {
  position: absolute;
  left: -10%;
  width: 120%;
  height: 200px;
  opacity: 0.55;
  filter: blur(1px);
  mix-blend-mode: screen;
  will-change: transform, opacity;
}
.atmo-ribbon-a {
  top: 18%;
  animation: ribbon-drift-a 22s ease-in-out infinite alternate,
             ribbon-glow 6s ease-in-out infinite alternate;
}
.atmo-ribbon-b {
  top: 48%;
  animation: ribbon-drift-b 28s ease-in-out infinite alternate,
             ribbon-glow 9s ease-in-out infinite alternate;
}
.atmo-ribbon-c {
  top: 72%;
  animation: ribbon-drift-a 34s ease-in-out infinite alternate-reverse,
             ribbon-glow 7s ease-in-out infinite alternate;
}
@keyframes ribbon-drift-a {
  from { transform: translateX(-4%) translateY(0); }
  to   { transform: translateX(4%)  translateY(-12px); }
}
@keyframes ribbon-drift-b {
  from { transform: translateX(3%)  translateY(0); }
  to   { transform: translateX(-5%) translateY(10px); }
}
@keyframes ribbon-glow {
  from { opacity: 0.35; }
  to   { opacity: 0.7; }
}

/* Floating culture sparks — abstract diamond/square QR-feel shapes */
.atmo-spark {
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 1.5px;
  background: rgba(255, 255, 255, 0.55);
  box-shadow: 0 0 14px currentColor, 0 0 4px currentColor;
  transform: rotate(45deg);
  opacity: 0.6;
  animation: spark-float 12s ease-in-out infinite alternate;
}
.atmo-spark-1 { top: 14%; left:  8%; color: #f472b6; animation-delay: 0s; animation-duration: 11s; }
.atmo-spark-2 { top: 22%; left: 88%; color: #67e8f9; animation-delay: 1.6s; animation-duration: 14s; }
.atmo-spark-3 { top: 58%; left: 12%; color: #c4b5fd; animation-delay: 3.1s; animation-duration: 16s; }
.atmo-spark-4 { top: 70%; left: 82%; color: #6ee7b7; animation-delay: 4.4s; animation-duration: 13s; }
.atmo-spark-5 { top: 36%; left: 46%; color: #f9a8d4; animation-delay: 2.2s; animation-duration: 15s; }
.atmo-spark-6 { top: 84%; left: 32%; color: #a5f3fc; animation-delay: 5.5s; animation-duration: 17s; }
@keyframes spark-float {
  0%, 100% { transform: rotate(45deg)  translate(0,0)   scale(1);   opacity: 0.35; }
  50%      { transform: rotate(225deg) translate(8px,-14px) scale(1.4); opacity: 0.9; }
}

/* Crowd silhouette at the bottom — concert-feel heads & shoulders */
.atmo-crowd {
  position: absolute;
  bottom: -10px;
  left: 0; right: 0;
  height: 90px;
  background:
    radial-gradient(ellipse 12px 18px at 6%  100%, rgba(0,0,0,0.7) 60%, transparent 70%),
    radial-gradient(ellipse 14px 22px at 14% 100%, rgba(0,0,0,0.8) 60%, transparent 70%),
    radial-gradient(ellipse 12px 20px at 22% 100%, rgba(0,0,0,0.65) 60%, transparent 70%),
    radial-gradient(ellipse 16px 26px at 31% 100%, rgba(0,0,0,0.85) 60%, transparent 70%),
    radial-gradient(ellipse 11px 18px at 39% 100%, rgba(0,0,0,0.6) 60%, transparent 70%),
    radial-gradient(ellipse 14px 22px at 47% 100%, rgba(0,0,0,0.75) 60%, transparent 70%),
    radial-gradient(ellipse 12px 20px at 56% 100%, rgba(0,0,0,0.7) 60%, transparent 70%),
    radial-gradient(ellipse 15px 24px at 64% 100%, rgba(0,0,0,0.8) 60%, transparent 70%),
    radial-gradient(ellipse 13px 21px at 73% 100%, rgba(0,0,0,0.7) 60%, transparent 70%),
    radial-gradient(ellipse 11px 19px at 80% 100%, rgba(0,0,0,0.6) 60%, transparent 70%),
    radial-gradient(ellipse 15px 23px at 88% 100%, rgba(0,0,0,0.78) 60%, transparent 70%),
    radial-gradient(ellipse 12px 20px at 95% 100%, rgba(0,0,0,0.65) 60%, transparent 70%),
    linear-gradient(to top, rgba(2,0,8,0.85) 0%, rgba(2,0,8,0.4) 50%, transparent 100%);
  opacity: 0.62;
  filter: blur(0.4px);
}

/* ═══════════════════════════════════════════════════════
   ISO FLOOR — glowing nodes, heat zones, scan pulses
═══════════════════════════════════════════════════════ */
.iso-floor-nodes {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 0 0, rgba(196, 181, 253, 0.7) 1.5px, transparent 2.2px);
  background-size: 90px 90px;
  /* Mask so the node dots only appear where the floor is visible */
  mask-image: radial-gradient(ellipse at center, black 25%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 25%, transparent 70%);
  opacity: 0.45;
}
@keyframes floor-node-pulse {
  from { filter: brightness(0.9); }
  to   { filter: brightness(1.4); }
}

/* Heat zones — soft radial blooms under hot artist portals */
.iso-floor-heat {
  position: absolute;
  border-radius: 50%;
  mix-blend-mode: screen;
  filter: blur(30px);
  pointer-events: none;
}
.iso-floor-heat-a {
  width: 360px; height: 360px;
  top: 22%; left: 18%;
  background: radial-gradient(circle, rgba(236, 72, 153, 0.55), transparent 65%);
}
.iso-floor-heat-b {
  width: 420px; height: 420px;
  top: 38%; left: 44%;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.6), transparent 65%);
}
.iso-floor-heat-c {
  width: 320px; height: 320px;
  top: 50%; left: 72%;
  background: radial-gradient(circle, rgba(34, 211, 238, 0.5), transparent 65%);
}
@keyframes heat-breathe {
  from { transform: scale(0.85); opacity: 0.6; }
  to   { transform: scale(1.15); opacity: 1; }
}

/* Scan pulse rings on the floor — expanding concentric circles */
.iso-floor-scan {
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.35);
  pointer-events: none;
  mix-blend-mode: screen;
  opacity: 0;
}
.iso-floor-scan-a {
  width: 220px; height: 220px;
  top: 36%; left: 24%;
  margin: -110px 0 0 -110px;
  border-color: rgba(236, 72, 153, 0.5);
  display: none;
}
.iso-floor-scan-b {
  width: 260px; height: 260px;
  top: 48%; left: 64%;
  margin: -130px 0 0 -130px;
  border-color: rgba(34, 211, 238, 0.45);
  display: none;
}
@keyframes scan-pulse {
  0%   { transform: scale(0.4); opacity: 0; }
  10%  { opacity: 0.9; }
  100% { transform: scale(1.8); opacity: 0; }
}

/* ═══════════════════════════════════════════════════════
   ARTIST PORTAL ENHANCEMENTS — platform, halo, ring, signals
═══════════════════════════════════════════════════════ */
/* Luminous platform — flat disc that sits beneath the portal */
.iso-tile-platform {
  position: absolute;
  left: 50%;
  bottom: -28px;
  width: 130%;
  height: 36px;
  margin-left: -65%;
  border-radius: 50%;
  background: radial-gradient(ellipse at center,
    rgba(168, 85, 247, 0.7) 0%,
    rgba(168, 85, 247, 0.25) 35%,
    transparent 70%);
  filter: blur(8px);
  pointer-events: none;
  z-index: -1;
  mix-blend-mode: screen;
}
.iso-tile-platform.tone-pink    { background: radial-gradient(ellipse at center, rgba(236, 72, 153, 0.8) 0%, rgba(236, 72, 153, 0.25) 35%, transparent 70%); }
.iso-tile-platform.tone-cyan    { background: radial-gradient(ellipse at center, rgba(34, 211, 238, 0.75) 0%, rgba(34, 211, 238, 0.22) 35%, transparent 70%); }
.iso-tile-platform.tone-emerald { background: radial-gradient(ellipse at center, rgba(52, 211, 153, 0.7) 0%, rgba(52, 211, 153, 0.22) 35%, transparent 70%); }
.iso-tile-platform.tone-purple  { background: radial-gradient(ellipse at center, rgba(168, 85, 247, 0.8) 0%, rgba(168, 85, 247, 0.25) 35%, transparent 70%); }
@keyframes portal-platform-pulse {
  from { opacity: 0.55; transform: scaleX(1); }
  to   { opacity: 1;    transform: scaleX(1.15); }
}

/* Stage-light halo — soft glow behind the tile */
.iso-tile-halo {
  position: absolute;
  inset: -18px;
  border-radius: 24px;
  background: radial-gradient(circle at 50% 30%,
    rgba(168, 85, 247, 0.45) 0%,
    rgba(168, 85, 247, 0.18) 30%,
    transparent 70%);
  filter: blur(14px);
  pointer-events: none;
  z-index: -1;
  mix-blend-mode: screen;
}
.iso-tile-halo.tone-pink    { background: radial-gradient(circle at 50% 30%, rgba(236, 72, 153, 0.5) 0%, rgba(236, 72, 153, 0.18) 30%, transparent 70%); }
.iso-tile-halo.tone-cyan    { background: radial-gradient(circle at 50% 30%, rgba(34, 211, 238, 0.45) 0%, rgba(34, 211, 238, 0.16) 30%, transparent 70%); }
.iso-tile-halo.tone-emerald { background: radial-gradient(circle at 50% 30%, rgba(52, 211, 153, 0.4) 0%, rgba(52, 211, 153, 0.15) 30%, transparent 70%); }
.iso-tile-halo.tone-purple  { background: radial-gradient(circle at 50% 30%, rgba(168, 85, 247, 0.5) 0%, rgba(168, 85, 247, 0.18) 30%, transparent 70%); }
@keyframes portal-halo-pulse {
  from { opacity: 0.5; transform: scale(0.95); }
  to   { opacity: 1;   transform: scale(1.05); }
}

/* Expanding scan ring — waveform pulse out from each portal */
.iso-tile-ring {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  border: 1.5px solid rgba(168, 85, 247, 0.6);
  pointer-events: none;
  opacity: 0;
  z-index: 0;
  display: none;
}
.iso-tile-ring.tone-pink    { border-color: rgba(236, 72, 153, 0.7); }
.iso-tile-ring.tone-cyan    { border-color: rgba(34, 211, 238, 0.7); }
.iso-tile-ring.tone-emerald { border-color: rgba(52, 211, 153, 0.7); }
.iso-tile-ring.tone-purple  { border-color: rgba(168, 85, 247, 0.7); }
@keyframes portal-ring {
  0%   { transform: scale(0.96); opacity: 0; }
  15%  { opacity: 0.8; }
  100% { transform: scale(1.45); opacity: 0; }
}

/* Tiny orbiting fan-signal sparks around each portal */
.iso-tile-signals {
  position: absolute;
  inset: -10px;
  pointer-events: none;
  z-index: 0;
  display: none;
}
.iso-tile-signals span {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 8px currentColor, 0 0 2px currentColor;
  opacity: 0;
}
.iso-tile-signals span:nth-child(1) { top: 8%;  left: 12%; animation-delay: 0s; }
.iso-tile-signals span:nth-child(2) { top: 18%; right: 8%; animation-delay: 1s; }
.iso-tile-signals span:nth-child(3) { bottom: 22%; left: 6%;  animation-delay: 2s; }
.iso-tile-signals span:nth-child(4) { bottom: 8%;  right: 14%; animation-delay: 3s; }
/* Color sparks by the parent tile's tone (CSS :has() — modern browsers). Default pink. */
.iso-tile-signals span { color: #f9a8d4; }
.iso-tile:has(.iso-tile-inner.tone-cyan)    .iso-tile-signals span { color: #a5f3fc; }
.iso-tile:has(.iso-tile-inner.tone-emerald) .iso-tile-signals span { color: #6ee7b7; }
.iso-tile:has(.iso-tile-inner.tone-purple)  .iso-tile-signals span { color: #c4b5fd; }
@keyframes portal-spark {
  0%, 100% { opacity: 0; transform: translateY(0) scale(0.6); }
  20%      { opacity: 1; transform: translateY(-2px) scale(1); }
  80%      { opacity: 0.7; transform: translateY(-6px) scale(0.9); }
}

/* ═══════════════════════════════════════════════════════
   FEATURED CENTER PORTAL — the "Ultimate Smart Link"
═══════════════════════════════════════════════════════ */
.iso-tile.featured-portal {
  z-index: 5;
}
.iso-tile.featured-portal .iso-tile-inner {
  /* Stronger gradient border + brighter halo */
  box-shadow:
    0 28px 80px rgba(0, 0, 0, 0.8),
    0 0 60px rgba(236, 72, 153, 0.5),
    0 0 100px rgba(168, 85, 247, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  border-radius: 18px;
  transform: scale(1.12);
  transform-origin: center;
}
.iso-tile.featured-portal .iso-tile-platform {
  width: 180%;
  margin-left: -90%;
  height: 56px;
  bottom: -42px;
  background: radial-gradient(ellipse at center,
    rgba(236, 72, 153, 0.9) 0%,
    rgba(168, 85, 247, 0.5) 25%,
    rgba(34, 211, 238, 0.3) 50%,
    transparent 72%);
  filter: blur(10px);
}
.iso-tile.featured-portal .iso-tile-halo {
  inset: -32px;
  background: radial-gradient(circle at 50% 30%,
    rgba(236, 72, 153, 0.6) 0%,
    rgba(168, 85, 247, 0.3) 30%,
    rgba(34, 211, 238, 0.15) 55%,
    transparent 75%);
  filter: blur(22px);
}
.iso-tile.featured-portal .iso-tile-ring {
  border-width: 2px;
}
.iso-tile.featured-portal::after {
  /* Second outer ring for extra focal weight */
  content: '';
  position: absolute;
  inset: -8px;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  pointer-events: none;
  opacity: 0.45;
}
.iso-tile.featured-portal::before {
  /* "Ultimate" crown indicator above the portal */
  content: '';
  position: absolute;
  top: -16px;
  left: 50%;
  width: 8px;
  height: 8px;
  margin-left: -4px;
  background: linear-gradient(135deg, #ec4899, #a855f7);
  border-radius: 2px;
  transform: rotate(45deg);
  box-shadow: 0 0 18px rgba(236, 72, 153, 0.8);
  z-index: 3;
}
@keyframes featured-crown {
  from { transform: rotate(45deg)  translateY(0)   scale(1);   opacity: 0.85; }
  to   { transform: rotate(225deg) translateY(-2px) scale(1.3); opacity: 1; }
}

/* ═══════════════════════════════════════════════════════
   MOBILE
═══════════════════════════════════════════════════════ */
@media (max-width: 768px) {
  .cinematic-artist-world {
    min-height: 560px;
    perspective: none;
  }

  .world-layer-deep {
    opacity: 0.5;
    transform: none;
  }

  .deep-img {
    opacity: 0.1;
    filter: blur(12px) saturate(1.3);
  }

  .world-overlay-left,
  .world-overlay-right {
    width: 100px;
  }

  .world-scanlines {
    display: none;
  }

  /* Isometric grid: smaller, lighter on mobile */
  .world-iso {
    opacity: 0.55;
  }
  .iso-grid {
    width: 900px;
    margin-left: -450px;
    grid-template-columns: repeat(5, 1fr);
    grid-auto-rows: 130px;
    gap: 22px;
  }
  .iso-floor {
    background-size: 60px 60px;
  }
  .iso-floor-nodes { background-size: 60px 60px; opacity: 0.35; }

  /* Hide the heaviest atmosphere on mobile to keep it light */
  .atmo-ribbon-c,
  .atmo-spark-4,
  .atmo-spark-6,
  .iso-floor-scan-b,
  .iso-floor-heat-c {
    display: none;
  }
  .atmo-crowd { height: 60px; opacity: 0.45; }

  /* Featured portal: smaller boost on mobile */
  .iso-tile.featured-portal .iso-tile-inner { transform: scale(1.05); }
  .iso-tile.featured-portal .iso-tile-platform { height: 36px; bottom: -28px; }

  /* Smaller portal decorations */
  .iso-tile-platform { height: 24px; bottom: -18px; }
  .iso-tile-halo { inset: -10px; filter: blur(10px); }
  .iso-tile-signals { display: none; }

  .world-data-ticker {
    top: auto;
    bottom: 12%;
    right: 4%;
  }
  .ticker-item {
    min-width: 0;
    padding: 8px 12px 8px 10px;
  }
  .ticker-value {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .cinematic-artist-world {
    min-height: 480px;
  }
  /* On phones, hide ribbons and most atmosphere */
  .atmo-ribbon,
  .atmo-spark,
  .iso-floor-scan,
  .iso-floor-heat {
    display: none;
  }
}

/* ═══════════════════════════════════════════════════════
   REDUCED MOTION
═══════════════════════════════════════════════════════ */
@media (prefers-reduced-motion: reduce) {
  .cinematic-artist-world,
  .cinematic-artist-world * {
    animation: none !important;
    transition: none !important;
  }
}
</style>
