(function () {
  "use strict";

  var root = document.querySelector("[data-interred-search]");
  if (!root) return;

  var select = root.querySelector("[data-interred-surname]");
  var status = root.querySelector("[data-interred-status]");
  var results = document.querySelector("[data-interred-results]");
  var pageSize = 15;
  var currentRows = [];
  var currentPage = 1;
  var columns = [
    "Cemetery", "Grave", "Interred", "Burial", "Age", "Birth",
    "Certificate", "Aged", "Status", "Occupation", "Address", "Townlands", "Witness"
  ];

  function sitePath(path) {
    var prefix = (document.documentElement.getAttribute("data-path-prefix") || "").replace(/\/$/, "");
    return prefix + path;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderPage() {
    if (!currentRows.length) {
      results.innerHTML = "";
      status.textContent = "Select a surname to view matching records.";
      return;
    }

    var totalPages = Math.ceil(currentRows.length / pageSize);
    var start = (currentPage - 1) * pageSize;
    var pageRows = currentRows.slice(start, start + pageSize);
    var head = columns.map(function (column) {
      return "<th scope=\"col\">" + escapeHtml(column) + "</th>";
    }).join("");
    var body = pageRows.map(function (row) {
      return "<tr>" + columns.map(function (column) {
        return "<td>" + escapeHtml(row[column]) + "</td>";
      }).join("") + "</tr>";
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
  }

  fetch(sitePath("/data/interred.json"))
    .then(function (response) {
      if (!response.ok) throw new Error("Could not load cemetery records");
      return response.json();
    })
    .then(function (data) {
      (data.surnames || []).forEach(function (surname) {
        var option = document.createElement("option");
        option.value = surname;
        option.textContent = surname;
        select.appendChild(option);
      });
      var records = data.records || [];
      status.textContent = records.length + " records available. Select a surname to search.";
      select.addEventListener("change", function () {
        var surname = select.value;
        currentRows = records.filter(function (row) {
          return row.PlotSurname === surname;
        });
        currentPage = 1;
        renderPage();
      });
    })
    .catch(function () {
      select.disabled = true;
      status.textContent = "The cemetery records are temporarily unavailable.";
    });
})();
