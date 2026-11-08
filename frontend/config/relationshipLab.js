/**
 * Relationship Labs fixtures. Presentation-only.
 * No fifth_show milestone. No Passport. Not live API data.
 */

import { galleryLabItems } from '~/config/galleryLab'

export const RELATIONSHIP_LAB_WIDTHS = [390, 430, 1280]

function night({ id, sourceId, city, venue, date, occurredAt, photoCount = 0 }) {
  return {
    id,
    kind: 'show',
    occurredAt,
    sourceId,
    showContext: { city, venue, date },
    hasNightStory: photoCount > 0,
    artistUpdates: photoCount
      ? [{ id: `u-${id}`, locked: false, hasMedia: true, media: galleryLabItems(photoCount) }]
      : [],
  }
}

function milestone({ id, type, occurredAt, value, evidence }) {
  return { id, type, status: 'active', occurredAt, value, evidence }
}

const nashville = night({
  id: 'nash',
  sourceId: '1',
  city: 'Nashville',
  venue: 'The Basement East',
  date: '2025-10-18',
  occurredAt: '2025-10-19T02:00:00.000Z',
  photoCount: 3,
})

const knoxville = night({
  id: 'knox',
  sourceId: '2',
  city: 'Knoxville',
  venue: 'The Mill & Mine',
  date: '2025-12-05',
  occurredAt: '2025-12-06T03:00:00.000Z',
  photoCount: 0,
})

const firstShow = milestone({
  id: 'ms-first',
  type: 'fan_artist.first_show',
  occurredAt: nashville.occurredAt,
  value: 1,
  evidence: { attendanceId: '1' },
})

const firstReply = milestone({
  id: 'ms-reply',
  type: 'fan_artist.first_reply',
  occurredAt: '2025-11-12T00:00:00.000Z',
  value: 1,
  evidence: { relationshipEventId: '8' },
})

const secondShow = milestone({
  id: 'ms-return',
  type: 'fan_artist.second_show',
  occurredAt: knoxville.occurredAt,
  value: 2,
  evidence: { attendanceId: '2', priorAttendanceId: '1', ordinal: 2 },
})

const base = {
  artistName: 'Badflower',
  fanName: 'Sarah',
  joinedAt: '2025-06-01T00:00:00.000Z',
}

export const relationshipLabCases = {
  zero: {
    key: 'zero',
    title: '0 shows',
    note: 'Joined. No nights yet. Meaningful minimum before attendance.',
    story: {
      ...base,
      shows: { count: 0, returning: false },
      communication: {},
      moments: [],
      milestones: [],
    },
  },
  one: {
    key: 'one',
    title: '1 show',
    note: 'Nashville only. IT STARTED HERE. No return required.',
    story: {
      ...base,
      shows: { count: 1, returning: false },
      communication: {},
      moments: [nashville],
      milestones: [firstShow],
    },
  },
  thesis: {
    key: 'thesis',
    title: '2 shows · return hero',
    note: 'Nashville has photography. Knoxville is the return. Primary acceptance.',
    story: {
      ...base,
      shows: { count: 2, returning: true },
      communication: {
        artistMessagesSent: 1,
        fanReplies: 1,
        lastReplyAt: firstReply.occurredAt,
      },
      moments: [nashville, knoxville],
      milestones: [firstShow, firstReply, secondShow],
    },
  },
  nophoto: {
    key: 'nophoto',
    title: '2 shows · no photos',
    note: 'Place, date, and meaning have to carry the story.',
    story: {
      ...base,
      shows: { count: 2, returning: true },
      communication: {
        artistMessagesSent: 1,
        fanReplies: 1,
        lastReplyAt: firstReply.occurredAt,
      },
      moments: [
        { ...nashville, hasNightStory: false, artistUpdates: [] },
        knoxville,
      ],
      milestones: [firstShow, firstReply, secondShow],
    },
  },
  photorich: {
    key: 'photorich',
    title: '2 shows · both nights photographed',
    note: 'Same truth as thesis, with Knoxville photography too.',
    story: {
      ...base,
      shows: { count: 2, returning: true },
      communication: {
        artistMessagesSent: 1,
        fanReplies: 1,
        lastReplyAt: firstReply.occurredAt,
      },
      moments: [
        nashville,
        night({
          id: 'knox-photo',
          sourceId: '2',
          city: 'Knoxville',
          venue: 'The Mill & Mine',
          date: '2025-12-05',
          occurredAt: knoxville.occurredAt,
          photoCount: 4,
        }),
      ],
      milestones: [firstShow, firstReply, secondShow],
    },
  },
  five: {
    key: 'five',
    title: '5 shows',
    note: 'Layout observation only. No fifth_show milestone.',
    story: {
      ...base,
      shows: { count: 5, returning: true },
      communication: {
        artistMessagesSent: 1,
        fanReplies: 1,
        lastReplyAt: firstReply.occurredAt,
      },
      moments: [
        nashville,
        knoxville,
        night({
          id: 'atl',
          sourceId: '3',
          city: 'Atlanta',
          venue: 'The Tabernacle',
          date: '2026-02-20',
          occurredAt: '2026-02-21T03:00:00.000Z',
          photoCount: 0,
        }),
        night({
          id: 'chi',
          sourceId: '4',
          city: 'Chicago',
          venue: 'Metro',
          date: '2026-04-11',
          occurredAt: '2026-04-12T03:00:00.000Z',
          photoCount: 2,
        }),
        night({
          id: 'den',
          sourceId: '5',
          city: 'Denver',
          venue: 'Ogden Theatre',
          date: '2026-06-03',
          occurredAt: '2026-06-04T03:00:00.000Z',
          photoCount: 0,
        }),
      ],
      milestones: [firstShow, firstReply, secondShow],
    },
  },
}

export const relationshipLabCaseList = Object.values(relationshipLabCases)
