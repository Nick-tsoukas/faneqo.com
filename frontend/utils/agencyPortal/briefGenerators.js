/**
 * V1.2 Brief Generators - Pure functions that generate copy/paste-ready text
 */

import {
  formatDateTimeShort,
  formatDateRange,
  formatWindowLabel,
  formatDelta,
  formatAbsoluteDelta,
  truncate,
  ownerNameById,
  formatMomentumPill,
  formatScore,
  formatVelocity,
  deepLink,
  formatBulletList,
  formatNumberedList
} from './formatters'

// =====================================================
// WHY-NOW MAPPING BY SIGNAL TYPE
// =====================================================
const WHY_NOW_MAP = {
  CITY_CLAIM: (ctx) => `City interest spiked — fans are repeatedly choosing ${ctx.city || 'this city'} right now.`,
  MOMENTUM_SURGE: () => 'Engagement velocity jumped above baseline — likely share + post-show lift.',
  AFTER_SHOW_ENERGY: () => 'Post-show behavior is high — convert while attention is hottest.',
  SHARE_CHAIN: () => 'Links are being shared — amplify before the chain cools.',
  PEAK_HOUR: () => 'This artist has a clear peak hour — schedule the push inside the window.',
  PLATFORM_PULL: (ctx) => `Fans are pulling toward ${ctx.platform || 'a platform'} — reinforce that lane immediately.`,
  RETURNING_FANS: () => 'Returning fans detected — nurture the loyalty loop now.',
  ENGAGED_SESSION_SPIKE: () => 'Deep engagement is up — fans are exploring, give them more.',
  QR_SCAN_BURST: () => 'QR scans spiked — physical touchpoint is working, double down.',
  LINK_CLICK_SURGE: () => 'Link clicks surged — the funnel is hot, optimize the destination.'
}

function getWhyNow(signalType, context = {}) {
  const fn = WHY_NOW_MAP[signalType]
  return fn ? fn(context) : 'Signal detected — review and act.'
}

// =====================================================
// PLAYBOOK STEPS MAPPING
// =====================================================
const PLAYBOOK_STEPS = {
  'City Claim Activation': [
    'Post city-specific story + pin link',
    'DM local playlist/blog + venue outreach',
    'Run a 48h city-focused push (QR + smart link)'
  ],
  'After-Show Conversion': [
    'Post show recap with smart link',
    'Drive follows/saves via 1 CTA',
    'Retarget engaged fans within 24–48h'
  ],
  'Share Chain Amplifier': [
    'Create a share prompt (caption + incentive)',
    'Double down on the top shared link',
    'Ask partners to repost within 12h'
  ],
  'Returning Fans Conversion': [
    'Drop a "you\'re early" thank-you post',
    'Route to follow/save + mailing list',
    'Offer a small unlock (demo/live clip)'
  ],
  'Platform Pull Reinforcement': [
    'Put top platform first on smart link',
    'Post a native clip pointing to that platform',
    'Track click share shift over 7d'
  ],
  'Momentum Surge Capture': [
    'Post while hot — story + feed',
    'Push the top-performing link',
    'Schedule follow-up within 24h'
  ],
  'Peak Hour Optimization': [
    'Schedule posts inside the peak window',
    'Test link placement during peak',
    'Monitor conversion rate shift'
  ]
}

function getPlaybookSteps(playbookName) {
  return PLAYBOOK_STEPS[playbookName] || [
    'Review signal and context',
    'Take recommended action',
    'Monitor results over 48h'
  ]
}

// =====================================================
// D1) SLACK UPDATE (SINGLE MESSAGE)
// =====================================================
export function slackUpdate({ signal, band, owner, playbook, baseUrl = '' }) {
  const whyNow = getWhyNow(signal.type, signal.context || {})
  const steps = getPlaybookSteps(playbook?.name)
  const link = deepLink(`/agency/artists/${band.bandId}`, baseUrl)
  const ownerName = owner?.name || 'Unassigned'

  return `⚡ ${signal.headline} — ${band.name} (${signal.windowLabel})
Hero: ${signal.hero}
Proof: ${signal.proof}
Why now: ${whyNow}
Next: ${playbook?.name || 'Review'} → ${steps[0]}; ${steps[1] || 'Monitor'}
Open: ${link}
Owner: ${ownerName}`
}

// =====================================================
// D2) SLACK THREAD PACK (4 MESSAGES)
// =====================================================
export function slackThreadPack({ signal, band, owner, playbook, metrics, cityData, baseUrl = '' }) {
  const steps = getPlaybookSteps(playbook?.name)
  const link = deepLink(`/agency/artists/${band.bandId}`, baseUrl)
  const ownerName = owner?.name || 'Unassigned'
  const momentumPill = formatMomentumPill(metrics?.momentumState || 'steady')
  const velocity = formatVelocity(metrics?.velocity7d || 0)

  // Message 1: Headline
  const msg1 = `📌 ${band.name} — ${momentumPill} (${velocity})
Top signal: ${signal.headline} (${signal.windowLabel}) — score ${formatScore(signal.score)}`

  // Message 2: Territory
  const topCity = metrics?.topCity || signal.context?.city || 'Unknown'
  const cityNote = cityData?.isStack 
    ? `Stack detected — ${cityData.highMomentumArtists || 0} artists hot here`
    : 'Single artist active'
  const stackLine = cityData?.isStack ? `Yes (${cityData.activeArtists || 0} active)` : 'No'

  const msg2 = `📍 Territory: Top city = ${topCity}
City notes: ${cityNote}
City stack: ${stackLine}`

  // Message 3: What changed (deltas)
  const sessionsDelta = metrics?.sessionsDelta ? formatAbsoluteDelta(metrics.sessionsDelta) : 'N/A'
  const clicksDelta = metrics?.clicksDelta ? formatAbsoluteDelta(metrics.clicksDelta) : 'N/A'
  const engagedDelta = metrics?.engagedDelta ? formatAbsoluteDelta(metrics.engagedDelta) : 'N/A'
  const sharesDelta = metrics?.sharesDelta ? formatAbsoluteDelta(metrics.sharesDelta) : 'N/A'

  const msg3 = `🔎 What changed:
- Sessions: ${sessionsDelta}
- Link clicks: ${clicksDelta}
- Engaged: ${engagedDelta}
- Shares: ${sharesDelta}`

  // Message 4: Action
  const msg4 = `✅ Recommended: ${playbook?.name || 'Review Signal'}
Next steps:
1) ${steps[0]}
2) ${steps[1] || 'Monitor results'}
3) ${steps[2] || 'Report back'}
Owner: ${ownerName}
Deep link: ${link}`

  return [msg1, msg2, msg3, msg4].join('\n\n---\n\n')
}

// =====================================================
// D3) DAILY BRIEF (ROSTER)
// =====================================================
export function dailyBrief({ orgName, window, actionItems, topMovers, topCities, overdueTasks, baseUrl = '' }) {
  const date = formatDateTimeShort(new Date())
  const windowLabel = formatWindowLabel(window)

  // Format action items
  const actionLines = actionItems.slice(0, 5).map(item => {
    const link = deepLink(`/agency/artists/${item.bandId}`, baseUrl)
    return `• ${item.bandName} — ${item.signalHeadline} — ${item.topCity || 'N/A'} — score ${item.score} — Owner ${item.ownerName} — ${link}`
  }).join('\n')

  // Format top movers
  const moverLines = topMovers.slice(0, 5).map(m => {
    return `• ${m.bandName} ${formatVelocity(m.velocity)} — Index ${m.momentumIndex} — Top city ${m.topCity || 'N/A'}`
  }).join('\n')

  // Format top cities
  const cityLines = topCities.slice(0, 5).map(c => {
    return `• ${c.name} — Heat ${c.heatScore}/100 — ${c.activeArtists} artists active`
  }).join('\n')

  // Format overdue tasks
  let overdueBlock = 'None 🎉'
  if (overdueTasks && overdueTasks.length > 0) {
    overdueBlock = overdueTasks.slice(0, 5).map(t => {
      return `• ${t.title} — ${t.bandName} — Owner ${t.ownerName} — Due ${formatDateTimeShort(t.dueAt)}`
    }).join('\n')
  }

  return `MBQ DAILY BRIEF — ${orgName} — ${date} (${windowLabel})

1) NEEDS ACTION TODAY
${actionLines || '• No urgent signals'}

2) TOP MOVERS
${moverLines || '• No significant movers'}

3) CITIES HEATING UP
${cityLines || '• No hot cities'}

4) TASKS AT RISK
${overdueBlock}

Notes: Generated from MBQ first-party link/QR engagement + momentum signals.`
}

// =====================================================
// D4) WEEKLY DECK OUTLINE (ROSTER)
// =====================================================
export function weeklyDeckOutline({ 
  orgName, 
  dateRange, 
  rosterMomentum, 
  topCity, 
  biggestMover, 
  topMovers, 
  topCities, 
  actionSignals, 
  taskStats, 
  proofLines 
}) {
  const dateStr = formatDateRange(dateRange.start, dateRange.end)
  const momentumDirection = rosterMomentum.delta >= 0 ? 'UP' : 'DOWN'

  // Slide 2: Top Movers
  const moverSlide = topMovers.slice(0, 5).map(m => {
    return `- ${m.bandName} — ${m.whyNow || 'Momentum detected'} — action: ${m.playbook || 'Review'}`
  }).join('\n')

  // Slide 3: Territory Focus
  const citySlide = topCities.slice(0, 5).map(c => {
    return `- ${c.name} — ${c.activeArtists} artists active — stack ${c.isStack ? 'Yes' : 'No'}`
  }).join('\n')

  // Slide 4: Signals needing action
  const signalSlide = actionSignals.slice(0, 6).map(s => {
    return `- ${s.bandName} — ${s.signalHeadline} — owner ${s.ownerName} — next step ${s.nextStep || 'Review'}`
  }).join('\n')

  // Slide 5: Tasks
  const ownerLoadList = taskStats.topOwners?.slice(0, 3).map(o => `${o.name} (${o.count})`).join(', ') || 'N/A'

  // Slide 6: Wins & Proof
  const proofSlide = proofLines.slice(0, 3).map(p => `- ${p}`).join('\n')

  return `WEEKLY ROSTER BRIEF — ${orgName} — Week of ${dateStr}

Slide 1 — Executive Summary
- Roster momentum: ${momentumDirection} (avg index ${rosterMomentum.current} vs ${rosterMomentum.previous})
- Top city: ${topCity.name} (${topCity.heatScore}/100)
- Biggest mover: ${biggestMover.bandName} (${formatVelocity(biggestMover.velocity)})

Slide 2 — Top Movers (5)
${moverSlide || '- No significant movers this week'}

Slide 3 — Territory Focus (Top Cities)
${citySlide || '- No hot cities this week'}

Slide 4 — Signals That Need Action (Top 6)
${signalSlide || '- No urgent signals'}

Slide 5 — Tasks & Accountability
- Overdue: ${taskStats.overdue || 0}
- Open tasks: ${taskStats.open || 0}
- Owners needing help: ${ownerLoadList}

Slide 6 — Wins & Proof (for Partners)
${proofSlide || '- No proof lines this week'}`
}

// =====================================================
// D5) CITY CLAIM BRIEF
// =====================================================
export function cityClaimBrief({ city, window, topArtists, baseUrl = '' }) {
  const windowLabel = formatWindowLabel(window)

  // Top artists in city
  const artistLines = topArtists.slice(0, 5).map(a => {
    const link = deepLink(`/agency/artists/${a.bandId}`, baseUrl)
    return `• ${a.bandName} — ${formatMomentumPill(a.momentumState)} — Index ${a.momentumIndex} — ${link}`
  }).join('\n')

  // Recommended activation steps
  const steps = PLAYBOOK_STEPS['City Claim Activation']

  // Proof lines from top signals
  const proofLines = topArtists.slice(0, 3).map(a => {
    return `• ${a.bandName}: ${a.topSignalProof || 'Engagement detected in ' + city.name}`
  }).join('\n')

  return `CITY CLAIM BRIEF — ${city.name} — ${windowLabel}

Heat: ${city.heatScore}/100
Active artists: ${city.activeArtists}
Stack: ${city.isStack ? `Yes (${city.highMomentumArtists} high momentum)` : 'No'}

Top artists in this city:
${artistLines || '• No artists active'}

Recommended activation:
- ${steps[0]}
- ${steps[1]}
- ${steps[2]}

Proof lines:
${proofLines || '• No proof available'}`
}

// =====================================================
// D6) ARTIST MOMENTUM PACK
// =====================================================
export function artistMomentumPack({ band, signal, metrics, playbook, owner, narrativeLines, proofLines, baseUrl = '' }) {
  const windowLabel = formatWindowLabel(metrics?.window || '7d')
  const link = deepLink(`/agency/artists/${band.bandId}`, baseUrl)
  const ownerName = owner?.name || 'Unassigned'
  const momentumPill = formatMomentumPill(metrics?.momentumState || 'steady')
  const velocity = formatVelocity(metrics?.velocity7d || 0)
  const steps = getPlaybookSteps(playbook?.name)

  // Narrative lines
  const narrativeBlock = narrativeLines?.slice(0, 2).map(n => `- ${n}`).join('\n') || '- Activity detected in window'

  // Proof lines
  const proofBlock = proofLines?.slice(0, 3).map(p => `- ${p}`).join('\n') || '- Engagement metrics available'

  return `ARTIST MOMENTUM PACK — ${band.name} — ${windowLabel}

Snapshot
- Momentum: ${momentumPill} (7d velocity ${velocity})
- Index today: ${metrics?.momentumIndex || 0}/100
- Top city: ${metrics?.topCity || 'N/A'}
- Top signal: ${signal?.headline || 'None'} (score ${formatScore(signal?.score)})

What happened
${narrativeBlock}

Proof
${proofBlock}

Recommended playbook: ${playbook?.name || 'Review Signal'}
Steps:
1) ${steps[0]}
2) ${steps[1] || 'Monitor results'}
3) ${steps[2] || 'Report back'}

Owner: ${ownerName}
Deep link: ${link}`
}

// =====================================================
// HELPER: Generate narrative lines from metrics
// =====================================================
export function generateNarrativeLines(metrics, signal) {
  const lines = []
  
  if (metrics?.sessionsDelta > 0) {
    lines.push(`Sessions up ${formatAbsoluteDelta(metrics.sessionsDelta)} vs previous period`)
  }
  if (metrics?.clicksDelta > 0) {
    lines.push(`Link clicks increased by ${formatAbsoluteDelta(metrics.clicksDelta)}`)
  }
  if (signal?.type === 'AFTER_SHOW_ENERGY') {
    lines.push('Post-show engagement spike detected')
  }
  if (signal?.type === 'CITY_CLAIM') {
    lines.push(`Strong activity in ${signal.context?.city || 'target city'}`)
  }
  if (signal?.type === 'SHARE_CHAIN') {
    lines.push('Link sharing activity above baseline')
  }
  
  if (lines.length === 0) {
    lines.push('Engagement activity detected in window')
  }
  
  return lines.slice(0, 2)
}

// =====================================================
// HELPER: Generate proof lines from signals
// =====================================================
export function generateProofLines(signals, band) {
  return signals.slice(0, 3).map(s => {
    return `${s.headline}: ${s.hero} (${s.windowLabel})`
  })
}
