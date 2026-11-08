# Private video worker. Do not use this image for the public Faneqo website.
# Build from the musicbizqr repo root:
#   docker build -f workers/studio-video/Dockerfile -t faneqo-studio-video .
FROM node:22-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
     chromium fonts-liberation fonts-noto-color-emoji \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx nuxt build

ENV HOST=127.0.0.1 \
    PORT=3000 \
    NITRO_HOST=127.0.0.1 \
    NITRO_PORT=3000 \
    STUDIO_RENDER_INTERNAL=1 \
    STUDIO_RENDER_BASE=http://127.0.0.1:3000 \
    STUDIO_VIDEO_WORKER_HOST=0.0.0.0 \
    STUDIO_VIDEO_WORKER_PORT=8791 \
    STUDIO_VIDEO_CHROME_PATH=/usr/bin/chromium

EXPOSE 8791
CMD ["node", "workers/studio-video/start.mjs"]
