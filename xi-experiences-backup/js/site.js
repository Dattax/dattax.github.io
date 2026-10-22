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
    // Inquire opened from the fleet gallery: that dialog closes, so return focus to View the Fleet.
    if (lastFocus && lastFocus.closest && lastFocus.closest("#fleet-gallery-modal")) {
      lastFocus = document.querySelector("#svc-fleet .svc-menu-toggle") || lastFocus;
    }
    // Opened from inside a service dropdown: that list closes, so return focus to its toggle.
    var svcMenu = lastFocus && lastFocus.closest ? lastFocus.closest("[data-svc-menu]") : null;
    if (svcMenu) lastFocus = svcMenu.querySelector(".svc-menu-toggle") || lastFocus;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    var panel = modal.querySelector(".modal-panel");
    var first = modal.querySelector(".modal-close, input, textarea, button");
    if (first) first.focus();
    if (panel) panel.scrollTop = 0;
  }
  document.querySelectorAll("[data-modal]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-modal");
      if (id === "fleet-inquire-modal") {
        var carInput = document.getElementById("fi-car");
        if (carInput) carInput.value = btn.getAttribute("data-car") || "";
      }
      if (id === "fleet-gallery-modal" && window.XIFleetGallery) {
        window.XIFleetGallery.open(btn.getAttribute("data-fleet") || "", btn.getAttribute("data-car") || "");
      }
      openModal(id, btn);
    });
  });
  // fleet.html?car=Name opens the inquire form with that car filled in.
  var fleetCarField = document.getElementById("fi-car");
  if (fleetCarField && window.URLSearchParams) {
    var presetCar = "";
    try {
      presetCar = new URLSearchParams(window.location.search).get("car") || "";
    } catch (err) {
      presetCar = "";
    }
    if (presetCar) {
      fleetCarField.value = presetCar;
      openModal("fleet-inquire-modal");
    }
  }
  document.querySelectorAll(".modal").forEach(function (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) closeModal(modal);
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    document.querySelectorAll(".modal:not([hidden])").forEach(closeModal);
  });
  // Keep Tab / Shift+Tab inside an open modal.
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Tab") return;
    var modal = document.querySelector(".modal:not([hidden])");
    if (!modal) return;
    var items = Array.prototype.filter.call(
      modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      function (el) { return el.tabIndex >= 0 && el.getClientRects().length && !el.closest('[aria-hidden="true"]'); }
    );
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    var inside = modal.contains(document.activeElement);
    if (e.shiftKey && (document.activeElement === first || !inside)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
      e.preventDefault();
      first.focus();
    }
  });

  document.querySelectorAll("form.form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var action = form.getAttribute("action") || "";
      var note = form.querySelector(".form-note");
      var btn = form.querySelector('button[type="submit"]');

      function showNote(text, ok) {
        if (!note) return;
        if (text) note.textContent = text;
        note.classList.add("is-on");
        note.setAttribute("data-state", ok ? "ok" : "err");
      }

      // Server endpoint (unused by marketing forms — they use mailto:)
      if (action && !/^mailto:/i.test(action)) {
        if (/\.github\.io$/i.test(location.hostname)) {
          action = "https://xipremierproductions.com/lead.php";
        }
        if (btn) btn.disabled = true;
        var fd = new FormData(form);
        fetch(action, {
          method: "POST",
          body: fd,
          headers: { Accept: "application/json" },
          credentials: "same-origin"
        })
          .then(function (res) {
            return res.json().then(function (data) {
              return { res: res, data: data };
            }).catch(function () {
              return { res: res, data: null };
            });
          })
          .then(function (pack) {
            if (btn) btn.disabled = false;
            if (pack.res.ok && pack.data && pack.data.ok) {
              form.reset();
              showNote("Sent. We’ll write back.", true);
            } else {
              var err = (pack.data && pack.data.error) || "Could not send. Email us directly.";
              showNote(err, false);
            }
          })
          .catch(function () {
            if (btn) btn.disabled = false;
            showNote("Could not send. Email us directly.", false);
          });
        return;
      }

      // mailto path (Contact, Events, Sponsorship)
      var to = action.replace(/^mailto:/i, "").split("?")[0] || "exec-assistant@xiexperiences.com";
      var lines = [];
      form.querySelectorAll("input, select, textarea").forEach(function (el) {
        if (!el.name) return;
        if (el.name === "company" || el.name === "form_tag") return;
        var label = "";
        if (el.id) {
          var lab = form.querySelector('label[for="' + el.id + '"]');
          if (lab) label = lab.textContent.replace(/\s+/g, " ").trim();
        }
        lines.push((label || el.name) + ": " + (el.value || ""));
      });
      var subject = form.getAttribute("data-subject") || "XI";
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

(function () {
  var root = document.querySelector(".sizzle");
  if (!root) return;
  var btn = root.querySelector(".sizzle-play");
  if (!btn) return;
  var embed = root.getAttribute("data-embed") || "https://www.youtube.com/embed/g98kO672JeM";

  function mount(muted) {
    var existing = root.querySelector(".sizzle-viewport");
    if (existing) existing.parentNode.removeChild(existing);

    root.classList.add("is-playing");
    root.classList.toggle("is-muted", muted);
    btn.setAttribute("aria-label", muted ? "Unmute XI sizzle reel" : "Play XI sizzle reel");

    var join = embed.indexOf("?") === -1 ? "?" : "&";
    var frame = document.createElement("iframe");
    var viewport = document.createElement("div");
    viewport.className = "sizzle-viewport";
    frame.className = "sizzle-frame";
    frame.title = "XI sizzle reel";
    frame.width = "315";
    frame.height = "560";
    frame.src = embed + join + "autoplay=1&mute=" + (muted ? "1" : "0") + "&rel=0&modestbranding=1&playsinline=1&enablejsapi=1";
    frame.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
    frame.setAttribute("allowfullscreen", "");
    frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    viewport.appendChild(frame);
    root.appendChild(viewport);
    if (!muted) {
      try { frame.focus(); } catch (e) {}
    }
  }

  function unmute() {
    if (!root.classList.contains("is-muted")) return;
    mount(false);
  }

  mount(true);

  root.addEventListener("click", function () {
    if (root.classList.contains("is-muted")) unmute();
  });
  btn.addEventListener("click", unmute);
  btn.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    unmute();
  });
})();

/* Service card offerings dropdown (services.html). Reusable: any .svc-menu[data-svc-menu] with a
   .svc-menu-toggle button whose aria-controls points at its panel. */
(function () {
  var menus = Array.prototype.slice.call(document.querySelectorAll("[data-svc-menu]"));
  if (!menus.length) return;

  function parts(menu) {
    var btn = menu.querySelector(".svc-menu-toggle");
    var panel = btn && document.getElementById(btn.getAttribute("aria-controls"));
    return { btn: btn, panel: panel };
  }
  function links(menu) {
    var p = parts(menu).panel;
    return p ? Array.prototype.slice.call(p.querySelectorAll("a[href], button:not([disabled])")) : [];
  }
  function isOpen(menu) {
    return menu.classList.contains("is-open");
  }
  function setOpen(menu, open, focusBtn) {
    var p = parts(menu);
    if (!p.btn || !p.panel) return;
    var col = menu.closest(".col");
    var group = menu.closest(".service-cols");
    menu.classList.toggle("is-open", open);
    p.btn.setAttribute("aria-expanded", open ? "true" : "false");
    p.panel.hidden = !open;
    if (col) col.classList.toggle("is-menu-open", open);
    if (group) {
      group.classList.toggle("has-open-menu", !!group.querySelector(".svc-menu.is-open"));
    }
    if (open) {
      p.panel.scrollTop = 0;
      var list = p.panel.querySelector(".svc-menu-list");
      if (list) list.scrollTop = 0;
      reveal(p.btn, p.panel);
    }
    if (!open && focusBtn) p.btn.focus();
  }
  // After opening, nudge the page so the button clears the fixed header and the panel is on screen.
  function reveal(btn, panel) {
    var header = document.querySelector(".site-header");
    var top = (header ? header.getBoundingClientRect().bottom : 0) + 12;
    var b = btn.getBoundingClientRect();
    var pr = panel.getBoundingClientRect();
    var delta = 0;
    var group = btn.closest(".service-cols");
    // Stacked (mobile) cards don't resize, so the panel's height is final now; side-by-side cards are
    // still widening at this point, so their bottom check waits for the transition (below).
    var stacked = group && getComputedStyle(group).flexDirection === "column";
    if (b.top < top) delta = b.top - top;
    else if (stacked && pr.bottom > window.innerHeight - 18) delta = Math.min(pr.bottom - window.innerHeight + 18, b.top - top);
    scrollByPx(delta);
    // Side-by-side cards: once the card has finished widening, bring the bottom of the list on screen.
    if (!stacked && delta === 0) {
      var col = btn.closest(".col");
      var done = false;
      var check = function () {
        if (done) return;
        done = true;
        if (col) col.removeEventListener("transitionend", onEnd);
        if (btn.getAttribute("aria-expanded") !== "true") return;
        var b2 = btn.getBoundingClientRect();
        var p2 = panel.getBoundingClientRect();
        var over = p2.bottom - (window.innerHeight - 12);
        if (over > 1) scrollByPx(Math.min(over, b2.top - top));
      };
      var onEnd = function (e) {
        if (e.target === col && /^flex/.test(e.propertyName)) check();
      };
      if (col) col.addEventListener("transitionend", onEnd);
      window.setTimeout(check, 900);
    }
  }
  function scrollByPx(delta) {
    if (Math.abs(delta) < 1) return;
    var smooth = !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    window.scrollBy({ top: delta, behavior: smooth ? "smooth" : "auto" });
  }
  function closeAll(except, focusBtn) {
    menus.forEach(function (m) {
      if (m !== except && isOpen(m)) setOpen(m, false, focusBtn && m.contains(document.activeElement));
    });
  }

  menus.forEach(function (menu) {
    var p = parts(menu);
    if (!p.btn || !p.panel) return;

    p.btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var open = !isOpen(menu);
      closeAll(menu, false);
      setOpen(menu, open, false);
    });

    // Clicks inside the menu never reach the card or the outside-click handler.
    // A modal opener inside the list (e.g. Inquire) closes the list; the modal returns focus to the toggle.
    menu.addEventListener("click", function (e) {
      e.stopPropagation();
      if (e.target.closest && e.target.closest("[data-modal]")) setOpen(menu, false, false);
    });

    menu.addEventListener("keydown", function (e) {
      var items = links(menu);
      var i = items.indexOf(document.activeElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!isOpen(menu)) setOpen(menu, true, false);
        items = links(menu);
        if (items.length) items[i < 0 ? 0 : Math.min(i + 1, items.length - 1)].focus();
      } else if (e.key === "ArrowUp" && i >= 0) {
        e.preventDefault();
        if (i === 0) p.btn.focus();
        else items[i - 1].focus();
      } else if ((e.key === "Home" || e.key === "End") && i >= 0) {
        e.preventDefault();
        items[e.key === "Home" ? 0 : items.length - 1].focus();
      }
    });

    // Tabbing out of the menu closes it.
    menu.addEventListener("focusout", function (e) {
      if (e.relatedTarget && !menu.contains(e.relatedTarget) && isOpen(menu)) setOpen(menu, false, false);
    });
  });

  document.addEventListener("click", function () {
    closeAll(null, false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" || e.key === "Esc") closeAll(null, true);
  });
})();

/* On-page fleet gallery (services.html). Images load when a car is opened. */
(function () {
  var modal = document.getElementById("fleet-gallery-modal");
  if (!modal) return;
  var title = document.getElementById("fleet-gallery-title");
  var thumbs = modal.querySelector(".fleet-gallery-thumbs");
  var stage = modal.querySelector(".fleet-gallery-stage");
  var main = document.createElement("img");
  main.id = "fleet-gallery-main";
  main.width = 1800;
  main.height = 1013;
  main.alt = "";
  main.decoding = "async";
  main.loading = "lazy";
  stage.insertBefore(main, stage.firstChild);
  var inquire = document.getElementById("fleet-gallery-inquire");
  var index = 0;
  var slug = "";
  var name = "";
  var count = 10;

  function src(i) {
    return "assets/fleet/" + slug + "/" + (i + 1) + ".jpg";
  }
  function show(i) {
    if (!slug) return;
    index = (i + count) % count;
    main.src = src(index);
    main.alt = name + " — photo " + (index + 1) + " of " + count;
    Array.prototype.forEach.call(thumbs.querySelectorAll("button"), function (b, n) {
      var on = n === index;
      b.classList.toggle("is-current", on);
      b.setAttribute("aria-current", on ? "true" : "false");
      if (on && b.scrollIntoView) b.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }
  function openCar(nextSlug, nextName) {
    slug = nextSlug;
    name = nextName || "";
    if (title) title.textContent = name;
    if (inquire) inquire.setAttribute("data-car", name);
    thumbs.innerHTML = "";
    var n;
    for (n = 0; n < count; n++) {
      var b = document.createElement("button");
      var img = document.createElement("img");
      b.type = "button";
      b.className = "fleet-gallery-thumb";
      b.setAttribute("aria-label", "Photo " + (n + 1) + " of " + count);
      img.alt = "";
      img.width = 160;
      img.height = 90;
      img.loading = "lazy";
      img.decoding = "async";
      img.src = src(n);
      b.appendChild(img);
      (function (photo) {
        b.addEventListener("click", function () { show(photo); });
      })(n);
      thumbs.appendChild(b);
    }
    show(0);
  }
  window.XIFleetGallery = { open: openCar };

  modal.querySelector(".fleet-gallery-prev").addEventListener("click", function () { show(index - 1); });
  modal.querySelector(".fleet-gallery-next").addEventListener("click", function () { show(index + 1); });

  var startX = 0;
  var tracking = false;
  stage.addEventListener("touchstart", function (e) {
    if (!e.changedTouches || !e.changedTouches[0]) return;
    if (e.target.closest && e.target.closest("button")) { tracking = false; return; }
    tracking = true;
    startX = e.changedTouches[0].clientX;
  }, { passive: true });
  stage.addEventListener("touchend", function (e) {
    if (!tracking || !e.changedTouches || !e.changedTouches[0]) return;
    tracking = false;
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) < 40) return;
    show(index + (dx < 0 ? 1 : -1));
  }, { passive: true });

  document.addEventListener("keydown", function (e) {
    if (modal.hidden) return;
    if (e.key === "ArrowLeft") { e.preventDefault(); show(index - 1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); show(index + 1); }
  });
})();
