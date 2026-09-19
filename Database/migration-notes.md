# Database migration notes

## Purpose

This folder is for the transition from Access-era data to a SQLite-based working database.

## Current status

- No SQLite database file has been created yet.
- No Access-to-SQLite import scripts are active yet.
- This repo is still primarily a website/content migration project.

## Planned workflow

1. Export raw tables from Access into `Database/raw/`.
2. Clean names and null values in `Database/staging/`.
3. Create final tables in `Database/sqlite/schema.sql`.
4. Load the cleaned data into SQLite.
5. Build query views under `Database/queries/`.

## Considerations

- Keep the original Access extracts unchanged.
- Use a single canonical SQLite database for reporting and later views.
- Build a mapping document for each table before loading data.
- Keep every view tied to a named business purpose, not to a raw export name.

## Future view examples

- `v_people_summary`
- `v_places_by_parish`
- `v_interments_by_cemetery`
- `v_events_calendar`

This is a starting point for the first working database model.
