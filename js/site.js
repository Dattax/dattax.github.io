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


(function () {
  var section = document.getElementById("rooms-opened");
  if (!section) return;
  var bg = section.querySelector(".proof-bg");
  if (!bg) return;
  var played = false;
  function play() {
    if (played) return;
    played = true;
    bg.classList.add("is-revealing");
  }
  function whenReady(fn) {
    var img = new Image();
    img.onload = img.onerror = fn;
    img.src = "assets/rooms-fade.jpg";
    if (img.complete) fn();
  }
  whenReady(function () {
    if (!("IntersectionObserver" in window)) { play(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { play(); io.disconnect(); }
      });
    }, { threshold: 0.28 });
    io.observe(section);
  });
})();
(function () {
  if (typeof jQuery === "undefined" || !jQuery.fn.slick) return;
  var $slider = jQuery(".wedding-venues-section-slider");
  if (!$slider.length) return;

  $slider.slick({
    centerMode: true,
    centerPadding: "60px",
    slidesToShow: 1,
    arrows: true,
    draggable: true,
    dots: false,
    autoplay: true,
    autoplaySpeed: 5000,
    adaptiveHeight: false,
    variableWidth: true,
    nextArrow: '<span class="slick-next"><svg viewBox="0 0 56 10" aria-hidden="true"><g><line class="st0" x1="0" y1="4.3" x2="51" y2="4.3"/><polygon class="st1" points="48.3,4.3 48.3,0 52,2.1 55.7,4.3 52,6.4 48.3,8.6"/></g></svg></span>',
    prevArrow: '<span class="slick-prev"><svg viewBox="0 0 56 10" aria-hidden="true"><g><line class="st0" x1="55.7" y1="4.3" x2="4.8" y2="4.3"/><polygon class="st1" points="7.4,4.3 7.4,8.6 3.7,6.4 0,4.3 3.7,2.1 7.4,0"/></g></svg></span>',
    infinite: true
  });

  function lockSideClicks() {
    jQuery(".wedding-venues-section-slider .slick-slide a").off("click.venues").on("click.venues", function (e) {
      e.preventDefault();
    });
    jQuery(".wedding-venues-section-slider .slick-slide.slick-active a").off("click.venues");
  }
  lockSideClicks();
  $slider.on("afterChange", lockSideClicks);
})();
