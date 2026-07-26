# How to edit historical places (committee & collaborators)

This guide is for people invited to the **carrigtwohill-historical-society** GitHub organisation.  
**Do not publish the CMS link on the public website.** Share this file and the CMS bookmark privately.

## What you can do

- Browse and search places (by name or townland)
- Add photographs, short map notes, and longer text
- Set the type of place (controls pin colour on the public map)
- Move a pin (latitude / longitude)
- Add a new place
- Paste a YouTube URL
- Leave townland blank to auto-fill from the map location, or type a correction

## First-time setup

1. Create a free [GitHub](https://github.com/) account (if you do not have one).
2. Accept the email invite to **carrigtwohill-historical-society**.
3. Open **Pages CMS**: [https://app.pagescms.org](https://app.pagescms.org) and sign in with GitHub.
4. Choose the repository **carrigtwohill-historical-society/website**.
5. Bookmark that page on your phone and computer.

## Everyday editing (including from a phone)

1. Open your Pages CMS bookmark and sign in.
2. Open **Carrigtwohill Historical Society — Places**.
3. Find the place (search or sort) and open it — or choose **New**.
4. Upload photographs (**JPEG / PNG / WebP only** — not HEIC). On iPhone, use “Most Compatible” in Camera settings, or export as JPEG.
5. Add a **caption** and **credit** (who took or owns the photo). Only upload images you have permission to publish.
6. For then/now: put the older photo first, with captions such as “c. 1920” and “2026”.
7. Edit the short map note and full notes as needed.
8. Set **Status**:
   - **Draft** — only in the editor (default for new places; not on the public site)
   - **Published** / **Stub** — appears on the public map and list after the site rebuilds (a few minutes)
9. Save. GitHub Pages rebuilds automatically.

## Townland

Leave **Townland** empty to use the automatic value from the pin’s location.  
Fill it in only when the pin sits on a border and the automatic name is wrong.

## Type of place

Choose from the dropdown. That choice sets the pin colour.  
If you choose **Other**, fill in “If Other — describe the type” so we can add a proper category later.

## Moving a pin

Edit **Latitude** and **Longitude** (decimal degrees). Tip: in Google Maps, long-press a spot → copy the coordinates.

## If the CMS is too awkward

Email a note or photo to **admin@carrigtwohillhistoricalsociety.com**.  
**Attach the photo yourself** in your email app (a mailto link cannot attach files for you).  
A committee member will enter accepted material into the place record.

## If something you saved does not appear

The site may still be rebuilding, or the build may have failed (for example a missing place name or bad coordinates).  
Aidan is notified when a deploy fails — contact him if your change is missing after 10–15 minutes.

## For Aidan: categories

Place types live in `src/data/categories.json`.  
The CMS dropdown in `.pages.yml` **mirrors** that list (Pages CMS cannot load the JSON automatically).  
When you add a type, update **both** files.
