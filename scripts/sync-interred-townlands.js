const XLSX = require("xlsx");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const WORKBOOK_PATH = path.join(ROOT, "Database", "Interred.xlsx");

function text(value) {
  return value == null ? "" : String(value).trim();
}

function joinKey(value) {
  return text(value).replace(/\.0+$/, "").toLowerCase();
}

function findColumn(headers, name) {
  return headers.findIndex((header) => text(header).toLowerCase() === name.toLowerCase());
}

function main() {
  const workbook = XLSX.readFile(WORKBOOK_PATH, { cellDates: true });
  const interredSheet = workbook.Sheets.Interred;
  const civilSheet = workbook.Sheets.CivilRegistration || workbook.Sheets.Civil;
  if (!interredSheet || !civilSheet) {
    throw new Error("Interred.xlsx must contain Interred and Civil worksheets");
  }

  const interredRows = XLSX.utils.sheet_to_json(interredSheet, { header: 1, defval: "" });
  const civilRows = XLSX.utils.sheet_to_json(civilSheet, { defval: "" });
  const headers = interredRows[0] || [];
  const noColumn = findColumn(headers, "No");
  const townlandColumn = findColumn(headers, "Townland");
  if (noColumn < 0 || townlandColumn < 0) {
    throw new Error("Interred worksheet is missing No or Townland columns");
  }

  const civilByBurialId = new Map();
  civilRows.forEach((row) => {
    const burialId = joinKey(row.BurialId || row.BurialID || row.BurialRecordID);
    if (burialId) civilByBurialId.set(burialId, row);
  });

  let updated = 0;
  for (let rowIndex = 1; rowIndex < interredRows.length; rowIndex += 1) {
    const row = interredRows[rowIndex];
    if (text(row[townlandColumn])) continue;
    const civil = civilByBurialId.get(joinKey(row[noColumn]));
    if (!civil) continue;
    const townland = text(civil.Townland) || text(civil["Registered Townland"]);
    if (!townland) continue;

    const cellAddress = XLSX.utils.encode_cell({ c: townlandColumn, r: rowIndex });
    interredSheet[cellAddress] = { t: "s", v: townland };
    updated += 1;
  }

  XLSX.writeFile(workbook, WORKBOOK_PATH);
  console.log(`Updated ${updated} Interred townland cells in ${path.relative(ROOT, WORKBOOK_PATH)}`);
}

main();