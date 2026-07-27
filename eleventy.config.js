const path = require("path");
const fs = require("fs");
const Image = require("@11ty/eleventy-img");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/js": "js" });
  eleventyConfig.addPassthroughCopy({ "src/css": "css" });
  eleventyConfig.addPassthroughCopy({ "src/data/places.json": "data/places.json" });
  eleventyConfig.addPassthroughCopy({ "src/data/categories.json": "data/categories.json" });
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

  eleventyConfig.addFilter("urlencode", (s) =>
    encodeURIComponent(s == null ? "" : String(s))
  );

  eleventyConfig.addFilter("youtubeId", (url) => {
    if (!url) return "";
    const s = String(url).trim();
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/)([A-Za-z0-9_-]{6,})/,
      /^([A-Za-z0-9_-]{11})$/,
    ];
    for (const re of patterns) {
      const m = s.match(re);
      if (m) return m[1];
    }
    return "";
  });

  /** Resize place photos; sharp fixes orientation before EXIF strip. */
  eleventyConfig.addNunjucksAsyncShortcode(
    "placeImage",
    async function (src, alt) {
      if (!src) return "";
      const inputPath = String(src).startsWith("http")
        ? String(src)
        : path.join(
            __dirname,
            "src",
            String(src).replace(/^\//, "")
          );
      if (!String(src).startsWith("http") && !fs.existsSync(inputPath)) {
        const fallback = this.ctx && this.ctx.page ? "" : "";
        return `<img src="${src}" alt="${alt || ""}" loading="lazy">`;
      }
      try {
        const metadata = await Image(inputPath, {
          widths: [640, 960, 1280],
          formats: ["webp", "jpeg"],
          outputDir: path.join(__dirname, "_site", "img", "places"),
          urlPath: "/img/places/",
          sharpJpegOptions: { quality: 78, mozjpeg: true },
          sharpWebpOptions: { quality: 75 },
        });
        const attrs = {
          alt: alt || "",
          loading: "lazy",
          decoding: "async",
          sizes: "(max-width: 800px) 100vw, 800px",
        };
        return Image.generateHTML(metadata, attrs);
      } catch (e) {
        console.warn("placeImage failed for", src, e.message);
        return `<img src="${src}" alt="${alt || ""}" loading="lazy">`;
      }
    }
  );

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
    let out = content.replace(
      /(href|src|action)="\/(?!website\/)/g,
      '$1="/website/'
    );
    // eleventy-img srcset
    out = out.replace(
      /(srcset=")([^"]+)(")/g,
      (full, a, list, c) => {
        const fixed = list
          .split(",")
          .map((part) => {
            const trimmed = part.trim();
            if (trimmed.startsWith("/website/") || trimmed.startsWith("http")) {
              return trimmed;
            }
            if (trimmed.startsWith("/")) {
              return `/website${trimmed}`;
            }
            return trimmed;
          })
          .join(", ");
        return a + fixed + c;
      }
    );
    return out;
  });

  // G2 — external http(s) links open in a new tab; internal links untouched
  eleventyConfig.addTransform("externalLinks", (content, outputPath) => {
    if (!outputPath || !outputPath.endsWith(".html")) return content;
    const siteData = require("./src/_data/site.json");
    const ownHosts = new Set(
      [
        "carrigtwohill-historical-society.github.io",
        "localhost",
        "127.0.0.1",
      ]
        .concat(
          (() => {
            try {
              return [new URL(siteData.url).hostname];
            } catch {
              return [];
            }
          })()
        )
        .filter(Boolean)
    );

    return content.replace(/<a\b([^>]*)>/gi, (full, attrs) => {
      const hrefMatch = attrs.match(/\bhref\s*=\s*(["'])(.*?)\1/i);
      if (!hrefMatch) return full;
      const href = hrefMatch[2].trim();
      if (!/^https?:\/\//i.test(href)) return full;

      let host = "";
      try {
        host = new URL(href).hostname;
      } catch {
        return full;
      }
      if (ownHosts.has(host)) return full;

      let next = attrs;
      if (/\btarget\s*=/i.test(next)) {
        next = next.replace(/\btarget\s*=\s*(["']).*?\1/gi, 'target="_blank"');
      } else {
        next += ' target="_blank"';
      }

      if (/\brel\s*=/i.test(next)) {
        next = next.replace(/\brel\s*=\s*(["'])(.*?)\1/gi, (m, q, relVal) => {
          const parts = new Set(
            String(relVal)
              .split(/\s+/)
              .map((p) => p.trim().toLowerCase())
              .filter(Boolean)
          );
          parts.add("noopener");
          parts.add("noreferrer");
          return `rel=${q}${[...parts].join(" ")}${q}`;
        });
      } else {
        next += ' rel="noopener noreferrer"';
      }

      return `<a${next}>`;
    });
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
