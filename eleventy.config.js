const path = require("path");
const fs = require("fs");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/js": "js" });
  eleventyConfig.addPassthroughCopy({ "src/css": "css" });
  eleventyConfig.addPassthroughCopy({ "src/data/places.json": "data/places.json" });
  eleventyConfig.addPassthroughCopy({ "src/data/url-map.json": "data/url-map.json" });
  eleventyConfig.addPassthroughCopy({
    "src/data/carrigtwohill-parishes.geojson": "data/carrigtwohill-parishes.geojson",
  });
  eleventyConfig.addPassthroughCopy({
    "src/data/carrigtwohill-townlands.geojson": "data/carrigtwohill-townlands.geojson",
  });
  // legacy filename if present
  eleventyConfig.addPassthroughCopy({ "src/data/parishes.geojson": "data/parishes.geojson" });

  eleventyConfig.addWatchTarget("src/css/");
  eleventyConfig.addWatchTarget("src/js/");

  eleventyConfig.addFilter("absoluteUrl", (url, base) => {
    if (!url) return base;
    if (url.startsWith("http")) return url;
    const b = (base || "").replace(/\/$/, "");
    const u = url.startsWith("/") ? url : `/${url}`;
    return `${b}${u}`;
  });

  eleventyConfig.addFilter("isoDate", () => new Date().toISOString().slice(0, 10));

  eleventyConfig.addCollection("contentPages", (api) =>
    api.getFilteredByGlob("src/content/**/*.md").sort((a, b) =>
      (a.data.title || "").localeCompare(b.data.title || "")
    )
  );

  eleventyConfig.addCollection("sitemapPages", (api) =>
    api.getFilteredByGlob("src/**/*.{md,njk}").filter((item) => {
      if (item.data.eleventyExcludeFromCollections) return false;
      if (item.data.permalink === false) return false;
      const p = item.url || "";
      return !p.includes("404") && p !== "/robots.txt";
    })
  );

  // Inject pathPrefix into every template via global data merge is in site.json;
  // also expose helper for nav active state
  // Usage: page.url | navActive(child.url)
  eleventyConfig.addNunjucksFilter("navActive", (current, url) => {
    if (!url || !current) return false;
    if (url === "/") return current === "/";
    return current === url || current.startsWith(url);
  });

  // Migrated HTML uses root-absolute /assets/... — apply pathPrefix for GH Pages
  eleventyConfig.addTransform("prefixRootUrls", (content, outputPath) => {
    if (!outputPath || !outputPath.endsWith(".html")) return content;
    return content.replace(
      /(href|src|action)="\/(?!website\/)/g,
      '$1="/website/'
    );
  });

  return {
    pathPrefix: "/website/",
    templateFormats: ["md", "njk", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
  };
};
