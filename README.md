# Carrigtwohill & District Historical Society

Eleventy static site for GitHub Pages: `https://carrigtwohill-historical-society.github.io/website/`

## Commands

```bash
npm install
npm run migrate      # ASPX → Markdown (+ url-map.json)
npm run copy-assets  # images/PDFs from backup
npm run build-places # merge jimmap + MTU pins
npm start            # local server
npm run build        # production build to _site/
```

Or all prep steps:

```bash
npm run prepare-content
npm start
```

## Content rules

- Historian prose is frozen — do not rewrite body text.
- Old ASP.NET paths are recorded in `src/data/url-map.json`.
- Large CIT videos are not in the repo; pages link to the live site until YouTube hosts them.
- Contact form: Formspree. Attachments: email `admin@carrigtwohillhistoricalsociety.com`.

## Source material

- Backup: `D:\chs\website_backup_04072026\OneDrive_1_04-07-2026`
- Map pins: `D:\chs\jimmap\data\places.json` (+ Barryscourt from carrigmapv2)
