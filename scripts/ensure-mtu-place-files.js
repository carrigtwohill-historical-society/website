/**
 * One-off helper: ensure MTU exhibit pins exist as src/places/*.md
 * and normalise legacy category labels. Safe to re-run.
 * (Not part of the regular build — the build never writes src/places/.)
 */
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const ROOT = path.resolve(__dirname, "..");
const DIR = path.join(ROOT, "src", "places");
const CREDIT =
  "Produced by Carrigtwohill Historical Society in partnership with CIT/MTU, with support from Cork County Council and the Poor Servants of the Mother of God";

const MTU = [
  {
    id: "mtu-abbey-st-davids",
    name: "Abbey / St David’s (MTU exhibit)",
    lat: 51.9085,
    lng: -8.2635,
    preview: "MTU/CIT interactive village map — Abbey and St David’s film.",
    liveVideoPage:
      "https://carrigtwohillhistoricalsociety.com/CITInteractive/CITAbbeyRuins.aspx",
  },
  {
    id: "mtu-convent",
    name: "Poor Servants Convent (MTU exhibit)",
    lat: 51.9089,
    lng: -8.2648,
    preview: "MTU/CIT interactive village map — Convent film.",
    liveVideoPage:
      "https://carrigtwohillhistoricalsociety.com/CITInteractive/CITConvent.aspx",
  },
  {
    id: "mtu-st-marys",
    name: "St Mary’s Church (MTU exhibit)",
    lat: 51.9092,
    lng: -8.2655,
    preview: "MTU/CIT interactive village map — St Mary’s film.",
    liveVideoPage:
      "https://carrigtwohillhistoricalsociety.com/CITInteractive/CITStMarys.aspx",
  },
  {
    id: "mtu-ric-barracks",
    name: "RIC Barracks (MTU exhibit)",
    lat: 51.9082,
    lng: -8.2662,
    preview: "MTU/CIT interactive village map — RIC Barracks film.",
    liveVideoPage:
      "https://carrigtwohillhistoricalsociety.com/CITInteractive/CITBarracks.aspx",
  },
  {
    id: "mtu-schools",
    name: "Schools of Carrigtwohill (MTU exhibit)",
    lat: 51.9096,
    lng: -8.264,
    preview: "MTU/CIT interactive village map — Schools film.",
    liveVideoPage:
      "https://carrigtwohillhistoricalsociety.com/CITInteractive/CITSchools.aspx",
  },
  {
    id: "mtu-barryscourt",
    name: "Barryscourt Castle (MTU exhibit film)",
    lat: 51.9075,
    lng: -8.2615,
    preview: "MTU/CIT interactive village map — Barryscourt Castle film.",
    liveVideoPage:
      "https://carrigtwohillhistoricalsociety.com/CITInteractive/CITBarryscourt.aspx",
  },
  {
    id: "mtu-rossmore",
    name: "Battle of Rossmore (MTU exhibit)",
    lat: 51.915,
    lng: -8.255,
    preview: "MTU/CIT interactive village map — Rossmore / Tithe War film.",
    liveVideoPage:
      "https://carrigtwohillhistoricalsociety.com/CITInteractive/CITRossmore.aspx",
  },
];

function normCat(c) {
  if (c === "Exhibit") return "exhibit";
  if (c === "Unknown") return "unknown";
  return c;
}

for (const p of MTU) {
  const fp = path.join(DIR, `${p.id}.md`);
  if (fs.existsSync(fp)) {
    console.log("exists", p.id);
    continue;
  }
  const data = {
    id: p.id,
    title: p.name,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    layer: "mtu",
    category: "exhibit",
    categories: ["exhibit"],
    preview: p.preview,
    author: "",
    status: "published",
    heroImage: "",
    liveVideoPage: p.liveVideoPage,
    credit: CREDIT,
    sources: [],
  };
  fs.writeFileSync(fp, matter.stringify(p.preview + "\n", data), "utf8");
  console.log("wrote", p.id);
}

for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith(".md"))) {
  const fp = path.join(DIR, f);
  const raw = fs.readFileSync(fp, "utf8");
  const parsed = matter(raw);
  let changed = false;
  if (parsed.data.category) {
    const n = normCat(parsed.data.category);
    if (n !== parsed.data.category) {
      parsed.data.category = n;
      changed = true;
    }
  }
  if (Array.isArray(parsed.data.categories)) {
    const nc = parsed.data.categories.map(normCat);
    if (JSON.stringify(nc) !== JSON.stringify(parsed.data.categories)) {
      parsed.data.categories = nc;
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(fp, matter.stringify(parsed.content, parsed.data), "utf8");
    console.log("normalized", f);
  }
}
