# Query views and reports

This folder is for views and reusable SQL created after the SQLite schema is in place.

## Naming pattern

Use descriptive, task-oriented names such as:

- `v_people_summary`
- `v_interments_by_cemetery`
- `v_places_by_parish`
- `v_events_calendar`

## Workflow

- Build views only after the base tables are stable.
- Keep queries readable and use schema names where needed.
- Store final reporting SQL here rather than inside application files.
- Document the purpose and source table for each view.
