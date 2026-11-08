# Carrigtwohill & District Historical Society

Eleventy static site: `https://carrigtwohillhistoricalsociety.com/`

The custom domain is served from the site root. Leave `pathPrefix` in `src/_data/site.json` empty so CSS, JavaScript, and image URLs are not prefixed with `/website/`. GitHub still redirects `https://carrigtwohill-historical-society.github.io/website/` to that domain.

## Commands

```bash
npm install
npm run validate-places  # fatal/warn checks on src/places/*.md
npm run build-places     # MD → src/data/places.json (never writes MD)
npm start                # local server
npm run build            # validate + build-places + eleventy
```

Map places are edited as Markdown in `src/places/` (committee via Pages CMS). See `docs/PLACES.md` and `docs/EDITING-PLACES.md`.

## Content rules

- Historian prose is frozen — do not rewrite body text.
- Old ASP.NET paths are recorded in `src/data/url-map.json`.
- Contact form: Formspree → society admin. Photo attachments: email and attach the file yourself.

## Source material

- Backup: `D:\chs\website_backup_04072026\OneDrive_1_04-07-2026`
- Place records: `src/places/*.md` (source of truth)
