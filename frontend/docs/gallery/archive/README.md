# Gallery Archive design lab

Isolated, dev-only exploration of the Galleries page. Read this before starting a new direction.

| Direction | Thesis | Route | Doc |
| --- | --- | --- | --- |
| A — Night Journal | Your Nights, in pictures. A Night is a chapter; weight follows how much of it was photographed | `/__dev/gallery-archive-v3?state=<state>` | [DIRECTION_A](./FANEQO_GALLERY_ARCHIVE_DIRECTION_A.md) |
| B — Tour Contact Sheet | The tour, as it was printed. One continuous proof sheet; a Night is a stamped strip | `/__dev/gallery-archive-b?state=<state>` | [DIRECTION_B](./FANEQO_GALLERY_ARCHIVE_DIRECTION_B.md) |

No direction has been chosen. Nothing in this lab is product truth. Production `/galleries`, `FaneqoGalleryStack.vue`, Living Gallery and the backend stay untouched by lab work.

---

## What a new direction may inherit

**Infrastructure — yes.** The dev-only lab route pattern and its 404 guard outside `import.meta.dev`, the fixture/state-rail mechanic, the local concert photography in `public/labs/gallery-experience/`, the read-only shared utils (`groupArchiveShelves`, `stackPrintRatio`, `archiveVisibilityLabel`, `normalizeFaneqoMediaList`), the Node contract-test shape, and the Playwright capture scripts under `.visual-review/`.

**Composition — no.** A direction's layout must be reasoned from its own thesis, not adopted because a previous direction already solved it.

Specifically, these are Direction B's answers and are **not** the lab's defaults:

- continuous proof-sheet composition
- native-ratio strip geometry (shared strip height, widths from the photograph)
- the sticky tour index
- density-driven hierarchy (the opening strip instead of a hero)

And these are Direction A's answers, equally non-default: the journal margin column, the micro-track span planner, and lead-by-hero-height.

`FaneqoGalleryStack.vue` remains a locked signature primitive in every direction. Wrappers own context; the primitive is never modified.

## The failure condition

If Direction C or D starts looking like Direction B with different spacing — or like Direction A with different spacing — it has failed. Stop, say so, and re-derive the composition from that direction's own thesis before continuing. A direction that cannot state what makes it fundamentally different from every direction before it is not a direction.

Each direction carries its own self-critique in its doc, answering: what makes it fundamentally different, where it is stronger, where it is weaker, and whether it still reads as music photography rather than a media manager.
