# `public/rive/`

Exported `.riv` files for Faneqo live here and are served as static assets.

Do not drop random marketplace files into this folder.

## Planned names

| File | Purpose |
|------|---------|
| `faneqo-echo.riv` | Signature connection + return |
| `faneqo-connection.riv` | Fan List / relationship connection success |
| `faneqo-gallery-memory.riv` | Gallery save/remove feedback in FanPassport |
| `fan-connected.riv` | Fan ↔ artist connected state |
| `message-echo.riv` | Message sent / received feedback |
| `check-in.riv` | Show Mode check-in feedback |

`FaneqoEcho` auto-detects `faneqo-echo.riv` and renders nothing until the branded file exists.

`FaneqoConnectionMotion` auto-detects `faneqo-connection.riv`. Until that file exists it uses a CSS/SVG footprint fallback of the same size.

`FaneqoGalleryMemoryMotion` auto-detects `faneqo-gallery-memory.riv`. Its native button, visible text, gallery access, and Passport request never depend on Rive. The fallback occupies the same footprint and preserves save/remove feedback while the branded file is being authored.

See `docs/rive.md` and `docs/FANEQO_GALLERY_MEMORY_RIVE.md` for the View Model and state-machine contracts.
