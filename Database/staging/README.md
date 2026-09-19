# Staging data

This folder holds cleaned and normalized data ready for SQLite import.

## Typical contents

- cleaned CSV files
- deduplicated table dumps
- mapping files
- lookup tables
- transformation scripts

## Rules

- Keep a one-way flow: raw -> staging -> SQLite.
- Track changes and assumptions in a migration note or SQL script.
- Name files consistently, for example:
  - `people_clean.csv`
  - `places_clean.csv`
  - `interments_clean.csv`
