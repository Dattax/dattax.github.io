(function () {
  var KEYS = {
    users: "xi.club.users.v1",
    session: "xi.club.session.v1",
    requests: "xi.club.requests.v1",
    rsvps: "xi.club.rsvps.v1"
  };

  var DEMO_USERS = [
    {
      id: "u-member",
      name: "Guest of the House",
      email: "member@xi.test",
      password: "member",
      role: "member",
      phone: "",
      smsOptIn: false
    },
    {
      id: "u-admin",
      name: "House Admin",
      email: "admin@xi.test",
      password: "admin",
      role: "admin",
      phone: "",
      smsOptIn: false
    }
  ];

  var EVENTS = [
    {
      id: "autumn-salon-soho",
      title: "Autumn Salon SoHo",
      city: "NYC",
      date: "2026-09-16",
      time: "7:30 PM",
      month: "Sep 2026",
      when: "Wed 9/16",
      blurb: "A first-cool-night salon. Conversation, a pianist, wine that does not announce itself.",
      detail: "SoHo. A room written by hand for the season’s first cool night — conversation, a pianist, and a table that does not print tickets."
    },
    {
      id: "hamptons-house-weekend",
      title: "Hamptons House Weekend",
      city: "Hamptons",
      date: "2026-10-09",
      time: "Friday arrival",
      month: "Oct 2026",
      when: "Fri 10/9",
      blurb: "A house on the East End. Friday arrival, Saturday supper, Sunday water.",
      detail: "The East End. Windows open to the marsh. Friday arrival, a Saturday supper, Sunday on the water. A house weekend, not a hotel night."
    },
    {
      id: "tribeca-dinner",
      title: "Tribeca Dinner",
      city: "NYC",
      date: "2026-11-19",
      time: "8:30 PM",
      month: "Nov 2026",
      when: "Thu 11/19",
      blurb: "A long table after the tape. Downtown, low light, no printed start time.",
      detail: "Tribeca. A long table after the tape — downtown, low light, a night that does not sell seats."
    },
    {
      id: "sunset-sail-biscayne",
      title: "Sunset Sail Biscayne",
      city: "Miami",
      date: "2026-11-07",
      time: "5:30 PM",
      month: "Nov 2026",
      when: "Sat 11/7",
      blurb: "The bay after the heat. A members sail, then a table on the water.",
      detail: "Biscayne Bay. The city after the sun has done its work — a members sail, then a table on the water."
    },
    {
      id: "art-basel-members-night",
      title: "Art Basel Members Night",
      city: "Miami",
      date: "2026-12-03",
      time: "9:00 PM",
      month: "Dec 2026",
      when: "Thu 12/3",
      blurb: "A members room away from the fair — the people, not the booths.",
      detail: "Miami, early December. A members night held away from the fair: the people in the room, not the booths on the floor."
    }
  ];

  var PROTECTED = {
    app: true,
    events: true,
    event: true,
    profile: true,
    admin: true
  };

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function write(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  function norm(email) {
    return String(email || "").trim().toLowerCase();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function seedUsers() {
    var users = read(KEYS.users, []);
    DEMO_USERS.forEach(function (demo) {
      var exists = users.some(function (u) { return u.email === demo.email; });
      if (!exists) users.push(Object.assign({}, demo));
    });
    write(KEYS.users, users);
    return users;
  }

  function users() {
    return seedUsers();
  }

  function saveUsers(list) {
    write(KEYS.users, list);
  }

  function findUser(email) {
    var e = norm(email);
    return users().find(function (u) { return u.email === e; }) || null;
  }

  function current() {
    var s = read(KEYS.session, null);
    if (!s || !s.email) return null;
    return findUser(s.email);
  }

  function setSession(user) {
    write(KEYS.session, { email: user.email, at: Date.now() });
  }

  function logout() {
    localStorage.removeItem(KEYS.session);
  }

  function login(email, password) {
    var u = findUser(email);
    if (!u || u.password !== String(password || "")) {
      return { ok: false, error: "That name is not on tonight’s list." };
    }
    setSession(u);
    return { ok: true, user: u };
  }

  function addRequest(data) {
    var email = norm(data.email);
    var name = String(data.name || "").trim();
    if (!email || !name) {
      return { ok: false, error: "Leave a name and an email. The house writes back." };
    }
    var all = read(KEYS.requests, []);
    all.unshift({
      id: "r-" + Date.now(),
      name: name,
      email: email,
      phone: String(data.phone || "").trim(),
      note: String(data.note || "").trim(),
      status: "pending",
      at: Date.now()
    });
    write(KEYS.requests, all);
    return { ok: true };
  }

  function requests() {
    return read(KEYS.requests, []);
  }

  function rsvps() {
    return read(KEYS.rsvps, {});
  }

  function getRsvp(email, eventId) {
    var book = rsvps();
    var byUser = book[norm(email)] || {};
    return byUser[eventId] || null;
  }

  function setRsvp(email, eventId, status) {
    var book = rsvps();
    var key = norm(email);
    book[key] = book[key] || {};
    if (book[key][eventId] === status) {
      delete book[key][eventId];
    } else {
      book[key][eventId] = status;
    }
    write(KEYS.rsvps, book);
    return book[key][eventId] || null;
  }

  function headcounts(eventId) {
    var book = rsvps();
    var counts = { going: 0, maybe: 0, no: 0 };
    Object.keys(book).forEach(function (email) {
      var status = book[email][eventId];
      if (status && counts[status] != null) counts[status] += 1;
    });
    return counts;
  }

  function eventById(id) {
    return EVENTS.find(function (e) { return e.id === id; }) || null;
  }

  function sortedEvents() {
    return EVENTS.slice().sort(function (a, b) {
      return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
    });
  }

  function note(form, text, ok) {
    var n = form && form.querySelector(".form-note");
    if (!n) return;
    n.textContent = text;
    n.classList.add("is-on");
    n.setAttribute("data-state", ok ? "ok" : "err");
  }

  function queryId() {
    try {
      return new URLSearchParams(window.location.search).get("id") || "";
    } catch (err) {
      var m = String(window.location.search || "").match(/[?&]id=([^&]+)/);
      return m ? decodeURIComponent(m[1]) : "";
    }
  }

  function bindNav() {
    var header = document.querySelector(".club-header");
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
      nav.querySelectorAll("a, button").forEach(function (el) {
        el.addEventListener("click", function () {
          header.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    }

    var page = document.body.getAttribute("data-page");
    document.querySelectorAll("[data-nav]").forEach(function (a) {
      if (a.getAttribute("data-nav") === page) a.classList.add("is-here");
    });
    if (page === "event") {
      document.querySelectorAll('[data-nav="events"]').forEach(function (a) {
        a.classList.add("is-here");
      });
    }
    if (page === "app") {
      document.querySelectorAll('[data-nav="members"]').forEach(function (a) {
        a.classList.add("is-here");
      });
    }
  }

  function hydrateChrome() {
    var user = current();
    var adminLinks = document.querySelectorAll("[data-admin]");
    adminLinks.forEach(function (el) {
      el.hidden = !(user && user.role === "admin");
    });

    var slot = document.querySelector("[data-session]");
    if (slot) {
      if (!user) {
        slot.innerHTML = '<a href="login.html">Member login</a>';
      } else {
        slot.innerHTML =
          '<a class="who" href="profile.html">' + escapeHtml(user.name) + "</a>" +
          '<button type="button" class="text-btn" data-signout>Sign out</button>';
      }
    }

    document.querySelectorAll("[data-signout]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        logout();
        window.location.href = "./";
      });
    });
  }

  function renderGate() {
    var user = current();
    var out = document.querySelector("[data-gate-out]");
    var inn = document.querySelector("[data-gate-in]");
    if (!out || !inn) return;
    if (user) {
      out.hidden = true;
      inn.hidden = false;
    } else {
      out.hidden = false;
      inn.hidden = true;
    }
  }

  function bindLogin() {
    var form = document.getElementById("login-form");
    if (!form) return;
    if (current()) {
      window.location.replace("app.html");
      return;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var res = login(fd.get("email"), fd.get("password"));
      if (!res.ok) return note(form, res.error, false);
      window.location.href = "app.html";
    });
  }

  function bindRequest() {
    var form = document.getElementById("request-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var res = addRequest({
        name: fd.get("name"),
        email: fd.get("email"),
        phone: fd.get("phone"),
        note: fd.get("note")
      });
      if (!res.ok) return note(form, res.error, false);
      form.reset();
      note(form, "Received. The house will write back.", true);
    });
  }

  function nightCard(ev) {
    return (
      '<a class="night" href="event.html?id=' + encodeURIComponent(ev.id) + '">' +
        '<p class="month">' + escapeHtml(ev.month) + "</p>" +
        '<p class="when">' + escapeHtml(ev.when) + "</p>" +
        "<h3>" + escapeHtml(ev.title) + "</h3>" +
        '<p class="place">' + escapeHtml(ev.city) + "</p>" +
        '<p class="blurb">' + escapeHtml(ev.blurb) + "</p>" +
      "</a>"
    );
  }

  function renderEvents() {
    var root = document.getElementById("events-root");
    if (!root) return;
    root.innerHTML = sortedEvents().map(nightCard).join("");
  }

  function renderEvent() {
    var root = document.getElementById("event-root");
    if (!root) return;
    var ev = eventById(queryId());
    if (!ev) {
      root.innerHTML =
        '<p class="empty">That night is not on this season’s book.</p>' +
        '<p><a class="back" href="events.html">← Events</a></p>';
      return;
    }
    var user = current();
    var status = user ? getRsvp(user.email, ev.id) : null;
    root.innerHTML =
      '<a class="back" href="events.html">← Events</a>' +
      '<p class="eyebrow">' + escapeHtml(ev.month) + "</p>" +
      '<p class="lede" style="margin-bottom:1rem">' + escapeHtml(ev.when) + " · " + escapeHtml(ev.time) + "</p>" +
      "<h1 class=\"display\">" + escapeHtml(ev.title) + "</h1>" +
      '<p class="place" style="letter-spacing:0.26em;text-transform:uppercase;font-size:0.62rem;color:var(--accent);margin:0 0 1.2rem">' +
        escapeHtml(ev.city) +
      "</p>" +
      '<div class="prose"><p>' + escapeHtml(ev.detail) + "</p></div>" +
      '<div class="rsvp" role="group" aria-label="RSVP">' +
        '<button type="button" data-rsvp="going"' + (status === "going" ? ' class="is-on"' : "") + ">Going</button>" +
        '<button type="button" data-rsvp="maybe"' + (status === "maybe" ? ' class="is-on"' : "") + ">Maybe</button>" +
        '<button type="button" data-rsvp="no"' + (status === "no" ? ' class="is-on"' : "") + ">Can’t go</button>" +
      "</div>" +
      '<p class="form-note is-on" id="rsvp-note">' +
        (status ? "You’re marked " + status + "." : "Tell the house if you’ll sit.") +
      "</p>";

    root.querySelectorAll("[data-rsvp]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!user) {
          window.location.href = "login.html";
          return;
        }
        var next = setRsvp(user.email, ev.id, btn.getAttribute("data-rsvp"));
        root.querySelectorAll("[data-rsvp]").forEach(function (b) {
          b.classList.toggle("is-on", next && b.getAttribute("data-rsvp") === next);
        });
        var n = document.getElementById("rsvp-note");
        if (n) n.textContent = next ? "You’re marked " + next + "." : "RSVP cleared.";
      });
    });
  }

  function bindProfile() {
    var form = document.getElementById("profile-form");
    if (!form) return;
    var user = current();
    if (!user) return;
    form.querySelector("#name").value = user.name || "";
    form.querySelector("#email").value = user.email || "";
    form.querySelector("#phone").value = user.phone || "";
    form.querySelector("#sms").checked = !!user.smsOptIn;
    var role = document.querySelector("[data-role]");
    if (role) role.textContent = user.role === "admin" ? "Admin" : "Member";

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = String(form.querySelector("#name").value || "").trim();
      if (!name) return note(form, "The house needs a name.", false);
      var list = users().map(function (u) {
        if (u.email !== user.email) return u;
        return Object.assign({}, u, {
          name: name,
          phone: String(form.querySelector("#phone").value || "").trim(),
          smsOptIn: form.querySelector("#sms").checked
        });
      });
      saveUsers(list);
      note(form, "Saved on this device. SMS is a stub — no texts are sent.", true);
      hydrateChrome();
    });
  }

  function renderAdmin() {
    var eventsRoot = document.getElementById("admin-events");
    var reqRoot = document.getElementById("admin-requests");
    if (eventsRoot) {
      eventsRoot.innerHTML = sortedEvents().map(function (ev) {
        var c = headcounts(ev.id);
        return (
          '<article class="panel">' +
            '<p class="month" style="color:var(--accent);letter-spacing:0.32em;text-transform:uppercase;font-size:0.62rem;margin:0 0 0.35rem">' +
              escapeHtml(ev.month) + " · " + escapeHtml(ev.city) +
            "</p>" +
            "<h3>" + escapeHtml(ev.title) + "</h3>" +
            '<p class="counts">' +
              "<span><strong>" + c.going + "</strong> going</span>" +
              "<span><strong>" + c.maybe + "</strong> maybe</span>" +
              "<span><strong>" + c.no + "</strong> no</span>" +
            "</p>" +
          "</article>"
        );
      }).join("");
    }
    if (reqRoot) {
      var pending = requests();
      if (!pending.length) {
        reqRoot.innerHTML = '<p class="empty">No pending requests.</p>';
        return;
      }
      reqRoot.innerHTML = pending.map(function (r) {
        var when = new Date(r.at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        });
        return (
          '<article class="panel">' +
            "<h3>" + escapeHtml(r.name) + "</h3>" +
            '<p class="request-meta">' + escapeHtml(r.email) + (r.phone ? " · " + escapeHtml(r.phone) : "") + "</p>" +
            (r.note ? "<p>" + escapeHtml(r.note) + "</p>" : "") +
            '<p class="request-meta">Pending · ' + escapeHtml(when) + "</p>" +
          "</article>"
        );
      }).join("");
    }
  }

  function bindVideo() {
    var frame = document.querySelector("[data-video]");
    if (!frame) return;
    var btn = frame.querySelector("button");
    if (!btn) return;
    btn.addEventListener("click", function () {
      frame.innerHTML =
        '<iframe title="XI sizzle reel" src="https://www.youtube.com/embed/g98kO672JeM?autoplay=1&rel=0&modestbranding=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    seedUsers();
    var page = document.body.getAttribute("data-page") || "";
    var user = current();

    if (PROTECTED[page] && !user) {
      window.location.replace("login.html");
      return;
    }
    if (page === "admin" && (!user || user.role !== "admin")) {
      window.location.replace("app.html");
      return;
    }

    bindNav();
    hydrateChrome();

    if (page === "soon") renderGate();
    if (page === "login") bindLogin();
    if (page === "request") bindRequest();
    if (page === "app") bindVideo();
    if (page === "events") renderEvents();
    if (page === "event") renderEvent();
    if (page === "profile") bindProfile();
    if (page === "admin") renderAdmin();
  });
})();
