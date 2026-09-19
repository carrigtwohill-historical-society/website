# Database migration workspace

This folder is reserved for the Access-to-SQLite migration and for later query views.

## Directory layout

- `raw/` - original Access exports, spreadsheet extracts, and untouched source files.
- `staging/` - cleaned, normalized, and deduplicated data before import into SQLite.
- `sqlite/` - SQLite database files, schema, and migration scripts.
- `queries/` - reusable SQL views and reporting queries.

## Rules

- Do not edit source exports in `raw/`.
- Keep transformation scripts and cleaned tables under `staging/`.
- Treat SQLite as the canonical working database after import.
- Put all later query views under `queries/` rather than mixing them into the web app.
- Keep a migration log for each source table and mapping decision.

## Intended workflow

1. Export data from Access into `raw/`.
2. Standardize names, types, and null handling in `staging/`.
3. Create final schema in `sqlite/`.
4. Load cleaned data into SQLite.
5. Build query views in `queries/`.

This structure is intended to keep the historical data work separate from the website content migration.
