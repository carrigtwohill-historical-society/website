# Historical map places — how data works

## Source of truth

Each place is a **Markdown file** in `src/places/<id>.md`.

- Humans and **Pages CMS** edit those files.
- `npm run build-places` **reads** them and writes `src/data/places.json` for the map.
- The build **never writes** into `src/places/`.

## Townland

- If `townland` is blank in the Markdown, the build computes it with point-in-polygon against `src/data/carrigtwohill-townlands.geojson`.
- If `townland` is filled in, that value wins (border corrections).

## Status

| Status | Public map / list | Detail page |
|--------|-------------------|-------------|
| `draft` | No | No |
| `published` / `stub` | Yes | Yes |

## Categories

Single source: `src/data/categories.json` (`id`, `label`, `colour`).  
Mirror the same ids/labels in `.pages.yml` when adding a type.

## Validation

`npm run validate-places` (also part of `npm run build`):

- **Fatal:** missing required fields, unknown category, duplicate id, out-of-bounds lat/lng, missing/HEIC images
- **Warn:** Other without `categoryOther`, thin credit/author/sources on substantial notes

## Public tips

Place pages link to the contact form with the place pre-filled.  
Tips go to the society admin email. A human enters accepted content via the CMS — tips are not auto-published.

## Committee editing

See [EDITING-PLACES.md](./EDITING-PLACES.md) (share privately; not linked from the public nav).

## Commands

```bash
npm run validate-places
npm run build-places
npm run build
npm start
```
