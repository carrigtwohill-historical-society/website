(function () {
  "use strict";

  var root = document.querySelector("[data-interred-search]");
  if (!root) return;

  var select = root.querySelector("[data-interred-surname]");
  var cemeterySelect = root.querySelector("[data-interred-cemetery]");
  var status = root.querySelector("[data-interred-status]");
  var results = document.querySelector("[data-interred-results]");
  var pageSize = 15;
  var currentRows = [];
  var currentPage = 1;
  var siteHeader = document.querySelector(".site-header");
  var columns = [
    "No", "Plot", "Row", "Interred", "Date", "Age", "Born", "Relationship", "Address", "Townland"
  ];

  function sitePath(path) {
    var prefix = (document.documentElement.getAttribute("data-path-prefix") || "").replace(/\/$/, "");
    return prefix + path;
  }

  function updateStickyHeaderOffset() {
    if (siteHeader) {
      root.style.setProperty("--interred-sticky-top", siteHeader.getBoundingClientRect().height + "px");
    }
  }

  updateStickyHeaderOffset();
  window.addEventListener("resize", updateStickyHeaderOffset);

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function displayInterred(row) {
    var name = String(row.Interred || "").trim();
    var alias = String(row.Alias || "").trim();
    var surname = String(row.Surname || "").trim();
    if (!name || !alias || !surname) return name;

    var surnameStart = name.toLowerCase().lastIndexOf(surname.toLowerCase());
    if (surnameStart < 0) return name;
    return name.slice(0, surnameStart).trimEnd() + " (" + alias + ") " + name.slice(surnameStart);
  }

  function relatedFields(row) {
    return Object.entries(row.Civil || {}).filter(function (entry) {
      var fieldName = entry[0].toLowerCase();
      return fieldName !== "no" && fieldName !== "burialid" && fieldName !== "certid";
    });
  }

  function renderRelated(row, rowIndex) {
    var fields = relatedFields(row);
    if (!fields.length) return "";
    var detailId = "interred-detail-" + rowIndex;
    var content = fields.map(function (entry) {
      return "<dt>" + escapeHtml(entry[0]) + "</dt><dd>" + escapeHtml(entry[1]) + "</dd>";
    }).join("");
    return "<button type=\"button\" class=\"interred-detail-toggle\" data-interred-detail=\"" + detailId +
      "\" aria-expanded=\"false\" aria-controls=\"" + detailId + "\" aria-label=\"Show related record details\">+</button>" +
      "<div id=\"" + detailId + "\" class=\"interred-detail\" hidden><dl>" + content + "</dl></div>";
  }

  function renderPage() {
    if (!currentRows.length) {
      results.innerHTML = "";
      status.textContent = "No records found for this surname and cemetery.";
      return;
    }

    var totalPages = Math.ceil(currentRows.length / pageSize);
    var start = (currentPage - 1) * pageSize;
    var pageRows = currentRows.slice(start, start + pageSize);
    var head = columns.map(function (column) {
      return "<th scope=\"col\">" + escapeHtml(column) + "</th>";
    }).join("");
    var body = pageRows.map(function (row, rowIndex) {
      var cells = columns.map(function (column, cellIndex) {
        if (cellIndex === 0) {
          return "<td>" + renderRelated(row, start + rowIndex) + escapeHtml(row.No) + "</td>";
        }
        var value = column === "Interred" ? displayInterred(row) : row[column];
        return "<td>" + escapeHtml(value) + "</td>";
      });
      return "<tr>" + cells.join("") + "</tr>";
    }).join("");
    var pages = "";

    for (var page = 1; page <= totalPages; page += 1) {
      pages += "<button type=\"button\" class=\"interred-page" +
        (page === currentPage ? " is-current" : "") +
        "\" data-interred-page=\"" + page + "\" aria-label=\"Page " + page + "\"" +
        (page === currentPage ? " aria-current=\"page\"" : "") + ">" + page + "</button>";
    }

    results.innerHTML =
      "<div class=\"interred-table-wrap\"><table class=\"interred-table\"><thead><tr>" +
      head + "</tr></thead><tbody>" + body + "</tbody></table></div>" +
      "<nav class=\"interred-pager\" aria-label=\"Cemetery result pages\">" +
      "<button type=\"button\" class=\"interred-page-nav\" data-interred-page=\"" +
      (currentPage - 1) + "\"" + (currentPage === 1 ? " disabled" : "") +
      ">Previous</button>" + pages +
      "<button type=\"button\" class=\"interred-page-nav\" data-interred-page=\"" +
      (currentPage + 1) + "\"" + (currentPage === totalPages ? " disabled" : "") +
      ">Next</button></nav>";
    status.textContent = "Showing " + (start + 1) + "-" + Math.min(start + pageSize, currentRows.length) +
      " of " + currentRows.length + " records.";

    results.querySelectorAll("[data-interred-page]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (button.disabled) return;
        currentPage = Number(button.getAttribute("data-interred-page"));
        renderPage();
      });
    });
    results.querySelectorAll("[data-interred-detail]").forEach(function (button) {
      button.addEventListener("click", function () {
        var detail = document.getElementById(button.getAttribute("data-interred-detail"));
        var expanded = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", String(!expanded));
        button.textContent = expanded ? "+" : "−";
        detail.hidden = expanded;
      });
    });
  }

  fetch(sitePath("/data/interred.json"))
    .then(function (response) {
      if (!response.ok) throw new Error("Could not load cemetery records");
      return response.json();
    })
    .then(function (data) {
      var records = data.records || [];
      function matchesSurname(row, surname) {
        var selected = String(surname || "").trim().toLowerCase();
        return [row.Surname, row.PlotSurname, row.Alias].some(function (value) {
          return String(value || "").trim().toLowerCase() === selected;
        });
      }

      function plotKey(value) {
        return String(value || "").trim().toLowerCase();
      }

      function updateSurnames() {
        var surnames = [...new Set(records.reduce(function (values, row) {
          [row.Surname || row.PlotSurname, row.Alias].forEach(function (value) {
            if (value) values.push(value);
          });
          return values;
        }, []))].sort(function (a, b) {
          return a.localeCompare(b);
        });
        select.innerHTML = "<option value=\"\">Choose a surname</option>";
        surnames.forEach(function (surname) {
          var option = document.createElement("option");
          option.value = surname;
          option.textContent = surname;
          select.appendChild(option);
        });
      }

      function cemeteryOrder(cemetery) {
        var order = { "St David's": 0, "Templecurraheen": 1, "Caherlag": 2 };
        return order[cemetery] == null ? 99 : order[cemetery];
      }

      function updateCemeteries() {
        var surname = select.value;
        var available = records.filter(function (row) {
          return matchesSurname(row, surname);
        }).map(function (row) {
          return row.Cemetery;
        });
        var cemeteries = [...new Set(available)].sort(function (a, b) {
          return cemeteryOrder(a) - cemeteryOrder(b) || a.localeCompare(b);
        });
        cemeterySelect.innerHTML = "<option value=\"\">Choose a cemetery</option>";
        cemeteries.forEach(function (cemetery) {
          var option = document.createElement("option");
          option.value = cemetery;
          option.textContent = cemetery;
          cemeterySelect.appendChild(option);
        });
        cemeterySelect.disabled = !surname || cemeteries.length === 0;
        if (surname && cemeteries.length === 0) {
          status.textContent = "No cemetery records found for this surname.";
        }
      }

      function updateResults() {
        var cemetery = cemeterySelect.value;
        var surname = select.value;
        if (!surname || !cemetery) {
          currentRows = [];
          results.innerHTML = "";
          status.textContent = surname ? "Select a cemetery to view matching records." :
            "Select a surname first.";
          return;
        }
        var matchingRows = records.filter(function (row) {
          return matchesSurname(row, surname) && (!cemetery || row.Cemetery === cemetery);
        });
        var matchingPlots = new Set(matchingRows.map(function (row) {
          return plotKey(row.Plot);
        }).filter(Boolean));
        currentRows = records.filter(function (row) {
          return row.Cemetery === cemetery && matchingPlots.has(plotKey(row.Plot));
        });
        currentPage = 1;
        renderPage();
      }

      updateSurnames();
      select.value = "Agheson";
      updateCemeteries();
      if (cemeterySelect.options.length === 2) {
        cemeterySelect.value = cemeterySelect.options[1].value;
        updateResults();
      } else {
        status.textContent = records.length + " records available. Select a cemetery to view Agheson records.";
      }
      select.addEventListener("change", function () {
        updateCemeteries();
        cemeterySelect.value = "";
        updateResults();
      });
      cemeterySelect.addEventListener("change", updateResults);
    })
    .catch(function () {
      select.disabled = true;
      cemeterySelect.disabled = true;
      status.textContent = "The cemetery records are temporarily unavailable.";
    });
})();
