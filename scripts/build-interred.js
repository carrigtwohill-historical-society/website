const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "Database", "Interred.xlsx");
const OUTPUT = path.join(ROOT, "src", "data", "interred.json");

const PUBLIC_COLUMNS = [
  ["No", ["no", "number", "recordnumber"]],
  ["BurialID", ["burialid", "burialnumber", "burialrecordid"]],
  ["Cemetery", ["cemetery"]],
  ["Plot", ["plot", "plotnumber", "grave", "gravenumber"]],
  ["Row", ["row", "rownumber"]],
  ["Surname", ["surname", "plotsurname", "lastname"]],
  ["Interred", ["interred", "name", "fullname", "person"]],
  ["Alias", ["alias", "aka"]],
  ["Date", ["date", "buried", "burial", "burialdate", "dateofburial", "dateburied"]],
  ["Age", ["age"]],
  ["Born", ["born", "birth", "birthyear", "yearofbirth"]],
  ["Relationship", ["relationship", "relation"]],
  ["Address", ["address"]],
  ["Townland", ["townland"]],
];

function key(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function text(value) {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

function findValue(row, aliases) {
  const entries = Object.entries(row);
  for (const alias of aliases) {
    const match = entries.find(([header]) => key(header) === alias);
    if (match) return text(match[1]);
  }
  return "";
}

function joinKey(value) {
  return text(value).replace(/\.0+$/, "").trim().toLowerCase();
}

function cleanRelatedRow(row) {
  return Object.fromEntries(
    Object.entries(row)
      .map(([header, value]) => [text(header), text(value)])
      .filter(([header, value]) => header && value)
  );
}

function parsePlot(value) {
  if (value == null || value === "") return Number.MAX_SAFE_INTEGER;
  const match = String(value).match(/-?\d+/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[0]);
}

function cemeterySortValue(cemetery) {
  const order = { "St David's": 0, "Templecurraheen": 1, "Caherlag": 2 };
  return order[cemetery] ?? 99;
}

function main() {
  if (!fs.existsSync(SOURCE)) {
    throw new Error(`Missing workbook: ${path.relative(ROOT, SOURCE)}`);
  }

  const workbook = XLSX.readFile(SOURCE, { cellDates: true });
  const sheetName = workbook.SheetNames.includes("Interred")
    ? "Interred"
    : workbook.SheetNames.includes("ExportInterred")
      ? "ExportInterred"
      : null;
  if (!sheetName) {
    throw new Error(
      "Interred.xlsx must contain an Interred worksheet; the legacy WebsiteExport worksheet is no longer supported"
    );
  }

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
  const civilSheetName = workbook.SheetNames.includes("CivilRegistration")
    ? "CivilRegistration"
    : workbook.SheetNames.includes("Civil")
      ? "Civil"
      : null;
  const civilByBurialId = new Map();
  const civilSheet = civilSheetName && workbook.Sheets[civilSheetName];
  if (civilSheet) {
    const civilRows = XLSX.utils.sheet_to_json(civilSheet, { defval: "" });
    civilRows.forEach((row) => {
      const burialId = findValue(row, ["burialid", "burialnumber", "burialrecordid"]);
      if (burialId) civilByBurialId.set(joinKey(burialId), cleanRelatedRow(row));
    });
  }
  const records = rows
    .map((row) => {
      const record = {};
      for (const [name, aliases] of PUBLIC_COLUMNS) record[name] = findValue(row, aliases);
      record.PlotSurname = record.Surname;
      const related = civilByBurialId.get(joinKey(record.No));
      if (related) {
        if (!record.Townland) {
          record.Townland = related.Townland || related["Registered Townland"] || "";
        }
        record.Civil = related;
      }
      return record;
    })
    .filter((record) => record.PlotSurname || record.Name || record.Interred);

  records.sort((a, b) => {
    const cemetery = cemeterySortValue(a.Cemetery) - cemeterySortValue(b.Cemetery);
    if (cemetery !== 0) return cemetery;

    const aPlot = parsePlot(a.Plot);
    const bPlot = parsePlot(b.Plot);
    if (aPlot !== bPlot) return aPlot - bPlot;

    const aNo = parsePlot(a.No);
    const bNo = parsePlot(b.No);
    if (aNo !== bNo) return aNo - bNo;

    return (a.Interred || "").localeCompare(b.Interred || "");
  });

  const payload = {
    $comment: "Generated from Database/Interred.xlsx by scripts/build-interred.js.",
    surnames: [...new Set(records.map((record) => record.PlotSurname).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b)
    ),
    records,
  };

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Wrote ${records.length} cemetery records from ${sheetName} -> ${path.relative(ROOT, OUTPUT)}`);
}

main();
