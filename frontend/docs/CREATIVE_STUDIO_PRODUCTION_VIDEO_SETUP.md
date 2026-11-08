# Creative Studio — production video setup

The public website does not render video. A separate worker does. Until that worker is provisioned and this document's environment variables are set, Creative Studio keeps previews and PNG downloads, and it does not offer an MP4 button.

Nothing in this document is a secret. Do not commit tokens, keys, or bucket credentials.

## What exists now

- Video & Reels in Creative Studio creates one of the three films that already work: Artist page, Fan list, The night. Story 9:16 and motion are turned on. The show style stays a still.
- Local development still exports through `/api/__dev/studio-mp4`. Those routes are absent outside `nuxt dev`.
- Production calls `/api/studio/video`. The route checks the studio session, loads the saved creative with that person's own Strapi JWT, and forwards it to the worker. It does not spawn Chromium or FFmpeg.
- If `STUDIO_VIDEO_WORKER_URL` or `STUDIO_VIDEO_WORKER_TOKEN` is empty, the route returns 503 and the editor says MP4 export is not connected.

## Railway services

Keep the current public website service as it is. Add a second service from the same `musicbizqr` repository. Do not point the public service at `workers/studio-video/Dockerfile`.

| Service | Role | Public domain |
| --- | --- | --- |
| Existing web | Nuxt site, studio UI, `/api/studio/video` proxy | Yes, faneqo.com |
| New worker | Private Nuxt renderer on 127.0.0.1:3000 plus the job server | No |

The worker image is `workers/studio-video/Dockerfile`, built from the repo root:

```text
docker build -f workers/studio-video/Dockerfile -t faneqo-studio-video .
```

`workers/studio-video/start.mjs` starts both processes. The renderer listens on 127.0.0.1 only. The job server listens on the private network. Do not attach a public Railway domain or public port to the worker.

Chromium and FFmpeg belong in that image, not on the public service. The Dockerfile installs both (Debian `chromium` plus fonts) and sets `STUDIO_VIDEO_CHROME_PATH=/usr/bin/chromium`. That image build has not been run yet: build it once and check `chromium --version` inside it before the first export. The exporter imports `playwright-core`, which currently arrives through `nuxt-og-image`; make it a direct dependency if that ever changes. Local development keeps using the installed Chrome and does not need that variable.

## Environment variables

Set these on the services. Values stay in the host, not in git.

Public web service:

- `STUDIO_VIDEO_WORKER_URL` — private address of the worker job port, for example the Railway private host on port 8791
- `STUDIO_VIDEO_WORKER_TOKEN` — shared secret, long random string

Worker service, same token:

- `STUDIO_VIDEO_WORKER_TOKEN`
- `STUDIO_VIDEO_WORKER_HOST` — `0.0.0.0` so the private network can reach it
- `STUDIO_VIDEO_WORKER_PORT` — `8791`
- `STUDIO_RENDER_BASE` — `http://127.0.0.1:3000`
- `STUDIO_RENDER_INTERNAL` — `1`
- `STUDIO_VIDEO_CHROME_PATH` — Chromium binary inside the image
- `STUDIO_VIDEO_JOB_TTL_MS` — optional, default 7200000 (2 hours)

Leave `STUDIO_RENDER_INTERNAL` unset on the public service. The render page answers only for `nuxt dev`, or for a localhost host when that flag is on. A public hostname still returns 404.

## Authorization

`/api/studio/video` uses the same studio allowlist as the rest of Creative Studio (`requireStudio`). The caller's Strapi JWT is checked against `/api/users/me`. Everyone else gets 404.

The server then loads `/api/creatives/:id` with that same JWT. Strapi already returns a creative only to its owner. The browser sends the id, not the creative, not a user id, and not a URL. A `local-` id is rejected until the project is saved to Faneqo.

The worker accepts only `Authorization: Bearer` matching `STUDIO_VIDEO_WORKER_TOKEN`. It ignores render URLs, filesystem paths, and shell commands. The render address is `STUDIO_RENDER_BASE`, and the exporter refuses any host that is not localhost.

Progress, cancel, and download use the job id returned by the worker. The Nuxt route checks the studio session again before proxying. The MP4 is not a public URL.

## Storage

Finished files stay in the worker's temp directory and are deleted when the job expires, when it is cancelled, or when encoding fails. The editor downloads through the authenticated Nuxt route.

Faneqo already has private S3 media (`AWS_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_ACCESS_SECRET`, `FANEQO_PROTECTED_MEDIA_ENABLED`). Reusing that bucket for video is the right later step: a private prefix such as `studio-video/`, a short-lived signed download, and a lifecycle rule that deletes the object. That wiring is not built. It needs an explicit decision before the worker is given those credentials. Do not put artist snapshots or account ids in object metadata that could become public.

## Limits

These are conservative defaults, not a speed promise.

- One render at a time. A second request gets 429.
- Films longer than 12 seconds are rejected. The three shipped films are 11 seconds.
- Output is 720×1280, H.264, 30 fps, silent.
- Payload cap is 512 KB, the same cap as the local exporter.
- Job lifetime is 2 hours, then the temp files are removed.
- The public web process does not encode. Rendering stays on the worker.

There is no durable job table. Status lives in the worker process. A restart forgets in-flight jobs and deletes nothing that already expired. A database or Redis queue is a separate approval. Do not add one just to start.

## Cost

Video export is a long CPU and memory spike, on the order of a couple of minutes and a few hundred megabytes for an 11-second 720p film. Run the worker at a small fixed size and accept that an export is slow. Do not scale the public website up to absorb renders. One concurrent job is the control that keeps a second export from stacking on the first.

## Verify the worker

1. Deploy the worker with no public domain.
2. Set the two public-service variables and the worker token.
3. From the public service's private network, `GET` the worker `/jobs/does-not-exist` with the bearer token. Expect 404, not a render.
4. The same request without the token must be 401.
5. Open a production creative, turn on a film, and confirm the editor shows Export MP4 only after the worker variables are present.
6. Unset `STUDIO_VIDEO_WORKER_URL` and confirm the button disappears and the line reads that MP4 export is not connected. PNG download still works.

## First export

Do this once, yourself, after the worker is up.

1. Open Creative Studio, Video & Reels, and choose Artist page, Fan list, or The night.
2. Pick the artist and save the project to Faneqo. A device-only project cannot export in production.
3. In the editor, press Play, then Pause, and drag the timeline. Confirm the film is the one you chose.
4. Press Export MP4 once. Leave it running. The status moves through frame numbers and ends with a download.
5. The file should be a silent 720×1280 H.264 MP4, about 11 seconds. PNG download is the still, a different file.

This repository has not run that production export.

## Turn video export off

Remove `STUDIO_VIDEO_WORKER_URL` from the public service, or stop the worker. The editor drops the MP4 button. Previews and PNG downloads stay. Do not point the public service at the dev MP4 routes.

## When a job fails

- 503, "not configured" — the public service has no worker URL or token.
- 404 — the studio session is missing, or the creative is not yours.
- 409, save first — the project is still only on this device.
- 400 — the template cannot be filmed, motion is off, or the film is longer than 12 seconds.
- 429 — a render is already running. Wait, or cancel it.
- 502 — the worker was unreachable or the encoder exited. Read the worker logs. Cancel the job if it is still marked running after a crash, then start one new export.

Temp files live under the system temp directory in `faneqo-studio-video/`. They are removed on failure, cancel, and expiry. If a restart leaves a directory behind, delete that directory on the worker. Do not delete anything in the public website's disk.
