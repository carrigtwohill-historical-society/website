# Historical map places — how to add or edit

## What you edit

Each place on the map is a **Markdown file** in:

`src/places/<id>.md`

Example: `src/places/ballyannan-castle.md`

After editing, regenerate the map data:

```bash
npm run build-places
npm run build
```

(Or `npm start` while developing — run `build-places` after place edits.)

## File format

```markdown
---
id: ballyannan-castle
name: "Ballyannan Castle"
lat: 51.89694
lng: -8.16928
layer: places
category: "Castle"
categories:
  - "castles-antiquities"
eras:
  - "1600s"
preview: "Short blurb for the map popup."
author: "Jim Barry"
status: published
sources:
  - "Griffith's Valuation"
---

Longer notes for the place go here (optional for now).
Committee members can expand these over time.
```

### Map popup & detail page

Every marker popup always shows:

1. **Photograph** — real image, or a “Photograph to be added” placeholder  
2. **Short notes** — `preview` text, or a “Notes to be added” placeholder  
3. **Further information** — links to `/map/places/<id>/` (detail page with the same placeholders until filled)

Filling `preview`, the body text under the `---`, and `heroImage` replaces the blanks.

## Required fields

| Field | Meaning |
|-------|---------|
| `id` | URL-safe id, no spaces (e.g. `knockaheem-forge`) |
| `name` | Label on the map |
| `lat` / `lng` | Coordinates (decimal degrees) |
| `status` | Use `published` to show on the map; `draft` to hide later if we filter |

### Useful optional fields

| Field | Meaning |
|-------|---------|
| `preview` | Short popup text |
| `category` / `categories` | Grouping (castles, churches, forges…) |
| `eras` | Time periods |
| `author` | Who wrote the note |
| `sources` | References |

## Who can edit (planned)

For now: Aidan via GitHub.

Later (committee-friendly, still not open to the public):

1. Invite named committee members as GitHub collaborators on `website`
2. They edit a place file in the GitHub website (no install needed)
3. Protect the `main`/`master` branch so changes go through a short review

We can add a simple form-to-PR tool later if typing YAML feels awkward.

## Do not put in the public map files

- Personal emails/phones of living people
- Petition / membership private data
- Anything the committee has not agreed to publish

## Data sources merged into the map

- **carrigmapv2** stories (best written notes + Barryscourt)
- **jimmap** `places.json` (coordinates, some images/sections)
- **MTU exhibit** pins (red circles → live video pages for now)
- **Townlands**: `src/data/carrigtwohill-townlands.geojson` (208 local townlands from carrigmapv2)
