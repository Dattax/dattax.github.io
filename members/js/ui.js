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
    var slot = document.querySelector("[data-session]");
    if (!slot) return;
    if (!user) {
      slot.innerHTML = '<a href="login.html">Sign in</a>';
      return;
    }
    slot.innerHTML =
      '<span class="who">' + escapeHtml(user.name) + "</span>" +
      '<button type="button" class="text-btn" data-signout>Sign out</button>';
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
    if (page === "gate") {
      var user = NS.auth.current();
      var inn = document.querySelector("[data-gate-in]");
      var out = document.querySelector("[data-gate-out]");
      if (user && inn && out) {
        out.hidden = true;
        inn.hidden = false;
        var who = inn.querySelector("[data-gate-who]");
        if (who) who.textContent = user.name;
      }
    }
    if (page === "calendar" && !NS.auth.require()) return;

    var login = document.getElementById("login-form");
    if (login) {
      login.addEventListener("submit", function (e) {
        e.preventDefault();
        var fd = new FormData(login);
        var res = NS.auth.login(fd.get("email"), fd.get("password"));
        if (!res.ok) return note(login, res.error, false);
        window.location.href = "calendar.html";
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
        window.location.href = "calendar.html";
      });
    }

    var req = document.getElementById("request-form");
    if (req) {
      req.addEventListener("submit", function (e) {
        e.preventDefault();
        var fd = new FormData(req);
        var payload = {
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          note: fd.get("note")
        };
        var res = NS.auth.requestAccess(payload);
        if (!res.ok) return note(req, res.error, false);
        var body = [
          "Name: " + String(payload.name || "").trim(),
          "Email: " + String(payload.email || "").trim(),
          "Phone: " + String(payload.phone || "").trim(),
          "Note: " + String(payload.note || "").trim()
        ].join("\n");
        var mail = "mailto:deepdattax@gmail.com" +
          "?subject=" + encodeURIComponent("XI Members — access request") +
          "&body=" + encodeURIComponent(body);
        req.reset();
        note(req, "Received. The house will write back.", true);
        window.location.href = mail;
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

  NS.ui = { banner: banner, nav: nav, note: note, escapeHtml: escapeHtml };

  document.addEventListener("DOMContentLoaded", function () {
    document.body.classList.add("members");
    banner();
    nav();
    sessionChrome();
    bindAuthPages();
    bindSignOut();
  });
})(window);
