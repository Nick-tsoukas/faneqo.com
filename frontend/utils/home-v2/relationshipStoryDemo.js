/**
 * Home V2 relationship story — copy, identity, order, timing.
 * Edit here. Do not bury story decisions in ScrollTrigger.
 * Presentation only — no live check-in, email, or message APIs.
 */

export const HOME_V2_STORY_DEMO = {
  artist: {
    name: 'BADFLOWER',
    city: 'Nashville',
    when: 'Tonight',
    venueLine: 'You’re at the show.',
    hereLine: 'You’re here.',
  },
  fanCountBefore: 128,
  fanCountAfter: 129,
  fan: {
    initials: 'SM',
    name: 'Sarah M.',
    city: 'Nashville',
    shows: 1,
    showsLabel: '1 show',
    joinedLabel: 'Joined tonight',
  },
  neighbors: [
    { initials: 'JK', name: 'James K.', city: 'Chicago', showsLabel: '3 shows', joinedLabel: 'Last week' },
    { initials: 'MR', name: 'Maya R.', city: 'Nashville', showsLabel: '2 shows', joinedLabel: 'Yesterday' },
    { initials: 'CD', name: 'Chris D.', city: 'Austin', showsLabel: '1 show', joinedLabel: '2 days ago' },
  ],
  email: {
    kicker: 'Email your fans',
    to: 'All fans · 129',
    subject: 'Thanks for coming out Nashville 🤘',
    body: 'Last night was incredible. Thank you for being in the room.',
    send: 'Send.',
    sending: 'Sending…',
    sent: 'Sent to 129 fans',
  },
  talk: {
    kicker: 'New message request',
    quote: 'That show was incredible. Are you coming back this fall?',
    accept: 'Accept',
    decline: 'Decline',
    artistReply: 'October 🤘 We’ll announce it soon.',
    sarahReply: 'I’m there.',
  },
  remember: {
    caption: 'Here are a few from last night.',
    photos: [
      { id: 'moondough', src: 'https://qrcode101.s3.us-east-1.amazonaws.com/moondoug_6829e46a19.jpg', pos: '50% 38%' },
      { id: 'emerge', src: 'https://qrcode101.s3.us-east-1.amazonaws.com/61651_7df7eb9bab.png', pos: '50% 32%' },
      { id: 'andydarling', src: 'https://qrcode101.s3.us-east-1.amazonaws.com/andydarling_7d4caf6ff2.webp', pos: '48% 22%' },
      { id: 'shannon', src: 'https://qrcode101.s3.us-east-1.amazonaws.com/a3f241_692a27b6b7f54cc99d9668ba78417271_mv2_e1e00ed0ca.jpg', pos: '50% 18%' },
    ],
  },
  ending: {
    line1: 'The show ended.',
    line2: 'The connection didn’t.',
  },
  copy: {
    show: { kicker: 'At the show', title: 'Someone shows up.' },
    keep: { title: 'Keep them.', line: 'Don’t lose them when the show ends.' },
    reach: { title: 'Reach them tomorrow.' },
    talk: { title: 'And they can', rest: 'talk back.' },
  },
}

export const HOME_V2_STORY_SCENES = [
  { id: 'show', hold: 1 },
  { id: 'keep', hold: 1 },
  { id: 'reach', hold: 1 },
  { id: 'talk', hold: 1 },
  { id: 'remember', hold: 1 },
]

/** Viewport-enter motion. No pin. No scrub. */
export const HOME_V2_STORY_MOTION = {
  start: 'top 76%',
  duration: 0.62,
  ease: 'power2.out',
}

/** Quick-edit alias for copy, identity, and scene order. */
export const homeV2Story = {
  fan: HOME_V2_STORY_DEMO.fan,
  email: HOME_V2_STORY_DEMO.email,
  request: { text: HOME_V2_STORY_DEMO.talk.quote },
  direct: {
    artist: HOME_V2_STORY_DEMO.talk.artistReply,
    fan: HOME_V2_STORY_DEMO.talk.sarahReply,
  },
  copy: HOME_V2_STORY_DEMO.copy,
  ending: HOME_V2_STORY_DEMO.ending,
  photos: HOME_V2_STORY_DEMO.remember.photos,
  scenes: HOME_V2_STORY_SCENES.map((scene) => scene.id),
  motion: HOME_V2_STORY_MOTION,
}

/** @deprecated Progress tabs are gone. Kept so older imports don't crash. */
export const HOME_V2_STORY_CHAPTERS = ['CHECK IN', 'KEEP', 'REACH', 'TALK', 'REMEMBER']
