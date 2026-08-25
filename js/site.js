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
