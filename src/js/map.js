/**
 * Historical map — MapLibre GL (jimmap-style Esri satellite + globe tilt).
 * Circle markers; labels from zoom threshold; optional townland names/borders.
 */
(function () {
  "use strict";

  const DEFAULT_CENTER = [-8.266, 51.908];
  const DEFAULT_ZOOM = 12;
  const DEFAULT_PITCH = 30;
  const DEFAULT_BEARING = 0;
  const FIT_MAX_ZOOM = 15;
  const LABEL_MIN_ZOOM = 12.2;

  const OSM_ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
  const ESRI_ATTRIBUTION =
    "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community";

  function prefixPath(p) {
    const css = document.querySelector('link[href*="/css/site.css"]');
    if (css) {
      const href = css.getAttribute("href");
      const idx = href.indexOf("/css/site.css");
      if (idx > 0) return href.slice(0, idx) + p;
    }
    return p;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Average of ring vertices — good enough for townland label anchors. */
  function ringCentroid(ring) {
    let x = 0;
    let y = 0;
    let n = 0;
    for (let i = 0; i < ring.length; i++) {
      const c = ring[i];
      if (!c || c.length < 2) continue;
      x += c[0];
      y += c[1];
      n++;
    }
    if (!n) return null;
    return [x / n, y / n];
  }

  function geometryLabelPoint(geom) {
    if (!geom) return null;
    if (geom.type === "Point") return geom.coordinates;
    if (geom.type === "MultiPoint") return geom.coordinates[0] || null;
    if (geom.type === "Polygon") {
      return ringCentroid(geom.coordinates[0] || []);
    }
    if (geom.type === "MultiPolygon") {
      let best = null;
      let bestLen = -1;
      for (const poly of geom.coordinates) {
        const outer = poly[0] || [];
        if (outer.length > bestLen) {
          bestLen = outer.length;
          best = ringCentroid(outer);
        }
      }
      return best;
    }
    return null;
  }

  function townlandLabelCollection(fc) {
    const features = [];
    for (const f of fc.features || []) {
      const name =
        (f.properties && (f.properties.name || f.properties.name_en)) ||
        (f.properties && f.properties.tags && f.properties.tags.name) ||
        "";
      if (!name) continue;
      const pt = geometryLabelPoint(f.geometry);
      if (!pt) continue;
      features.push({
        type: "Feature",
        properties: {
          name: String(name),
          name_irish:
            (f.properties && f.properties.name_irish) ||
            (f.properties && f.properties.tags && f.properties.tags["name:ga"]) ||
            "",
        },
        geometry: { type: "Point", coordinates: pt },
      });
    }
    return { type: "FeatureCollection", features };
  }

  function emptySourcesExtra() {
    return {
      townlands: {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      },
      "townland-labels": {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      },
      parishes: {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      },
    };
  }

  function boundaryLayers(satellite) {
    const line = satellite ? "#ffffff" : "#0b3d6e";
    const parish = satellite ? "#ffdd00" : "#e2b84a";
    return [
      {
        id: "townland-fill",
        type: "fill",
        source: "townlands",
        layout: { visibility: "none" },
        paint: { "fill-color": line, "fill-opacity": 0.06 },
      },
      {
        id: "townland-outline",
        type: "line",
        source: "townlands",
        layout: { visibility: "none" },
        paint: {
          "line-color": line,
          "line-opacity": satellite ? 0.85 : 0.65,
          "line-width": 1.25,
        },
      },
      {
        id: "parish-outline-casing",
        type: "line",
        source: "parishes",
        paint: {
          "line-color": "#1c1a17",
          "line-opacity": 0.55,
          "line-width": 4.5,
        },
      },
      {
        id: "parish-outline",
        type: "line",
        source: "parishes",
        paint: {
          "line-color": parish,
          "line-opacity": 1,
          "line-width": 2.5,
        },
      },
    ];
  }

  /** Drawn last so names sit above satellite reference tiles. */
  function townlandNameLayer(satellite) {
    return {
      id: "townland-names",
      type: "symbol",
      source: "townland-labels",
      minzoom: 9.5,
      layout: {
        visibility: "none",
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 9.5, 10, 13, 13, 15, 15],
        "text-max-width": 7,
        "text-padding": 2,
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        "symbol-placement": "point",
      },
      paint: {
        "text-color": satellite ? "#ffffff" : "#0b3d6e",
        "text-halo-color": satellite
          ? "rgba(10, 16, 24, 0.95)"
          : "rgba(255, 253, 248, 0.95)",
        "text-halo-width": 1.6,
      },
    };
  }

  function buildStyle(kind) {
    const satellite = kind !== "street";
    if (!satellite) {
      return {
        version: 8,
        projection: { type: "globe" },
        glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
        sources: Object.assign(
          {
            osm: {
              type: "raster",
              tiles: [
                "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
              ],
              tileSize: 256,
              maxzoom: 19,
              attribution: OSM_ATTRIBUTION,
            },
          },
          emptySourcesExtra()
        ),
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": "#f6f1e6" },
          },
          { id: "osm", type: "raster", source: "osm" },
          ...boundaryLayers(false),
          townlandNameLayer(false),
        ],
      };
    }

    return {
      version: 8,
      projection: { type: "globe" },
      glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
      sources: Object.assign(
        {
          "esri-imagery": {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            maxzoom: 19,
            attribution: ESRI_ATTRIBUTION,
          },
          "esri-reference": {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            maxzoom: 19,
          },
        },
        emptySourcesExtra()
      ),
      layers: [
        {
          id: "background",
          type: "background",
          paint: { "background-color": "#000" },
        },
        { id: "esri-imagery", type: "raster", source: "esri-imagery" },
        ...boundaryLayers(true),
        { id: "esri-reference", type: "raster", source: "esri-reference" },
        townlandNameLayer(true),
      ],
    };
  }

  function popupHtml(place) {
    const catLabel =
      place.categoryLabel ||
      (place.category && place.category !== "unknown" ? place.category : "");
    const cat =
      catLabel && String(catLabel).toLowerCase() !== "unknown"
        ? escapeHtml(catLabel)
        : "";
    const preview = place.hasPreview ? String(place.preview).trim() : "";
    // Keep popup short — long notes live on the place page
    const shortPreview =
      preview.length > 140 ? preview.slice(0, 137).trim() + "…" : preview;
    const detailHref = place.detailPath
      ? prefixPath(place.detailPath)
      : null;

    let html = `<div class="map-popup">`;
    html += `<h3>${escapeHtml(place.name || "Historical place")}</h3>`;

    if (cat || place.townland) {
      html += `<p class="map-popup-meta">`;
      if (cat) html += cat;
      if (cat && place.townland) html += " · ";
      if (place.townland) html += escapeHtml(place.townland);
      html += `</p>`;
    } else {
      html += `<p class="map-popup-meta map-popup-meta-empty">Category to be added</p>`;
    }

    // Only show a real photo in the popup — no tall empty placeholder
    if (place.heroImage) {
      html += `<figure class="map-popup-figure"><img src="${escapeHtml(
        place.heroImage.startsWith("http")
          ? place.heroImage
          : prefixPath(place.heroImage)
      )}" alt="${escapeHtml(place.heroAlt || place.name)}"></figure>`;
    }

    if (shortPreview) {
      html += `<p class="map-popup-info">${escapeHtml(shortPreview)}</p>`;
    }

    html += `<p class="map-popup-actions">`;
    if (place.liveVideoPage) {
      html += `<a class="map-popup-link" href="${escapeHtml(
        place.liveVideoPage
      )}" target="_blank" rel="noopener">Watch video</a>`;
    }
    if (detailHref) {
      if (place.liveVideoPage) html += `<span class="map-popup-sep"> · </span>`;
      html += `<a class="map-popup-link" href="${escapeHtml(
        detailHref
      )}">Further information</a>`;
    }
    html += `</p>`;

    html += `</div>`;
    return html;
  }

  function createPinElement(place) {
    const wrap = document.createElement("button");
    wrap.type = "button";
    wrap.className = "map-pin map-pin-place";
    const catLabel = place.categoryLabel || place.category || "Historical place";
    wrap.setAttribute(
      "aria-label",
      `${place.name || "Historical place"} (${catLabel})`
    );
    wrap.title = place.name || "";

    const dot = document.createElement("span");
    dot.className = "map-pin-dot";
    if (place.categoryColour) {
      dot.style.background = place.categoryColour;
      dot.style.borderColor = "#1c1a17";
    }
    wrap.appendChild(dot);

    if (place.name) {
      const label = document.createElement("span");
      label.className = "map-pin-label";
      label.textContent = place.name;
      wrap.appendChild(label);
    }
    return wrap;
  }

  function setOverlayVisibility(map, layerIds, on) {
    const v = on ? "visible" : "none";
    for (const id of layerIds) {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", v);
    }
  }

  function setToggleState(btn, on, onLabel, offLabel) {
    if (!btn) return;
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.classList.toggle("is-active", on);
    if (onLabel && offLabel) btn.textContent = on ? onLabel : offLabel;
  }

  async function init() {
    const el = document.getElementById("chs-map");
    if (!el || typeof maplibregl === "undefined") return;

    const status = document.getElementById("map-status");
    const hint = document.getElementById("map-layer-hint");
    if (status) status.hidden = false;

    let currentBasemap = "satellite";
    let townlandsOn = false;
    let townlandNamesOn = false;
    let townlandsData = null;
    let townlandLabelsData = null;
    let parishesData = null;
    let loadingBoundaries = false;

    const map = new maplibregl.Map({
      container: "chs-map",
      style: buildStyle("satellite"),
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: DEFAULT_PITCH,
      bearing: DEFAULT_BEARING,
      maxPitch: 75,
      attributionControl: { compact: true },
      // Let the page scroll normally; require Ctrl/⌘+scroll (or +/-) to zoom
      cooperativeGestures: true,
    });

    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      "top-right"
    );
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 120 }), "bottom-left");

    const syncLabelVisibility = () => {
      el.classList.toggle("show-pin-labels", map.getZoom() >= LABEL_MIN_ZOOM);
    };
    map.on("zoom", syncLabelVisibility);
    map.on("zoomend", syncLabelVisibility);

    const btnBase = document.getElementById("map-basemap-toggle");
    const btnTown = document.getElementById("map-townlands-toggle");
    const btnNames = document.getElementById("map-townland-names-toggle");

    function updateHint() {
      if (!hint) return;
      const parts = [];
      parts.push(
        currentBasemap === "satellite" ? "Satellite view" : "Street map"
      );
      if (townlandsOn) parts.push("townland borders on");
      if (townlandNamesOn) {
        parts.push("townland names on");
        if (map.getZoom() < 10.5) {
          parts.push("zoom in a little if names look sparse");
        }
      }
      if (!townlandsOn && !townlandNamesOn) {
        parts.push("use the buttons above to show townland borders or names");
      }
      hint.textContent = parts.join(" · ");
    }

    function syncButtons() {
      setToggleState(
        btnBase,
        currentBasemap === "street",
        "Show satellite",
        "Show street map"
      );
      // Basemap button: pressed = street mode active (optional); keep as action label
      if (btnBase) {
        btnBase.setAttribute(
          "aria-pressed",
          currentBasemap === "street" ? "true" : "false"
        );
        btnBase.classList.toggle("is-active", currentBasemap === "street");
        btnBase.textContent =
          currentBasemap === "satellite" ? "Show street map" : "Show satellite";
      }
      setToggleState(btnTown, townlandsOn, "Hide townland borders", "Show townland borders");
      setToggleState(btnNames, townlandNamesOn, "Hide townland names", "Show townland names");
      updateHint();
    }

    async function ensureBoundaries() {
      if (townlandsData && parishesData && townlandLabelsData) return;
      if (loadingBoundaries) {
        while (loadingBoundaries) {
          await new Promise((r) => setTimeout(r, 50));
        }
        return;
      }
      loadingBoundaries = true;
      if (btnTown) btnTown.disabled = true;
      if (btnNames) btnNames.disabled = true;
      try {
        const [tRes, pRes] = await Promise.all([
          fetch(prefixPath("/data/carrigtwohill-townlands.geojson")),
          fetch(prefixPath("/data/carrigtwohill-parishes.geojson")),
        ]);
        if (tRes.ok) {
          townlandsData = await tRes.json();
          townlandLabelsData = townlandLabelCollection(townlandsData);
        }
        if (pRes.ok) parishesData = await pRes.json();
      } finally {
        loadingBoundaries = false;
        if (btnTown) btnTown.disabled = false;
        if (btnNames) btnNames.disabled = false;
      }
    }

    function applyBoundaryData() {
      const t = map.getSource("townlands");
      const tl = map.getSource("townland-labels");
      const p = map.getSource("parishes");
      if (t && townlandsData) t.setData(townlandsData);
      if (tl && townlandLabelsData) tl.setData(townlandLabelsData);
      if (p && parishesData) p.setData(parishesData);
      setOverlayVisibility(
        map,
        ["townland-fill", "townland-outline"],
        townlandsOn
      );
      setOverlayVisibility(map, ["townland-names"], townlandNamesOn);
      updateHint();
    }

    map.on("style.load", () => {
      applyBoundaryData();
      syncButtons();
    });

    if (btnBase) {
      btnBase.addEventListener("click", () => {
        currentBasemap = currentBasemap === "satellite" ? "street" : "satellite";
        syncButtons();
        map.setStyle(buildStyle(currentBasemap), { diff: false });
      });
    }

    if (btnTown) {
      btnTown.addEventListener("click", async () => {
        townlandsOn = !townlandsOn;
        if (!townlandsOn && townlandNamesOn) {
          // Keep names usable; borders can be off independently
        }
        syncButtons();
        if (townlandsOn) await ensureBoundaries();
        applyBoundaryData();
      });
    }

    if (btnNames) {
      btnNames.addEventListener("click", async () => {
        townlandNamesOn = !townlandNamesOn;
        if (townlandNamesOn) {
          // Borders help names make sense — turn on together
          townlandsOn = true;
          await ensureBoundaries();
          // Nudge zoom if labels would be sparse
          if (map.getZoom() < 10.8) {
            map.easeTo({ zoom: 11.2, duration: 600 });
          }
        }
        syncButtons();
        applyBoundaryData();
      });
    }

    syncButtons();

    try {
      const pr = await fetch(prefixPath("/data/carrigtwohill-parishes.geojson"));
      if (pr.ok) parishesData = await pr.json();
      applyBoundaryData();
    } catch (_) {
      /* optional */
    }

    // Keep keyboard users from getting stuck in the WebGL canvas
    try {
      const canvas = el.querySelector("canvas");
      if (canvas) canvas.setAttribute("tabindex", "-1");
    } catch (_) {
      /* ignore */
    }

    const res = await fetch(prefixPath("/data/places.json"));
    const data = await res.json();
    const places = data.places || [];
    const bounds = new maplibregl.LngLatBounds();
    let count = 0;
    places.forEach((place) => {
      if (
        !place.location ||
        typeof place.location.lat !== "number" ||
        typeof place.location.lng !== "number"
      ) {
        return;
      }
      const lng = place.location.lng;
      const lat = place.location.lat;
      bounds.extend([lng, lat]);
      count++;

      new maplibregl.Marker({
        element: createPinElement(place),
        anchor: "center",
      })
        .setLngLat([lng, lat])
        .setPopup(
          new maplibregl.Popup({
            offset: 16,
            maxWidth: "280px",
            closeButton: true,
            focusAfterOpen: false,
          }).setHTML(popupHtml(place))
        )
        .addTo(map);
    });

    map.on("style.load", syncLabelVisibility);
    map.on("zoomend", updateHint);

    const applyBounds = () => {
      if (count > 1) {
        map.fitBounds(bounds, {
          padding: 60,
          maxZoom: FIT_MAX_ZOOM,
          pitch: DEFAULT_PITCH,
          bearing: DEFAULT_BEARING,
          duration: 0,
        });
      }
      syncLabelVisibility();
      updateHint();
      if (status) status.hidden = true;
    };

    if (map.loaded()) applyBounds();
    else map.once("load", applyBounds);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
