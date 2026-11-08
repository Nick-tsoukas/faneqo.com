/**
 * Agency Portal Mock Data
 * Single source of truth for V1 frontend-only implementation
 * 
 * HOW TO SWAP FOR REAL API:
 * Replace imports of this file with API calls in the store.
 * See docs/AGENCY_SCHEMA_BLUEPRINT.md for endpoint suggestions.
 */

// Signal types enum
export const SIGNAL_TYPES = {
  CITY_CLAIM: 'CITY_CLAIM',
  NEW_CITY_UNLOCKED: 'NEW_CITY_UNLOCKED',
  CITY_STACK: 'CITY_STACK',
  MOMENTUM_SURGE: 'MOMENTUM_SURGE',
  PEAK_HOUR: 'PEAK_HOUR',
  ENGAGED_SESSIONS: 'ENGAGED_SESSIONS',
  RETURNING_FANS: 'RETURNING_FANS',
  SHARE_CHAIN: 'SHARE_CHAIN',
  SOURCE_SURGE: 'SOURCE_SURGE',
  AFTER_SHOW_ENERGY: 'AFTER_SHOW_ENERGY',
  PLATFORM_PULL: 'PLATFORM_PULL',
  MILESTONE_DROP: 'MILESTONE_DROP'
}

// Accent colors for signals
export const SIGNAL_ACCENTS = {
  violet: 'violet',
  blue: 'blue',
  emerald: 'emerald',
  amber: 'amber',
  rose: 'rose'
}

// Mock Organization
export const mockOrg = {
  id: 'org_001',
  name: 'Horizon Music Group',
  plan: 'pro',
  createdAt: '2024-01-15T00:00:00Z'
}

// Mock Members
export const mockMembers = [
  { id: 'mem_001', name: 'Sarah Chen', role: 'admin', email: 'sarah@horizonmusic.com' },
  { id: 'mem_002', name: 'Marcus Williams', role: 'agent', email: 'marcus@horizonmusic.com' },
  { id: 'mem_003', name: 'Elena Rodriguez', role: 'agent', email: 'elena@horizonmusic.com' },
  { id: 'mem_004', name: 'James Park', role: 'analyst', email: 'james@horizonmusic.com' },
  { id: 'mem_005', name: 'Aisha Thompson', role: 'agent', email: 'aisha@horizonmusic.com' },
  { id: 'mem_006', name: 'David Kim', role: 'viewer', email: 'david@horizonmusic.com' }
]

// Mock Roster Bands (20 bands)
export const mockRosterBands = [
  { bandId: 'band_001', name: 'The Midnight Echoes', slug: 'midnight-echoes', imageUrl: '/assets/band-placeholder.png', tier: 'A', ownerId: 'mem_002', genre: 'Indie Rock', homeCity: 'Austin' },
  { bandId: 'band_002', name: 'Velvet Storm', slug: 'velvet-storm', imageUrl: '/assets/band-placeholder.png', tier: 'A', ownerId: 'mem_003', genre: 'Electronic', homeCity: 'Los Angeles' },
  { bandId: 'band_003', name: 'Nova Heights', slug: 'nova-heights', imageUrl: '/assets/band-placeholder.png', tier: 'A', ownerId: 'mem_002', genre: 'Pop', homeCity: 'Nashville' },
  { bandId: 'band_004', name: 'Desert Mirage', slug: 'desert-mirage', imageUrl: '/assets/band-placeholder.png', tier: 'B', ownerId: 'mem_005', genre: 'Alternative', homeCity: 'Phoenix' },
  { bandId: 'band_005', name: 'Crystal Waves', slug: 'crystal-waves', imageUrl: '/assets/band-placeholder.png', tier: 'B', ownerId: 'mem_003', genre: 'Synth Pop', homeCity: 'Miami' },
  { bandId: 'band_006', name: 'Iron Bloom', slug: 'iron-bloom', imageUrl: '/assets/band-placeholder.png', tier: 'A', ownerId: 'mem_002', genre: 'Metal', homeCity: 'Chicago' },
  { bandId: 'band_007', name: 'Lunar Drift', slug: 'lunar-drift', imageUrl: '/assets/band-placeholder.png', tier: 'B', ownerId: 'mem_005', genre: 'Dream Pop', homeCity: 'Portland' },
  { bandId: 'band_008', name: 'Static Hearts', slug: 'static-hearts', imageUrl: '/assets/band-placeholder.png', tier: 'C', ownerId: 'mem_003', genre: 'Punk', homeCity: 'Brooklyn' },
  { bandId: 'band_009', name: 'Golden Hour', slug: 'golden-hour', imageUrl: '/assets/band-placeholder.png', tier: 'B', ownerId: 'mem_002', genre: 'Folk', homeCity: 'Denver' },
  { bandId: 'band_010', name: 'Neon Prophets', slug: 'neon-prophets', imageUrl: '/assets/band-placeholder.png', tier: 'A', ownerId: 'mem_005', genre: 'Hip Hop', homeCity: 'Atlanta' },
  { bandId: 'band_011', name: 'Ember & Ash', slug: 'ember-ash', imageUrl: '/assets/band-placeholder.png', tier: 'C', ownerId: 'mem_003', genre: 'Americana', homeCity: 'Austin' },
  { bandId: 'band_012', name: 'Phantom Circuit', slug: 'phantom-circuit', imageUrl: '/assets/band-placeholder.png', tier: 'B', ownerId: 'mem_002', genre: 'Electronic', homeCity: 'Seattle' },
  { bandId: 'band_013', name: 'Wildfire Saints', slug: 'wildfire-saints', imageUrl: '/assets/band-placeholder.png', tier: 'C', ownerId: 'mem_005', genre: 'Country Rock', homeCity: 'Nashville' },
  { bandId: 'band_014', name: 'Skyline Theory', slug: 'skyline-theory', imageUrl: '/assets/band-placeholder.png', tier: 'B', ownerId: 'mem_003', genre: 'Indie Pop', homeCity: 'San Francisco' },
  { bandId: 'band_015', name: 'Black Orchid', slug: 'black-orchid', imageUrl: '/assets/band-placeholder.png', tier: 'A', ownerId: 'mem_002', genre: 'R&B', homeCity: 'Los Angeles' },
  { bandId: 'band_016', name: 'Rust & Ruin', slug: 'rust-ruin', imageUrl: '/assets/band-placeholder.png', tier: 'C', ownerId: 'mem_005', genre: 'Blues Rock', homeCity: 'Memphis' },
  { bandId: 'band_017', name: 'Prism Effect', slug: 'prism-effect', imageUrl: '/assets/band-placeholder.png', tier: 'B', ownerId: 'mem_003', genre: 'Psychedelic', homeCity: 'Austin' },
  { bandId: 'band_018', name: 'Silver Tongue', slug: 'silver-tongue', imageUrl: '/assets/band-placeholder.png', tier: 'C', ownerId: 'mem_002', genre: 'Jazz Fusion', homeCity: 'New Orleans' },
  { bandId: 'band_019', name: 'Voltage Kids', slug: 'voltage-kids', imageUrl: '/assets/band-placeholder.png', tier: 'B', ownerId: 'mem_005', genre: 'Pop Punk', homeCity: 'Philadelphia' },
  { bandId: 'band_020', name: 'Hollow Sun', slug: 'hollow-sun', imageUrl: '/assets/band-placeholder.png', tier: 'C', ownerId: 'mem_003', genre: 'Post Rock', homeCity: 'Minneapolis' }
]

// Helper to generate timestamps
const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString()
const daysAgo = (d) => new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString()

// Mock Signals (2-6 per band, with variety)
export const mockSignals = [
  // Band 001 - The Midnight Echoes (Austin) - HIGH ACTIVITY
  { id: 'sig_001', bandId: 'band_001', type: SIGNAL_TYPES.CITY_CLAIM, headline: 'AUSTIN IS YOURS', hero: '#1', proof: 'Top city by engagement for 7 consecutive days', accent: 'violet', score: 92, windowLabel: 'Last 7d', createdAt: hoursAgo(2), context: { city: 'Austin', rank: 1 } },
  { id: 'sig_002', bandId: 'band_001', type: SIGNAL_TYPES.MOMENTUM_SURGE, headline: 'MOMENTUM SURGING', hero: '+47%', proof: 'Week-over-week engagement up significantly', accent: 'emerald', score: 88, windowLabel: 'Last 7d', createdAt: hoursAgo(5), context: { delta: 47 } },
  { id: 'sig_003', bandId: 'band_001', type: SIGNAL_TYPES.SHARE_CHAIN, headline: 'SHARE CHAIN ACTIVE', hero: '23', proof: '23 fans shared your link in the last 24h', accent: 'blue', score: 85, windowLabel: 'Last 24h', createdAt: hoursAgo(8), context: { shares: 23 } },
  { id: 'sig_004', bandId: 'band_001', type: SIGNAL_TYPES.RETURNING_FANS, headline: 'FANS COMING BACK', hero: '156', proof: '156 returning visitors this week', accent: 'amber', score: 72, windowLabel: 'Last 7d', createdAt: daysAgo(1), context: { count: 156 } },

  // Band 002 - Velvet Storm (LA) - AFTER SHOW
  { id: 'sig_005', bandId: 'band_002', type: SIGNAL_TYPES.AFTER_SHOW_ENERGY, headline: 'POST-SHOW SPIKE', hero: '+312%', proof: 'Traffic surged after Troubadour show', accent: 'rose', score: 94, windowLabel: 'Last 2h', createdAt: hoursAgo(1), context: { venue: 'Troubadour', city: 'Los Angeles' } },
  { id: 'sig_006', bandId: 'band_002', type: SIGNAL_TYPES.CITY_CLAIM, headline: 'LA LOCKED IN', hero: '#1', proof: 'Dominant in Los Angeles market', accent: 'violet', score: 89, windowLabel: 'Last 7d', createdAt: hoursAgo(4), context: { city: 'Los Angeles', rank: 1 } },
  { id: 'sig_007', bandId: 'band_002', type: SIGNAL_TYPES.PEAK_HOUR, headline: 'PEAK HOUR NOW', hero: '9PM', proof: 'Highest engagement window active', accent: 'blue', score: 86, windowLabel: 'Last 2h', createdAt: hoursAgo(1), context: { hour: 21 } },

  // Band 003 - Nova Heights (Nashville) - MILESTONE
  { id: 'sig_008', bandId: 'band_003', type: SIGNAL_TYPES.MILESTONE_DROP, headline: '10K SCANS REACHED', hero: '10,000', proof: 'Lifetime QR scans milestone achieved', accent: 'amber', score: 78, windowLabel: 'All time', createdAt: hoursAgo(12), context: { milestone: 10000, type: 'scans' } },
  { id: 'sig_009', bandId: 'band_003', type: SIGNAL_TYPES.CITY_CLAIM, headline: 'NASHVILLE STRONGHOLD', hero: '#1', proof: 'Home city dominance continues', accent: 'violet', score: 82, windowLabel: 'Last 7d', createdAt: daysAgo(1), context: { city: 'Nashville', rank: 1 } },
  { id: 'sig_010', bandId: 'band_003', type: SIGNAL_TYPES.PLATFORM_PULL, headline: 'SPOTIFY SURGE', hero: '+89%', proof: 'Spotify click-throughs up this week', accent: 'emerald', score: 76, windowLabel: 'Last 7d', createdAt: daysAgo(2), context: { platform: 'Spotify', delta: 89 } },

  // Band 004 - Desert Mirage (Phoenix) - MODERATE
  { id: 'sig_011', bandId: 'band_004', type: SIGNAL_TYPES.NEW_CITY_UNLOCKED, headline: 'TUCSON UNLOCKED', hero: 'NEW', proof: 'First significant engagement from Tucson', accent: 'blue', score: 68, windowLabel: 'Last 7d', createdAt: daysAgo(2), context: { city: 'Tucson' } },
  { id: 'sig_012', bandId: 'band_004', type: SIGNAL_TYPES.ENGAGED_SESSIONS, headline: 'DEEP ENGAGEMENT', hero: '4:32', proof: 'Average session duration above benchmark', accent: 'emerald', score: 65, windowLabel: 'Last 7d', createdAt: daysAgo(3), context: { avgDuration: '4:32' } },

  // Band 005 - Crystal Waves (Miami) - CITY STACK CANDIDATE
  { id: 'sig_013', bandId: 'band_005', type: SIGNAL_TYPES.CITY_CLAIM, headline: 'AUSTIN BREAKTHROUGH', hero: '#2', proof: 'Rising fast in Austin market', accent: 'violet', score: 79, windowLabel: 'Last 7d', createdAt: hoursAgo(6), context: { city: 'Austin', rank: 2 } },
  { id: 'sig_014', bandId: 'band_005', type: SIGNAL_TYPES.MOMENTUM_SURGE, headline: 'HEATING UP', hero: '+34%', proof: 'Consistent growth trajectory', accent: 'emerald', score: 77, windowLabel: 'Last 7d', createdAt: hoursAgo(18), context: { delta: 34 } },
  { id: 'sig_015', bandId: 'band_005', type: SIGNAL_TYPES.SOURCE_SURGE, headline: 'INSTAGRAM DRIVING', hero: '67%', proof: 'Instagram is primary traffic source', accent: 'rose', score: 71, windowLabel: 'Last 24h', createdAt: daysAgo(1), context: { source: 'Instagram', pct: 67 } },

  // Band 006 - Iron Bloom (Chicago) - HIGH
  { id: 'sig_016', bandId: 'band_006', type: SIGNAL_TYPES.AFTER_SHOW_ENERGY, headline: 'METRO AFTERGLOW', hero: '+278%', proof: 'Post-show engagement from Metro Chicago', accent: 'rose', score: 91, windowLabel: 'Last 2h', createdAt: hoursAgo(3), context: { venue: 'Metro', city: 'Chicago' } },
  { id: 'sig_017', bandId: 'band_006', type: SIGNAL_TYPES.SHARE_CHAIN, headline: 'VIRAL MOMENT', hero: '45', proof: '45 shares in 24 hours - highest ever', accent: 'blue', score: 87, windowLabel: 'Last 24h', createdAt: hoursAgo(6), context: { shares: 45 } },
  { id: 'sig_018', bandId: 'band_006', type: SIGNAL_TYPES.CITY_CLAIM, headline: 'CHICAGO OWNED', hero: '#1', proof: 'Undisputed Chicago leader', accent: 'violet', score: 84, windowLabel: 'Last 7d', createdAt: daysAgo(1), context: { city: 'Chicago', rank: 1 } },

  // Band 007 - Lunar Drift (Portland) - MODERATE
  { id: 'sig_019', bandId: 'band_007', type: SIGNAL_TYPES.RETURNING_FANS, headline: 'LOYAL BASE', hero: '89', proof: '89 fans returned this week', accent: 'amber', score: 63, windowLabel: 'Last 7d', createdAt: daysAgo(2), context: { count: 89 } },
  { id: 'sig_020', bandId: 'band_007', type: SIGNAL_TYPES.ENGAGED_SESSIONS, headline: 'QUALITY TIME', hero: '3:45', proof: 'Above average session length', accent: 'emerald', score: 58, windowLabel: 'Last 7d', createdAt: daysAgo(4), context: { avgDuration: '3:45' } },

  // Band 008 - Static Hearts (Brooklyn) - COOLING
  { id: 'sig_021', bandId: 'band_008', type: SIGNAL_TYPES.PLATFORM_PULL, headline: 'BANDCAMP INTEREST', hero: '+12%', proof: 'Slight uptick in Bandcamp clicks', accent: 'emerald', score: 45, windowLabel: 'Last 7d', createdAt: daysAgo(5), context: { platform: 'Bandcamp', delta: 12 } },
  { id: 'sig_022', bandId: 'band_008', type: SIGNAL_TYPES.NEW_CITY_UNLOCKED, headline: 'PHILLY CURIOUS', hero: 'NEW', proof: 'First visitors from Philadelphia', accent: 'blue', score: 42, windowLabel: 'Last 7d', createdAt: daysAgo(6), context: { city: 'Philadelphia' } },

  // Band 009 - Golden Hour (Denver) - WATCHING
  { id: 'sig_023', bandId: 'band_009', type: SIGNAL_TYPES.CITY_CLAIM, headline: 'DENVER HOME', hero: '#1', proof: 'Strong in home market', accent: 'violet', score: 67, windowLabel: 'Last 7d', createdAt: daysAgo(2), context: { city: 'Denver', rank: 1 } },
  { id: 'sig_024', bandId: 'band_009', type: SIGNAL_TYPES.SOURCE_SURGE, headline: 'TIKTOK TRACTION', hero: '34%', proof: 'TikTok driving new traffic', accent: 'rose', score: 62, windowLabel: 'Last 24h', createdAt: daysAgo(3), context: { source: 'TikTok', pct: 34 } },

  // Band 010 - Neon Prophets (Atlanta) - HIGH
  { id: 'sig_025', bandId: 'band_010', type: SIGNAL_TYPES.MOMENTUM_SURGE, headline: 'EXPLOSIVE GROWTH', hero: '+156%', proof: 'Biggest week in 6 months', accent: 'emerald', score: 95, windowLabel: 'Last 7d', createdAt: hoursAgo(4), context: { delta: 156 } },
  { id: 'sig_026', bandId: 'band_010', type: SIGNAL_TYPES.CITY_CLAIM, headline: 'ATLANTA KINGS', hero: '#1', proof: 'Dominating Atlanta scene', accent: 'violet', score: 90, windowLabel: 'Last 7d', createdAt: hoursAgo(8), context: { city: 'Atlanta', rank: 1 } },
  { id: 'sig_027', bandId: 'band_010', type: SIGNAL_TYPES.PEAK_HOUR, headline: 'PRIME TIME', hero: '8PM', proof: 'Peak engagement window identified', accent: 'blue', score: 83, windowLabel: 'Last 2h', createdAt: hoursAgo(2), context: { hour: 20 } },
  { id: 'sig_028', bandId: 'band_010', type: SIGNAL_TYPES.SHARE_CHAIN, headline: 'SPREADING FAST', hero: '67', proof: 'Record share count', accent: 'blue', score: 88, windowLabel: 'Last 24h', createdAt: hoursAgo(6), context: { shares: 67 } },

  // Band 011 - Ember & Ash (Austin) - CITY STACK CANDIDATE
  { id: 'sig_029', bandId: 'band_011', type: SIGNAL_TYPES.CITY_CLAIM, headline: 'AUSTIN RISING', hero: '#3', proof: 'Breaking into Austin top 3', accent: 'violet', score: 76, windowLabel: 'Last 7d', createdAt: hoursAgo(10), context: { city: 'Austin', rank: 3 } },
  { id: 'sig_030', bandId: 'band_011', type: SIGNAL_TYPES.RETURNING_FANS, headline: 'REPEAT VISITORS', hero: '45', proof: 'Loyal fan base growing', accent: 'amber', score: 54, windowLabel: 'Last 7d', createdAt: daysAgo(3), context: { count: 45 } },

  // Band 012 - Phantom Circuit (Seattle) - MODERATE
  { id: 'sig_031', bandId: 'band_012', type: SIGNAL_TYPES.PLATFORM_PULL, headline: 'SOUNDCLOUD SPIKE', hero: '+45%', proof: 'SoundCloud traffic increasing', accent: 'emerald', score: 69, windowLabel: 'Last 7d', createdAt: daysAgo(1), context: { platform: 'SoundCloud', delta: 45 } },
  { id: 'sig_032', bandId: 'band_012', type: SIGNAL_TYPES.NEW_CITY_UNLOCKED, headline: 'VANCOUVER FOUND', hero: 'NEW', proof: 'Cross-border interest from Vancouver', accent: 'blue', score: 64, windowLabel: 'Last 7d', createdAt: daysAgo(2), context: { city: 'Vancouver' } },
  { id: 'sig_033', bandId: 'band_012', type: SIGNAL_TYPES.ENGAGED_SESSIONS, headline: 'DEEP DIVES', hero: '5:12', proof: 'Exceptional session duration', accent: 'emerald', score: 71, windowLabel: 'Last 7d', createdAt: daysAgo(3), context: { avgDuration: '5:12' } },

  // Band 013 - Wildfire Saints (Nashville) - COOLING
  { id: 'sig_034', bandId: 'band_013', type: SIGNAL_TYPES.CITY_CLAIM, headline: 'NASHVILLE PRESENCE', hero: '#4', proof: 'Holding position in Nashville', accent: 'violet', score: 48, windowLabel: 'Last 7d', createdAt: daysAgo(4), context: { city: 'Nashville', rank: 4 } },
  { id: 'sig_035', bandId: 'band_013', type: SIGNAL_TYPES.SOURCE_SURGE, headline: 'FACEBOOK TRAFFIC', hero: '28%', proof: 'Facebook driving some visits', accent: 'rose', score: 41, windowLabel: 'Last 24h', createdAt: daysAgo(5), context: { source: 'Facebook', pct: 28 } },

  // Band 014 - Skyline Theory (SF) - WATCHING
  { id: 'sig_036', bandId: 'band_014', type: SIGNAL_TYPES.MILESTONE_DROP, headline: '5K MILESTONE', hero: '5,000', proof: 'Reached 5,000 total scans', accent: 'amber', score: 66, windowLabel: 'All time', createdAt: daysAgo(2), context: { milestone: 5000, type: 'scans' } },
  { id: 'sig_037', bandId: 'band_014', type: SIGNAL_TYPES.CITY_CLAIM, headline: 'SF STEADY', hero: '#2', proof: 'Consistent SF presence', accent: 'violet', score: 61, windowLabel: 'Last 7d', createdAt: daysAgo(3), context: { city: 'San Francisco', rank: 2 } },

  // Band 015 - Black Orchid (LA) - HIGH
  { id: 'sig_038', bandId: 'band_015', type: SIGNAL_TYPES.CITY_CLAIM, headline: 'LA CONTENDER', hero: '#2', proof: 'Rising in competitive LA market', accent: 'violet', score: 81, windowLabel: 'Last 7d', createdAt: hoursAgo(12), context: { city: 'Los Angeles', rank: 2 } },
  { id: 'sig_039', bandId: 'band_015', type: SIGNAL_TYPES.MOMENTUM_SURGE, headline: 'BUILDING HEAT', hero: '+28%', proof: 'Steady upward trajectory', accent: 'emerald', score: 75, windowLabel: 'Last 7d', createdAt: daysAgo(1), context: { delta: 28 } },
  { id: 'sig_040', bandId: 'band_015', type: SIGNAL_TYPES.RETURNING_FANS, headline: 'FAN LOYALTY', hero: '234', proof: 'Strong returning visitor count', accent: 'amber', score: 73, windowLabel: 'Last 7d', createdAt: daysAgo(2), context: { count: 234 } },

  // Band 016 - Rust & Ruin (Memphis) - COOLING
  { id: 'sig_041', bandId: 'band_016', type: SIGNAL_TYPES.CITY_CLAIM, headline: 'MEMPHIS BASE', hero: '#1', proof: 'Home city loyal', accent: 'violet', score: 52, windowLabel: 'Last 7d', createdAt: daysAgo(4), context: { city: 'Memphis', rank: 1 } },
  { id: 'sig_042', bandId: 'band_016', type: SIGNAL_TYPES.ENGAGED_SESSIONS, headline: 'DECENT TIME', hero: '2:45', proof: 'Average session length', accent: 'emerald', score: 44, windowLabel: 'Last 7d', createdAt: daysAgo(6), context: { avgDuration: '2:45' } },

  // Band 017 - Prism Effect (Austin) - CITY STACK CANDIDATE
  { id: 'sig_043', bandId: 'band_017', type: SIGNAL_TYPES.CITY_CLAIM, headline: 'AUSTIN PLAYER', hero: '#4', proof: 'Part of Austin scene', accent: 'violet', score: 78, windowLabel: 'Last 7d', createdAt: hoursAgo(14), context: { city: 'Austin', rank: 4 } },
  { id: 'sig_044', bandId: 'band_017', type: SIGNAL_TYPES.PEAK_HOUR, headline: 'LATE NIGHT PEAK', hero: '11PM', proof: 'Late night audience active', accent: 'blue', score: 72, windowLabel: 'Last 2h', createdAt: hoursAgo(3), context: { hour: 23 } },
  { id: 'sig_045', bandId: 'band_017', type: SIGNAL_TYPES.SHARE_CHAIN, headline: 'WORD SPREADING', hero: '18', proof: '18 shares this week', accent: 'blue', score: 68, windowLabel: 'Last 7d', createdAt: daysAgo(1), context: { shares: 18 } },

  // Band 018 - Silver Tongue (New Orleans) - COOLING
  { id: 'sig_046', bandId: 'band_018', type: SIGNAL_TYPES.CITY_CLAIM, headline: 'NOLA NATIVE', hero: '#1', proof: 'New Orleans stronghold', accent: 'violet', score: 49, windowLabel: 'Last 7d', createdAt: daysAgo(5), context: { city: 'New Orleans', rank: 1 } },
  { id: 'sig_047', bandId: 'band_018', type: SIGNAL_TYPES.PLATFORM_PULL, headline: 'YOUTUBE VIEWS', hero: '+8%', proof: 'Slight YouTube increase', accent: 'emerald', score: 38, windowLabel: 'Last 7d', createdAt: daysAgo(7), context: { platform: 'YouTube', delta: 8 } },

  // Band 019 - Voltage Kids (Philly) - MODERATE
  { id: 'sig_048', bandId: 'band_019', type: SIGNAL_TYPES.NEW_CITY_UNLOCKED, headline: 'NYC CURIOUS', hero: 'NEW', proof: 'New York showing interest', accent: 'blue', score: 70, windowLabel: 'Last 7d', createdAt: daysAgo(1), context: { city: 'New York' } },
  { id: 'sig_049', bandId: 'band_019', type: SIGNAL_TYPES.MOMENTUM_SURGE, headline: 'PICKING UP', hero: '+22%', proof: 'Momentum building', accent: 'emerald', score: 67, windowLabel: 'Last 7d', createdAt: daysAgo(2), context: { delta: 22 } },
  { id: 'sig_050', bandId: 'band_019', type: SIGNAL_TYPES.CITY_CLAIM, headline: 'PHILLY PRIDE', hero: '#1', proof: 'Philadelphia locked down', accent: 'violet', score: 74, windowLabel: 'Last 7d', createdAt: daysAgo(3), context: { city: 'Philadelphia', rank: 1 } },

  // Band 020 - Hollow Sun (Minneapolis) - WATCHING
  { id: 'sig_051', bandId: 'band_020', type: SIGNAL_TYPES.CITY_CLAIM, headline: 'MPLS HOME', hero: '#1', proof: 'Minneapolis base solid', accent: 'violet', score: 59, windowLabel: 'Last 7d', createdAt: daysAgo(3), context: { city: 'Minneapolis', rank: 1 } },
  { id: 'sig_052', bandId: 'band_020', type: SIGNAL_TYPES.RETURNING_FANS, headline: 'CORE FANS', hero: '67', proof: '67 returning this week', accent: 'amber', score: 55, windowLabel: 'Last 7d', createdAt: daysAgo(4), context: { count: 67 } }
]

// Playbook definitions
export const playbooks = {
  CITY_CLAIM: {
    id: 'pb_city_claim',
    name: 'City Claim Activation',
    description: 'Capitalize on city dominance with targeted local push',
    steps: ['Schedule local show or appearance', 'Partner with local venues/blogs', 'Geo-targeted social campaign', 'Local press outreach']
  },
  AFTER_SHOW_ENERGY: {
    id: 'pb_after_show',
    name: 'After-Show Conversion',
    description: 'Convert post-show energy into lasting engagement',
    steps: ['Push merch/music links within 2 hours', 'Share show photos/videos', 'Email list capture push', 'Thank you post with CTA']
  },
  SHARE_CHAIN: {
    id: 'pb_share_chain',
    name: 'Share Chain Amplifier',
    description: 'Amplify organic sharing momentum',
    steps: ['Identify top sharers', 'Create shareable content', 'Incentivize sharing', 'Track share sources']
  },
  RETURNING_FANS: {
    id: 'pb_returning',
    name: 'Returning Fans Conversion',
    description: 'Convert loyal visitors into superfans',
    steps: ['Exclusive content offer', 'Email list push', 'Membership/Patreon pitch', 'Direct engagement']
  },
  PLATFORM_PULL: {
    id: 'pb_platform',
    name: 'Platform Pull Reinforcement',
    description: 'Double down on performing platform',
    steps: ['Increase posting frequency', 'Platform-specific content', 'Cross-promote to platform', 'Analyze what works']
  },
  MOMENTUM_SURGE: {
    id: 'pb_momentum',
    name: 'Momentum Surge Capture',
    description: 'Ride the wave of growing engagement',
    steps: ['Release new content', 'Increase ad spend', 'Book shows', 'Press outreach']
  }
}

// Helper to get playbook by signal type
export function getPlaybookForSignalType(signalType) {
  const mapping = {
    [SIGNAL_TYPES.CITY_CLAIM]: playbooks.CITY_CLAIM,
    [SIGNAL_TYPES.AFTER_SHOW_ENERGY]: playbooks.AFTER_SHOW_ENERGY,
    [SIGNAL_TYPES.SHARE_CHAIN]: playbooks.SHARE_CHAIN,
    [SIGNAL_TYPES.RETURNING_FANS]: playbooks.RETURNING_FANS,
    [SIGNAL_TYPES.PLATFORM_PULL]: playbooks.PLATFORM_PULL,
    [SIGNAL_TYPES.MOMENTUM_SURGE]: playbooks.MOMENTUM_SURGE,
    [SIGNAL_TYPES.PEAK_HOUR]: playbooks.MOMENTUM_SURGE,
    [SIGNAL_TYPES.NEW_CITY_UNLOCKED]: playbooks.CITY_CLAIM,
    [SIGNAL_TYPES.ENGAGED_SESSIONS]: playbooks.RETURNING_FANS,
    [SIGNAL_TYPES.SOURCE_SURGE]: playbooks.PLATFORM_PULL,
    [SIGNAL_TYPES.MILESTONE_DROP]: playbooks.MOMENTUM_SURGE
  }
  return mapping[signalType] || playbooks.MOMENTUM_SURGE
}

// Triage bucket logic - V1.1 updated to include PLATFORM_PULL
export function getTriageBucket(signal) {
  const actionTypes = [
    SIGNAL_TYPES.MOMENTUM_SURGE,
    SIGNAL_TYPES.AFTER_SHOW_ENERGY,
    SIGNAL_TYPES.CITY_CLAIM,
    SIGNAL_TYPES.SHARE_CHAIN,
    SIGNAL_TYPES.PEAK_HOUR,
    SIGNAL_TYPES.PLATFORM_PULL
  ]
  
  if (signal.score >= 85 && actionTypes.includes(signal.type)) {
    return 'needsAction'
  }
  if (signal.score >= 75) {
    return 'heatingUp'
  }
  if (signal.score >= 55) {
    return 'watching'
  }
  return 'cooling'
}

// Get momentum state from top signal (legacy - use getMomentumStateFromVelocity for V1.1)
export function getMomentumState(score) {
  if (score >= 85) return 'surging'
  if (score >= 70) return 'warming'
  if (score >= 55) return 'steady'
  return 'cooling'
}

// V1.1: Get momentum state from velocity
export function getMomentumStateFromVelocity(velocity7d, index) {
  if (velocity7d >= 12 || index >= 85) return 'surging'
  if (velocity7d >= 5) return 'warming'
  if (velocity7d >= -4) return 'steady'
  return 'cooling'
}

// V1.1: Signal suppression windows (hours)
export const SIGNAL_SUPPRESSION_HOURS = {
  [SIGNAL_TYPES.CITY_CLAIM]: 24,
  [SIGNAL_TYPES.MOMENTUM_SURGE]: 24,
  [SIGNAL_TYPES.AFTER_SHOW_ENERGY]: 12,
  [SIGNAL_TYPES.SHARE_CHAIN]: 24,
  [SIGNAL_TYPES.PEAK_HOUR]: 12,
  [SIGNAL_TYPES.PLATFORM_PULL]: 24,
  default: 24
}

// V1.1: Get confidence label from score
export function getConfidenceLabel(score) {
  if (score >= 85) return 'strong'
  if (score >= 70) return 'moderate'
  return 'early'
}

// V1.1: Cities for city stack scenarios
const STACK_CITIES = ['Austin', 'Los Angeles', 'Nashville', 'Chicago', 'Atlanta']

// V1.1: Generate 30 days of daily metrics for a band
function generateBandDailyMetrics(bandId, bandConfig) {
  const metrics = []
  const today = new Date()
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateISO = date.toISOString().split('T')[0]
    
    // Base values with some randomness based on band tier/activity
    const baseMultiplier = bandConfig.baseMultiplier || 1
    const trend = bandConfig.trend || 0 // positive = growing, negative = declining
    const trendFactor = 1 + (trend * (29 - i) / 100)
    
    // Add weekly pattern (weekends higher)
    const dayOfWeek = date.getDay()
    const weekendBoost = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.3 : 1
    
    // Random daily variance
    const variance = 0.7 + Math.random() * 0.6
    
    const multiplier = baseMultiplier * trendFactor * weekendBoost * variance
    
    // Check if this is an after-show day
    const isAfterShow = bandConfig.showDays?.includes(i)
    const showBoost = isAfterShow ? 2.5 : 1
    
    const sessions = Math.round(150 * multiplier * showBoost)
    const qrScans = Math.round(40 * multiplier * showBoost)
    const linkClicks = Math.round(90 * multiplier * showBoost)
    const engagedSessions = Math.round(50 * multiplier * showBoost)
    const returningFans = Math.round(25 * multiplier)
    const shares = Math.round(15 * multiplier * (isAfterShow ? 1.8 : 1))
    const paymentsCount = Math.round(3 * multiplier * (isAfterShow ? 2 : 1))
    
    // Platform clicks with variety
    const platformClicks = {
      spotify: Math.round(35 * multiplier * (bandConfig.spotifyWeight || 1)),
      youtube: Math.round(20 * multiplier * (bandConfig.youtubeWeight || 1)),
      tickets: Math.round(15 * multiplier * (isAfterShow ? 0.5 : 1)),
      instagram: Math.round(25 * multiplier * (bandConfig.instagramWeight || 1))
    }
    
    // Top city - use stack city if configured, otherwise home city
    const topCity = bandConfig.stackCity && i < 14 
      ? { city: bandConfig.stackCity, region: bandConfig.stackRegion || 'TX', country: 'US' }
      : { city: bandConfig.homeCity, region: bandConfig.homeRegion || 'TX', country: 'US' }
    
    metrics.push({
      dateISO,
      sessions,
      qrScans,
      linkClicks,
      engagedSessions,
      returningFans,
      shares,
      paymentsCount,
      platformClicks,
      topCity,
      isAfterShow: isAfterShow || false
    })
  }
  
  return metrics
}

// V1.1: Band configurations for metric generation
const bandConfigs = {
  band_001: { baseMultiplier: 2.2, trend: 15, homeCity: 'Austin', homeRegion: 'TX', stackCity: 'Austin', stackRegion: 'TX', showDays: [3, 10], spotifyWeight: 1.5 },
  band_002: { baseMultiplier: 2.0, trend: 8, homeCity: 'Los Angeles', homeRegion: 'CA', stackCity: 'Los Angeles', stackRegion: 'CA', showDays: [1, 7], instagramWeight: 1.8 },
  band_003: { baseMultiplier: 1.8, trend: 5, homeCity: 'Nashville', homeRegion: 'TN', stackCity: 'Nashville', stackRegion: 'TN', showDays: [5], spotifyWeight: 1.3 },
  band_004: { baseMultiplier: 1.2, trend: 2, homeCity: 'Phoenix', homeRegion: 'AZ', showDays: [], youtubeWeight: 1.4 },
  band_005: { baseMultiplier: 1.4, trend: 10, homeCity: 'Miami', homeRegion: 'FL', stackCity: 'Austin', stackRegion: 'TX', showDays: [8], instagramWeight: 1.6 },
  band_006: { baseMultiplier: 2.1, trend: 12, homeCity: 'Chicago', homeRegion: 'IL', stackCity: 'Chicago', stackRegion: 'IL', showDays: [2, 9], spotifyWeight: 1.2 },
  band_007: { baseMultiplier: 1.0, trend: -2, homeCity: 'Portland', homeRegion: 'OR', showDays: [], youtubeWeight: 1.3 },
  band_008: { baseMultiplier: 0.7, trend: -8, homeCity: 'Brooklyn', homeRegion: 'NY', showDays: [], instagramWeight: 1.1 },
  band_009: { baseMultiplier: 1.1, trend: 0, homeCity: 'Denver', homeRegion: 'CO', showDays: [12], spotifyWeight: 1.1 },
  band_010: { baseMultiplier: 2.5, trend: 20, homeCity: 'Atlanta', homeRegion: 'GA', stackCity: 'Atlanta', stackRegion: 'GA', showDays: [4, 11], instagramWeight: 2.0 },
  band_011: { baseMultiplier: 0.9, trend: 8, homeCity: 'Austin', homeRegion: 'TX', stackCity: 'Austin', stackRegion: 'TX', showDays: [], spotifyWeight: 0.9 },
  band_012: { baseMultiplier: 1.3, trend: 3, homeCity: 'Seattle', homeRegion: 'WA', showDays: [6], youtubeWeight: 1.5 },
  band_013: { baseMultiplier: 0.6, trend: -5, homeCity: 'Nashville', homeRegion: 'TN', stackCity: 'Nashville', stackRegion: 'TN', showDays: [], spotifyWeight: 1.0 },
  band_014: { baseMultiplier: 1.1, trend: 1, homeCity: 'San Francisco', homeRegion: 'CA', showDays: [], instagramWeight: 1.2 },
  band_015: { baseMultiplier: 1.7, trend: 6, homeCity: 'Los Angeles', homeRegion: 'CA', stackCity: 'Los Angeles', stackRegion: 'CA', showDays: [13], instagramWeight: 1.7 },
  band_016: { baseMultiplier: 0.5, trend: -10, homeCity: 'Memphis', homeRegion: 'TN', showDays: [], youtubeWeight: 1.2 },
  band_017: { baseMultiplier: 1.4, trend: 7, homeCity: 'Austin', homeRegion: 'TX', stackCity: 'Austin', stackRegion: 'TX', showDays: [3], spotifyWeight: 1.4 },
  band_018: { baseMultiplier: 0.6, trend: -6, homeCity: 'New Orleans', homeRegion: 'LA', showDays: [], youtubeWeight: 1.1 },
  band_019: { baseMultiplier: 1.2, trend: 4, homeCity: 'Philadelphia', homeRegion: 'PA', showDays: [7], instagramWeight: 1.3 },
  band_020: { baseMultiplier: 0.8, trend: -3, homeCity: 'Minneapolis', homeRegion: 'MN', showDays: [], spotifyWeight: 1.0 }
}

// V1.1: Generate bandDailyMetrics for all bands
export const bandDailyMetrics = {}
mockRosterBands.forEach(band => {
  const config = bandConfigs[band.bandId] || { baseMultiplier: 1, trend: 0, homeCity: band.homeCity, homeRegion: 'XX' }
  bandDailyMetrics[band.bandId] = generateBandDailyMetrics(band.bandId, config)
})

// V1.1: Momentum Index scoring caps
export const MOMENTUM_CAPS = {
  sessions: 2000,
  qrScans: 500,
  linkClicks: 1200,
  engagedSessions: 600,
  returningFans: 250,
  shares: 200,
  paymentsCount: 50
}

// V1.1: Momentum Index weights
export const MOMENTUM_WEIGHTS = {
  sessions: 0.20,
  qrScans: 0.15,
  linkClicks: 0.20,
  engagedSessions: 0.15,
  returningFans: 0.10,
  shares: 0.10,
  paymentsCount: 0.10
}

// V1.1: Calculate normalized value with log scaling
export function normalizeMetric(value, cap) {
  return Math.min(1, Math.log10(1 + value) / Math.log10(1 + cap))
}

// V1.1: Calculate Momentum Index for a single day's metrics
export function calculateMomentumIndex(dayMetrics) {
  if (!dayMetrics) return 0
  
  const normalized = {
    sessions: normalizeMetric(dayMetrics.sessions || 0, MOMENTUM_CAPS.sessions),
    qrScans: normalizeMetric(dayMetrics.qrScans || 0, MOMENTUM_CAPS.qrScans),
    linkClicks: normalizeMetric(dayMetrics.linkClicks || 0, MOMENTUM_CAPS.linkClicks),
    engagedSessions: normalizeMetric(dayMetrics.engagedSessions || 0, MOMENTUM_CAPS.engagedSessions),
    returningFans: normalizeMetric(dayMetrics.returningFans || 0, MOMENTUM_CAPS.returningFans),
    shares: normalizeMetric(dayMetrics.shares || 0, MOMENTUM_CAPS.shares),
    paymentsCount: normalizeMetric(dayMetrics.paymentsCount || 0, MOMENTUM_CAPS.paymentsCount)
  }
  
  const weightedSum = 
    normalized.sessions * MOMENTUM_WEIGHTS.sessions +
    normalized.qrScans * MOMENTUM_WEIGHTS.qrScans +
    normalized.linkClicks * MOMENTUM_WEIGHTS.linkClicks +
    normalized.engagedSessions * MOMENTUM_WEIGHTS.engagedSessions +
    normalized.returningFans * MOMENTUM_WEIGHTS.returningFans +
    normalized.shares * MOMENTUM_WEIGHTS.shares +
    normalized.paymentsCount * MOMENTUM_WEIGHTS.paymentsCount
  
  return Math.round(100 * weightedSum)
}

export default {
  mockOrg,
  mockMembers,
  mockRosterBands,
  mockSignals,
  playbooks,
  SIGNAL_TYPES,
  SIGNAL_ACCENTS,
  SIGNAL_SUPPRESSION_HOURS,
  MOMENTUM_CAPS,
  MOMENTUM_WEIGHTS,
  bandDailyMetrics,
  getPlaybookForSignalType,
  getTriageBucket,
  getMomentumState,
  getMomentumStateFromVelocity,
  getConfidenceLabel,
  normalizeMetric,
  calculateMomentumIndex
}
