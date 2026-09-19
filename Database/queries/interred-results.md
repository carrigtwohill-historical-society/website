# Interred results

This page records the current working results for the Interred data as the SQLite migration and query views are developed.

## Current status

- Schema created for the project database in `Database/sqlite/schema.sql`
- Relational lookup view created for Interred name logic
- Browser preview page created in `Database/sqlite/viewer.html`
- Interred data imported and available in the SQLite preview
- Preview now shows the combined `full_name` instead of the intermediate name fields
- Alias names are displayed between the first name and surname when present

## Key query

Use this as the working preview query:

```sql
SELECT *
FROM v_interred_preview
LIMIT 20;
```

## Relational name logic

This mirrors the Access logic for the name display:

```sql
COALESCE(ssl.surname, i.surname)
COALESCE(cn.christian_name, i.first_name)

When an alias is present, the display name follows this format:

```text
First (Alias) Surname
```
```

## Purpose

This view is intended to validate:

- the imported Interred rows are present
- the lookup tables are joined correctly
- the display name matches the expected Access behavior
- the first 20 rows are readable and stable

## Notes

- The IRA medals database remains separate.
- Access remains the source of truth until the SQLite data is validated.
- Each table should be reviewed in turn using the same pattern: preview -> validate -> keep or adjust.
