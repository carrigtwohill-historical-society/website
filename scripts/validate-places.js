/**
 * Fatal vs warn validation for src/places/*.md
 * Fatal → exit 1 (blocks deploy). Warn → stderr only.
 */
const fs = require("fs");
const path = require("path");
const {
  ROOT,
  BOUNDS,
  loadCategories,
  normalizeCategory,
  listPlaceFiles,
  readPlaceFile,
  collectImagePaths,
} = require("./lib/place-utils");

const HEIC_RE = /\.hei[c|f]$/i;
const ALLOWED_IMG = /\.(jpe?g|png|webp|gif)$/i;

function main() {
  const { ids: categoryIds } = loadCategories();
  const fatals = [];
  const warns = [];
  const seenIds = new Map();

  const files = listPlaceFiles();
  if (!files.length) {
    fatals.push("No place Markdown files found under src/places/");
  }

  for (const filePath of files) {
    const rel = path.relative(ROOT, filePath);
    let parsed;
    try {
      parsed = readPlaceFile(filePath);
    } catch (e) {
      fatals.push(`${rel}: cannot parse frontmatter (${e.message})`);
      continue;
    }
    const d = parsed.data || {};
    const id = d.id != null ? String(d.id).trim() : "";
    const name = d.name || d.title || "";
    const lat = parseFloat(d.lat);
    const lng = parseFloat(d.lng);
    const status = d.status != null ? String(d.status).trim() : "";
    const category = normalizeCategory(d.category);

    if (!id) fatals.push(`${rel}: missing id`);
    if (!String(name).trim()) fatals.push(`${rel}: missing name/title`);
    if (!status) fatals.push(`${rel}: missing status`);
    if (!category) fatals.push(`${rel}: missing category`);
    else if (!categoryIds.has(category)) {
      fatals.push(
        `${rel}: category "${d.category}" not in categories.json (normalised: "${category}")`
      );
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      fatals.push(`${rel}: lat/lng must be numbers`);
    } else {
      if (
        lat < BOUNDS.minLat ||
        lat > BOUNDS.maxLat ||
        lng < BOUNDS.minLng ||
        lng > BOUNDS.maxLng
      ) {
        fatals.push(
          `${rel}: coordinates ${lat},${lng} outside Carrigtwohill working bounds`
        );
      }
    }

    if (id) {
      if (seenIds.has(id)) {
        fatals.push(
          `${rel}: duplicate id "${id}" (also ${path.relative(ROOT, seenIds.get(id))})`
        );
      } else {
        seenIds.set(id, filePath);
      }
    }

    if (category === "other" && !String(d.categoryOther || "").trim()) {
      warns.push(`${rel}: category is "other" but categoryOther is empty`);
    }
    // Prefer author/sources on substantial published notes (content quality, not fatal)
    const bodyLen = (parsed.body || "").length;
    if (
      String(status).toLowerCase() !== "draft" &&
      bodyLen > 120 &&
      !String(d.author || "").trim()
    ) {
      warns.push(`${rel}: author is empty on a published note`);
    }
    const sources = d.sources;
    if (
      String(status).toLowerCase() !== "draft" &&
      bodyLen > 120 &&
      (!sources || (Array.isArray(sources) && sources.length === 0))
    ) {
      warns.push(`${rel}: sources is empty on a published note`);
    }

    for (const imgPath of collectImagePaths(d)) {
      if (HEIC_RE.test(imgPath)) {
        fatals.push(`${rel}: HEIC/HEIF not allowed: ${imgPath}`);
        continue;
      }
      if (!ALLOWED_IMG.test(imgPath) && !imgPath.startsWith("http")) {
        fatals.push(`${rel}: unsupported image type: ${imgPath}`);
      }
      if (imgPath.startsWith("http")) continue;
      const disk = path.join(
        ROOT,
        "src",
        imgPath.replace(/^\//, "").replace(/^assets\//, "assets/")
      );
      // Paths in content are like /assets/map/places/foo.jpg → src/assets/...
      const candidates = [
        path.join(ROOT, "src", imgPath.replace(/^\//, "")),
        path.join(ROOT, imgPath.replace(/^\//, "")),
      ];
      if (!candidates.some((c) => fs.existsSync(c))) {
        fatals.push(`${rel}: missing image file: ${imgPath}`);
      }
    }

    const images = d.images;
    if (Array.isArray(images)) {
      for (const img of images) {
        if (img && typeof img === "object" && !img.credit && !img.caption) {
          warns.push(`${rel}: an image is missing caption/credit`);
          break;
        }
      }
    }
  }

  if (warns.length) {
    console.warn("Place validation warnings:");
    for (const w of warns) console.warn("  •", w);
  }

  if (fatals.length) {
    console.error("Place validation FAILED:");
    for (const f of fatals) console.error("  ✗", f);
    process.exit(1);
  }

  console.log(
    `Place validation OK (${files.length} files, ${warns.length} warnings)`
  );
}

main();
