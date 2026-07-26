/**
 * Shared helpers for place MD → places.json (no writes to src/places/).
 */
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const ROOT = path.resolve(__dirname, "..", "..");
const PLACES_DIR = path.join(ROOT, "src", "places");
const CATEGORIES_PATH = path.join(ROOT, "src", "data", "categories.json");
const TOWNLANDS_PATH = path.join(
  ROOT,
  "src",
  "data",
  "carrigtwohill-townlands.geojson"
);

/** Approximate Carrigtwohill / Midleton parish working area */
const BOUNDS = {
  minLat: 51.85,
  maxLat: 51.98,
  minLng: -8.4,
  maxLng: -8.05,
};

const CATEGORY_ALIASES = {
  Exhibit: "exhibit",
  exhibit: "exhibit",
  Unknown: "unknown",
  unknown: "unknown",
  Other: "other",
  other: "other",
};

function loadCategories() {
  const raw = JSON.parse(fs.readFileSync(CATEGORIES_PATH, "utf8"));
  const list = raw.categories || [];
  const byId = Object.fromEntries(list.map((c) => [c.id, c]));
  return { list, byId, ids: new Set(list.map((c) => c.id)) };
}

function normalizeCategory(cat) {
  if (cat == null || cat === "") return "";
  const s = String(cat).trim();
  if (CATEGORY_ALIASES[s]) return CATEGORY_ALIASES[s];
  return s;
}

function pointInRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPoly(lng, lat, geom) {
  if (!geom || !geom.coordinates) return false;
  const polys =
    geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  for (const poly of polys) {
    if (!pointInRing(lng, lat, poly[0])) continue;
    let inHole = false;
    for (let h = 1; h < poly.length; h++) {
      if (pointInRing(lng, lat, poly[h])) inHole = true;
    }
    if (!inHole) return true;
  }
  return false;
}

let townlandsCache = null;
function loadTownlands() {
  if (townlandsCache) return townlandsCache;
  if (!fs.existsSync(TOWNLANDS_PATH)) {
    townlandsCache = [];
    return townlandsCache;
  }
  const g = JSON.parse(fs.readFileSync(TOWNLANDS_PATH, "utf8"));
  townlandsCache = g.features || [];
  return townlandsCache;
}

function computeTownland(lat, lng) {
  const features = loadTownlands();
  for (const f of features) {
    if (pointInPoly(lng, lat, f.geometry)) {
      return {
        townland: f.properties.name || f.properties.tags?.name || "",
        townlandIrish:
          f.properties.name_irish || f.properties.tags?.["name:ga"] || "",
      };
    }
  }
  return { townland: "", townlandIrish: "" };
}

function resolveTownland(data, lat, lng) {
  const override = (data.townland || "").toString().trim();
  if (override) {
    return {
      townland: override,
      townlandIrish: (data.townlandIrish || "").toString().trim(),
      townlandSource: "override",
    };
  }
  const computed = computeTownland(lat, lng);
  return { ...computed, townlandSource: "computed" };
}

function listPlaceFiles() {
  if (!fs.existsSync(PLACES_DIR)) return [];
  return fs
    .readdirSync(PLACES_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => path.join(PLACES_DIR, f));
}

function readPlaceFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  return { data, body: (content || "").trim(), filePath };
}

function collectImagePaths(data) {
  const paths = [];
  if (data.heroImage) paths.push(String(data.heroImage));
  const images = data.images;
  if (Array.isArray(images)) {
    for (const img of images) {
      if (typeof img === "string") paths.push(img);
      else if (img && (img.path || img.src)) paths.push(img.path || img.src);
    }
  }
  return paths.filter(Boolean);
}

function isPublishedStatus(status) {
  const s = String(status || "published").toLowerCase();
  return s !== "draft";
}

function assertNoWriteToPlaces(targetPath) {
  const resolved = path.resolve(targetPath);
  const placesRoot = path.resolve(PLACES_DIR);
  if (resolved === placesRoot || resolved.startsWith(placesRoot + path.sep)) {
    throw new Error(
      `Refusing to write into src/places/: ${targetPath}\nPlace Markdown is sacred — only humans/CMS may edit it.`
    );
  }
}

module.exports = {
  ROOT,
  PLACES_DIR,
  CATEGORIES_PATH,
  BOUNDS,
  loadCategories,
  normalizeCategory,
  computeTownland,
  resolveTownland,
  listPlaceFiles,
  readPlaceFile,
  collectImagePaths,
  isPublishedStatus,
  assertNoWriteToPlaces,
};
