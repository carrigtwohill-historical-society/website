(function () {
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-site-nav]");
  const label = document.querySelector("[data-nav-toggle-label]");

  function setOpen(open) {
    if (!nav || !toggle) return;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("nav-open", open);
    if (label) label.textContent = open ? "Close" : "Menu";
    if (!open) {
      document.querySelectorAll(".nav-item.is-open").forEach((item) => {
        item.classList.remove("is-open");
        const btn = item.querySelector("[data-nav-parent]");
        if (btn) btn.setAttribute("aria-expanded", "false");
      });
    }
  }

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      setOpen(!nav.classList.contains("is-open"));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        if (window.matchMedia("(max-width: 900px)").matches) {
          setOpen(false);
        }
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  document.querySelectorAll("[data-nav-parent]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".nav-item");
      const willOpen = !item.classList.contains("is-open");
      // Accordion: one section open at a time on mobile
      if (window.matchMedia("(max-width: 900px)").matches) {
        document.querySelectorAll(".nav-item.is-open").forEach((other) => {
          if (other !== item) {
            other.classList.remove("is-open");
            const otherBtn = other.querySelector("[data-nav-parent]");
            if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
          }
        });
      }
      item.classList.toggle("is-open", willOpen);
      btn.setAttribute("aria-expanded", willOpen ? "true" : "false");
    });
  });

  if (window.matchMedia("(max-width: 900px)").matches) {
    document.querySelectorAll(".section-nav-panel").forEach((panel) => {
      panel.removeAttribute("open");
    });
  }
})();
