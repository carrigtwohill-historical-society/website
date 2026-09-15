const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "Database", "Interred.xlsx");
const OUTPUT = path.join(ROOT, "src", "data", "interred.json");

const PUBLIC_COLUMNS = [
  ["Cemetery", ["cemetery"]],
  ["Grave", ["grave", "plot", "plotnumber"]],
  ["Interred", ["interred", "name", "fullname"]],
  ["Burial", ["burial", "burialdate", "dateofburial"]],
  ["Age", ["age"]],
  ["Birth", ["birth", "birthyear", "yearofbirth"]],
  ["Certificate", ["certificate", "certificatenumber"]],
  ["Aged", ["aged"]],
  ["Status", ["status"]],
  ["Occupation", ["occupation"]],
  ["Address", ["address"]],
  ["Townlands", ["townlands", "townland"]],
  ["Witness", ["witness", "witnesses"]],
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
      record.PlotSurname = findValue(row, ["plotsurname", "surname", "lastname"]);
      return record;
    })
    .filter((record) => record.PlotSurname || record.Interred);

  records.sort((a, b) => {
    const cemetery = a.Cemetery.localeCompare(b.Cemetery);
    if (cemetery !== 0) return cemetery;

    const aGrave = Number.parseInt(a.Grave, 10);
    const bGrave = Number.parseInt(b.Grave, 10);
    if (Number.isFinite(aGrave) && Number.isFinite(bGrave) && aGrave !== bGrave) {
      return aGrave - bGrave;
    }
    if (Number.isFinite(aGrave) !== Number.isFinite(bGrave)) {
      return Number.isFinite(aGrave) ? -1 : 1;
    }

    return a.Grave.localeCompare(b.Grave, undefined, { numeric: true }) ||
      a.Interred.localeCompare(b.Interred);
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
