/**
 * Starts the private renderer and the job server together.
 * The renderer binds to 127.0.0.1. Only the job port is meant for the
 * private network, and only with STUDIO_VIDEO_WORKER_TOKEN set.
 */
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('../../..', import.meta.url)))
const children = []

function launch(command, args, extraEnv) {
  const child = spawn(command, args, {
    cwd: root,
    shell: false,
    windowsHide: true,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  })
  children.push(child)
  child.on('exit', (code) => {
    for (const other of children) {
      if (other !== child && other.exitCode == null) other.kill()
    }
    process.exit(code || 0)
  })
}

if (!process.env.STUDIO_VIDEO_WORKER_TOKEN) {
  console.error('STUDIO_VIDEO_WORKER_TOKEN is required.')
  process.exit(1)
}

launch(process.execPath, ['.output/server/index.mjs'], {
  HOST: '127.0.0.1',
  PORT: '3000',
  NITRO_HOST: '127.0.0.1',
  NITRO_PORT: '3000',
  STUDIO_RENDER_INTERNAL: '1',
})

launch(process.execPath, ['workers/studio-video/server.mjs'], {
  STUDIO_RENDER_BASE: process.env.STUDIO_RENDER_BASE || 'http://127.0.0.1:3000',
  STUDIO_VIDEO_WORKER_HOST: process.env.STUDIO_VIDEO_WORKER_HOST || '0.0.0.0',
})
