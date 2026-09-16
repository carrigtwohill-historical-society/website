const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "Database", "Interred.xlsx");
const OUTPUT = path.join(ROOT, "src", "data", "interred.json");

const PUBLIC_COLUMNS = [
  ["Cemetery", ["cemetery"]],
  ["No", ["no", "number", "recordnumber"]],
  ["Plot", ["plot", "plotnumber", "grave", "gravenumber"]],
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
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("Interred.xlsx contains no worksheets");

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
  const records = rows
    .map((row) => {
      const record = {};
      for (const [name, aliases] of PUBLIC_COLUMNS) record[name] = findValue(row, aliases);
      record.PlotSurname = record.Surname;
      return record;
    })
    .filter((record) => record.PlotSurname || record.Name || record.Interred);

  records.sort((a, b) => {
    const cemetery = cemeterySortValue(a.Cemetery) - cemeterySortValue(b.Cemetery);
    if (cemetery !== 0) return cemetery;

    const aPlot = parsePlot(a.Plot);
    const bPlot = parsePlot(b.Plot);
    if (aPlot !== bPlot) return aPlot - bPlot;

    const row = String(a.Row || "").localeCompare(String(b.Row || ""), undefined, { numeric: true });
    if (row !== 0) return row;

    return (a.Name || a.Interred || "").localeCompare(b.Name || b.Interred || "");
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
