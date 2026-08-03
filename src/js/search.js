(function () {
  "use strict";

  var MIN_QUERY = 2;
  var DEBOUNCE_MS = 200;
  var DROPDOWN_LIMIT = 8;

  var pagefindPromise = null;

  function pathPrefix() {
    var raw = document.documentElement.getAttribute("data-path-prefix") || "";
    return raw.replace(/\/$/, "");
  }

  function withPrefix(url) {
    if (!url) return pathPrefix() + "/";
    try {
      if (/^https?:\/\//i.test(url)) {
        var parsed = new URL(url);
        url = parsed.pathname + parsed.search + parsed.hash;
      }
    } catch (e) {
      /* keep url */
    }
    var prefix = pathPrefix();
    if (!prefix) return url;
    if (url === prefix || url.indexOf(prefix + "/") === 0) return url;
    if (url.charAt(0) !== "/") url = "/" + url;
    return prefix + url;
  }

  function searchPageUrl(query) {
    var base = withPrefix("/search/");
    if (!query) return base;
    return base + "?q=" + encodeURIComponent(query);
  }

  function getPagefind() {
    if (!pagefindPromise) {
      var base = withPrefix("/pagefind/");
      if (base.slice(-1) !== "/") base += "/";
      pagefindPromise = import(base + "pagefind.js")
        .then(function (pf) {
          return pf.options({ bundlePath: base }).then(function () {
            return pf;
          });
        })
        .catch(function (err) {
          pagefindPromise = null;
          throw err;
        });
    }
    return pagefindPromise;
  }

  function debounce(fn, wait) {
    var timer = null;
    return function () {
      var args = arguments;
      var ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(ctx, args);
      }, wait);
    };
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Allow Pagefind <mark> tags only. */
  function formatExcerpt(html) {
    if (!html) return "";
    var safe = escapeHtml(html);
    return safe
      .replace(/&lt;mark&gt;/gi, "<mark>")
      .replace(/&lt;\/mark&gt;/gi, "</mark>");
  }

  function resultTitle(data, fallbackUrl) {
    var title = "";
    if (data && data.meta && data.meta.title) title = data.meta.title;
    else if (data && data.meta && data.meta["og:title"]) title = data.meta["og:title"];
    else title = fallbackUrl || "Untitled page";
    var sep = title.indexOf(" · ");
    if (sep > 0) title = title.slice(0, sep);
    return title.trim() || fallbackUrl || "Untitled page";
  }

  async function loadResults(query, limit) {
    var pf = await getPagefind();
    var search = await pf.search(query);
    var slice =
      typeof limit === "number" ? search.results.slice(0, limit) : search.results;
    var loaded = await Promise.all(
      slice.map(function (r) {
        return r.data();
      })
    );
    return {
      total: search.results.length,
      results: loaded,
    };
  }

  /* —— Header dropdown —— */

  function initHeaderSearch() {
    var root = document.querySelector("[data-site-search]");
    if (!root) return;

    var form = root.querySelector("[data-search-form]");
    var input = root.querySelector("[data-search-input]");
    var panel = root.querySelector("[data-search-results]");
    if (!form || !input || !panel) return;

    var activeIndex = -1;
    var currentQuery = "";
    var requestId = 0;

    function setExpanded(open) {
      input.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        panel.hidden = false;
        root.classList.add("is-open");
      } else {
        panel.hidden = true;
        root.classList.remove("is-open");
        activeIndex = -1;
      }
    }

    function closePanel() {
      setExpanded(false);
      panel.innerHTML = "";
    }

    function getOptions() {
      return Array.prototype.slice.call(panel.querySelectorAll("[data-search-option]"));
    }

    function highlightOption(index) {
      var options = getOptions();
      options.forEach(function (el, i) {
        var on = i === index;
        el.classList.toggle("is-active", on);
        el.setAttribute("aria-selected", on ? "true" : "false");
      });
      activeIndex = index;
      if (index >= 0 && options[index]) {
        input.setAttribute("aria-activedescendant", options[index].id);
      } else {
        input.removeAttribute("aria-activedescendant");
      }
    }

    function renderStatus(message) {
      panel.innerHTML =
        '<p class="header-search-status" role="status">' + escapeHtml(message) + "</p>";
      setExpanded(true);
      highlightOption(-1);
    }

    function renderResults(query, payload) {
      if (!payload.total) {
        renderStatus('No results for “' + query + '”');
        return;
      }

      var items = payload.results
        .map(function (data, i) {
          var url = withPrefix(data.url);
          var title = resultTitle(data, url);
          var excerpt = formatExcerpt(data.excerpt || "");
          var id = "site-search-option-" + i;
          return (
            '<a class="header-search-option" role="option" id="' +
            id +
            '" href="' +
            escapeHtml(url) +
            '" data-search-option aria-selected="false">' +
            '<span class="header-search-option-title">' +
            escapeHtml(title) +
            "</span>" +
            (excerpt
              ? '<span class="header-search-option-excerpt">' + excerpt + "</span>"
              : "") +
            "</a>"
          );
        })
        .join("");

      var footer =
        '<a class="header-search-view-all" href="' +
        escapeHtml(searchPageUrl(query)) +
        '">View all ' +
        payload.total +
        " result" +
        (payload.total === 1 ? "" : "s") +
        "</a>";

      panel.innerHTML =
        '<p class="header-search-status" role="status">' +
        payload.total +
        " result" +
        (payload.total === 1 ? "" : "s") +
        " for “" +
        escapeHtml(query) +
        "”</p>" +
        '<div class="header-search-options">' +
        items +
        "</div>" +
        footer;

      setExpanded(true);
      highlightOption(-1);
    }

    var runSearch = debounce(async function (query) {
      var id = ++requestId;
      currentQuery = query;

      if (query.length < MIN_QUERY) {
        closePanel();
        return;
      }

      renderStatus("Searching…");

      try {
        var payload = await loadResults(query, DROPDOWN_LIMIT);
        if (id !== requestId) return;
        renderResults(query, payload);
      } catch (err) {
        if (id !== requestId) return;
        renderStatus("Search is unavailable right now.");
        console.warn("Site search failed:", err);
      }
    }, DEBOUNCE_MS);

    input.addEventListener("input", function () {
      runSearch(input.value.trim());
    });

    input.addEventListener("focus", function () {
      if (input.value.trim().length >= MIN_QUERY && panel.innerHTML) {
        setExpanded(true);
      }
    });

    form.addEventListener("submit", function (e) {
      var q = input.value.trim();
      if (!q) {
        e.preventDefault();
        return;
      }
      var options = getOptions();
      if (activeIndex >= 0 && options[activeIndex]) {
        e.preventDefault();
        window.location.href = options[activeIndex].href;
        return;
      }
      e.preventDefault();
      window.location.href = searchPageUrl(q);
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closePanel();
        input.blur();
        return;
      }

      if (panel.hidden) return;

      var options = getOptions();
      if (!options.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        highlightOption(Math.min(activeIndex + 1, options.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        highlightOption(Math.max(activeIndex - 1, -1));
      }
    });

    document.addEventListener("click", function (e) {
      if (!root.contains(e.target)) closePanel();
    });
  }

  /* —— Full search page —— */

  function initSearchPage() {
    var page = document.querySelector("[data-search-page]");
    if (!page) return;

    var input = page.querySelector("[data-search-page-input]");
    var status = page.querySelector("[data-search-page-status]");
    var list = page.querySelector("[data-search-page-list]");
    if (!input || !status || !list) return;

    var params = new URLSearchParams(window.location.search);
    var initial = (params.get("q") || "").trim();
    if (initial) input.value = initial;

    var headerInput = document.querySelector("[data-search-input]");
    if (headerInput && initial) headerInput.value = initial;

    async function renderPage(query) {
      list.innerHTML = "";
      if (query.length < MIN_QUERY) {
        status.textContent =
          query.length === 0
            ? "Enter a search term to find pages across the site."
            : "Type at least two characters to search.";
        return;
      }

      status.textContent = "Searching…";

      try {
        var payload = await loadResults(query);
        if (!payload.total) {
          status.textContent = 'No results for “' + query + '”.';
          return;
        }

        status.textContent =
          payload.total +
          " result" +
          (payload.total === 1 ? "" : "s") +
          " for “" +
          query +
          "”";

        list.innerHTML = payload.results
          .map(function (data) {
            var url = withPrefix(data.url);
            var title = resultTitle(data, url);
            var excerpt = formatExcerpt(data.excerpt || "");
            return (
              '<li class="search-result">' +
              '<a class="search-result-link" href="' +
              escapeHtml(url) +
              '">' +
              '<span class="search-result-title">' +
              escapeHtml(title) +
              "</span>" +
              (excerpt
                ? '<span class="search-result-excerpt">' + excerpt + "</span>"
                : "") +
              '<span class="search-result-url">' +
              escapeHtml(url) +
              "</span>" +
              "</a>" +
              "</li>"
            );
          })
          .join("");
      } catch (err) {
        status.textContent = "Search is unavailable right now. Try again after the site finishes building.";
        console.warn("Site search failed:", err);
      }
    }

    var form = page.querySelector("[data-search-page-form]");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var q = input.value.trim();
        var url = searchPageUrl(q);
        if (q) {
          history.replaceState(null, "", url);
        } else {
          history.replaceState(null, "", withPrefix("/search/"));
        }
        renderPage(q);
      });
    }

    input.addEventListener(
      "input",
      debounce(function () {
        var q = input.value.trim();
        if (q.length >= MIN_QUERY || q.length === 0) {
          history.replaceState(null, "", q ? searchPageUrl(q) : withPrefix("/search/"));
          renderPage(q);
        }
      }, DEBOUNCE_MS)
    );

    renderPage(initial);
  }

  initHeaderSearch();
  initSearchPage();
})();
