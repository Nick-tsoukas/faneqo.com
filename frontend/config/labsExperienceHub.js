/**
 * Internal Labs experience hub catalog.
 * Links only — no new product surfaces.
 */

export const labsHubSections = [
  {
    id: 'memories',
    kicker: 'Memories',
    items: [
      {
        name: 'Living Gallery',
        blurb: 'Photographic afterlife of a Night. Living Gallery + Enter the Night.',
        status: 'lab',
        statusLabel: 'Experience lab',
        note: 'Isolated from production Gallery. Seven-photograph fixture.',
        actions: [
          { to: '/labs/gallery-experience', label: 'Open' },
          { to: '/__dev/gallery-experience', label: 'Local fixture', local: true },
        ],
      },
      {
        name: 'Elite Gallery',
        blurb: 'Shared editorial media presentation.',
        status: 'ready',
        statusLabel: 'Ready',
        actions: [
          { to: '/labs/gallery', label: 'Open' },
          { to: '/__dev/gallery', label: 'Local fixture', local: true },
        ],
      },
      {
        name: 'Night Story',
        blurb: 'A show memory visible to the people who were there.',
        status: 'ready',
        statusLabel: 'Ready',
        actions: [
          { to: '/labs/night-story', label: 'Open' },
          { to: '/__dev/night-story', label: 'Local fixture', local: true },
        ],
      },
      {
        name: 'Night Recordings',
        blurb: 'FROM THE STAGE on Public Night. Artist Recap add/edit.',
        status: 'ready',
        statusLabel: 'Ready',
        note: 'Lab is a fixture harness. Real routes are Public Night and Show Recap.',
        actions: [
          { to: '/labs/night-recordings', label: 'Open' },
          { to: '/__dev/night-recordings', label: 'Local fixture', local: true },
        ],
      },
      {
        name: 'Share Photos From Tonight',
        blurb: 'Artist flow from Show Recap into attendee-only memory.',
        status: 'ready',
        statusLabel: 'Ready',
        note: 'The fixture opens immediately. The real composer needs a Show Recap id — without one it stays closed. No fake recaps.',
        actions: [
          { to: '/labs/share-photos-lab', label: 'Open fixture' },
          { to: '/labs/share-photos', label: 'Open real flow' },
          { to: '/__dev/share-photos', label: 'Local fixture', local: true },
        ],
      },
    ],
  },
  {
    id: 'messaging',
    kicker: 'Messaging',
    items: [
      {
        name: 'Messaging Home',
        blurb: 'Inbox, thread, and composer — All fans, Night, and private.',
        status: 'ready',
        statusLabel: 'Ready',
        actions: [
          { to: '/__dev/messages', label: 'Local fixture', local: true },
        ],
      },
      {
        name: 'DM Media',
        blurb: 'Private conversational image attachments.',
        status: 'ready',
        statusLabel: 'Ready',
        actions: [
          { to: '/labs/dm-media', label: 'Open' },
          { to: '/__dev/dm-media', label: 'Local fixture', local: true },
        ],
      },
    ],
  },
  {
    id: 'relationship',
    kicker: 'Relationship',
    items: [
      {
        name: 'Artist × Fan',
        blurb: 'Relationship history, Moments, and Milestones.',
        status: 'ready',
        statusLabel: 'Ready',
        note: 'Badflower × Sarah fixtures load immediately. Live data uses the band and fan picker on that page — nothing is hardcoded.',
        actions: [
          { to: '/labs/relationship', label: 'Open' },
          { to: '/__dev/relationship', label: 'Local fixture', local: true },
        ],
      },
      {
        name: 'Moments',
        blurb: 'Sparse history index — proven inside Artist × Fan, not as its own product.',
        status: 'inspector',
        statusLabel: 'Pointer',
        actions: [{ to: '/labs/moments', label: 'Open note' }],
      },
      {
        name: 'Relationship Events',
        blurb: 'Internal ledger inspector. Not artist product UI.',
        status: 'inspector',
        statusLabel: 'Inspector',
        note: 'Needs a band and fan you select there.',
        actions: [{ to: '/labs/relationships', label: 'Open inspector' }],
      },
    ],
  },
  {
    id: 'future',
    kicker: 'Passport and next',
    items: [
      {
        name: 'Passport',
        blurb: 'Artist relationship universe and music memory journal.',
        status: 'ready',
        statusLabel: 'Relationship journal',
        note: 'Labs reuse production Passport components. Real route /fan/passport is source of truth.',
        actions: [
          { to: '/labs/passport', label: 'Open Labs' },
          { to: '/__dev/passport', label: 'Local fixture', local: true },
          { to: '/fan/passport', label: 'Open fan experience' },
        ],
      },
      {
        name: 'Signals',
        blurb: 'Artist intelligence observations. Not started.',
        status: 'not-built',
        statusLabel: 'Not built yet — Phase 08',
        actions: [{ to: '/labs/signals', label: 'Placeholder' }],
      },
      {
        name: 'Share Studio',
        blurb: 'Share compositions and snapshots. Not started.',
        status: 'not-built',
        statusLabel: 'Not built yet',
        actions: [{ to: '/labs/share-studio', label: 'Placeholder' }],
      },
    ],
  },
]

export const labsHubEngineering = [
  { name: 'Data integrity', blurb: 'Read-only uniqueness inspector.', to: '/labs/data' },
  { name: 'External intelligence', blurb: 'Feature key only. No ingestion.', to: '/labs/external' },
]
