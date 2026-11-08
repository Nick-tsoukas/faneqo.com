# Living Gallery vs Fancybox — development benchmark

Lab-only. Fancybox is **not** installed and must not be installed. This is a usability/quality checklist against a mature lightbox, judged on the isolated Living Gallery at `/__dev/gallery-experience`.

Assets: seven ~1024px Basement East fixtures. Do not treat their resolution as production.

**Scope:** this measures whether our gesture physics are broken relative to a mature viewer. It cannot establish Faneqo quality. Beating Fancybox on composition or identity is not evidence of signature quality — that judgement is absolute and belongs to the Visual Critic gate and founder review (LG-D025).

**REAL DEVICE NOT TESTED.** Browser emulation only. Touch claims below are therefore provisional.

| Area | Requirement | Faneqo now | Notes |
| --- | --- | --- | --- |
| Open | equal/better | **Tie (provisional)** | PhotoSwipe zoom + `getThumbBoundsFn`. Not frame-proven against Fancybox. Thumbs are the same 1024px files. |
| Swipe | equal/better | **Tie (provisional)** | PhotoSwipe v5 owns it. Rapid flicks / reverse / edge slides not finger-tested. |
| Pinch | equal/better | **Tie (provisional)** | PhotoSwipe pinch. Not real-device tested. Desktop secondary zoom now allows >1× when already at fit. |
| Pan | equal/better | **Tie (provisional)** | Zoomed drag should pan, not navigate. Not finger-tested. |
| Close gesture | equal/better | **Tie (provisional)** | `closeOnVerticalDrag` + pinch-close. Cancelled close not tested. |
| Portrait composition | better | **Win (desktop); mixed (phone)** | Desktop/ultrawide left-weighted editorial. Phone portraits fill width; fixtures are near-square so they are not tall spectacles. |
| Landscape composition | better | **Win (phone); mixed (desktop)** | Phone ~full width, optical vertical. Desktop 1024px fixtures stay 1024px — authored black field, not a filled monitor. |
| Desktop composition | better | **Win vs a leaked mobile max-width; not yet vs a high-res Fancybox fill** | Architecture ready for large derivatives. Current fixtures cannot honestly fill 1920. |
| Chrome restraint | better | **Win** | Default is black + photograph. Tap reveals close / index / Night context. |
| Object continuity | better | **Not yet a win** | Zoom-from-thumb is the right mechanism. Duplicate-crossing / jump not proven. |
| Night context | better | **Win** | Artist / venue / city · date. Photographer line only if present (fixtures have none). |
| PWA Back behavior | better | **Win (architecture); unverified on Android** | One `#living-gallery` entry. Back closes viewer. Swipes do not push. |
| Faneqo identity | far better | **Win on restraint; not yet on feel** | Identity is black, type, composition. It is not a Fancybox skin. It is also not yet a finished product Gallery. |

## Verdict

Faneqo is **calmer and more authored** than a conventional lightbox on chrome, Night context, and composition rules.

Faneqo has **not** earned “feels better than Fancybox” on a phone, because pinch, flick, swipe-down close, and Android Back were not tested on a real device.

If both showed these exact 1024px photographs on a 1920 desktop, Fancybox would look similarly modest. Our job when real derivatives arrive is to fill the authored box. That path exists. It is not proven.

Do not award a win because we built it.
