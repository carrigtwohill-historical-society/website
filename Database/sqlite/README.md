# SQLite migration workflow

This folder contains the SQLite database and the import pipeline used to load the confirmed project tables from Access exports.

## Files

- `schema.sql` – main database schema for the project data
- `table_map.json` – mapping between Access table names and SQLite table names
- `import_project_data.py` – imports CSV/XLSX exports into SQLite and validates the result
- `project.db` – generated SQLite database file created by the import script

## Notes

- The IRA medals database is separate and is not included in this project schema.
- Export tables such as `WebsiteExportCivil` and `WebsiteExportInterred` are treated as staging or derived files.
- The Access table names are kept as the source-of-truth labels.

## Usage

From the repository root:

```bash
python Database/sqlite/import_project_data.py
```

Optional overrides:

```bash
python Database/sqlite/import_project_data.py --raw-dir "Database/raw" --db "Database/sqlite/project.db" --reset
```

This script will:

1. read the raw CSV/XLSX files from `Database/raw/`
2. map file/table names using `table_map.json`
3. load the schema from `schema.sql`
4. insert rows into the matching SQLite tables
5. print row counts as validation
