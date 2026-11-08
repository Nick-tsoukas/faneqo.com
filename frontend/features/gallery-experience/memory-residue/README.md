# Memory Residue (lab experiment)

LG-MOT-12 / LG-TEC-15. **Off by default.** Not product chrome.

| | |
| --- | --- |
| Available | Three r170 `WebGLRenderer`. `navigator.gpu` is probed only. |
| Selected | WebGL2 ShaderMaterial ping-pong (WebGL1 if WebGL2 is absent). |
| Why | Three r170 `WebGPURenderer` does not run `ShaderMaterial` (needs NodeMaterial/TSL). A fragile WebGPU port would not improve this slice. |
| Upgrade | Same `createMemoryResidueRenderer` contract + TSL decay/display materials. No new dependency until that port exists. |
| Fallback | Experiment does nothing. Viewer stays pure black + photograph. |
| Reduced motion | Experiment does not run. |

PhotoSwipe never imports this module.
