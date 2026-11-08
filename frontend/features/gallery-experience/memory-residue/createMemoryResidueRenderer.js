/**
 * Memory Residue — GPU temporal-decay experiment.
 *
 * Available renderer: Three r170 WebGLRenderer (WebGL2 preferred, WebGL1 fallback).
 * Selected renderer: WebGL2 ShaderMaterial feedback, or none.
 * Why: Three r170 WebGPURenderer does not run ShaderMaterial (NodeMaterial/TSL).
 * Future WebGPU path: a TSL/NodeMaterial port of the same ping-pong contract.
 * Do not add a WebGPU dependency for this experiment.
 *
 * PhotoSwipe must never import this file.
 *
 * Contract: init / setSource / capture / startDecay / setProgress / resize /
 * suspend / resume / destroy
 */

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

const DECAY_FRAG = `
precision highp float;

uniform sampler2D uPrev;
uniform sampler2D uSource;
uniform vec4 uPhotoRect;
uniform float uInject;
uniform float uDecay;
uniform float uPersist;
uniform float uLumaThresh;
uniform float uEdge;
uniform float uColorRetain;
uniform float uDesat;
uniform float uDisplace;
uniform float uNoise;
uniform float uTime;
uniform vec2 uTexel;

varying vec2 vUv;

float luma(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 uv = vUv;
  vec2 photoUv = (uv - uPhotoRect.xy) / max(uPhotoRect.zw, vec2(0.0001));
  float inPhoto = step(0.0, photoUv.x) * step(photoUv.x, 1.0) * step(0.0, photoUv.y) * step(photoUv.y, 1.0);
  if (inPhoto < 0.5) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  vec2 drift = vec2(
    hash(floor(uv * 18.0) + floor(uTime * 1.5)) - 0.5,
    hash(floor(uv.yx * 14.0) - floor(uTime * 1.5)) - 0.5
  ) * uDisplace;

  vec3 prevC = texture2D(uPrev, clamp(uv + drift, 0.0, 1.0)).rgb;
  vec3 blur = (
    texture2D(uPrev, clamp(uv + vec2(uTexel.x, 0.0), 0.0, 1.0)).rgb +
    texture2D(uPrev, clamp(uv - vec2(uTexel.x, 0.0), 0.0, 1.0)).rgb +
    texture2D(uPrev, clamp(uv + vec2(0.0, uTexel.y), 0.0, 1.0)).rgb +
    texture2D(uPrev, clamp(uv - vec2(0.0, uTexel.y), 0.0, 1.0)).rgb
  ) * 0.25;
  vec3 prev = mix(prevC, blur, 0.28);

  float l = luma(prev);
  float lx = luma(texture2D(uPrev, clamp(uv + vec2(uTexel.x, 0.0), 0.0, 1.0)).rgb);
  float ly = luma(texture2D(uPrev, clamp(uv + vec2(0.0, uTexel.y), 0.0, 1.0)).rgb);
  float edge = abs(l - lx) + abs(l - ly);

  vec3 src = vec3(0.0);
  if (uInject > 0.5) {
    src = texture2D(uSource, clamp(photoUv, 0.0, 1.0)).rgb;
  }

  float srcLuma = luma(src);
  float highlight = smoothstep(uLumaThresh, uLumaThresh + 0.28, srcLuma);
  vec3 mixed = max(prev * uDecay, src * uInject * mix(0.35, 1.0, highlight));
  float energy = luma(mixed);
  float gate = smoothstep(uLumaThresh * 0.22, uLumaThresh + 0.16, energy);
  mixed = mix(vec3(energy), mixed, clamp(uColorRetain, 0.0, 1.0));
  mixed *= mix(0.18, 1.0, gate);
  mixed += vec3(edge * uEdge * 0.38);
  float grain = hash(uv * 36.0 + floor(uTime * 8.0)) - 0.5;
  mixed -= mixed * grain * uNoise * 0.55;
  float grey = luma(mixed);
  mixed = mix(mixed, vec3(grey), clamp(uDesat, 0.0, 1.0));
  mixed *= clamp(uPersist, 0.0, 1.2);
  mixed = max(mixed, vec3(0.0));

  gl_FragColor = vec4(mixed, 1.0);
}
`

const DISPLAY_FRAG = `
precision highp float;

uniform sampler2D uField;
uniform float uFade;
uniform vec4 uPhotoRect;
varying vec2 vUv;

float luma(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
  vec2 photoUv = (vUv - uPhotoRect.xy) / max(uPhotoRect.zw, vec2(0.0001));
  float inPhoto = step(0.0, photoUv.x) * step(photoUv.x, 1.0) * step(0.0, photoUv.y) * step(photoUv.y, 1.0);
  if (inPhoto < 0.5) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    return;
  }
  vec3 c = texture2D(uField, vUv).rgb;
  float a = smoothstep(0.014, 0.09, luma(c)) * clamp(uFade, 0.0, 1.0);
  gl_FragColor = vec4(c, a);
}
`

const EMPTY = {
  ready: false,
  backend: 'none',
  webgpu: false,
}

function probeWebGpu() {
  try {
    return typeof navigator !== 'undefined' && typeof navigator.gpu !== 'undefined'
  } catch {
    return false
  }
}

function targetSize(w, h) {
  const max = 720
  const scale = Math.min(1, max / Math.max(w, h, 1))
  return {
    w: Math.max(64, Math.round(w * scale)),
    h: Math.max(64, Math.round(h * scale)),
  }
}

function defaultParams() {
  return {
    decay: 0.88,
    persistence: 0.42,
    lumaThreshold: 0.18,
    edge: 0.1,
    colorRetention: 0.2,
    desaturation: 0.7,
    displace: 0.003,
    noise: 0.025,
    durationMs: 1200,
  }
}

export function createMemoryResidueRenderer() {
  let THREE = null
  let renderer = null
  let canvas = null
  let decayMat = null
  let displayMat = null
  let decayMesh = null
  let displayMesh = null
  let decayScene = null
  let displayScene = null
  let camera = null
  let rtA = null
  let rtB = null
  let readRT = null
  let writeRT = null
  let sourceTex = null
  let blankTex = null
  let container = null
  let disposed = false
  let suspended = false
  let decaying = false
  let raf = 0
  let startedAt = 0
  let durationMs = 1200
  let progress = 0
  let inject = 0
  let backend = 'none'
  let ready = false
  let photoRect = { x: 0.08, y: 0.18, w: 0.84, h: 0.52 }
  let params = defaultParams()
  const webgpu = probeWebGpu()

  function sleep() {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    decaying = false
    inject = 0
    if (canvas) canvas.style.visibility = 'hidden'
  }

  function applyParams(next = {}) {
    params = { ...params, ...next }
    durationMs = Math.max(240, Number(params.durationMs) || 1200)
    if (!decayMat) return
    const u = decayMat.uniforms
    u.uDecay.value = Number(params.decay) || 0.88
    u.uPersist.value = Number(params.persistence) || 0.42
    u.uLumaThresh.value = Number(params.lumaThreshold) || 0.18
    u.uEdge.value = Number(params.edge) || 0.1
    u.uColorRetain.value = Number(params.colorRetention) || 0.2
    u.uDesat.value = Number(params.desaturation) || 0.7
    u.uDisplace.value = Number(params.displace) || 0.003
    u.uNoise.value = Number(params.noise) || 0.025
  }

  function makeRT(w, h) {
    const rt = new THREE.WebGLRenderTarget(w, h, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
    })
    rt.texture.generateMipmaps = false
    return rt
  }

  function resizeTargets(w, h) {
    const size = targetSize(w, h)
    if (!rtA) {
      rtA = makeRT(size.w, size.h)
      rtB = makeRT(size.w, size.h)
      readRT = rtA
      writeRT = rtB
    } else {
      rtA.setSize(size.w, size.h)
      rtB.setSize(size.w, size.h)
    }
    if (decayMat) {
      decayMat.uniforms.uTexel.value.set(1 / size.w, 1 / size.h)
    }
  }

  function clearTargets() {
    if (!renderer || !rtA) return
    renderer.setClearColor(0x000000, 1)
    renderer.setRenderTarget(rtA)
    renderer.clear()
    renderer.setRenderTarget(rtB)
    renderer.clear()
    renderer.setRenderTarget(null)
  }

  function paint() {
    if (disposed || suspended || !renderer || !decayMat) return
    decayMat.uniforms.uPrev.value = readRT.texture
    decayMat.uniforms.uInject.value = inject
    decayMat.uniforms.uTime.value = performance.now() * 0.001
    decayMat.uniforms.uPhotoRect.value.set(
      photoRect.x,
      1 - photoRect.y - photoRect.h,
      photoRect.w,
      photoRect.h,
    )
    renderer.setRenderTarget(writeRT)
    renderer.render(decayScene, camera)
    renderer.setRenderTarget(null)
    displayMat.uniforms.uField.value = writeRT.texture
    displayMat.uniforms.uFade.value = Math.max(0, 1 - progress * 0.15)
    displayMat.uniforms.uPhotoRect.value.set(
      photoRect.x,
      1 - photoRect.y - photoRect.h,
      photoRect.w,
      photoRect.h,
    )
    renderer.autoClear = true
    renderer.setClearColor(0x000000, 0)
    renderer.render(displayScene, camera)
    const tmp = readRT
    readRT = writeRT
    writeRT = tmp
    inject = 0
  }

  function tick() {
    raf = 0
    if (disposed || suspended || !decaying) return
    const elapsed = performance.now() - startedAt
    progress = Math.min(1, elapsed / durationMs)
    const persist = Math.max(0.08, (Number(params.persistence) || 0.42) * (1 - progress * 0.72))
    if (decayMat) decayMat.uniforms.uPersist.value = persist
    paint()
    if (progress >= 1) {
      sleep()
      return
    }
    raf = requestAnimationFrame(tick)
  }

  async function init(host) {
    if (typeof window === 'undefined' || !host) return { ...EMPTY, webgpu }
    container = host
    try {
      THREE = await import('three')
    } catch {
      return { ...EMPTY, webgpu }
    }

    canvas = document.createElement('canvas')
    canvas.className = 'fq-lg-residue'
    canvas.setAttribute('aria-hidden', 'true')
    canvas.style.visibility = 'hidden'
    host.appendChild(canvas)

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: 'low-power',
        preserveDrawingBuffer: false,
      })
    } catch {
      canvas.remove()
      canvas = null
      return { ...EMPTY, webgpu }
    }

    try {
      renderer.setClearColor(0x000000, 0)
      renderer.autoClear = true
      renderer.toneMapping = THREE.NoToneMapping
      renderer.outputColorSpace = THREE.SRGBColorSpace

      blankTex = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1)
      blankTex.needsUpdate = true
      sourceTex = blankTex

      decayMat = new THREE.ShaderMaterial({
        uniforms: {
          uPrev: { value: blankTex },
          uSource: { value: blankTex },
          uPhotoRect: { value: new THREE.Vector4(0.1, 0.2, 0.8, 0.5) },
          uInject: { value: 0 },
          uDecay: { value: 0.88 },
          uPersist: { value: 0.42 },
          uLumaThresh: { value: 0.18 },
          uEdge: { value: 0.1 },
          uColorRetain: { value: 0.2 },
          uDesat: { value: 0.7 },
          uDisplace: { value: 0.003 },
          uNoise: { value: 0.025 },
          uTime: { value: 0 },
          uTexel: { value: new THREE.Vector2(0.002, 0.002) },
        },
        vertexShader: VERT,
        fragmentShader: DECAY_FRAG,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      })
      displayMat = new THREE.ShaderMaterial({
        uniforms: {
          uField: { value: blankTex },
          uFade: { value: 1 },
          uPhotoRect: { value: new THREE.Vector4(0.1, 0.2, 0.8, 0.5) },
        },
        vertexShader: VERT,
        fragmentShader: DISPLAY_FRAG,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      })

      const geo = new THREE.PlaneGeometry(2, 2)
      decayMesh = new THREE.Mesh(geo, decayMat)
      displayMesh = new THREE.Mesh(geo, displayMat)
      decayScene = new THREE.Scene()
      displayScene = new THREE.Scene()
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
      decayScene.add(decayMesh)
      displayScene.add(displayMesh)

      backend = renderer.capabilities?.isWebGL2 ? 'webgl2' : 'webgl'
      ready = true
      disposed = false
      applyParams(params)
      resize()
      clearTargets()
      canvas.dataset.fqResidue = backend
      return { ready: true, backend, webgpu }
    } catch {
      try { renderer?.dispose?.() } catch { /* ignore */ }
      canvas.remove()
      canvas = null
      renderer = null
      return { ...EMPTY, webgpu }
    }
  }

  function setSource(image) {
    if (!THREE || !ready || !image) return
    if (sourceTex && sourceTex !== blankTex) sourceTex.dispose()
    sourceTex = new THREE.Texture(image)
    sourceTex.colorSpace = THREE.SRGBColorSpace
    sourceTex.minFilter = THREE.LinearFilter
    sourceTex.magFilter = THREE.LinearFilter
    sourceTex.generateMipmaps = false
    sourceTex.needsUpdate = true
    if (decayMat) decayMat.uniforms.uSource.value = sourceTex
  }

  function setPhotoRect(rect) {
    if (!rect) return
    photoRect = {
      x: Number(rect.x) || 0,
      y: Number(rect.y) || 0,
      w: Number(rect.w) || 0,
      h: Number(rect.h) || 0,
    }
  }

  function capture(image, rect) {
    if (!ready || disposed) return false
    if (image) setSource(image)
    if (rect) setPhotoRect(rect)
    inject = 1
    if (canvas) canvas.style.visibility = 'visible'
    paint()
    return true
  }

  function startDecay(nextParams) {
    if (!ready || disposed) return false
    if (nextParams) applyParams(nextParams)
    suspended = false
    decaying = true
    startedAt = performance.now()
    progress = 0
    if (canvas) canvas.style.visibility = 'visible'
    if (!raf) raf = requestAnimationFrame(tick)
    return true
  }

  function setProgress(value) {
    progress = Math.min(1, Math.max(0, Number(value) || 0))
    if (ready && !suspended) paint()
  }

  function resize() {
    if (!renderer || !container || disposed) return
    let w = Number(container.clientWidth) || 0
    let h = Number(container.clientHeight) || 0
    if (w < 32) w = Number(window.innerWidth) || 390
    if (h < 32) h = Number(window.innerHeight) || 844
    renderer.setPixelRatio(1)
    renderer.setSize(w, h, true)
    resizeTargets(w, h)
  }

  function suspend() {
    suspended = true
    sleep()
  }

  function resume() {
    suspended = false
  }

  function destroy() {
    disposed = true
    sleep()
    try { sourceTex && sourceTex !== blankTex && sourceTex.dispose() } catch { /* ignore */ }
    try { blankTex?.dispose?.() } catch { /* ignore */ }
    try { rtA?.dispose?.() } catch { /* ignore */ }
    try { rtB?.dispose?.() } catch { /* ignore */ }
    try { decayMat?.dispose?.() } catch { /* ignore */ }
    try { displayMat?.dispose?.() } catch { /* ignore */ }
    try { decayMesh?.geometry?.dispose?.() } catch { /* ignore */ }
    try { renderer?.dispose?.() } catch { /* ignore */ }
    canvas?.remove?.()
    THREE = null
    renderer = null
    canvas = null
    decayMat = null
    displayMat = null
    ready = false
    backend = 'none'
  }

  return {
    init,
    setSource,
    setPhotoRect,
    capture,
    startDecay,
    setProgress,
    setParams: applyParams,
    resize,
    suspend,
    resume,
    destroy,
    sleep,
    interrupt: sleep,
    isReady: () => ready && !disposed,
    isActive: () => decaying,
    getBackend: () => backend,
    hasWebGpu: () => webgpu,
  }
}
