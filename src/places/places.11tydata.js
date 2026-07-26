/**
 * Draft places stay in the repo for CMS but are not built as public pages.
 * Townland: blank in MD → computed from polygons (same rules as places.json).
 */
const {
  resolveTownland,
  normalizeCategory,
  loadCategories,
} = require("../../scripts/lib/place-utils");

const { byId } = loadCategories();

module.exports = {
  layout: "layouts/place.njk",
  tags: ["mapPlaces"],
  eleventyComputed: {
    permalink(data) {
      const status = String(data.status || "published").toLowerCase();
      if (status === "draft") return false;
      if (!data.id) return false;
      return `/map/places/${data.id}/`;
    },
    category(data) {
      return normalizeCategory(data.category) || data.category;
    },
    townland(data) {
      const lat = parseFloat(data.lat);
      const lng = parseFloat(data.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return data.townland || "";
      }
      return resolveTownland(data, lat, lng).townland;
    },
    townlandIrish(data) {
      const lat = parseFloat(data.lat);
      const lng = parseFloat(data.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return data.townlandIrish || "";
      }
      const resolved = resolveTownland(data, lat, lng);
      return resolved.townlandIrish;
    },
    categoryLabel(data) {
      const id = normalizeCategory(data.category) || data.category;
      return (byId[id] && byId[id].label) || id || "";
    },
  },
};
