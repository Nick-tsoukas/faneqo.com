/**
 * Night Story Labs fixtures. Same gallery SVGs as 05B.3.
 * Server-shaped fields only — youWereThere is a fixture flag, not localStorage.
 */

import { galleryLabItems } from '~/config/galleryLab'

export const NIGHT_STORY_LAB_WIDTHS = [320, 390, 430, 768, 1024, 1280]

export const nightStoryLabArtist = {
  name: 'Badflower',
}

export function nightStoryLabAttendee(count = 4) {
  return {
    artistName: nightStoryLabArtist.name,
    city: 'Nashville',
    venue: 'The Basement East',
    date: '2024-10-18',
    caption: '',
    youWereThere: true,
    firstShow: true,
    locked: false,
    visibility: 'show_attendees',
    media: galleryLabItems(count),
    photoCount: count,
  }
}

export function nightStoryLabLocked() {
  return {
    artistName: nightStoryLabArtist.name,
    city: 'Nashville',
    venue: 'The Basement East',
    date: '2024-10-18',
    youWereThere: false,
    firstShow: false,
    locked: true,
    lockReason: 'show_attendees',
    visibility: 'show_attendees',
    media: [],
    photoCount: 4,
  }
}

export function nightStoryLabManual() {
  return {
    artistName: nightStoryLabArtist.name,
    city: 'Nashville',
    venue: 'The Basement East',
    date: '2024-10-18',
    youWereThere: true,
    firstShow: false,
    locked: false,
    visibility: 'show_attendees',
    media: galleryLabItems(3),
    photoCount: 3,
  }
}

export function nightStoryLabNoPhotos() {
  return {
    artistName: nightStoryLabArtist.name,
    city: 'Nashville',
    venue: 'The Basement East',
    date: '2024-10-18',
    caption: '',
    youWereThere: true,
    firstShow: true,
    locked: false,
    visibility: 'show_attendees',
    media: [],
    photoCount: 0,
  }
}

export function nightStoryLabAccountRequired() {
  return {
    artistName: nightStoryLabArtist.name,
    city: 'Nashville',
    venue: 'The Basement East',
    date: '2024-10-18',
    youWereThere: false,
    firstShow: false,
    locked: true,
    lockReason: 'account_required',
    visibility: 'show_attendees',
    media: [],
    photoCount: 4,
  }
}
