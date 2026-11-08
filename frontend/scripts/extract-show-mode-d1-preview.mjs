/**
 * Build a static owner preview of Show Mode dashboard states.
 * Run: node scripts/extract-show-mode-d1-preview.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const vue = fs.readFileSync(path.join(root, 'components/dashboard/ShowModeCard.vue'), 'utf8')
const css = vue.match(/<style scoped>([\s\S]*?)<\/style>/)[1]

const icon = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M4.93 19.07a10 10 0 010-14.14M7.76 16.24a6 6 0 010-8.48M16.24 7.76a6 6 0 010 8.48M19.07 4.93a10 10 0 010 14.14" /><circle cx="12" cy="12" r="1.55" fill="currentColor" stroke="none" /></svg>`
const clock = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`

const chips = `
      <ul class="sm-chips" aria-label="What Show Mode does">
        <li class="sm-chip"><span class="sm-chip__mark">✓</span> Fan check-ins</li>
        <li class="sm-chip"><span class="sm-chip__mark">✓</span> Capture real fans</li>
        <li class="sm-chip"><span class="sm-chip__mark">✓</span> Message the room</li>
        <li class="sm-chip"><span class="sm-chip__mark">✓</span> Recap + memories</li>
      </ul>`

const identity = `
        <div class="idle-identity">
          <span class="sm-icon off" aria-hidden="true">${icon}</span>
          <div class="sm-headings">
            <h3 class="sm-title sm-title--idle">Show Mode</h3>
            <p class="sm-headline">Turn tonight's crowd into fans you can reach again.</p>
            <p class="sm-support">Fans check in from their phones. Faneqo remembers who was there so you can message them after the show and keep the relationship going.</p>
          </div>
        </div>`

const neighbors = (wide) => `
  <aside class="neighbor">
    <div class="neighbor__icon"></div>
    <div>
      <h2>Artist Pages</h2>
      <p>Your public presence</p>
    </div>
  </aside>
  <div class="show-mode-card shell-collapsed ${wide ? '' : ''}">`

const after = `
  </div>
  <aside class="neighbor neighbor--fans">
    <div class="neighbor__icon neighbor__icon--fans"></div>
    <div>
      <h2>Fan Intelligence</h2>
      <p>The fans you've built</p>
    </div>
  </aside>`

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Show Mode D1 owner preview</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #050506;
      color: #f5f5f6;
      font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
    }
    .shot { display: none; min-height: 100vh; padding: 28px 28px 48px; }
    .shot.on { display: block; }
    .shot.mobile { padding: 16px 14px 40px; }
    .frame { width: min(100%, 1080px); margin: 0 auto; }
    .shot.mobile .frame { width: 390px; max-width: 100%; }
    .dash-kicker {
      margin: 0 0 18px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.38);
    }
    .dash-title { margin: 0 0 22px; font-size: 28px; font-weight: 700; letter-spacing: -0.03em; }
    .shot.mobile .dash-title { font-size: 22px; margin-bottom: 16px; }
    .neighbor {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      padding: 16px 18px;
      border-radius: 1rem;
      background: #0b0c10;
      border: 1px solid rgba(255,255,255,0.08);
    }
    .neighbor h2 { margin: 0; font-size: 16px; }
    .neighbor p { margin: 2px 0 0; font-size: 12.5px; color: rgba(255,255,255,0.5); }
    .neighbor__icon {
      width: 40px; height: 40px; border-radius: 12px;
      background: linear-gradient(135deg, #10b981, #14b8a6);
    }
    .neighbor--fans { margin: 12px 0 0; }
    .neighbor__icon--fans { background: linear-gradient(135deg, #4ca6ff, #39d5ff); }
    ${css}
  </style>
</head>
<body>
  <article id="s1" class="shot on">
    <div class="frame">
      <p class="dash-kicker">Dashboard · desktop inactive</p>
      <h1 class="dash-title">Dashboard</h1>
      ${neighbors(true)}
        <div class="idle-view">
          ${identity}
          <div class="idle-actions">
            <button type="button" class="sm-primary">Set up Show Mode</button>
            <button type="button" class="sm-ghost">Expand</button>
          </div>
          ${chips}
          <p class="sm-latest">Last show: Test night · Zen</p>
        </div>
      ${after}
    </div>
  </article>

  <article id="s2" class="shot mobile">
    <div class="frame">
      <p class="dash-kicker">Dashboard · 390px inactive</p>
      <h1 class="dash-title">Dashboard</h1>
      ${neighbors(false)}
        <div class="idle-view">
          ${identity}
          <div class="idle-actions">
            <button type="button" class="sm-primary">Set up Show Mode</button>
            <button type="button" class="sm-ghost">Expand</button>
          </div>
          ${chips}
          <p class="sm-latest">Last show: Test night · Zen</p>
        </div>
      ${after}
    </div>
  </article>

  <article id="s3" class="shot">
    <div class="frame">
      <p class="dash-kicker">Dashboard · see how it works</p>
      <h1 class="dash-title">Dashboard</h1>
      ${neighbors(true)}
        <div class="idle-view">
          ${identity}
          <div class="idle-actions">
            <button type="button" class="sm-primary">Set up Show Mode</button>
            <button type="button" class="sm-ghost">Collapse</button>
          </div>
          <p class="sm-latest">Last show: Test night · Zen</p>
          <ol class="sm-loop">
            <li><span class="sm-loop__kicker">At the show</span><p>Fans scan/check in.</p></li>
            <li><span class="sm-loop__kicker">After the show</span><p>You know who was there.</p></li>
            <li><span class="sm-loop__kicker">Keep the connection</span><p>Message the room, share photos, and let the night live in Passport.</p></li>
          </ol>
        </div>
      ${after}
    </div>
  </article>

  <article id="s4" class="shot">
    <div class="frame">
      <p class="dash-kicker">Dashboard · setup form</p>
      <h1 class="dash-title">Dashboard</h1>
      <div class="show-mode-card">
        <div class="expanded-view">
          <div class="sm-head">
            <div class="sm-head__left">
              <span class="sm-icon off">${icon}</span>
              <div class="sm-headings">
                <h3 class="sm-title">Show Mode</h3>
                <p class="sm-state">Add tonight's details, then activate.</p>
              </div>
            </div>
            <div class="sm-head__right">
              <button type="button" class="sm-ghost">Minimize</button>
            </div>
          </div>
          <div class="card-content">
            <p class="description">Add tonight's details, then activate. Auto-expires tomorrow at 6:00 AM.</p>
            <div class="activation-form">
              <div class="form-field"><label>Show Title (optional)</label><input type="text" placeholder="e.g. Album Release Party" value="Test night"></div>
              <div class="form-field"><label>Venue (optional)</label><input type="text" placeholder="e.g. The Roxy" value="Zen"></div>
              <div class="form-row">
                <div class="form-field"><label>City (optional)</label><input type="text" value="Nashville"></div>
                <div class="form-field"><label>Region (optional)</label><input type="text" value="TN"></div>
              </div>
              <div class="form-field"><label>Country (optional)</label><input type="text" value="USA"></div>
              <div class="form-field show-cover">
                <label>Show cover <span class="optional">Optional</span></label>
                <p class="show-cover__hint">Add a poster, flyer, or photo for this show.</p>
                <button type="button" class="show-cover__add">Add cover</button>
              </div>
              <div class="form-actions">
                <button type="button" class="cancel-btn">Cancel</button>
                <button type="button" class="action-btn activate">Activate Show Mode</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </article>

  <article id="s5" class="shot">
    <div class="frame">
      <p class="dash-kicker">Dashboard · live</p>
      <h1 class="dash-title">Dashboard</h1>
      <div class="show-mode-card">
        <div class="expanded-view">
          <div class="sm-head">
            <div class="sm-head__left">
              <span class="sm-icon live">${icon}</span>
              <div class="sm-headings">
                <div class="sm-title-row">
                  <h3 class="sm-title">Show Mode</h3>
                  <span class="sm-pill live"><span class="sm-pill__dot"></span>LIVE</span>
                </div>
              </div>
            </div>
          </div>
          <div class="card-content">
            <div class="live-place">
              <div class="live-place__text">
                <p class="live-place__title">Test night</p>
                <p class="live-place__meta">Zen · Nashville, TN</p>
              </div>
            </div>
            <div class="session-stats">
              <div class="session-stat"><div class="stat-value">47</div><div class="stat-label">checked in tonight</div></div>
              <div class="session-stat"><div class="stat-value">18</div><div class="stat-label">new fans captured</div></div>
            </div>
            <div class="action-buttons">
              <a class="action-btn live-view">Open Live Show View</a>
              <button type="button" class="action-btn deactivate">Turn Off Show Mode</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </article>

  <article id="s6" class="shot">
    <div class="frame">
      <p class="dash-kicker">Dashboard · recap ready</p>
      <h1 class="dash-title">Dashboard</h1>
      <div class="show-mode-card">
        <div class="recap-panel">
          <div class="recap-panel-head">
            <span class="recap-check">✓</span>
            <span class="recap-panel-title">Show recap ready.</span>
          </div>
          <div class="recap-preview">
            <div class="recap-stat"><span class="recap-stat-value">47</span><span class="recap-stat-label">Check-ins</span></div>
            <div class="recap-stat"><span class="recap-stat-value">18</span><span class="recap-stat-label">New fans</span></div>
          </div>
          <div class="recap-actions">
            <a class="action-btn recap-primary">View Recap</a>
            <a class="action-btn recap-secondary">Message the Room</a>
          </div>
          <div class="recap-footer">
            <a class="recap-history-link">Show All Recaps</a>
            <button type="button" class="recap-dismiss">Dismiss</button>
          </div>
        </div>
      </div>
    </div>
  </article>
  <script>
    function showShot() {
      const id = location.hash.replace('#', '') || 's1'
      document.querySelectorAll('.shot').forEach((el) => el.classList.toggle('on', el.id === id))
      window.scrollTo(0, 0)
    }
    showShot()
    window.addEventListener('hashchange', showShot)
  </script>
</body>
</html>
`

fs.writeFileSync(path.join(root, 'scripts/show-mode-d1-preview.html'), html)
console.log('wrote scripts/show-mode-d1-preview.html')
