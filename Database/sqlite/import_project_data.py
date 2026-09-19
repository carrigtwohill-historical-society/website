#!/usr/bin/env python3
"""Import Access-export CSV/XLSX files into the project SQLite database."""

from __future__ import annotations

import argparse
import csv
import json
import sqlite3
import sys
from pathlib import Path
from typing import Iterable

try:
    from openpyxl import load_workbook
except Exception:  # pragma: no cover
    load_workbook = None


DEF_TABLE_MAP = {
    "Ballinacurra": "ballinacurra",
    "BurialCertificates": "burial_certificate",
    "BurialPlots": "burial_plot",
    "Cemetery": "cemetery",
    "Data": "data",
    "Headstones": "headstone",
    "Interred": "interred",
    "InterredStDavids": "interred_st_davids",
    "MaritalStatus": "marital_status",
    "Months": "month_lookup",
    "Relationships": "relationship_lookup",
    "ReligiousDenominations": "religious_denomination",
    "StFinbarrs": "st_finbarrs",
    "WebsiteExportCivil": "website_export_civil",
    "WebsiteExportInterred": "website_export_interred",
    "StandardChristianNames": "standard_christian_names",
    "SurnamesStandardList": "surnames_standard_list",
    "Townlands": "townland",
}


def normalize_identifier(value: str) -> str:
    value = value.strip()
    value = value.replace("-", "_")
    value = value.replace(" ", "_")
    value = value.replace("/", "_")
    cleaned = []
    for ch in value:
        if ch.isalnum() or ch == "_":
            cleaned.append(ch)
        else:
            cleaned.append("_")
    text = "".join(cleaned)
    while "__" in text:
        text = text.replace("__", "_")
    return text.strip("_").lower()


def read_json_map(path: Path):
    if not path.exists():
        return DEF_TABLE_MAP.copy()
    with path.open("r", encoding="utf-8") as fh:
        data = json.load(fh)
    return {str(k): str(v) for k, v in data.items()}


def table_name_from_file(file_path: Path, mapping: dict[str, str]) -> str | None:
    stem = file_path.stem
    if stem in mapping:
        return mapping[stem]
    normalized = normalize_identifier(stem)
    for source_name, target_name in mapping.items():
        if normalize_identifier(source_name) == normalized:
            return target_name
    for source_name, target_name in mapping.items():
        if normalize_identifier(source_name).replace("_", "") == normalized.replace("_", ""):
            return target_name
    return None


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        rows = []
        for row in reader:
            cleaned = {}
            for key, value in row.items():
                if key is None:
                    continue
                cleaned[key] = "" if value is None else value.strip()
            rows.append(cleaned)
    return rows


def read_xlsx_rows(path: Path) -> list[dict[str, str]]:
    if load_workbook is None:
        raise RuntimeError(
            f"openpyxl is required to read Excel files. Install it with: pip install openpyxl"
        )
    workbook = load_workbook(path, read_only=True, data_only=True)
    sheet = workbook.active
    rows = []
    first = True
    header = []
    for row in sheet.iter_rows(values_only=True):
        if first:
            header = [str(cell).strip() if cell is not None else "" for cell in row]
            first = False
            continue
        if not any(cell is not None and str(cell).strip() != "" for cell in row):
            continue
        item = {}
        for idx, cell in enumerate(row):
            if idx >= len(header):
                break
            item[header[idx]] = "" if cell is None else str(cell).strip()
        rows.append(item)
    workbook.close()
    return rows


def pragma_columns(conn: sqlite3.Connection, table_name: str) -> list[str]:
    info = conn.execute(f'PRAGMA table_info("{table_name}")').fetchall()
    return [row[1] for row in info]


def record_source_file(conn: sqlite3.Connection, file_path: Path) -> int:
    original_name = file_path.name
    conn.execute(
        "INSERT INTO source_file (original_name, source_type) VALUES (?, ?)",
        (original_name, "csv" if file_path.suffix.lower() == ".csv" else "excel"),
    )
    return int(conn.execute("SELECT last_insert_rowid()").fetchone()[0])


def import_file(conn: sqlite3.Connection, file_path: Path, mapping: dict[str, str]) -> tuple[str, int]:
    table_name = table_name_from_file(file_path, mapping)
    if table_name is None:
        return ("SKIPPED", 0)

    if file_path.suffix.lower() == ".csv":
        rows = read_csv_rows(file_path)
    elif file_path.suffix.lower() in {".xlsx", ".xls"}:
        rows = read_xlsx_rows(file_path)
    else:
        return ("SKIPPED", 0)

    source_file_id = record_source_file(conn, file_path)
    columns = pragma_columns(conn, table_name)
    normalized_columns = {normalize_identifier(col): col for col in columns}

    inserted = 0
    for row in rows:
        if not row:
            continue
        normalized_row = {}
        for raw_key, value in row.items():
            key = normalize_identifier(str(raw_key))
            if key in normalized_columns:
                normalized_row[normalized_columns[key]] = value if value != "" else None
        if "source_file_id" in normalized_columns and "source_file_id" not in normalized_row:
            normalized_row["source_file_id"] = source_file_id
        if not normalized_row:
            continue

        insert_cols = []
        insert_values = []
        for col_name in columns:
            if col_name.endswith("_id") and col_name not in normalized_row:
                continue
            if col_name in normalized_row:
                insert_cols.append(col_name)
                insert_values.append(normalized_row[col_name])

        if not insert_cols:
            continue

        placeholders = ", ".join(["?"] * len(insert_cols))
        sql = f'INSERT INTO "{table_name}" ({", ".join(f'"{c}"' for c in insert_cols)}) VALUES ({placeholders})'
        conn.execute(sql, insert_values)
        inserted += 1

    conn.commit()
    return (table_name, inserted)


def iter_data_files(raw_dir: Path) -> Iterable[Path]:
    if not raw_dir.exists():
        return []
    files = []
    for pattern in ("*.csv", "*.xlsx", "*.xls"):
        files.extend(raw_dir.rglob(pattern))
    return sorted(set(files))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Import Access export files into the SQLite project database.")
    parser.add_argument("--raw-dir", type=Path, default=Path(__file__).resolve().parent.parent / "raw")
    parser.add_argument("--db", type=Path, default=Path(__file__).resolve().parent / "project.db")
    parser.add_argument("--schema", type=Path, default=Path(__file__).resolve().parent / "schema.sql")
    parser.add_argument("--map", type=Path, default=Path(__file__).resolve().parent / "table_map.json")
    parser.add_argument("--reset", action="store_true", help="Delete the existing database before import.")
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    db_path = args.db
    if args.reset and db_path.exists():
        db_path.unlink()

    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    conn.execute("PRAGMA foreign_keys = ON")

    if args.schema.exists():
        schema_sql = args.schema.read_text(encoding="utf-8")
        conn.executescript(schema_sql)
    else:
        print(f"Schema not found: {args.schema}", file=sys.stderr)
        return 1

    mapping = read_json_map(args.map)
    files = list(iter_data_files(args.raw_dir))
    if not files:
        print(f"No CSV/XLSX/XLS files found in {args.raw_dir}")
        return 0

    imported = []
    for file_path in files:
        table_name, count = import_file(conn, file_path, mapping)
        if table_name != "SKIPPED":
            imported.append((table_name, count, file_path.name))
            print(f"{file_path.name} -> {table_name}: {count} rows imported")

    print("\nValidation summary:")
    for table_name, count, file_name in imported:
        actual = conn.execute(f'SELECT COUNT(*) FROM "{table_name}"').fetchone()[0]
        print(f"- {table_name}: {actual} rows in SQLite ({file_name})")

    conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
