/**
 * Curated educational carousels for working musicians.
 *
 * Every line is general, checkable advice or a plain description of what a
 * Faneqo artist page does (songs, video, links, shows, fan list, galleries,
 * messages). No statistics, no promises about outcomes, no invented features.
 */
export const EDUCATION_TOPICS = [
  {
    id: 'direct-fan-list',
    label: 'Why a direct fan list matters',
    cover: {
      headline: 'Why a direct fan list matters',
      sub: 'Followers belong to the platform. A list belongs to you.',
    },
    slides: [
      { title: 'Reach is rented', body: 'A follower only sees your post if the feed decides to show it. You never choose who hears about the show.' },
      { title: 'A list is yours', body: 'An email or phone list goes with you when a platform changes its rules, its algorithm, or its mind.' },
      { title: 'Ask at the moment that matters', body: 'After a song, after a show, after a release. One clear ask, one field, one button.' },
      { title: 'Give a reason', body: 'First access to tickets, a song before it drops, a photo from the night. Say what they get.' },
      { title: 'Keep it short', body: 'Write to your list the way you would text a friend about the show. A few lines. One link.' },
    ],
    closing: {
      headline: 'Your page can do the asking.',
      line: 'Every Faneqo artist page has a fan list built in. Fans join from the page. You keep the list.',
      cta: 'Build your page',
    },
  },
  {
    id: 'promote-next-show',
    label: 'How to promote your next show',
    cover: {
      headline: 'How to promote your next show',
      sub: 'A simple two-week rhythm you can repeat for every date.',
    },
    slides: [
      { title: 'Announce once, clearly', body: 'City, venue, date, ticket link. One image, one caption. Pin it.' },
      { title: 'Tell your list first', body: 'The people who signed up asked to hear from you. Send them the date before the public post.' },
      { title: 'Show the room', body: 'A photo from the last show in that city says more than a flyer. Tag the venue and the opener.' },
      { title: 'Count down', body: 'One week out, three days out, day of. Different photo each time, same link.' },
      { title: 'Make the link easy', body: 'Put the show on your artist page so every bio, story, and message points to one place.' },
      { title: 'After the show', body: 'Post the photos, thank the city, and ask the people who came to join the list for the next one.' },
    ],
    closing: {
      headline: 'Shows live on your page.',
      line: 'List dates, venues, and ticket links on your Faneqo page, then share the photos from the night afterwards.',
      cta: 'Start your page',
    },
  },
  {
    id: 'beyond-link-in-bio',
    label: 'What artists need beyond a link in bio',
    cover: {
      headline: 'More than a link in bio',
      sub: 'A list of links is a menu. Fans need a place.',
    },
    slides: [
      { title: 'A song they can play', body: 'The featured song should play right there, not three taps away on another app.' },
      { title: 'The next show', body: 'Date, venue, tickets. If a fan has to search for it, most will not.' },
      { title: 'A way to stay', body: 'A fan list field on the page itself, so interest turns into a name you can reach.' },
      { title: 'The video', body: 'One featured video, not a channel. The one you want a new listener to see first.' },
      { title: 'Something from the night', body: 'Photos from the last show give a new visitor a reason to come to the next one.' },
    ],
    closing: {
      headline: 'One page. All of it.',
      line: 'A Faneqo artist page holds the song, the video, the links, the shows, the fan list, and the photos.',
      cta: 'See how it works',
    },
  },
  {
    id: 'listeners-to-followers',
    label: 'Turning casual listeners into followers',
    cover: {
      headline: 'From a listen to a follow',
      sub: 'Most people hear a song once. Here is how a few of them stay.',
    },
    slides: [
      { title: 'Make the next step obvious', body: 'After the song: one ask. Follow, join the list, or see the show. Not all three.' },
      { title: 'Use your face', body: 'People follow people. A photo of the band beats a logo on the page a new listener lands on.' },
      { title: 'Say who you are in one line', body: 'City, sound, and what the songs are about. The bio is read before the play button is pressed.' },
      { title: 'Reward the early ones', body: 'Thank them by name in a message, let them hear the next song first, keep the photos coming.' },
    ],
    closing: {
      headline: 'Give them somewhere to land.',
      line: 'Your Faneqo page is the place a new listener can play the song, see the show, and join the list.',
      cta: 'Start your page',
    },
  },
  {
    id: 'long-term-fans',
    label: 'Building long-term fan relationships',
    cover: {
      headline: 'Fans are a relationship, not a number',
      sub: 'What keeps people coming back to a band for years.',
    },
    slides: [
      { title: 'Remember who showed up', body: 'The fan at the third show is not the same as the first-timer. Treat them differently.' },
      { title: 'Write between releases', body: 'A short message on a slow month keeps the relationship alive without a product to push.' },
      { title: 'Share the night back', body: 'Photos from the show, sent to the people who were there, are the simplest thank-you there is.' },
      { title: 'Ask for less, more often', body: 'A reply, a photo, a city vote. Small asks keep a list warm; big asks every time wear it out.' },
      { title: 'Keep your list clean', body: 'One place for every fan, one email per person, no duplicates. Your messages land better.' },
    ],
    closing: {
      headline: 'Built for the long run.',
      line: 'Faneqo keeps your fan list, your shows, and your galleries together so you can keep in touch for years.',
      cta: 'Learn more at faneqo.com',
    },
  },
]

export function educationTopic(id) {
  return EDUCATION_TOPICS.find((topic) => topic.id === id) || EDUCATION_TOPICS[0]
}
