/**
 * Persistent GPU Photographic Stage.
 * One renderer. One fullscreen field. The photograph stays in PhotoSwipe.
 *
 * Capability:
 *   WebGL2 ShaderMaterial
 *     ↓
 *   WebGL1 ShaderMaterial
 *     ↓
 *   CSS Matte & Stage (caller)
 *
 * Three r170 WebGPURenderer does not run ShaderMaterial (NodeMaterial/TSL required).
 * This V1 does not add a second TSL material stack. WebGPU is probed, not required.
 */

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

const FRAG = `
precision highp float;

uniform sampler2D uField;
uniform vec3 uDeep;
uniform vec3 uHighlight;
uniform vec3 uHaze;
uniform vec3 uPersist;
uniform vec4 uPhotoRect;
uniform vec2 uHighlightXY;
uniform vec2 uPersistXY;
uniform float uIntensity;
uniform float uSpill;
uniform float uHazeAmt;
uniform float uHighlightAmt;
uniform float uHighlightRad;
uniform float uBlack;
uniform float uFidelity;
uniform float uChroma;
uniform float uPersistAmt;
uniform float uOpacity;

varying vec2 vUv;

float luma(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

vec3 maybeGrey(vec3 c) {
  float y = luma(c);
  float keep = smoothstep(0.02, 0.10, uChroma);
  return mix(vec3(y), c, keep);
}

vec3 sampleField(vec2 uv) {
  vec2 tUv = clamp(uv, 0.02, 0.98);
  vec3 regional = texture2D(uField, tUv).rgb;
  float y = clamp(uv.y, 0.0, 1.0);
  vec3 fallback = mix(uDeep, mix(uHaze, uHighlight, 0.62), smoothstep(0.12, 0.88, y));
  fallback = mix(fallback, uHighlight, smoothstep(0.55, 1.0, luma(uHighlight)) * 0.22);
  if (luma(regional) < 0.03) regional = fallback;
  else regional = mix(fallback, regional, mix(0.35, 0.9, clamp(uFidelity, 0.0, 1.0)));
  return mix(uDeep, regional, mix(0.82, 1.0, clamp(uFidelity, 0.0, 1.0)));
}

void main() {
  vec2 uv = vUv;
  vec4 pr = uPhotoRect;
  vec2 photoUv = (uv - pr.xy) / max(pr.zw, vec2(0.0001));
  vec2 clamped = clamp(photoUv, 0.0, 1.0);
  vec2 over = photoUv - clamped;
  float outside = length(over);
  float inside = 1.0 - step(0.0015, outside);

  vec3 field = maybeGrey(sampleField(clamped));
  float fieldL = luma(field);

  vec2 aniso = abs(over) / vec2(mix(0.70, 0.38, uSpill), mix(0.52, 0.24, uSpill));
  float dist = length(aniso);
  float spill = exp(-dist * mix(1.05, 0.42, uSpill));
  spill *= mix(1.15, 1.75, uSpill);
  spill *= mix(0.45, 1.0, smoothstep(0.008, 0.08, fieldL));
  spill *= (1.0 - inside);

  vec2 hScreen = pr.xy + uHighlightXY * pr.zw;
  vec2 hRad = vec2(0.24 + uHighlightRad * 0.58, 0.20 + uHighlightRad * 0.46);
  vec2 hDelta = (uv - hScreen) / max(hRad, vec2(0.04));
  float halo = exp(-dot(hDelta, hDelta)) * uHighlightAmt;
  halo *= mix(1.0, 0.16, inside);

  float haze = exp(-dot(hDelta * 1.22, hDelta * 1.22)) * uHazeAmt;
  haze *= mix(1.0, 0.10, inside);

  vec2 pDelta = (uv - uPersistXY) / vec2(0.16, 0.20);
  float persist = exp(-dot(pDelta, pDelta) * 5.2) * uPersistAmt;

  vec2 photoCenter = pr.xy + pr.zw * 0.5;
  float fromPhoto = length((uv - photoCenter) / max(pr.zw * vec2(0.70, 1.05), vec2(0.08)));
  float voidMask = smoothstep(1.25, 2.7, fromPhoto);

  vec3 deep = maybeGrey(uDeep);
  vec3 hi = maybeGrey(uHighlight);
  vec3 hz = maybeGrey(uHaze);
  vec3 emit = mix(hz, hi, 0.55);
  emit = mix(emit, field, 0.45);

  float rim = exp(-outside * mix(4.2, 1.6, uSpill)) * (1.0 - inside);
  rim *= mix(0.7, 1.35, uSpill);

  vec3 color = deep;
  color = mix(color, emit, clamp(max(spill, rim) * uIntensity, 0.0, 0.88));
  color = mix(color, hi, clamp(halo * 0.66 * uIntensity, 0.0, 0.60));
  color += hz * haze * uIntensity * 0.48;
  color += maybeGrey(uPersist) * persist;
  color = mix(color, deep * 0.10, voidMask * uBlack);
  color *= uOpacity;

  gl_FragColor = vec4(color, 1.0);
}
`

function hexToRgb01(hex) {
  const raw = String(hex || '000000').replace('#', '')
  if (raw.length === 3) {
    return [
      parseInt(raw[0] + raw[0], 16) / 255,
      parseInt(raw[1] + raw[1], 16) / 255,
      parseInt(raw[2] + raw[2], 16) / 255,
    ]
  }
  if (raw.length !== 6) return [0, 0, 0]
  return [
    parseInt(raw.slice(0, 2), 16) / 255,
    parseInt(raw.slice(2, 4), 16) / 255,
    parseInt(raw.slice(4, 6), 16) / 255,
  ]
}

function hexToVec3(THREE, hex) {
  const [r, g, b] = hexToRgb01(hex)
  return new THREE.Vector3(
    Number.isFinite(r) ? r : 0,
    Number.isFinite(g) ? g : 0,
    Number.isFinite(b) ? b : 0,
  )
}

function hexToBytes(hex) {
  const [r, g, b] = hexToRgb01(hex)
  return [
    Math.round(Math.min(1, Math.max(0, r)) * 255),
    Math.round(Math.min(1, Math.max(0, g)) * 255),
    Math.round(Math.min(1, Math.max(0, b)) * 255),
    255,
  ]
}

function probeWebGpu() {
  try {
    return typeof navigator !== 'undefined' && typeof navigator.gpu !== 'undefined'
  } catch {
    return false
  }
}

export async function createGpuStage(container) {
  if (typeof window === 'undefined' || !container) {
    return { backend: 'css', ready: false, webgpu: false, setState() {}, render() {}, resize() {}, dispose() {} }
  }

  let THREE
  try {
    THREE = await import('three')
  } catch {
    return { backend: 'css', ready: false, webgpu: probeWebGpu(), setState() {}, render() {}, resize() {}, dispose() {} }
  }

  const canvas = document.createElement('canvas')
  canvas.className = 'fq-stage__gpu'
  canvas.setAttribute('aria-hidden', 'true')
  container.appendChild(canvas)

  let renderer
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
      preserveDrawingBuffer: true,
    })
  } catch {
    canvas.remove()
    return { backend: 'css', ready: false, webgpu: probeWebGpu(), setState() {}, render() {}, resize() {}, dispose() {} }
  }

  try {
  renderer.setClearColor(0x000000, 1)
  renderer.autoClear = true
  renderer.toneMapping = THREE.NoToneMapping
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace

  const fieldData = new Uint8Array(3 * 3 * 4)
  fieldData.fill(0)
  const fieldTex = new THREE.DataTexture(fieldData, 3, 3, THREE.RGBAFormat)
  fieldTex.magFilter = THREE.LinearFilter
  fieldTex.minFilter = THREE.LinearFilter
  fieldTex.wrapS = THREE.ClampToEdgeWrapping
  fieldTex.wrapT = THREE.ClampToEdgeWrapping
  fieldTex.generateMipmaps = false
  fieldTex.unpackAlignment = 1
  fieldTex.needsUpdate = true
  fieldTex.colorSpace = THREE.LinearSRGBColorSpace

  const uniforms = {
    uField: { value: fieldTex },
    uDeep: { value: new THREE.Vector3() },
    uHighlight: { value: new THREE.Vector3(1, 1, 1) },
    uHaze: { value: new THREE.Vector3() },
    uPersist: { value: new THREE.Vector3() },
    uPhotoRect: { value: new THREE.Vector4(0.08, 0.32, 0.84, 0.36) },
    uHighlightXY: { value: new THREE.Vector2(0.5, 0.4) },
    uPersistXY: { value: new THREE.Vector2(0.5, 0.4) },
    uIntensity: { value: 0.62 },
    uSpill: { value: 0.58 },
    uHazeAmt: { value: 0.2 },
    uHighlightAmt: { value: 0.64 },
    uHighlightRad: { value: 0.38 },
    uBlack: { value: 0.9 },
    uFidelity: { value: 0.92 },
    uChroma: { value: 0.1 },
    uPersistAmt: { value: 0 },
    uOpacity: { value: 1 },
  }

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: FRAG,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  scene.add(mesh)

  let disposed = false
  const backend = renderer.capabilities?.isWebGL2 ? 'webgl2' : 'webgl'

  function writeField(cellsIn) {
    if (!cellsIn?.length) return
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        const src = cellsIn[row * 3 + col]
        const destRow = 2 - row
        const bytes = hexToBytes(src?.hex)
        const i = (destRow * 3 + col) * 4
        fieldData[i] = bytes[0]
        fieldData[i + 1] = bytes[1]
        fieldData[i + 2] = bytes[2]
        fieldData[i + 3] = 255
      }
    }
    fieldTex.needsUpdate = true
  }

  function resize() {
    if (disposed) return
    let w = Number(container.clientWidth) || 0
    let h = Number(container.clientHeight) || 0
    if (w < 32) w = Number(window.innerWidth) || 390
    if (h < 32) h = Number(window.innerHeight) || 844
    renderer.setPixelRatio(0.5)
    renderer.setSize(w, h, true)
  }

  function setState({ field, rect, persist, tuning, opacity } = {}) {
    if (disposed) return
    writeField(field?.cells)
    uniforms.uDeep.value.copy(hexToVec3(THREE, field?.deep?.hex))
    uniforms.uHighlight.value.copy(hexToVec3(THREE, field?.highlight?.hex))
    uniforms.uHaze.value.copy(hexToVec3(THREE, field?.haze?.hex))
    uniforms.uHighlightXY.value.set(field?.highlight?.x ?? 0.5, 1 - (field?.highlight?.y ?? 0.4))
    uniforms.uChroma.value = Number(field?.chroma) || 0
    if (rect) {
      uniforms.uPhotoRect.value.set(rect.x, 1 - rect.y - rect.h, rect.w, rect.h)
    }
    uniforms.uPersist.value.copy(hexToVec3(THREE, persist?.hex))
    uniforms.uPersistXY.value.set(persist?.x ?? 0.5, 1 - (persist?.y ?? 0.4))
    uniforms.uPersistAmt.value = Number(persist?.energy) || 0
    uniforms.uIntensity.value = Number(tuning?.matteIntensity) || 0.62
    uniforms.uSpill.value = Number(tuning?.lightSpread) || 0.58
    uniforms.uHazeAmt.value = Number(tuning?.haze) || 0.2
    uniforms.uHighlightAmt.value = Number(tuning?.highlightIntensity) || 0.64
    uniforms.uHighlightRad.value = Number(tuning?.highlightRadius) || 0.38
    uniforms.uBlack.value = Number(tuning?.darkness) || 0.9
    uniforms.uFidelity.value = Number(tuning?.spatialFidelity) || 0.92
    uniforms.uOpacity.value = Math.min(1, Math.max(0, Number(opacity) ?? 1))
  }

  function render() {
    if (disposed) return
    renderer.render(scene, camera)
  }

  function dispose() {
    disposed = true
    fieldTex.dispose()
    material.dispose()
    mesh.geometry.dispose()
    renderer.dispose()
    canvas.remove()
  }

  resize()
  canvas.dataset.fqBackend = backend
  return {
    backend,
    ready: true,
    webgpu: probeWebGpu(),
    canvas,
    setState,
    render,
    resize,
    dispose,
  }
  } catch {
    try { renderer?.dispose?.() } catch {}
    canvas.remove()
    return { backend: 'css', ready: false, webgpu: probeWebGpu(), setState() {}, render() {}, resize() {}, dispose() {} }
  }
}
