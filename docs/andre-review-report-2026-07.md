# André Review Fixes — Report (July 2026)

**Branch:** `fix/andre-review-2026-07`  
**Repo (actual):** `carrigtwohill-historical-society/website` (brief said `duinneacha/CHS-Proto`; that repo was transferred/renamed)  
**Local path:** `D:\chs\chs_website`  
**Build:** `npm run build` succeeded (existing place-validation warnings only; no new build errors)

---

## Section A — Audit findings

### Styling approach
- **Plain global CSS only.** No Tailwind.
- Global stylesheet: [`src/css/site.css`](../src/css/site.css), linked from [`src/_includes/layouts/base.njk`](../src/_includes/layouts/base.njk).
- Width tokens: `--max: 68rem` (main), `--header-max: 76rem` (header).

### Layouts / includes / width
- Base: `layouts/base.njk` → `<main class="site-main">`.
- Content pages: `layouts/page.njk` → `.page` → `.page-body.prose`.
- Place pages: `layouts/place.njk`.
- Width: `.site-main { max-width: var(--max); margin: 0 auto; }`.
- Body copy often uses `<p class="indentedText">`. Pre-fix definition had **`max-width: 42rem`** and invalid **`text-align:justified`** — major cause of the “large right-hand gap / lopsided” look (G1 / P7).

### External links
- No markdown-it link plugin / shortcode for external links.
- Links are mostly **raw HTML** in migrated Markdown.
- Nav supports `external: true` → `target="_blank" rel="noopener noreferrer"` in `header.njk`.
- **G2 mechanism chosen:** Eleventy HTML transform `externalLinks` in [`eleventy.config.js`](../eleventy.config.js) — absolute `http(s)` links whose host is not the society GitHub Pages host get `target="_blank" rel="noopener noreferrer"`; path-absolute / relative / mailto links are untouched.

### `IndentedText` / `FigureCaption`
- Exact names **`IndentedText`** / **`FigureCaption`** are **not** defined as CSS classes in the live stack.
- Live site uses camelCase **`.indentedText`**. Pre-fix definition:

```css
.indentedText {
  margin: 0.85rem 0;
  max-width: 42rem;
   text-align:justified;  /* INVALID — should be justify */
}
```

- Legacy backup/scraped CSS (`D:\chs\current-site-scraped\Styles\Sitemaster.css`) defines:

```css
.indentedText, IndentQuotes {
    font-family: Cambria, Cochin, Georgia, Times, "Times New Roman", serif;
    font-size: 18px;
    font-style: normal;
    font-weight: normal;
    font-variant: inherit;
    text-align: justify;
}

.indentedText {
    width: 90%;
    margin-left: 5%;
    margin-right: 5%;
    font-size: 18px;
    font-style: normal;
    font-weight: normal;
    font-variant: inherit;
    text-align: justify;
}
```

- Captions in legacy CSS use standard **`figcaption`**, not `FigureCaption`:

```css
figcaption {
    border-bottom: none;
    caption-side: bottom;
    font-family: Cambria, Cochin, Georgia, Times, "Times New Roman", serif;
    font-weight: bold;
    font-style: italic;
    font-size: 16px;
    text-align: center;
    color: blueviolet;
}
```

- **`FigureCaption`** appeared as a **custom HTML element** in `barrack-story.md` (André’s recent edit). That is not a CSS class; browsers treat unknown elements inconsistently → unwanted breaks (P9). Fixed to `<figcaption>`.

### Content format
- Markdown + YAML frontmatter (HTML bodies from ASPX migrate), some Nunjucks.
- New page: add under `src/content/…`, optional nav entry in `src/_data/navigation.json`, assets under `src/assets/`.

### MTU / village-map assets (P4)
- Interactive map page: `src/content/cit-interactive/cit-map.njk`.
- Map art: `src/assets/CITInteractive/Images/InteractiveMap.png` with hotspot overlays (no iframe).
- Section hub: `src/content/cit-interactive/index.njk`.
- Film pages: `cit-abbey-ruins.md`, `cit-convent.md`, etc. under same folder.
- **P4 “image6”:** if André means a *different* map than `InteractiveMap.png` (e.g. Historic Environment Viewer embed), that asset/URL is **not** identified in-repo — needs André input. Current interactive map **is** already on the MTU map page.

### “Car” PNG on RIC Barracks (P8)
- No `Car.png` in the tree.
- Barrack story uses:  
  `src/assets/Events/Projects And Events/Past Events/Taking of the Barracks/ExternalView.png`
- PNG **color type 6 = RGBA** (alpha channel present). Corner samples decode as fully transparent.
- White appearance was **CSS**: `.prose img { background: var(--white); }` painted opaque white behind the transparent PNG. **Not** a missing-alpha asset problem.

### Barrett’s Forge (P10)
- **Already migrated:** `src/content/local-history/village-traders/barretts/barrets-forge.md`  
  Permalink `/local-history/village-traders/barretts/barrets-forge/`.
- Was **not** in `navigation.json` (now added under Local History).
- Backup ASPX:  
  `D:\chs\website_backup_04072026\OneDrive_1_04-07-2026\Local History\Village Traders\Barretts\BarretsForge.aspx`
- Assets present under `src/assets/Local History/Village Traders/Barretts/`.

### Other notes
- Membership banner lives in **`layouts/page.njk`** for the membership URL only — was above body; now below (P2).
- Archaeology GoFundMe was broken across lines with `Target="_blank"`; G2 transform now supplies `target`/`rel` systemically.
- Repo in brief (`duinneacha/CHS-Proto`) ≠ current production remote.

### Audit contradictions / flags before Phase 2
| Item | Flag |
|------|------|
| P1 header | André’s revised header image/spec not found in `D:\chs\Andre` or repo — **Blocked** pending asset/spec. |
| P3 MTU structure | **Needs-decision** — do not delete/merge. |
| P4 map | Clarify if `InteractiveMap.png` is enough or a separate map/embed is required. |
| P6 film links | Film **page** routes work; **video files** (`src/assets/Videos/*.mp4`) are missing from the repo. |
| P8 | CSS diagnosis confirmed; fixed. |
| P10 | Page existed; nav + fidelity check (no rewrite). |

---

## Section B — Per-item status table

| Item | Status | Files changed | What I did | How to verify | Notes/assumptions |
|------|--------|---------------|------------|---------------|-------------------|
| G1 | Done | `src/css/site.css` | Diagnosed as both: invalid `text-align:justified` **and** `max-width: 42rem` on `.indentedText`. Set `text-align: justify` on `.prose p` / `.indentedText`; removed narrow max-width so copy uses full content column (`--max`). | Desktop + mobile: Home, Archaeology, RIC Barracks — body justified, no large empty right gutter inside `.site-main`. | Honour André preference for justify. |
| G2 | Done | `eleventy.config.js` | Added `externalLinks` transform for absolute external `http(s)` links → `target="_blank" rel="noopener noreferrer"`. | Archaeology GoFundMe opens new tab with noopener/noreferrer; internal `/website/…` links have no `target`. | Hosts treated as internal: `carrigtwohill-historical-society.github.io`, localhost. |
| P1 | Blocked | — | Did not invent header text/assets. | — | Need André’s emailed/header image (review “image1”) or exact markup/spec. |
| P2 | Done | `src/_includes/layouts/page.njk` | Moved membership banner **below** `.page-body`. | `/membership/current-membership/` — banner after body copy. | Layout-only. |
| P3 | Needs-decision | — | No delete/merge. Proposal below in Section C. | — | Awaiting Aidan/André. |
| P4 | Partial | — | Interactive map (`InteractiveMap.png` + hotspots) already on `/cit-interactive/cit-map/`. Did not add a second unknown “image6”. | Open MTU map page; confirm if this is the intended map. | Need confirmation or alternate asset/URL. |
| P5 | Done | `src/content/cit-interactive/index.njk` | Removed duplicate Site films list from MTU hub; films remain in map Key on `cit-map.njk`. | Hub has About + Map links only; Key on map page lists all films. | Structure move only. |
| P6 | Blocked | — | Diagnosed: film page URLs resolve; video `<source src="/assets/Videos/….mp4">` targets a folder that **does not exist** in the repo. No Vimeo/YouTube IDs found for these exhibits. | Open any film page — page loads; video player has no file. | Need MP4s or host URLs (Vimeo preferred per convention). |
| P7 | Done | `src/css/site.css`, `archaeology.md` | Ported justified full-width `.indentedText` from legacy intent; removed Archaeology line-break workaround around GoFundMe (wording unchanged). | Archaeology GoFundMe sits mid-sentence; text full-width justified. | Flagged: reconstructed from legacy + fix of invalid property (not inventing historical text). |
| P8 | Done | `src/css/site.css` | Confirmed RGBA alpha on `ExternalView.png`; removed `.prose img { background: var(--white); }`. | Barracks page — car/external view shows page paper through transparent areas, not a white matte box. | File was fine; CSS was the cause. |
| P9 | Done | `barrack-story.md`, `site.css` | Replaced `<FigureCaption>` with `<figcaption>`; ensured `display: block` caption styling. | Captions sit under figures without forced odd break. | Caption **text** unchanged. |
| P10 | Partial | `navigation.json` | Page already present; added **Barrett's Forge** to Local History nav. Did not rewrite body. | Nav → Barrett's Forge; page builds. | Page still contains empty legacy petition table markup from migrate — flag if André wants that cleaned (would be structural, not history rewrite). |
| P11 | Done | `townlands.md`, `site.css` | Fixed `class ="TableNumbers"` attribute typo; added `.CentreTable` / table class styles ported from legacy. | Townlands table readable, aligned numbers, scrollable on mobile. | Content cells unchanged. |

---

## Section C — Items needing a human decision or input

1. **P1 — Revised header**  
   Need André’s header design asset and/or exact text/markup from the review email (“image1”). Nothing matching found under `D:\chs\Andre` or in-repo. Do not invent.

2. **P3 — MTU standalone page vs fold into About**  
   **Proposal (not implemented):**
   - Keep `/cit-interactive/cit-map/` as the interactive map destination.
   - On **About** (`/about/about-us/` or the MTU “About this project” page `/cit-interactive/cit-interactive-map/`): add a single existing link out to the Interactive Village Map (faithful existing wording only — no new history text).
   - Optionally retire `/cit-interactive/` hub from nav by pointing “Munster Technical University (MTU)” nav item directly at the map or the About-project page.
   - **Do not delete** film pages or map page without André’s OK.  
   **Need:** André/Aidan choose: keep hub, or merge nav target, and which About page receives the link.

3. **P4 — “Add the map” (image6)**  
   Confirm whether `InteractiveMap.png` on `/cit-interactive/cit-map/` satisfies the request. If not, supply the image file, iframe/embed URL, or Historic Environment Viewer link and the exact page + position.

4. **P6 — Film media URLs / files**  
   Need either:
   - Upload the seven exhibit MP4s into `src/assets/Videos/` with the names referenced by the film pages, **or**
   - Provide Vimeo (preferred) / YouTube URLs per film so players can be pointed at hosted media.  
   Current temporary “watch on society website” ASPX links are not a durable fix.

5. **P7 — `.indentedText` port**  
   Please confirm the ported full-width justified treatment matches André’s intended look (legacy used ~90% width + 5% side margins; we used full content column to fix the “lopsided / not quite full” complaint).

6. **P10 — Barrett’s Forge empty petition table**  
   Migrated page still has an empty ASP.NET-style table (`auto-style5`) where a petition form once lived. Confirm whether to leave as faithful migrate, or remove empty markup only (no historical prose change).

---

## Section D — Content integrity statement

**No historical content was authored or altered. Migrated/moved content (list which) is a faithful copy of existing material.**

| Page / area | Content handling |
|-------------|------------------|
| Global CSS / Eleventy transform | Layout/behaviour only |
| Membership layout | Banner **moved** below body (same markup) |
| MTU hub (`cit-interactive/index.njk`) | Duplicate Site films list **removed** (links already on map Key); remaining hub text **left untouched** |
| Archaeology | Line-break workaround **removed**; GoFundMe wording **unchanged** |
| RIC Barracks story | Caption tags markup-only (`FigureCaption` → `figcaption`); caption/history text **unchanged** |
| Townlands | Attribute spacing + CSS only; cell text **unchanged** |
| Barrett’s Forge | Body **left untouched**; nav entry added |
| Home / About / other history pages | Historical prose **left untouched** (G1/G2 apply via CSS/transform only) |

---

## Section E — Git summary

- **Branch:** `fix/andre-review-2026-07`
- **Commits (this work):**
  - `9b86889` — Fix justified full-width prose and open external links in new tabs. (CSS G1/P7/P8/P9/P11 styles + G2 transform)
  - `6993c45` — Apply André review page fixes without rewriting history text. (P2, P5, P9 markup, P10 nav, P11 typo, Archaeology linebreak)
  - *(this file)* — Document André review audit and fix status for July 2026.
- Earlier branch commits from André (image/caption/`justified` experiments) remain in history above these.
- **Ready for PR?** Yes for the implemented items, **after** human review of Section C blockers. Not pushed to `main`.
- **Secrets / `.bak`:** None staged or committed. Untracked local files left alone: `deploy-log.txt`, helper `scripts/*.py` unrelated to this brief. `src/data/places.json` rebuild noise from `npm run build` was **reverted** and not committed.

---

## Section F — Anything unexpected

- Brief repo name `duinneacha/CHS-Proto` is outdated; work is on `carrigtwohill-historical-society/website`.
- André had already committed `text-align:justified` (invalid) and `<FigureCaption>` on this branch — those were corrected rather than left as-is.
- MTU “broken film links” are primarily **missing video binaries**, not bad hrefs to the film pages.
- `npm run build` regenerates `src/data/places.json` (incidental diffs); that file was not included in these commits.
- Place validation still emits 8 pre-existing “empty sources” warnings; unrelated to this review.
- Transparent PNGs will now show the site paper background through alpha (intended); if André wants a pure white page behind that one figure only, that would be a separate, scoped style.

---

*End of report.*
