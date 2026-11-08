/**
 * Home V2 “after the show” story — copy, identity, messenger beats.
 * Presentation only. Edit here; keep motion out of the story decisions.
 */

export const AFTER_THE_SHOW_FAN = {
  initials: 'SM',
  name: 'Sarah M.',
  city: 'Nashville',
  showsLabel: '1 show',
  joinedLabel: 'Joined tonight',
}

export const AFTER_THE_SHOW_NEIGHBORS = [
  { initials: 'JK', name: 'James K.', city: 'Chicago', showsLabel: '3 shows' },
  { initials: 'MR', name: 'Maya R.', city: 'Nashville', showsLabel: '2 shows' },
  { initials: 'CD', name: 'Chris D.', city: 'Austin', showsLabel: '1 show' },
]

export function afterTheShowCopy(artistName = 'BADFLOWER') {
  const name = artistName || 'BADFLOWER'
  return {
    night: {
      kicker: 'Show Mode',
      title: 'The show is happening.',
      accent: 'Your page becomes the door.',
      body: `Scan. Check in. The room starts becoming ${name}’s list.`,
    },
    remember: {
      kicker: 'After the encore',
      title: 'The show is over.',
      accent: 'Sarah is on the list.',
      body: 'Check-ins become names, cities, and nights you can reach again.',
    },
    message: {
      kicker: 'The next morning',
      title: 'Then you talk to them.',
      accent: 'Send the night.',
      body: 'Thank them. Drop merch. Send the photos. Answer Sarah when she writes back.',
      cta: 'Start free',
    },
  }
}

export function afterTheShowMessenger(artistName = 'BADFLOWER', venue = 'Nashville') {
  const name = artistName || 'BADFLOWER'
  return {
    bandLine: `${name} @ ${venue}`,
    context: 'Post-show message',
    roomCount: 42,
    roomLabel: 'checked-in fans',
    sentLine: 'Sent to 42 fans who were in the room',
    examples: [
      {
        id: 'thanks',
        label: 'Thank you',
        text: `Thanks for coming out tonight ${venue}. You made the room electric.`,
        photos: true,
        reply: {
          name: 'Sarah M.',
          initials: 'SM',
          text: 'That show was incredible. Are you coming back this fall?',
        },
        artist: 'October. We’ll announce it soon.',
        fanBack: 'I’m there.',
      },
      {
        id: 'merch',
        label: 'Merch',
        text: 'Loved having you at the show. Official merch is up — grab it before it’s gone.',
        link: 'badflower.store / merch',
        reply: {
          name: 'James K.',
          initials: 'JK',
          text: 'Already ordered the black tee.',
        },
      },
      {
        id: 'next',
        label: 'Next show',
        text: `We’re back Aug 14 in ${venue} — get tickets before they disappear.`,
        reply: {
          name: 'Maya R.',
          initials: 'MR',
          text: 'See you in the front.',
        },
      },
    ],
  }
}
