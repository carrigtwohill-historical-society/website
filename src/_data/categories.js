const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "data", "categories.json");
const raw = JSON.parse(fs.readFileSync(file, "utf8"));

module.exports = {
  list: raw.categories || [],
  byId: Object.fromEntries((raw.categories || []).map((c) => [c.id, c])),
};
