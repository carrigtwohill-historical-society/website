/**
 * Historical map — MapLibre GL (Esri satellite, 3D terrain, Places tree, fly-to).
 */
(function () {
  "use strict";

  const DEFAULT_CENTER = [-8.266, 51.908];
  const DEFAULT_ZOOM = 12;
  const DEFAULT_PITCH = 52;
  const DEFAULT_BEARING = 0;
  const FIT_MAX_ZOOM = 15;
  const FLY_ZOOM = 16;
  const FLY_DURATION = 2500;
  const TERRAIN_EXAG = 1.5;

  const OSM_ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
  const ESRI_ATTRIBUTION =
    "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community";
  const TERRAIN_ATTRIBUTION =
    'Terrain © <a href="https://mapterhorn.com/attribution">Mapterhorn</a>';

  const CATEGORY_ORDER = [
    "castles-antiquities",
    "big-houses-estates",
    "churches-religious",
    "graveyards-memorials",
    "industry-trade",
    "shops-village",
    "notable-people",
    "townlands-placenames",
    "exhibit",
    "other",
    "unknown",
  ];

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

  function websiteLinkLabel(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch (e) {
      return "Related website";
    }
  }

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

  function terrainSources() {
    return {
      terrainSource: {
        type: "raster-dem",
        url: "https://tiles.mapterhorn.com/tilejson.json",
        tileSize: 512,
        attribution: TERRAIN_ATTRIBUTION,
      },
      hillshadeSource: {
        type: "raster-dem",
        url: "https://tiles.mapterhorn.com/tilejson.json",
        tileSize: 512,
      },
    };
  }

  function hillshadeLayer() {
    return {
      id: "hills",
      type: "hillshade",
      source: "hillshadeSource",
      paint: {
        "hillshade-shadow-color": "#473B24",
        "hillshade-exaggeration": 0.45,
      },
    };
  }

  function emptySourcesExtra() {
    return Object.assign(
      {
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
      },
      terrainSources()
    );
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
    const extras = emptySourcesExtra();
    if (!satellite) {
      return {
        version: 8,
        projection: { type: "globe" },
        glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
        terrain: { source: "terrainSource", exaggeration: TERRAIN_EXAG },
        sky: {},
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
          extras
        ),
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": "#f6f1e6" },
          },
          { id: "osm", type: "raster", source: "osm" },
          hillshadeLayer(),
          ...boundaryLayers(false),
          townlandNameLayer(false),
        ],
      };
    }

    return {
      version: 8,
      projection: { type: "globe" },
      glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
      terrain: { source: "terrainSource", exaggeration: TERRAIN_EXAG },
      sky: {},
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
        extras
      ),
      layers: [
        {
          id: "background",
          type: "background",
          paint: { "background-color": "#000" },
        },
        { id: "esri-imagery", type: "raster", source: "esri-imagery" },
        hillshadeLayer(),
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
    const shortPreview =
      preview.length > 140 ? preview.slice(0, 137).trim() + "…" : preview;
    const detailHref = place.detailPath ? prefixPath(place.detailPath) : null;

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
    const actionLinks = [];
    if (place.liveVideoPage) {
      actionLinks.push(
        `<a class="map-popup-link" href="${escapeHtml(
          place.liveVideoPage
        )}" target="_blank" rel="noopener">Watch video</a>`
      );
    }
    if (place.website) {
      actionLinks.push(
        `<a class="map-popup-link" href="${escapeHtml(
          place.website
        )}" target="_blank" rel="noopener">${escapeHtml(
          websiteLinkLabel(place.website)
        )}</a>`
      );
    }
    if (detailHref) {
      actionLinks.push(
        `<a class="map-popup-link" href="${escapeHtml(
          detailHref
        )}">Further information</a>`
      );
    }
    html += actionLinks.join(`<span class="map-popup-sep"> · </span>`);
    html += `</p></div>`;
    return html;
  }

  function createPinElement(place) {
    const wrap = document.createElement("button");
    wrap.type = "button";
    wrap.className = "map-pin map-pin-place";
    wrap.dataset.placeId = place.id || "";
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

  function placeHasCoords(place) {
    return (
      place &&
      place.location &&
      typeof place.location.lat === "number" &&
      typeof place.location.lng === "number"
    );
  }

  function groupPlaces(places) {
    const groups = new Map();
    for (const place of places) {
      if (!placeHasCoords(place)) continue;
      const id = place.category || "unknown";
      if (!groups.has(id)) {
        groups.set(id, {
          id,
          label: place.categoryLabel || id,
          colour: place.categoryColour || "#6B7280",
          places: [],
        });
      }
      groups.get(id).places.push(place);
    }
    const ordered = [];
    for (const id of CATEGORY_ORDER) {
      if (groups.has(id)) ordered.push(groups.get(id));
    }
    groups.forEach((g, id) => {
      if (!CATEGORY_ORDER.includes(id)) ordered.push(g);
    });
    for (const g of ordered) {
      g.places.sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""), "en-IE")
      );
    }
    return ordered;
  }

  async function init() {
    const el = document.getElementById("chs-map");
    if (!el || typeof maplibregl === "undefined") return;

    const status = document.getElementById("map-status");
    const hint = document.getElementById("map-layer-hint");
    const treeEl = document.getElementById("map-places-tree");
    const filterEl = document.getElementById("map-places-filter");
    const panelEl = document.getElementById("map-places-panel");
    const btnPlaces = document.getElementById("map-places-toggle");
    const btnPlacesClose = document.getElementById("map-places-close");
    if (status) status.hidden = false;

    let currentBasemap = "satellite";
    let townlandsOn = false;
    let townlandNamesOn = false;
    let townlandsData = null;
    let townlandLabelsData = null;
    let parishesData = null;
    let loadingBoundaries = false;
    let flyGen = 0;
    const records = new Map();

    const map = new maplibregl.Map({
      container: "chs-map",
      style: buildStyle("satellite"),
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: DEFAULT_PITCH,
      bearing: DEFAULT_BEARING,
      maxPitch: 85,
      attributionControl: { compact: true },
      cooperativeGestures: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      "top-right"
    );
    if (typeof maplibregl.TerrainControl === "function") {
      map.addControl(
        new maplibregl.TerrainControl({
          source: "terrainSource",
          exaggeration: TERRAIN_EXAG,
        }),
        "top-right"
      );
    }
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 120 }), "bottom-left");

    function applyTerrain() {
      if (!map.getSource("terrainSource")) return;
      try {
        map.setTerrain({ source: "terrainSource", exaggeration: TERRAIN_EXAG });
      } catch (_) {
        /* terrain optional */
      }
    }

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
      parts.push("click a place to fly there");
      hint.textContent = parts.join(" · ");
    }

    function syncButtons() {
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

    function setPanelOpen(open) {
      document.body.classList.toggle("map-places-open", open);
      if (btnPlaces) btnPlaces.setAttribute("aria-expanded", open ? "true" : "false");
      if (open && panelEl) panelEl.focus();
      window.setTimeout(() => map.resize(), 220);
    }

    if (btnPlaces) {
      btnPlaces.addEventListener("click", () => setPanelOpen(true));
    }
    if (btnPlacesClose) {
      btnPlacesClose.addEventListener("click", () => setPanelOpen(false));
    }

    map.on("style.load", () => {
      applyBoundaryData();
      applyTerrain();
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
        syncButtons();
        if (townlandsOn) await ensureBoundaries();
        applyBoundaryData();
      });
    }

    if (btnNames) {
      btnNames.addEventListener("click", async () => {
        townlandNamesOn = !townlandNamesOn;
        if (townlandNamesOn) {
          townlandsOn = true;
          await ensureBoundaries();
          if (map.getZoom() < 10.8) {
            map.easeTo({ zoom: 11.2, duration: 600, pitch: map.getPitch() });
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

    try {
      const canvas = el.querySelector("canvas");
      if (canvas) canvas.setAttribute("tabindex", "-1");
    } catch (_) {
      /* ignore */
    }

    function closeAllPopups() {
      records.forEach((rec) => {
        const popup = rec.marker.getPopup();
        if (popup && popup.isOpen()) rec.marker.togglePopup();
      });
    }

    function setPinVisible(placeId, on) {
      const rec = records.get(placeId);
      if (!rec) return;
      rec.visible = on;
      rec.marker.getElement().hidden = !on;
      if (!on) {
        const popup = rec.marker.getPopup();
        if (popup && popup.isOpen()) rec.marker.togglePopup();
      }
    }

    function highlightPlace(placeId) {
      treeEl.querySelectorAll(".map-places-row").forEach((row) => {
        row.classList.toggle("is-selected", row.dataset.placeId === placeId);
      });
    }

    function flyToPlace(place) {
      if (!placeHasCoords(place)) return;
      const rec = records.get(place.id);
      if (rec && rec.visible === false) {
        const check = treeEl.querySelector(
          '.map-places-row[data-place-id="' + place.id + '"] .map-places-check'
        );
        if (check) {
          check.checked = true;
          setPinVisible(place.id, true);
          syncFolderChecks();
        }
      }
      highlightPlace(place.id);
      const gen = ++flyGen;
      closeAllPopups();
      map.flyTo({
        center: [place.location.lng, place.location.lat],
        zoom: FLY_ZOOM,
        pitch: DEFAULT_PITCH,
        duration: FLY_DURATION,
        essential: true,
      });
      map.once("moveend", () => {
        if (gen !== flyGen) return;
        const current = records.get(place.id);
        if (!current) return;
        const popup = current.marker.getPopup();
        if (popup && !popup.isOpen()) current.marker.togglePopup();
      });
      if (window.matchMedia("(max-width: 700px)").matches) {
        setPanelOpen(false);
      }
    }

    function visiblePlaceButtons() {
      return Array.prototype.slice.call(
        treeEl.querySelectorAll(
          ".map-places-row:not(.is-filtered-out) .map-places-item-btn"
        )
      );
    }

    function syncFolderChecks() {
      treeEl.querySelectorAll(".map-places-folder").forEach((folder) => {
        const boxes = folder.querySelectorAll(
          ".map-places-folder-list .map-places-check"
        );
        const folderCheck = folder.querySelector(".map-places-folder-check");
        if (!folderCheck || !boxes.length) return;
        let on = 0;
        boxes.forEach((b) => {
          if (b.checked) on++;
        });
        folderCheck.checked = on === boxes.length;
        folderCheck.indeterminate = on > 0 && on < boxes.length;
      });
    }

    function applyFilter(q) {
      const query = String(q || "")
        .trim()
        .toLowerCase();
      treeEl.querySelectorAll(".map-places-row").forEach((row) => {
        const name = (row.dataset.name || "").toLowerCase();
        const match = !query || name.indexOf(query) !== -1;
        row.classList.toggle("is-filtered-out", !match);
      });
      treeEl.querySelectorAll(".map-places-folder").forEach((folder) => {
        const any = folder.querySelector(
          ".map-places-row:not(.is-filtered-out)"
        );
        folder.hidden = query && !any;
      });
    }

    function buildTree(mappable) {
      if (!treeEl) return;
      treeEl.innerHTML = "";
      const groups = groupPlaces(mappable);
      for (const group of groups) {
        const folder = document.createElement("div");
        folder.className = "map-places-folder";
        folder.dataset.category = group.id;

        const head = document.createElement("div");
        head.className = "map-places-folder-head";

        const folderCheck = document.createElement("input");
        folderCheck.type = "checkbox";
        folderCheck.className = "map-places-check map-places-folder-check";
        folderCheck.checked = true;
        folderCheck.title = "Show or hide this group";
        folderCheck.addEventListener("change", () => {
          const on = folderCheck.checked;
          folder.querySelectorAll(".map-places-folder-list .map-places-check").forEach(
            (box) => {
              box.checked = on;
              setPinVisible(box.closest(".map-places-row").dataset.placeId, on);
            }
          );
          folderCheck.indeterminate = false;
        });

        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "map-places-folder-toggle";
        toggle.setAttribute("aria-expanded", "true");

        const swatch = document.createElement("span");
        swatch.className = "map-places-swatch";
        swatch.style.background = group.colour;
        swatch.setAttribute("aria-hidden", "true");

        const label = document.createElement("span");
        label.className = "map-places-folder-label";
        label.textContent = group.label;

        const count = document.createElement("span");
        count.className = "map-places-count";
        count.textContent = String(group.places.length);

        toggle.appendChild(swatch);
        toggle.appendChild(label);
        toggle.appendChild(count);
        toggle.addEventListener("click", () => {
          const collapsed = folder.classList.toggle("is-collapsed");
          toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
        });

        head.appendChild(folderCheck);
        head.appendChild(toggle);

        const list = document.createElement("ul");
        list.className = "map-places-folder-list";
        list.setAttribute("role", "group");

        for (const place of group.places) {
          const li = document.createElement("li");
          li.className = "map-places-row";
          li.dataset.placeId = place.id;
          li.dataset.name = place.name || "";
          li.setAttribute("role", "treeitem");

          const check = document.createElement("input");
          check.type = "checkbox";
          check.className = "map-places-check";
          check.checked = true;
          check.title = "Show on map";
          check.addEventListener("change", () => {
            setPinVisible(place.id, check.checked);
            syncFolderChecks();
          });

          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "map-places-item-btn";
          btn.textContent = place.name || "Historical place";
          btn.addEventListener("click", () => flyToPlace(place));

          li.appendChild(check);
          li.appendChild(btn);
          list.appendChild(li);
        }

        folder.appendChild(head);
        folder.appendChild(list);
        treeEl.appendChild(folder);
      }

      treeEl.addEventListener("keydown", (e) => {
        const buttons = visiblePlaceButtons();
        const current = document.activeElement;
        const idx = buttons.indexOf(current);
        if (e.key === "ArrowDown") {
          e.preventDefault();
          const next = buttons[Math.min(idx + 1, buttons.length - 1)] || buttons[0];
          if (next) next.focus();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          const prev = buttons[Math.max(idx - 1, 0)] || buttons[0];
          if (prev) prev.focus();
        } else if (e.key === "Enter" && idx >= 0) {
          e.preventDefault();
          current.click();
        }
      });
    }

    if (filterEl) {
      filterEl.addEventListener("input", () => applyFilter(filterEl.value));
    }

    const res = await fetch(prefixPath("/data/places.json"));
    const data = await res.json();
    const places = data.places || [];
    const bounds = new maplibregl.LngLatBounds();
    let count = 0;
    const mappable = [];

    places.forEach((place) => {
      if (!placeHasCoords(place)) return;
      const lng = place.location.lng;
      const lat = place.location.lat;
      bounds.extend([lng, lat]);
      count++;
      mappable.push(place);

      const marker = new maplibregl.Marker({
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

      marker.getElement().addEventListener("click", () => {
        highlightPlace(place.id);
      });

      records.set(place.id, { place, marker, visible: true });
    });

    buildTree(mappable);

    map.on("zoomend", updateHint);
    window.addEventListener("resize", () => map.resize());

    const applyBounds = () => {
      if (count > 1) {
        map.fitBounds(bounds, {
          padding: 48,
          maxZoom: FIT_MAX_ZOOM,
          pitch: DEFAULT_PITCH,
          bearing: DEFAULT_BEARING,
          duration: 0,
        });
      }
      applyTerrain();
      updateHint();
      if (status) status.hidden = true;
      map.resize();
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
