-- SQLite schema for the project database.
-- This schema reflects the required Access tables already confirmed as working.
-- The IRA medals are intentionally kept in a separate database.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS source_file (
    source_file_id INTEGER PRIMARY KEY,
    original_name TEXT NOT NULL,
    source_type TEXT NOT NULL,
    imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS ballinacurra (
    ballinacurra_id INTEGER PRIMARY KEY,
    source_file_id INTEGER,
    record_code TEXT,
    description TEXT,
    notes TEXT,
    FOREIGN KEY (source_file_id) REFERENCES source_file(source_file_id)
);

CREATE TABLE IF NOT EXISTS burial_certificate (
    burial_certificate_id INTEGER PRIMARY KEY,
    source_file_id INTEGER,
    interred_id INTEGER,
    certificate_number TEXT,
    certificate_date TEXT,
    issued_by TEXT,
    notes TEXT,
    FOREIGN KEY (source_file_id) REFERENCES source_file(source_file_id)
);

CREATE TABLE IF NOT EXISTS burial_plot (
    burial_plot_id INTEGER PRIMARY KEY,
    source_file_id INTEGER,
    cemetery_id INTEGER,
    plot_number TEXT,
    plot_section TEXT,
    notes TEXT,
    FOREIGN KEY (source_file_id) REFERENCES source_file(source_file_id),
    FOREIGN KEY (cemetery_id) REFERENCES cemetery(cemetery_id)
);

CREATE TABLE IF NOT EXISTS cemetery (
    cemetery_id INTEGER PRIMARY KEY,
    source_file_id INTEGER,
    name TEXT,
    location TEXT,
    parish TEXT,
    county TEXT,
    notes TEXT,
    FOREIGN KEY (source_file_id) REFERENCES source_file(source_file_id)
);

CREATE TABLE IF NOT EXISTS headstone (
    headstone_id INTEGER PRIMARY KEY,
    source_file_id INTEGER,
    interred_id INTEGER,
    inscription TEXT,
    stone_material TEXT,
    notes TEXT,
    FOREIGN KEY (source_file_id) REFERENCES source_file(source_file_id)
);

CREATE TABLE IF NOT EXISTS interred (
    interred_id INTEGER PRIMARY KEY,
    source_file_id INTEGER,
    cemetery_id INTEGER,
    townland_id INTEGER,
    christian_name_id INTEGER,
    surname_id INTEGER,
    first_name TEXT,
    alias TEXT,
    middle_name TEXT,
    surname TEXT,
    maiden_name TEXT,
    religion_id INTEGER,
    marital_status_id INTEGER,
    age_at_death TEXT,
    date_of_birth TEXT,
    date_of_death TEXT,
    burial_date TEXT,
    grave_number TEXT,
    notes TEXT,
    FOREIGN KEY (source_file_id) REFERENCES source_file(source_file_id),
    FOREIGN KEY (cemetery_id) REFERENCES cemetery(cemetery_id),
    FOREIGN KEY (townland_id) REFERENCES townland(townland_id),
    FOREIGN KEY (religion_id) REFERENCES religious_denomination(religion_id),
    FOREIGN KEY (marital_status_id) REFERENCES marital_status(marital_status_id)
);

CREATE TABLE IF NOT EXISTS interred_st_davids (
    interred_st_davids_id INTEGER PRIMARY KEY,
    source_file_id INTEGER,
    interred_id INTEGER,
    cemetery_id INTEGER,
    notes TEXT,
    FOREIGN KEY (source_file_id) REFERENCES source_file(source_file_id),
    FOREIGN KEY (interred_id) REFERENCES interred(interred_id),
    FOREIGN KEY (cemetery_id) REFERENCES cemetery(cemetery_id)
);

CREATE TABLE IF NOT EXISTS marital_status (
    marital_status_id INTEGER PRIMARY KEY,
    source_file_id INTEGER,
    status_name TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY (source_file_id) REFERENCES source_file(source_file_id)
);

CREATE TABLE IF NOT EXISTS month_lookup (
    month_id INTEGER PRIMARY KEY,
    source_file_id INTEGER,
    month_number INTEGER,
    month_name TEXT,
    notes TEXT,
    FOREIGN KEY (source_file_id) REFERENCES source_file(source_file_id)
);

CREATE TABLE IF NOT EXISTS relationship_lookup (
    relationship_id INTEGER PRIMARY KEY,
    source_file_id INTEGER,
    relationship_name TEXT,
    notes TEXT,
    FOREIGN KEY (source_file_id) REFERENCES source_file(source_file_id)
);

CREATE TABLE IF NOT EXISTS religious_denomination (
    religion_id INTEGER PRIMARY KEY,
    source_file_id INTEGER,
    denomination_name TEXT,
    notes TEXT,
    FOREIGN KEY (source_file_id) REFERENCES source_file(source_file_id)
);

CREATE TABLE IF NOT EXISTS st_finbarrs (
    st_finbarrs_id INTEGER PRIMARY KEY,
    source_file_id INTEGER,
    interred_id INTEGER,
    cemetery_id INTEGER,
    notes TEXT,
    FOREIGN KEY (source_file_id) REFERENCES source_file(source_file_id),
    FOREIGN KEY (interred_id) REFERENCES interred(interred_id),
    FOREIGN KEY (cemetery_id) REFERENCES cemetery(cemetery_id)
);

CREATE TABLE IF NOT EXISTS standard_christian_names (
    christian_name_id INTEGER PRIMARY KEY,
    source_file_id INTEGER,
    christian_name TEXT,
    notes TEXT,
    FOREIGN KEY (source_file_id) REFERENCES source_file(source_file_id)
);

CREATE TABLE IF NOT EXISTS surnames_standard_list (
    surname_id INTEGER PRIMARY KEY,
    source_file_id INTEGER,
    surname TEXT,
    notes TEXT,
    FOREIGN KEY (source_file_id) REFERENCES source_file(source_file_id)
);

CREATE TABLE IF NOT EXISTS townland (
    townland_id INTEGER PRIMARY KEY,
    source_file_id INTEGER,
    townland_name TEXT,
    parish TEXT,
    county TEXT,
    notes TEXT,
    FOREIGN KEY (source_file_id) REFERENCES source_file(source_file_id)
);

-- Optional staging tables for derived export files.
CREATE TABLE IF NOT EXISTS website_export_civil (
    civil_export_id INTEGER PRIMARY KEY,
    source_file_id INTEGER,
    raw_record TEXT,
    notes TEXT,
    FOREIGN KEY (source_file_id) REFERENCES source_file(source_file_id)
);

CREATE TABLE IF NOT EXISTS website_export_interred (
    interred_export_id INTEGER PRIMARY KEY,
    source_file_id INTEGER,
    raw_record TEXT,
    notes TEXT,
    FOREIGN KEY (source_file_id) REFERENCES source_file(source_file_id)
);

CREATE TABLE IF NOT EXISTS data (
    data_id INTEGER PRIMARY KEY,
    source_file_id INTEGER,
    raw_record TEXT,
    notes TEXT,
    FOREIGN KEY (source_file_id) REFERENCES source_file(source_file_id)
);

CREATE INDEX IF NOT EXISTS idx_burial_certificate_interred ON burial_certificate(interred_id);
CREATE INDEX IF NOT EXISTS idx_burial_plot_cemetery ON burial_plot(cemetery_id);
CREATE INDEX IF NOT EXISTS idx_cemetery_name ON cemetery(name);
CREATE INDEX IF NOT EXISTS idx_headstone_interred ON headstone(interred_id);
CREATE INDEX IF NOT EXISTS idx_interred_cemetery ON interred(cemetery_id);
CREATE INDEX IF NOT EXISTS idx_interred_townland ON interred(townland_id);
CREATE INDEX IF NOT EXISTS idx_interred_surname ON interred(surname);
CREATE INDEX IF NOT EXISTS idx_townland_name ON townland(townland_name);

CREATE VIEW IF NOT EXISTS v_interred_summary AS
SELECT i.interred_id,
       i.first_name,
       i.middle_name,
       i.surname,
       i.maiden_name,
       c.name AS cemetery_name,
       t.townland_name,
       i.burial_date,
       i.date_of_death,
       i.age_at_death,
       i.grave_number
FROM interred i
LEFT JOIN cemetery c ON c.cemetery_id = i.cemetery_id
LEFT JOIN townland t ON t.townland_id = i.townland_id;

CREATE VIEW IF NOT EXISTS v_interred_lookup AS
SELECT i.interred_id,
       COALESCE(cn.christian_name, i.first_name) AS first_name_display,
       COALESCE(ssl.surname, i.surname) AS surname_display,
       CASE
           WHEN NULLIF(TRIM(i.alias), '') IS NOT NULL THEN
               COALESCE(cn.christian_name, i.first_name) || ' (' || TRIM(i.alias) || ') ' || COALESCE(ssl.surname, i.surname)
           ELSE
               COALESCE(cn.christian_name, i.first_name) || ' ' || COALESCE(ssl.surname, i.surname)
       END AS full_name,
       i.first_name,
       i.alias,
       i.middle_name,
       i.surname,
       i.maiden_name,
       c.name AS cemetery_name,
       t.townland_name,
       i.burial_date,
       i.date_of_death,
       i.age_at_death,
       i.grave_number
FROM interred i
LEFT JOIN standard_christian_names cn ON cn.christian_name_id = i.christian_name_id
LEFT JOIN surnames_standard_list ssl ON ssl.surname_id = i.surname_id
LEFT JOIN cemetery c ON c.cemetery_id = i.cemetery_id
LEFT JOIN townland t ON t.townland_id = i.townland_id;

CREATE VIEW IF NOT EXISTS v_interred_preview AS
SELECT interred_id,
       full_name,
       cemetery_name,
       townland_name,
       burial_date,
       date_of_death,
       age_at_death,
       grave_number
FROM v_interred_lookup
ORDER BY interred_id
LIMIT 20;

CREATE VIEW IF NOT EXISTS v_burial_certificate_summary AS
SELECT b.burial_certificate_id,
       i.first_name,
       i.surname,
       b.certificate_number,
       b.certificate_date
FROM burial_certificate b
LEFT JOIN interred i ON i.interred_id = b.interred_id;
