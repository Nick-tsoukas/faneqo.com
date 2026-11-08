# Creative Studio — Signature Collection Research

Written 2026-10-14. Research and art direction only. No templates were implemented.

This file is the brief a future agent implements from. It does not replace `docs/CREATIVE_STUDIO_VISUAL_HANDOFF.md`. That handoff still says what is on screen now. This file says what to build next, after Nick approves a concept.

Do not restyle Contemporary Music Culture. Do not restyle the Product Showcase phone film. Do not add a font, a renderer, a dashboard, or a backend.

Concept pictures are studies. Names, bios, monograms, and serif letters inside them are sketch errors. Implementation uses the artist snapshot, Poppins, and `/faneqo-wordmark.svg`.

Boards: `.visual-review/creative-studio-signature/` (local, not for commit unless Nick asks).

---

## 1. Research summary

The best music campaigns are small systems, not decorated posters.

A strong one has a single picture or a single line, a second quieter voice for facts, and a mark that never competes with the artist. The same picture is redesigned for each ratio. Motion, when it exists, is one move with a reason: a crop, a title arriving, a crossfade. It is not a slideshow and it is not synced to lyrics.

Faneqo already has the restrained half of that lesson: black field, one accent gradient, Poppins, the artist ahead of the wordmark. What it does not have is range. Artist Spotlight’s four styles are all “one photograph, then the name.” Song Spotlight’s three variants are all “the sleeve in the middle, then a treatment.” The only films are three Product Showcase stories, all 11 seconds, all silent, all 720p, Story only.

The next collection should add two new kinds of picture and two short films:

- A photograph that is never covered, with the name in a margin.
- A release where the title is larger than the sleeve.
- A 9-second artist title film.
- An 8-second approach into sharp artwork.

Genre is not a template. The same margin and the same title-block have to hold a stage photo, a daylight portrait, a square painting, and a nearly empty snapshot.

---

## 2. What the studio already is

Seven families. Styles live on `content.style`. Missing spotlight style renders as Original. Missing product style renders as the phone film. Missing insight style renders as Bold.

| Family | Styles or variants | Motion |
| --- | --- | --- |
| Artist Spotlight | Editorial, Cinematic, Culture (locked), Original (Photo band / Portrait / Page excerpt) | None |
| Song Spotlight | Cover, Room, Sleeve | None |
| Product Showcase | Artist page (phone film; Framed / Bleed; excerpts), Fan list, The night, The show | Phone, Fan list, and The night are 11s Story films. The show is a still. |
| Typography Statement | Statement, Poster, Manifesto, plus six copy presets | None |
| Musician Education | Editorial, Cards; five carousel topics | None. PNG per scene. |
| Music Industry Insights | Bold Insight, Music Playbook. No CTA pill. | None |
| Show Promotion | Poster, Ticket. Real upcoming show or an honest empty state. | None |

Archive at `/ads?view=archive` is five frozen older ads. They are not families.

Export: PNG at 1080 on post 1440, feed 1350, story 1920, square 1080. Story safe zone is top 250, bottom 320, sides 48. MP4 is local dev only, 720×1280, 30 fps, H.264, no audio, faststart. The exporter seeks `/__dev/studio-render`. Playback time is not saved. PNG never receives a time.

The artist snapshot can supply name, genre, bio, tagline, hero, photos, song, releases, shows, upcoming shows, galleries, links, and fan-list copy. It cannot supply merch, messages, analytics, or counts. Do not invent them.

---

## 3. References

Principles only. Do not copy lettering, layouts, or artwork. Older notes in `docs/CREATIVE_STUDIO_DESIGN_BENCHMARK.md` still apply. These entries were checked against the source pages in this pass unless marked.

### Campaigns and identities

**1. Pentagram — The National, *First Two Pages of Frankenstein* (2023)**
https://www.pentagram.com/work/first-two-pages-of-frankenstein
One odd photograph, processed to the record’s tone, then used on the sleeve, posters, and store objects. The picture carries the feeling. Type does not explain it.
Hierarchy: image, then the campaign objects that repeat it.
Type: quiet next to the picture.
Color: whatever the processed photo already is.
Motion: the case page includes video; the identity itself is a still system.
Use: one hero, repeated. Do not copy the mannequin photograph or 4AD’s packaging.

**2. Pentagram — The National, *Sleep Well Beast* (2017)**
https://www.pentagram.com/work/the-national-1
A barn photograph plus a house-shaped mark broken into pieces, applied like a deadpan corporate manual. Casey Reas made transmission-like videos for screens in Times Square, London, and Copenhagen.
Use: a still identity can have one motion idea that is not a tour of the poster. Do not copy the corporate joke. It belonged to that record.

**3. Pentagram Berlin, Justus Oehler — Wien Modern (2016, still in use)**
https://www.pentagram.com/work/wien-modern
One red. One monospace drawn so a headline can become the whole poster, on one line or five. No fixed logo.
Use: the name can be the image. Do not draw a new typeface. Faneqo is Poppins only. Get the effect from scale, measure, and line breaks.

**4. Pentagram, Emily Oberman — Tribeca Festival 2023**
https://www.pentagram.com/work/tribeca-festival-2023
The logo stayed. Druk changes scale, weight, and position. Color is always a three-color pair. Imagery uses a “multilayered zoom” across posters, social, and billboards.
Use: one system, many sizes. Do not adopt Druk or a rainbow of pairs. Faneqo’s accent is one gradient, used once.

**5. Fontaines D.C., *Romance* — Creative Review, 28 Aug 2024**
https://www.creativereview.co.uk/fontaines-dc-romance-album-visuals/
Carlos O’Connell with XL art director Texas Maragh. Lulu Lin’s cover. A new world (acid color, heart, grotesque) on purpose, while the band kept a permanent lettering habit from *Skinty Fia*.
Tour motion, separate article: https://crackmagazine.net/article/long-reads/fontaines-dc-visuals-interview/
Use: a campaign may change the picture and keep one permanent piece. For Faneqo the permanent piece is Poppins plus the wordmark, not a band’s hand-painted face. Do not copy the heart, the pig, or the green.

**6. Studio Moross — Kylie, *Tension* (2023)**
https://www.studiomoross.com/work/tension-featured
One wide wordmark (“Padam”) and one pulse mark, then artwork, merch, visualisers, lyric videos, and live visuals.
Motion: lyric videos with bespoke type. That is a content-sync job.
Use: a wordmark can be the campaign. Do not build lyric videos. Our exporter is silent and not beat-synced. Do not take the neon pop saturation as a Faneqo default.

**7. 4th Floor Creative / Frank Fieber — Headie One, *The Last One***
https://www.4thfloorcreative.co.uk/work/headie-one
A made world (black sand, a crystal edge) shot for the sleeve, then a trailer through that world. Custom type by Alex Bois. Packaging and marketing come from the same pictures.
Use: hip-hop does not need a different template. It needs room for a non-live photograph and for type that is not a magazine masthead. Do not build 3D worlds or trailers.

**8. YUCK / Daisy Chain — Jamie xx, *In Waves* visualisers (XL, 2025)**
https://www.yuck.ltd/projects/jamie-xx
Audio-reactive lyric videos and visualisers. Mouse and key tracking.
Use: electronic music can be type and artwork in motion, with no band photo. Reject audio-reactive and interactive playback. We export a deterministic silent MP4.

**9. Instruct — LoneLady, *Former Things* (Warp)**
https://instruct.studio/projects/lonelady/
Portrait plus letraset, photocopy, and scalpel, extended to singles and the stage.
Use: a second real photograph, cropped hard, can be identity. Do not fake photocopy texture or a custom face.

### Publications, festivals, software

**10. Apple Music billboards, as described in the 2026-10-11 benchmark**
https://appleinsider.com/articles/15/10/16/following-shot-on-iphone-6-campaign-new-billboards-featuring-apple-watch-apple-music-target-global-audiences
Full-bleed portrait. One small platform mark. No dates.
Use: The Margin. The photograph stays open. The mark is small.

**11. Apple Music for Artists — Promote**
https://artists.apple.com/support/3392-make-most-promote
Two templates, a background color, a preview, then a choice of sizes. Also milestone cards and a link out.
Use: artists already expect “pick a layout, then pick sizes.” That is our style plus format flow. Do not add a color picker. Do not add milestone claims we cannot verify.

**12. Spotify for Artists — Canvas, 10 Oct 2019**
https://artists.spotify.com/blog/10-tips-to-get-the-most-from-your-canvas
3–8 seconds. No talking heads if the clip is not locked to the song. No rapid cuts or flashing. Keep action out of the area controls cover. Do not repeat the name and title the player already shows. One motif can cross a whole album (Alex Wiley’s television; Homme’s half-circle).
Use: our films should be short, one move, and should not restate the name three times. Canvas is a loop behind a player, not a paid ad. Our films still need a close and a destination. Do not ship a reverse-loop or a hard-cut gif.

**13. Meta — Reels ads**
https://www.facebook.com/business/ads/facebook-instagram-reels-ads
Vertical, sound-on by platform default, type out of the UI.
Use: our Story safe zone already is top 250 / bottom 320. The first two seconds have to work with the sound off, because our file is silent. Do not add captions that duplicate the headline.

**14. Mucho — Primavera Sound; THRU — Primavera motion**
https://wearemucho.com/work/primavera-sound
https://thrumotion.com/primavera-sound/
Many type weights, one per musical world. Motion extends the same system.
Use: genre range comes from the artist’s picture and art, not from a template per genre. Do not add fifty weights.

**15. Fonts In Use — Tyler, the Creator, *Chromakopia***
https://www.fontsinuse.com/uses/64159/tyler-the-creator-chromakopia-album-art-and-c
One display face, one text face, one grade, one accent, one motif, on the cover and the trucks.
OOH case, separate and mostly media buying: https://www.milkmoney.com/case-studies/tyler-the-creator
Use: few elements. Do not adopt a second typeface or a shipping-container mascot.

**16. Square Dance — Floyd Country Store**
https://www.squaredance.agency/case-study-floyd-country-store
Old-time and country posters: one picture, one heavy name, the facts in a plain face. A jamboree poster is a stack of real photographs, oldest to newest.
Use: The Pair is this idea reduced to two frames. Americana does not need letterpress. Do not scan a fake 1950s poster.

**17. MJO — Hudson Westbrook, *Texas Forever***
https://www.madelynjormond.com/hw-campaign
The photographer and the designer worked as one. Social, vinyl, and billboards use the same pictures. No second visual language for “digital.”
Use: our hero and our gallery frame should feel like one session. Do not invent a Texas palette.

**18. Instrument — Splice, “Start with Sound”**
https://www.instrument.com/work/splice-campaign
A music tool that looks like a music brand. The picture behaves like the product (cut, echo).
Use: when the ad is about Faneqo, show the product, which the phone film and the fan-list film already do. These six concepts are not product ads. Do not put a phone in them.

### What was looked at and not used as a model

- Fred & Augustus country-release case study. Strategy, not a visual system. https://www.fredandaugustus.com/country-americana-album-release-marketing-strategy
- Behance album packaging. Portfolio posts, not verified campaigns.
- e.l.f. Mirror Mix (RIOT). A beauty-brand film with desktop chrome. Not a music-industry model. https://riot.nyc/portfolio/elf-mirror-mix/

Images on those sites were not downloaded. Nothing from them is in `public/` or in a template.

---

## 4. Lessons to keep

1. One hero, redesigned per ratio. Do not crop the face out to fit a square.
2. Two voices. Poppins 800 for the name or title. Poppins 500, small and tracked, for the fact. No second family.
3. The platform mark is never the biggest type.
4. Do not repeat the name, the URL, and the wordmark as three headlines.
5. Motion is one idea. A hold can be the shot.
6. A template that only works on a rock photograph has failed.
7. Missing data is an empty state or a hidden block. It is not a stock photo.

## 5. Gaps in the current set

- Editorial, Cinematic, and Original are the same idea at three distances: photo, then name on or under it. Culture is the only spotlight with a different object (a placed print and an echo).
- Song Spotlight’s Cover, Room, and Sleeve differ by effect (glow, blur, vinyl gag), not by idea. The sleeve is always the star in the middle.
- There is no Artist Spotlight film and no Song Spotlight film.
- Every proof render is Badflower. A daylight portrait, a square painting, and a one-word name have not been the test.
- Poppins cannot do Wien Modern or Druk. Scale has to do that work.
- Eleven seconds is long for a title card. The engine can time a shorter film. The constant `PRODUCT_MOTION_MS` should not force every future film to 11s.

---

## 6. Six concepts

Store new spotlight styles on `content.style` beside the four that exist. Store new song styles the same way. Do not add a family. Missing or unknown spotlight style stays Original. A new song style must not become the default for old records: missing song style stays Cover.

### 6.1 The Margin — Artist Spotlight

**Purpose.** Introduce an artist when the photograph should be seen whole. Use it for a portrait, a daylight writer, or a stage shot where type on the face would ruin it.

**Idea.** The photograph is a clean rectangle. It is not faded. The name lives in black beside it or under it, like a wall label. Reading order: picture, name, one line, wordmark. The line is the tagline, else the first sentence of the bio, else nothing. Genre may be the small label. If genre is empty, skip it.

The photograph never goes under the type. Faces stay in the photo rectangle. Focal point is the crop inside that rectangle only.

Color is the photograph. The only accent is the wordmark. No gradient on the name.

**Ratios.**

- Post and feed: photo on the left, about 60% of the width. Margin on the right holds the name. Long names wrap inside the margin. They do not jump onto the photo.
- Square: photo on top, about 70% of the height. Margin is a black band underneath. The name is one or two lines in that band.
- Story: photo occupies the safe middle. The margin is the black field inside the bottom safe area, not type sitting in Instagram’s chrome. Top chrome stays empty.

**Missing data.** No photo: do not draw a gray box with a person. Black field, the name huge in the margin area, and the line “No photograph on this page.” No tagline and no bio: name only. No genre: no label.

**Not Editorial.** Editorial puts the masthead on the photograph. **Not Cinematic.** Cinematic shades the photo and sets type in the shade. **Not Culture.** Culture is a spine, a print, and an echo.

**Reuse.** `PhotoField` for the rectangle. A margin block (label, name, one line, wordmark) that Show Promotion and a later deck can use. `useFitLine` for the name.

Sketch: `.visual-review/creative-studio-signature/concept-the-margin.jpg`
The sketch invented a monogram and a bio. Throw those away. Use the wordmark and the snapshot line.

### 6.2 The Pair — Artist Spotlight

**Purpose.** When the artist has two real pictures: a portrait and a show, or a hero and a gallery frame. The ad is the relationship between them.

**Idea.** Two hard crops. A hairline gap. The name sits in the gap or along the bottom, clear of both faces. No blend, no shadow, no texture.

Picture A is `content.photo` or the hero. Picture B is the first gallery photo whose URL is not picture A, else the next snapshot photo. Never duplicate one URL into both frames.

**Ratios.**

- Post and feed: A is large on the left. B is a smaller rectangle low on the right, overlapping the black, not the face.
- Square: A on top, B on the bottom, split near 60/40, name in the gap.
- Story: A fills the upper safe area. B is a wide strip above the bottom chrome. Name sits between them.

**Missing data.** One photograph only: do not invent a second. Fall back to The Margin’s single rectangle and keep the name. The style id can stay `pair`; the layout becomes one frame. Say nothing about a missing picture.

**Not Culture.** Culture places one print on a spine. The Pair is two photographs of equal honesty.

**Reuse.** The two-frame crop. Gallery films already know how to pick a second URL. Share that pick, do not copy Night’s crossfade.

Sketch: `.visual-review/creative-studio-signature/concept-the-pair.jpg`

### 6.3 The Title — Artist Spotlight, and the artist film

**Purpose.** A short introduction that feels like the first card of a film. Use it when the portrait can hold the screen and the name should arrive, not sit on a poster from the first frame.

**Still.** The still is the last frame, not a separate poster. Photograph full-bleed in the upper area. It ends in a hard cut to black. It does not fade across the face. In the black: a small series label (“A Faneqo artist” is a starting line, editable), the name at display size, the wordmark. No song row. No masthead. No shade ramp.

**Ratios.** The black title field is a designed band, not letterboxing around a shrunken photo.

- Post and feed: photo about 70% of the height, band below.
- Square: photo about 62%, band below, name may be one line.
- Story: photo stays out of the top chrome. The band sits above the bottom chrome. The name is never in the 320px chrome.

**Missing data.** No photo: black frame, name only, no fake still. No name: do not render the style.

**Not Cinematic.** Cinematic is a one-sheet with type in a gradient on the picture. The Title cuts to a black band. **Not Original Portrait.** That style sets type on the photograph.

Sketch: `.visual-review/creative-studio-signature/concept-the-title.jpg`
The sketch used a serif and a made-up band name. Implementation is Poppins and `snapshot.name`.

Storyboard: `.visual-review/creative-studio-signature/storyboard-the-title.jpg` and section 7.

### 6.4 The Announcement — Song Spotlight

**Purpose.** A label one-sheet. The title is the news. The sleeve is the proof, small and sharp.

**Idea.** Black field. Song title in 800, left, as large as the measure allows. Under it: artist name, then the release year if `releases[].releaseDate` or the song’s year exists. The artwork sits low, at its true ratio, small, no glow, no blur, no disc. One accent is not required. Wordmark and CTA sit in the close, small.

Reading order: title, artist, artwork, close.

**Ratios.**

- Post and feed: title takes the top half. Artwork sits in the lower right, roughly a quarter of the width.
- Square: title on the left, artwork on the right, vertically centered. If the title is long, artwork moves under it.
- Story: title in the safe upper-middle. Artwork lower, still above the chrome. Do not scale the post up.

**Missing data.** No artwork: title and artist only. Do not draw an empty sleeve. No title: do not render. Year missing: omit the year. Do not write “Out now” unless the editor typed it.

**Not Cover.** Cover puts art in the middle on a glow. **Not Room.** Room blurs the art to the edges. **Not Sleeve.** Sleeve draws a record.

**Reuse.** True-ratio art frame. Title block (title, artist, year).

Sketch: `.visual-review/creative-studio-signature/concept-the-announcement.jpg`
The sketch says “Silent Archive” and “2024.” Those are not data. Use the snapshot.

### 6.5 The Object — Song Spotlight, and the release film

**Purpose.** The sleeve is the object, seen sharply, then named the way a spine names a jacket.

**Idea.** Artwork at true ratio, large, sharp, sitting in black. A caption column along one edge: artist, title, year. The caption is the small voice. The art is the large voice. No vinyl. No blur. No color glow sampled from the art unless a later, separate task adds a real sampler. Do not invent a sampled color in v1.

**Ratios.**

- Post and feed: art left, caption right.
- Square: art centered, caption along the bottom in one line if it fits, else two.
- Story: art in the safe center, caption above the bottom chrome, horizontal.

**Missing data.** No art: do not blur a color field. Black, the title large, and no object. The film does not run without art.

**Not Room.** Room fills the frame with a blur. The Object never fills by destroying the art.

Sketch: `.visual-review/creative-studio-signature/concept-the-object.jpg`
Storyboard: `.visual-review/creative-studio-signature/storyboard-the-object.jpg`

### 6.6 The Credit — Song Spotlight

**Purpose.** A quiet release for a strong title and a small piece of art. Closer to a credit than to a poster.

**Idea.** One huge title. A small true-ratio sleeve above it, like a footnote that happens to be first. Artist name under the title in the quiet voice. Almost no other elements. Wordmark in the corner.

**Ratios.** The title’s size is the layout. Square may drop to two lines. Story keeps the title out of both chrome zones and lets the art sit above it, small. Do not stretch the title to the chrome.

**Missing data.** No art: the title still holds. No title: do not render.

**Risk.** This is the closest concept to Typography Statement. It earns a place only because the sleeve is real snapshot art and the words are the song, not a brand manifesto. If the first render looks like a type preset with a stamp, reject it in review.

Sketch: `.visual-review/creative-studio-signature/concept-the-credit.jpg`

---

## 7. Motion

Both films use the existing pose model: a pure function of time, Story only, the same MP4 exporter. PNG is the last frame’s layout with motion off, which for these two styles is the designed still, not a black opener.

Do not default them to 11 seconds.

### The Title — 9 seconds

Marketing job: stop a scroll with a face, then leave the name.

| Time | Frame |
| --- | --- |
| 0.0–1.2 | Black. No type. |
| 1.2–2.0 | The photograph eases in. No zoom. Opacity or a short vertical settle of 24px, not a scale. |
| 2.0–5.0 | Photograph holds. It does not drift. |
| 5.0–7.2 | The black band is already there. The name eases up into it. The series label follows, smaller. |
| 7.2–9.0 | Hold. Wordmark eases to full opacity. No CTA until the hold, and only if `content.cta` is set. |

Opening frame of the file can be black. That is the same situation as the phone film’s first 40ms. The poster someone downloads is the still, with the name present.

Audio, if a later cut adds it: no score. Room tone or the first second of the song, low, and only with rights. The silent file must already make sense.

Feasibility: **small extension.** New `titlePose` next to `fanListPose`. `durationMs: 9000`. Exporter already counts frames from duration. Allow this style in `productMotionFilm`’s sibling for spotlight, or a `spotlightMotionFilm` that the editor already knows how to gate. Story only. Other ratios stay stills.

Not feasible without new work: a move that follows a face. There is no face detection.

### The Object — 8 seconds

Marketing job: show the sleeve as a thing, then say what it is.

| Time | Frame |
| --- | --- |
| 0.0–1.5 | Artwork small, sharp, centered. No caption. |
| 1.5–4.0 | Artwork eases to its final size. Scale only. No blur, no rotation. |
| 4.0–6.2 | Caption column eases in from the side it lives on. Title, artist, year. |
| 6.2–8.0 | Hold. Wordmark. |

Feasibility: **small extension.** `objectPose` returns scale and caption opacity. Artwork node is a transform, not a redraw. True ratio has to be known before the first frame so the scale does not jump.

Rejected motion: a spinning disc, a sleeve sliding off a record, a beat-cut, a zoom that never settles.

---

## 8. Source fields

| Concept | Required | Optional | If missing |
| --- | --- | --- | --- |
| The Margin | `snapshot.name`, one photo | genre, tagline or bio, focal | No photo: name on black and an explicit empty line. No bio: name only. |
| The Pair | name, one photo | a second photo with a different URL, focal on each | One photo: render The Margin’s single frame. |
| The Title | name, one photo | series label, CTA, focal | No photo: name on black, no film. |
| The Announcement | song title, artist name | art, year, CTA | No art: type only. No year: omit. |
| The Object | song title, art | year, artist name | No art: no film; still becomes type only. |
| The Credit | song title | art, artist name | No art: title only. |

Song title comes from `snapshot.song.title`, else the release title. Do not keep the placeholder “Song title” that old defaults used. The handoff already strips placeholder copy.

---

## 9. Feasibility

**Already there**

- Style ids on `content.style`, with a safe fallback for old records.
- `PhotoField` crop and focal.
- `useFitLine` so the editor zoom does not overflow the export.
- Four boards and safe zones.
- Pose functions, seek, Story-only motion, local MP4.
- Snapshot photos, galleries, song, releases.
- Duplicate, angles, and PNG that ignores `t`.

**Small extension**

- Spotlight and song motion flags, parallel to `productMotionFilm`.
- Durations of 9s and 8s. Frame count is `durationMs / 1000 * 30`.
- A second-photo picker that skips duplicate URLs.
- True-ratio art layout if a style needs the art smaller than Cover. Song Spotlight already refuses to force a square crop; this is a placement change, not a new cropper.

**Do not build for this collection**

- Audio, 1080p, beat sync, lyric timing.
- A new font.
- Face detection.
- Color sampled from the artwork.
- 3D, WebGL, or a second renderer.
- Per-genre templates.

---

## 10. Scores

Scored as proposals, not as renders. None is above 90 because none has been built. The sketch files are not the score.

| Concept | Originality 20 | Hierarchy 20 | Authenticity 15 | Brand 15 | Motion / format 10 | Flexibility 10 | Feasibility 10 | Total |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| The Title | 16 | 17 | 14 | 14 | 9 | 8 | 8 | 86 |
| The Margin | 15 | 18 | 14 | 14 | 7 | 9 | 9 | 86 |
| The Announcement | 15 | 18 | 15 | 13 | 7 | 8 | 9 | 85 |
| The Object | 13 | 16 | 15 | 13 | 9 | 8 | 8 | 82 |
| The Credit | 12 | 16 | 13 | 13 | 6 | 9 | 9 | 78 |
| The Pair | 16 | 14 | 13 | 12 | 7 | 6 | 8 | 76 |

Why the lows:

- The Title can become Cinematic if the black band turns into a gradient. The cut has to stay hard.
- The Margin’s sketch already drifted into a fake logo and a made-up bio. The build has to be stricter than the sketch.
- The Announcement fails if a long title collides with the sleeve. `useFitLine` is mandatory.
- The Object is the least new idea. It only survives if it never blurs and never draws a disc.
- The Credit may be a type poster. Hold it.
- The Pair is the most fragile. One photo, or two photos of the same moment, and the idea collapses. That is why it is not in the first four.

---

## 11. Build order

After approval, in this order:

1. **The Margin** — still only, all four ratios. Proves a spotlight that does not touch the photograph.
2. **The Announcement** — still only, all four ratios. Proves a release where type leads.
3. **The Title** — still plus the 9s film. First Artist Spotlight MP4.
4. **The Object** — still plus the 8s film. First Song Spotlight MP4.

Then, only if those four hold on a second artist who is not a rock band: The Pair, then The Credit.

Test artists: the demo fixture, one artist with a single photo and a short name, one with a long name, one with square art, one with no art, one with no second photo. Do not add fake songs or fake shows to the fixture.

---

## 12. Acceptance for the first build

The Margin and The Announcement are the first stills. The Title is the first film.

- Old creatives with no style still render as Original or Cover. No migration.
- Culture and the phone film are unchanged.
- Each new style has its own composition on post, feed, square, and story. A story is not a tall post.
- Names and titles fit the longest realistic string without touching a face or the story chrome.
- PNG matches the editor still. The film’s black first frame is not the PNG.
- MP4, if built, is the same pipeline: real creative JSON, 720×1280, silent, faststart, Story only. Duration is 9.0s or 8.0s, not 11.
- Missing photo, missing art, and a single photo on The Pair do what section 8 says.
- No new font, no vinyl illustration, no glow behind The Announcement or The Object.
- `node scripts/test-creative-studio.mjs` and `node scripts/test-ads-studio.mjs` pass.
- Renders go in `.visual-review/`. They are not committed unless Nick asks.

---

## 13. Rejected

- A custom display face. Poppins is the system.
- Reworking Editorial, Cinematic, Culture, Cover, Room, or Sleeve. They stay.
- A sixth product film. This collection is artist and release, not another product tour.
- Lyric videos, beat cuts, reverse loops, audio-reactive type.
- Per-genre skins. The references that work use one system and the artist’s own picture.
- Letterboxing a smaller photo inside bars. The Title’s black is a band the photo sits on, full width.
- Sampling a palette from the sleeve in v1. Easy to get wrong, and it fights the single accent.
- A shared component library as a new app. Reuse `PhotoField`, the margin block, the true-ratio frame, and the pose helper inside `features/ads/studio/`. Decks and pages can take those later.
- The Pair and The Credit as opening work. Pair needs two pictures. Credit may not be different enough from Typography Statement.

---

## 14. Weakest point in the current visual language

The still templates do not yet change their minds. Spotlight is one photograph with the name somewhere on it. Song Spotlight is one sleeve with an effect. The films proved that Faneqo can be specific. The stills still look like one family wearing four outfits, and every outfit has been fitted on the same band.
