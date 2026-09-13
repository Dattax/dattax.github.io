(function (global) {
  var NS = global.XI = global.XI || {};

  function banner() {
    if (document.querySelector(".xi-proto")) return;
    var el = document.createElement("div");
    el.className = "xi-proto";
    el.setAttribute("role", "status");
    el.textContent = "Members Only";
    document.body.insertBefore(el, document.body.firstChild);
    document.body.classList.add("has-proto");
  }

  function nav() {
    var header = document.querySelector(".site-header");
    var toggle = document.querySelector(".nav-toggle");
    var navEl = document.getElementById("nav");

    function onScroll() {
      if (!header) return;
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (toggle && header && navEl) {
      toggle.addEventListener("click", function () {
        var open = header.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      });
      navEl.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          header.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    }
  }

  function note(form, text, ok) {
    var n = form && form.querySelector(".form-note");
    if (!n) return;
    n.textContent = text;
    n.classList.add("is-on");
    n.setAttribute("data-state", ok ? "ok" : "err");
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function sessionChrome() {
    var user = NS.auth.current();
    document.querySelectorAll("[data-session]").forEach(function (slot) {
      if (!user) {
        slot.innerHTML = '<a href="login.html">Sign in</a>';
        return;
      }
      slot.innerHTML =
        '<span class="who">' + escapeHtml(user.name) + "</span>" +
        '<span class="credit-pill" data-credits-pill>' + (user.credits || 0) + " credits</span>" +
        '<button type="button" class="text-btn" data-signout>Sign out</button>';
    });
    document.querySelectorAll("[data-who]").forEach(function (el) {
      if (user) el.textContent = user.name;
    });
    document.querySelectorAll("[data-credits]").forEach(function (el) {
      if (user) el.textContent = String(user.credits || 0);
    });
  }

  function dock() {
    var user = NS.auth.current();
    if (!user) return;
    if (document.querySelector(".club-dock")) return;
    var page = document.body.getAttribute("data-members") || "";
    var items = [
      { href: "./", id: "home", label: "Home" },
      { href: "events.html", id: "events", label: "Events" },
      { href: "credits.html", id: "credits", label: "Credits" },
      { href: "./#you", id: "profile", label: "You" }
    ];
    if (NS.auth.isAdmin(user)) items.push({ href: "admin.html", id: "admin", label: "Admin" });
    var navEl = document.createElement("nav");
    navEl.className = "club-dock";
    navEl.setAttribute("aria-label", "Members");
    navEl.innerHTML = items.map(function (item) {
      var here = page === item.id || (item.id === "profile" && page === "home") || (item.id === "events" && page === "event");
      return '<a href="' + item.href + '"' + (here ? ' class="is-here"' : "") + ">" + item.label + "</a>";
    }).join("");
    document.body.appendChild(navEl);
    document.body.classList.add("has-dock");
  }

  function bindSignOut() {
    document.querySelectorAll("[data-signout]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        NS.auth.logout();
        window.location.href = "./";
      });
    });
  }

  function bindAuthPages() {
    var page = document.body.getAttribute("data-members");
    var user = NS.auth.current();

    if (page === "home" || page === "gate") {
      var inn = document.querySelector("[data-gate-in]");
      var out = document.querySelector("[data-gate-out]");
      if (user && inn && out) {
        out.hidden = true;
        inn.hidden = false;
        document.body.classList.add("is-in");
      } else if (!user && inn && out) {
        out.hidden = false;
        inn.hidden = true;
        document.body.classList.remove("is-in");
      }
    }

    var locked = { events: 1, event: 1, credits: 1, propose: 1, admin: 1, calendar: 1 };
    if (locked[page]) {
      if (page === "admin") {
        if (!NS.auth.require({ admin: true })) return;
      } else if (!NS.auth.require()) {
        return;
      }
    }

    var login = document.getElementById("login-form");
    if (login) {
      login.addEventListener("submit", function (e) {
        e.preventDefault();
        var fd = new FormData(login);
        var res = NS.auth.login(fd.get("email"), fd.get("password"));
        if (!res.ok) return note(login, res.error, false);
        window.location.href = NS.auth.isAdmin(res.user) ? "admin.html" : "./";
      });
    }

    var adminFill = document.querySelector("[data-admin-fill]");
    if (adminFill) {
      adminFill.addEventListener("click", function (e) {
        e.preventDefault();
        var email = document.getElementById("email");
        var password = document.getElementById("password");
        if (email) email.value = "admin@xi.demo";
        if (password) password.value = "xi-admin-2026";
        email && email.focus();
      });
    }

    var signup = document.getElementById("signup-form");
    if (signup) {
      signup.addEventListener("submit", function (e) {
        e.preventDefault();
        var fd = new FormData(signup);
        var res = NS.auth.signup({
          name: fd.get("name"),
          email: fd.get("email"),
          password: fd.get("password"),
          phone: fd.get("phone")
        });
        if (!res.ok) return note(signup, res.error, false);
        window.location.href = "./";
      });
    }

    var req = document.getElementById("request-form");
    if (req && !(req.getAttribute("action") || "").trim()) {
      req.addEventListener("submit", function (e) {
        e.preventDefault();
        var fd = new FormData(req);
        var res = NS.auth.requestAccess({
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          company: fd.get("company"),
          note: fd.get("note")
        });
        if (!res.ok) return note(req, res.error, false);
        req.reset();
        note(req, "Received. The house will write back.", true);
      });
    }

    var reset = document.getElementById("reset-form");
    if (reset) {
      reset.addEventListener("submit", function (e) {
        e.preventDefault();
        var fd = new FormData(reset);
        var res = NS.auth.reset(fd.get("email"), fd.get("password"));
        if (!res.ok) return note(reset, res.error, false);
        reset.reset();
        note(reset, "If that address is on the list, a new password is waiting. Sign in.", true);
      });
    }
  }

  function openModal(id) {
    var modal = document.getElementById(id);
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeModal(id) {
    var modal = document.getElementById(id);
    if (!modal) return;
    modal.hidden = true;
    if (!document.querySelector(".modal:not([hidden])")) {
      document.body.classList.remove("modal-open");
    }
  }

  function bindModals() {
    document.querySelectorAll(".modal").forEach(function (modal) {
      modal.addEventListener("click", function (e) {
        if (e.target.closest("[data-close]")) closeModal(modal.id);
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        document.querySelectorAll(".modal:not([hidden])").forEach(function (m) {
          closeModal(m.id);
        });
      }
    });
  }

  NS.ui = {
    banner: banner,
    nav: nav,
    note: note,
    escapeHtml: escapeHtml,
    sessionChrome: sessionChrome,
    dock: dock,
    openModal: openModal,
    closeModal: closeModal
  };

  document.addEventListener("DOMContentLoaded", function () {
    document.body.classList.add("members");
    banner();
    nav();
    sessionChrome();
    dock();
    bindAuthPages();
    bindSignOut();
    bindModals();
  });
})(window);
