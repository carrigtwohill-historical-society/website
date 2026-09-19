# Required table map

This is the working map for the confirmed project tables.

## Main project database

| Access file | Access table | Target SQLite table | Primary key | Notes |
| --- | --- | --- | --- | --- |
| MainDatabase.accdb | Ballinacurra | ballinacurra | ballinacurra_id | Local reference table |
| MainDatabase.accdb | BurialCertificates | burial_certificate | burial_certificate_id | Certificate records |
| MainDatabase.accdb | BurialPlots | burial_plot | burial_plot_id | Cemetery plot records |
| MainDatabase.accdb | Cemetery | cemetery | cemetery_id | Cemetery master table |
| MainDatabase.accdb | Data | data | data_id | Raw/staging table; not canonical |
| MainDatabase.accdb | Headstones | headstone | headstone_id | Memorial / inscription table |
| MainDatabase.accdb | Interred | interred | interred_id | Main person record table |
| MainDatabase.accdb | InterredStDavids | interred_st_davids | interred_st_davids_id | St David’s subset |
| MainDatabase.accdb | MaritalStatus | marital_status | marital_status_id | Lookup table |
| MainDatabase.accdb | Months | month_lookup | month_id | Lookup table |
| MainDatabase.accdb | Relationships | relationship_lookup | relationship_id | Lookup table |
| MainDatabase.accdb | ReligiousDenominations | religious_denomination | religion_id | Lookup table |
| MainDatabase.accdb | StFinbarrs | st_finbarrs | st_finbarrs_id | St Finbarr’s subset |
| MainDatabase.accdb | WebsiteExportCivil | website_export_civil | civil_export_id | Derived export table |
| MainDatabase.accdb | WebsiteExportInterred | website_export_interred | interred_export_id | Derived export table |
| MainDatabase.accdb | StandardChristianNames | standard_christian_names | christian_name_id | Lookup table |
| MainDatabase.accdb | SurnamesStandardList | surnames_standard_list | surname_id | Lookup table |
| MainDatabase.accdb | Townlands | townland | townland_id | Place lookup table |

## Separate medals database

| Access file | Access table | Target SQLite table | Primary key | Notes |
| --- | --- | --- | --- | --- |
| IRA_Medals.accdb | MedalRecords | medal_record | medal_record_id | Separate database |
| IRA_Medals.accdb | MedalTypes | medal_type | medal_type_id | Separate database |
| IRA_Medals.accdb | AwardRecipients | award_recipient | award_recipient_id | Linked by person or record ID |

## Rules

- Keep the project tables in the main database.
- Keep the IRA medal tables in a separate SQLite database or clearly isolated schema.
- Treat export tables as staging/derived only.
- Use stable IDs and link only where a relationship is truly needed.
- Keep the Access table names as the source-of-truth labels.

## Next step

The schema in [Database/sqlite/schema.sql](Database/sqlite/schema.sql) now reflects the confirmed project tables and leaves the medal data separate.
