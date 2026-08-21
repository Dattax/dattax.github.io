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

  var form = document.getElementById("inquire-form");
  var note = document.getElementById("form-note");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = (document.getElementById("name") || {}).value || "";
      var email = (document.getElementById("email") || {}).value || "";
      var city = (document.getElementById("city") || {}).value || "";
      var heard = (document.getElementById("heard") || {}).value || "";
      var extra = (document.getElementById("note") || {}).value || "";
      var body = [
        "Name: " + name,
        "Email: " + email,
        "City: " + city,
        "How I heard: " + heard,
        extra ? "Note: " + extra : ""
      ].filter(Boolean).join("\n");
      if (note) note.classList.add("is-on");
      form.reset();
      var mailto =
        "mailto:deepdattax@gmail.com" +
        "?subject=" + encodeURIComponent("XI inquiry") +
        "&body=" + encodeURIComponent(body);
      window.setTimeout(function () {
        window.location.href = mailto;
      }, 400);
    });
  }
})();
