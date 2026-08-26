(function () {
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav");

  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toggle && header && nav) {
    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        header.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  var lastFocus = null;
  function closeModal(modal) {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    lastFocus = null;
  }
  function openModal(id, opener) {
    var modal = document.getElementById(id);
    if (!modal) return;
    document.querySelectorAll(".modal").forEach(function (m) {
      if (m !== modal) closeModal(m);
    });
    lastFocus = opener || document.activeElement;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    var panel = modal.querySelector(".modal-panel");
    var first = modal.querySelector(".modal-close, input, textarea, button");
    if (first) first.focus();
    if (panel) panel.scrollTop = 0;
  }
  document.querySelectorAll("[data-modal]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openModal(btn.getAttribute("data-modal"), btn);
    });
  });
  document.querySelectorAll(".modal").forEach(function (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) closeModal(modal);
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    document.querySelectorAll(".modal:not([hidden])").forEach(closeModal);
  });

  document.querySelectorAll("form.form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var action = form.getAttribute("action") || "";
      var to = action.replace(/^mailto:/i, "").split("?")[0] || "shaun@xipremierproductions.com";
      var lines = [];
      form.querySelectorAll("input, select, textarea").forEach(function (el) {
        if (!el.name) return;
        var label = "";
        if (el.id) {
          var lab = form.querySelector('label[for="' + el.id + '"]');
          if (lab) label = lab.textContent.replace(/\s+/g, " ").trim();
        }
        lines.push((label || el.name) + ": " + (el.value || ""));
      });
      var subject = form.getAttribute("data-subject") || "XI";
      var note = form.querySelector(".form-note");
      if (note) note.classList.add("is-on");
      var mailto =
        "mailto:" + to +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(lines.join("\n"));
      window.setTimeout(function () {
        window.location.href = mailto;
      }, 400);
    });
  });
})();


(function () {
  var cards = Array.prototype.slice.call(document.querySelectorAll(".retreats-section .pass"));
  if (!cards.length) return;

  function bring(card) {
    cards.forEach(function (c) {
      var on = c === card && !c.classList.contains("is-forward");
      c.classList.toggle("is-forward", on);
      c.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  cards.forEach(function (card) {
    card.addEventListener("click", function (e) {
      e.stopPropagation();
      bring(card);
    });
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        bring(card);
      }
    });
  });

  document.addEventListener("click", function () {
    cards.forEach(function (c) {
      c.classList.remove("is-forward");
      c.setAttribute("aria-pressed", "false");
    });
  });
})();
