(function (global) {
  var NS = global.XI = global.XI || {};
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  function esc(s) { return NS.ui.escapeHtml(s); }

  function pad(n) { return n < 10 ? "0" + n : String(n); }

  function ymd(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function parseYmd(s) {
    var p = String(s || "").split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  function prettyDate(iso) {
    var d = parseYmd(iso);
    if (isNaN(d.getTime())) return iso;
    return MONTHS[d.getMonth()].slice(0, 3) + " " + d.getDate();
  }

  function prettyFull(iso) {
    var d = parseYmd(iso);
    if (isNaN(d.getTime())) return iso;
    return MONTHS[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  }

  function todayIso() { return ymd(new Date()); }

  function published() {
    return NS.store.events().filter(function (e) { return e.status === "published"; });
  }

  function upcoming(limit) {
    var today = todayIso();
    var next = published().filter(function (e) { return e.date >= today; })
      .sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    if (!next.length) next = published().slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    return typeof limit === "number" ? next.slice(0, limit) : next;
  }

  function eventById(id) {
    return NS.store.events().find(function (e) { return e.id === id; }) || null;
  }

  function rsvpsFor(eventId) {
    return NS.store.rsvps().filter(function (r) { return r.eventId === eventId; });
  }

  function hasRsvp(eventId, email) {
    return rsvpsFor(eventId).some(function (r) { return r.email === email; });
  }

  function guestsFor(eventId) {
    return NS.store.guests().filter(function (g) { return g.eventId === eventId; });
  }

  function mediaFor(eventId) {
    return NS.store.media().filter(function (m) { return m.eventId === eventId; });
  }

  function themeLabels(ids) {
    var map = {};
    NS.store.themes.forEach(function (t) { map[t.id] = t.label; });
    return (ids || []).map(function (id) { return map[id] || id; });
  }

  function tile(ev) {
    var themes = themeLabels(ev.themes).slice(0, 2).join(" · ");
    return (
      '<a class="night-tile" href="event.html?id=' + encodeURIComponent(ev.id) + '">' +
        '<img src="' + esc(ev.cover) + '" alt="" width="1200" height="800">' +
        '<div class="night-tile-veil">' +
          '<p class="meta">' + esc(themes || ev.kind) + " · " + esc(ev.city) + "</p>" +
          "<h3>" + esc(ev.title) + "</h3>" +
          '<p class="when">' + esc(prettyDate(ev.date)) + " · " + esc(ev.time) + "</p>" +
        "</div>" +
      "</a>"
    );
  }

  function creditOf(user) {
    var fresh = NS.auth.findUser(user.email);
    return fresh ? (fresh.credits || 0) : (user.credits || 0);
  }

  function refreshCredits() {
    var user = NS.auth.current();
    if (!user) return;
    var n = creditOf(user);
    document.querySelectorAll("[data-credits]").forEach(function (el) { el.textContent = String(n); });
    document.querySelectorAll("[data-credits-pill]").forEach(function (el) { el.textContent = n + " credits"; });
  }

  function spendForEvent(user, ev, note) {
    return NS.auth.credit(user.email, -(ev.cost || 1), "spend", note || ("RSVP · " + ev.title), { eventId: ev.id });
  }

  function rsvp(user, ev) {
    if (hasRsvp(ev.id, user.email)) return { ok: true, already: true };
    var paid = spendForEvent(user, ev);
    if (!paid.ok) return paid;
    NS.store.addRsvp({
      id: "rsvp-" + Date.now(),
      eventId: ev.id,
      email: user.email,
      name: user.name,
      at: Date.now()
    });
    return { ok: true };
  }

  var payContext = null;

  function ensurePayModal() {
    if (document.getElementById("pay-modal")) return;
    var wrap = document.createElement("div");
    wrap.className = "modal";
    wrap.id = "pay-modal";
    wrap.hidden = true;
    wrap.innerHTML =
      '<div class="modal-backdrop" data-close></div>' +
      '<div class="modal-panel pay-panel" role="dialog" aria-modal="true" aria-labelledby="pay-heading">' +
        '<button class="modal-close" type="button" data-close>Close</button>' +
        '<p class="eyebrow">The house</p>' +
        '<h2 class="display" id="pay-heading">A card<br><em>for the night.</em></h2>' +
        '<p class="lede" data-pay-lede>Stripe-style mock. Nothing leaves this browser.</p>' +
        '<form class="form pay-form" id="pay-form">' +
          '<div class="pay-brand">XI · Stripe</div>' +
          '<div class="field">' +
            '<label for="card-name">Name on card</label>' +
            '<input id="card-name" name="name" type="text" autocomplete="cc-name" required>' +
          "</div>" +
          '<div class="field">' +
            '<label for="card-number">Card number</label>' +
            '<input id="card-number" name="number" type="text" inputmode="numeric" autocomplete="cc-number" placeholder="4242 4242 4242 4242" required>' +
          "</div>" +
          '<div class="form-pair">' +
            '<div class="field">' +
              '<label for="card-exp">Expiry</label>' +
              '<input id="card-exp" name="exp" type="text" inputmode="numeric" autocomplete="cc-exp" placeholder="12 / 28" required>' +
            "</div>" +
            '<div class="field">' +
              '<label for="card-cvc">CVC</label>' +
              '<input id="card-cvc" name="cvc" type="text" inputmode="numeric" autocomplete="cc-csc" placeholder="123" required>' +
            "</div>" +
          "</div>" +
          '<div class="form-actions">' +
            '<button class="cta" type="submit">Pay</button>' +
            '<button class="text-btn" type="button" data-pay-link>Payment Link</button>' +
            '<p class="form-note" role="status"></p>' +
          "</div>" +
        "</form>" +
      "</div>";
    document.body.appendChild(wrap);
    wrap.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) NS.ui.closeModal("pay-modal");
    });
    wrap.querySelector("[data-pay-link]").addEventListener("click", function () {
      completePay({ via: "link" });
    });
    wrap.querySelector("#pay-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      var number = String(fd.get("number") || "").replace(/\s+/g, "");
      if (number.length < 12) {
        NS.ui.note(e.target, "The house needs a card number.", false);
        return;
      }
      completePay({ via: "card", last4: number.slice(-4) });
    });
  }

  function openPay(ctx) {
    ensurePayModal();
    payContext = ctx || {};
    var lede = document.querySelector("[data-pay-lede]");
    if (lede) lede.textContent = payContext.lede || "Stripe-style mock. Nothing leaves this browser.";
    var form = document.getElementById("pay-form");
    if (form) {
      form.reset();
      var n = form.querySelector(".form-note");
      if (n) { n.textContent = ""; n.classList.remove("is-on"); }
      var user = NS.auth.current();
      var name = form.querySelector("[name=name]");
      if (name && user) name.value = user.name;
    }
    NS.ui.openModal("pay-modal");
  }

  function completePay(meta) {
    var ctx = payContext || {};
    var user = NS.auth.current();
    if (!user) return;
    if (ctx.kind === "pack") {
      var pack = NS.store.packs.find(function (p) { return p.id === ctx.packId; });
      if (!pack) return;
      NS.auth.credit(user.email, pack.credits, "buy", pack.label + " via " + (meta.via === "link" ? "Payment Link" : "card"), { packId: pack.id });
    } else if (ctx.kind === "event") {
      var ev = eventById(ctx.eventId);
      if (!ev) return;
      NS.auth.credit(user.email, ev.cost || 1, "buy", "Night cover · " + ev.title, { eventId: ev.id });
      var paid = rsvp(NS.auth.current(), ev);
      if (!paid.ok) {
        var form = document.getElementById("pay-form");
        if (form) NS.ui.note(form, paid.error, false);
        return;
      }
    }
    refreshCredits();
    NS.ui.closeModal("pay-modal");
    if (typeof ctx.onDone === "function") ctx.onDone(meta);
    else window.location.reload();
  }

  function renderHome() {
    var root = document.getElementById("home-nights");
    if (!root) return;
    var user = NS.auth.current();
    if (!user) return;
    root.innerHTML = upcoming(4).map(tile).join("");
    var bal = document.querySelector("[data-home-balance]");
    if (bal) bal.textContent = String(creditOf(user));
  }

  function renderEvents() {
    var root = document.getElementById("events-grid");
    if (!root) return;
    var chips = document.getElementById("city-filter");
    var city = (chips && chips.getAttribute("data-city")) || "all";
    var list = upcoming();
    if (city !== "all") list = list.filter(function (e) { return e.city === city; });
    root.innerHTML = list.length
      ? list.map(tile).join("")
      : '<p class="lede">The house is quiet in that city.</p>';
  }

  function bindCityFilter() {
    var chips = document.getElementById("city-filter");
    if (!chips) return;
    chips.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-city]");
      if (!btn) return;
      chips.setAttribute("data-city", btn.getAttribute("data-city"));
      chips.querySelectorAll("[data-city]").forEach(function (b) {
        b.classList.toggle("is-on", b === btn);
      });
      renderEvents();
    });
  }

  function param(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function renderEvent() {
    var root = document.getElementById("event-root");
    if (!root) return;
    var user = NS.auth.current();
    var ev = eventById(param("id"));
    if (!ev || ev.status !== "published") {
      root.innerHTML = '<p class="lede">That night is not on the book.</p><p><a href="events.html">All nights</a></p>';
      return;
    }
    var going = hasRsvp(ev.id, user.email);
    var guests = guestsFor(ev.id);
    var rsvps = rsvpsFor(ev.id);
    var media = mediaFor(ev.id);
    var names = {};
    NS.store.users().forEach(function (u) { names[u.email] = u.name; });
    var guestRows = rsvps.map(function (r) {
      return '<li><span>' + esc(r.name || names[r.email] || r.email) + "</span><em>Member</em></li>";
    }).concat(guests.map(function (g) {
      return "<li><span>" + esc(g.name) + "</span><em>+1 · " + esc(names[g.hostEmail] || "guest") + "</em></li>";
    }));

    root.innerHTML =
      '<figure class="event-cover">' +
        '<img src="' + esc(ev.cover) + '" alt="" width="1600" height="900">' +
        '<figcaption>' +
          '<p class="meta">' + esc(themeLabels(ev.themes).join(" · ") || ev.kind) + " · " + esc(ev.city) + "</p>" +
          '<h1 class="display">' + esc(ev.title) + "</h1>" +
          '<p class="when">' + esc(prettyFull(ev.date)) + " · " + esc(ev.time) + "</p>" +
        "</figcaption>" +
      "</figure>" +
      '<div class="event-body">' +
        '<p class="lede">' + esc(ev.blurb) + "</p>" +
        '<p class="event-cost">One credit. The house holds ' + esc(String(creditOf(user))) + " for you.</p>" +
        '<div class="event-actions">' +
          (going
            ? '<p class="form-note is-on" data-state="ok">You’re on the list.</p>'
            : '<button type="button" class="cta" data-rsvp>RSVP</button>') +
          '<button type="button" class="cta" data-pay-night>Pay with card</button>' +
        "</div>" +
        '<p class="form-note" id="event-note" role="status"></p>' +
        "<section>" +
          '<p class="eyebrow">The list</p>' +
          '<ul class="guest-list">' + (guestRows.join("") || "<li>The room is still being written.</li>") + "</ul>" +
          '<form class="form guest-form" id="guest-form">' +
            '<div class="field">' +
              '<label for="guest-name">Add a guest</label>' +
              '<input id="guest-name" name="name" type="text" required>' +
            "</div>" +
            '<div class="form-actions"><button class="cta" type="submit">Write them in</button></div>' +
          "</form>" +
        "</section>" +
        "<section>" +
          '<p class="eyebrow">From the night</p>' +
          '<div class="media-grid">' +
            media.map(function (m) {
              return '<figure><img src="' + esc(m.src) + '" alt="' + esc(m.name || "") + '"><figcaption>' + esc(m.name || "") + "</figcaption></figure>";
            }).join("") +
          "</div>" +
          '<form class="form" id="media-form">' +
            '<div class="field">' +
              '<label for="media-file">Leave a still</label>' +
              '<input id="media-file" name="file" type="file" accept="image/*" required>' +
            "</div>" +
            '<div class="form-actions"><button class="cta" type="submit">Upload</button><p class="form-note" role="status"></p></div>' +
          "</form>" +
        "</section>" +
      "</div>";

    var noteEl = document.getElementById("event-note");
    function shout(text, ok) {
      if (!noteEl) return;
      noteEl.textContent = text;
      noteEl.classList.add("is-on");
      noteEl.setAttribute("data-state", ok ? "ok" : "err");
    }

    var rsvpBtn = root.querySelector("[data-rsvp]");
    if (rsvpBtn) {
      rsvpBtn.addEventListener("click", function () {
        var res = rsvp(NS.auth.current(), ev);
        if (!res.ok) {
          shout(res.error + " Buy credits, or pay the night.", false);
          return;
        }
        renderEvent();
        refreshCredits();
      });
    }

    var payBtn = root.querySelector("[data-pay-night]");
    if (payBtn) {
      payBtn.addEventListener("click", function () {
        openPay({
          kind: "event",
          eventId: ev.id,
          lede: ev.title + " · " + (ev.cost || 1) + " credit. Card mock or Payment Link.",
          onDone: function () { renderEvent(); refreshCredits(); }
        });
      });
    }

    var guestForm = document.getElementById("guest-form");
    if (guestForm) {
      guestForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var name = String(new FormData(guestForm).get("name") || "").trim();
        if (!name) return;
        if (!hasRsvp(ev.id, user.email)) {
          shout("RSVP first. Then the house will take a name.", false);
          return;
        }
        NS.store.addGuest({
          id: "g-" + Date.now(),
          eventId: ev.id,
          hostEmail: user.email,
          name: name,
          at: Date.now()
        });
        renderEvent();
      });
    }

    var mediaForm = document.getElementById("media-form");
    if (mediaForm) {
      mediaForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var file = mediaForm.querySelector('[name="file"]').files[0];
        if (!file) return;
        if (file.size > 900000) {
          NS.ui.note(mediaForm, "Keep the still under 900KB for this prototype.", false);
          return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          NS.store.addMedia({
            id: "m-" + Date.now(),
            eventId: ev.id,
            email: user.email,
            src: String(reader.result),
            name: file.name.replace(/\.[^.]+$/, ""),
            at: Date.now()
          });
          renderEvent();
        };
        reader.readAsDataURL(file);
      });
    }
  }

  function renderCredits() {
    var user = NS.auth.current();
    if (!user) return;
    var bal = document.querySelector("[data-credits]");
    if (bal) bal.textContent = String(creditOf(user));
    var packs = document.getElementById("credit-packs");
    if (packs) {
      packs.innerHTML = NS.store.packs.map(function (p) {
        return (
          '<article class="pack-card">' +
            '<p class="meta">' + esc(p.price) + "</p>" +
            "<h3>" + esc(p.label) + "</h3>" +
            "<p>" + p.credits + " credits</p>" +
            '<button type="button" class="cta" data-pack="' + p.id + '">Buy</button>' +
          "</article>"
        );
      }).join("");
      packs.querySelectorAll("[data-pack]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var pack = NS.store.packs.find(function (p) { return p.id === btn.getAttribute("data-pack"); });
          openPay({
            kind: "pack",
            packId: pack.id,
            lede: pack.label + " · " + pack.price + ". Stripe mock or Payment Link.",
            onDone: function () { renderCredits(); refreshCredits(); }
          });
        });
      });
    }
    var ledger = document.getElementById("credit-ledger");
    if (ledger) {
      var rows = NS.store.ledger().filter(function (r) { return r.email === user.email; });
      ledger.innerHTML = rows.length
        ? rows.map(function (r) {
          var sign = r.amount > 0 ? "+" : "";
          return "<li><span>" + esc(r.note || r.kind) + "</span><em>" + sign + r.amount + "</em></li>";
        }).join("")
        : "<li>No movement yet.</li>";
    }
  }

  function bindPropose() {
    var form = document.getElementById("propose-form");
    if (!form) return;
    var user = NS.auth.current();
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var title = String(fd.get("title") || "").trim();
      var city = String(fd.get("city") || "").trim();
      var date = String(fd.get("date") || "").trim();
      if (!title || !city || !date) {
        NS.ui.note(form, "A night needs a name, a city, and a date.", false);
        return;
      }
      NS.store.addProposal({
        id: "p-" + Date.now(),
        title: title,
        city: city,
        date: date,
        time: String(fd.get("time") || "").trim() || "9:00 PM",
        note: String(fd.get("note") || "").trim(),
        cover: String(fd.get("cover") || "assets/dining.jpg"),
        email: user.email,
        name: user.name,
        status: "proposed",
        at: Date.now()
      });
      form.reset();
      NS.ui.note(form, "Held. The desk publishes; members only propose.", true);
      renderMyProposals();
    });
    var covers = document.getElementById("propose-covers");
    if (covers) {
      covers.innerHTML = NS.store.covers.map(function (c, i) {
        return (
          '<label class="cover-chip">' +
            '<input type="radio" name="cover" value="' + esc(c.src) + '"' + (i === 0 ? " checked" : "") + ">" +
            '<img src="' + esc(c.src) + '" alt="' + esc(c.label) + '">' +
            "<span>" + esc(c.label) + "</span>" +
          "</label>"
        );
      }).join("");
    }
    renderMyProposals();
  }

  function renderMyProposals() {
    var box = document.getElementById("my-proposals");
    var user = NS.auth.current();
    if (!box || !user) return;
    var mine = NS.store.proposals().filter(function (p) { return p.email === user.email; });
    box.innerHTML = mine.length
      ? mine.map(function (p) {
        return '<article class="night-card"><p class="meta">' + esc(p.status) + " · " + esc(p.city) + "</p><h3>" + esc(p.title) + "</h3><p class=\"when\">" + esc(prettyFull(p.date)) + "</p></article>";
      }).join("")
      : '<p class="lede">No proposals on this browser yet.</p>';
  }

  function coverPicker(name, selected) {
    return NS.store.covers.map(function (c) {
      var on = selected === c.src || selected === c.id;
      return (
        '<label class="cover-chip">' +
          '<input type="radio" name="' + name + '" value="' + esc(c.src) + '"' + (on ? " checked" : "") + ">" +
          '<img src="' + esc(c.src) + '" alt="' + esc(c.label) + '">' +
          "<span>" + esc(c.label) + "</span>" +
        "</label>"
      );
    }).join("");
  }

  function themePicker(selected) {
    var have = {};
    (selected || []).forEach(function (id) { have[id] = true; });
    return NS.store.themes.map(function (t) {
      return (
        '<label class="theme-chip">' +
          '<input type="checkbox" name="themes" value="' + t.id + '"' + (have[t.id] ? " checked" : "") + ">" +
          "<span>" + esc(t.label) + "</span>" +
        "</label>"
      );
    }).join("");
  }

  function renderAdmin() {
    var queue = document.getElementById("access-queue");
    if (queue) {
      var pending = NS.store.requests().filter(function (r) { return r.status === "pending"; });
      queue.innerHTML = pending.length
        ? pending.map(function (r) {
          return (
            '<article class="queue-card" data-req="' + esc(r.id) + '">' +
              "<h3>" + esc(r.name) + "</h3>" +
              "<p>" + esc(r.email) + (r.company ? " · " + esc(r.company) : "") + "</p>" +
              (r.note ? "<p>" + esc(r.note) + "</p>" : "") +
              '<div class="form-actions">' +
                '<button type="button" class="cta" data-approve>Approve</button>' +
                '<button type="button" class="text-btn" data-deny>Hold</button>' +
              "</div>" +
            "</article>"
          );
        }).join("")
        : '<p class="lede">The queue is quiet.</p>';
      queue.querySelectorAll("[data-req]").forEach(function (card) {
        var id = card.getAttribute("data-req");
        card.querySelector("[data-approve]").addEventListener("click", function () {
          NS.auth.approveRequest(id);
          renderAdmin();
        });
        card.querySelector("[data-deny]").addEventListener("click", function () {
          NS.auth.denyRequest(id);
          renderAdmin();
        });
      });
    }

    var create = document.getElementById("create-event-form");
    if (create && !create.getAttribute("data-bound")) {
      create.setAttribute("data-bound", "1");
      var coverBox = document.getElementById("admin-covers");
      if (coverBox) coverBox.innerHTML = coverPicker("cover", "assets/rooftop.jpg");
      var themeBox = document.getElementById("admin-themes");
      if (themeBox) themeBox.innerHTML = themePicker(["dinner"]);
      create.addEventListener("submit", function (e) {
        e.preventDefault();
        var fd = new FormData(create);
        var title = String(fd.get("title") || "").trim();
        var city = String(fd.get("city") || "").trim();
        var date = String(fd.get("date") || "").trim();
        if (!title || !city || !date) {
          NS.ui.note(create, "Name, city, and date.", false);
          return;
        }
        var themes = fd.getAll("themes");
        NS.store.addEvent({
          id: "ev-" + Date.now(),
          title: title,
          city: city,
          kind: String(fd.get("kind") || "House"),
          date: date,
          time: String(fd.get("time") || "9:00 PM"),
          blurb: String(fd.get("blurb") || "").trim(),
          cover: String(fd.get("cover") || "assets/dining.jpg"),
          themes: themes,
          cost: 1,
          status: "draft",
          publishedAt: 0,
          createdBy: NS.auth.current().email
        });
        create.reset();
        if (coverBox) coverBox.innerHTML = coverPicker("cover", "assets/rooftop.jpg");
        if (themeBox) themeBox.innerHTML = themePicker(["dinner"]);
        NS.ui.note(create, "Drafted. Publish when the room is set.", true);
        renderAdmin();
      });
    }

    var drafts = document.getElementById("draft-events");
    if (drafts) {
      var list = NS.store.events().filter(function (e) { return e.status !== "published"; });
      drafts.innerHTML = list.length
        ? list.map(function (ev) {
          return (
            '<article class="queue-card" data-ev="' + esc(ev.id) + '">' +
              '<img class="queue-cover" src="' + esc(ev.cover) + '" alt="">' +
              '<p class="meta">Draft · ' + esc(ev.city) + "</p>" +
              "<h3>" + esc(ev.title) + "</h3>" +
              "<p>" + esc(prettyFull(ev.date)) + " · " + esc(ev.time) + "</p>" +
              '<button type="button" class="cta" data-publish>Publish</button>' +
            "</article>"
          );
        }).join("")
        : '<p class="lede">No drafts. Create a night, then publish.</p>';
      drafts.querySelectorAll("[data-ev]").forEach(function (card) {
        card.querySelector("[data-publish]").addEventListener("click", function () {
          NS.store.updateEvent(card.getAttribute("data-ev"), { status: "published", publishedAt: Date.now() });
          renderAdmin();
        });
      });
    }

    var props = document.getElementById("proposal-queue");
    if (props) {
      var open = NS.store.proposals().filter(function (p) { return p.status === "proposed"; });
      props.innerHTML = open.length
        ? open.map(function (p) {
          return (
            '<article class="queue-card" data-prop="' + esc(p.id) + '">' +
              '<p class="meta">Member propose · ' + esc(p.city) + "</p>" +
              "<h3>" + esc(p.title) + "</h3>" +
              "<p>" + esc(p.name) + " · " + esc(prettyFull(p.date)) + "</p>" +
              (p.note ? "<p>" + esc(p.note) + "</p>" : "") +
              '<button type="button" class="cta" data-pub-prop>Publish</button>' +
            "</article>"
          );
        }).join("")
        : '<p class="lede">No member proposals waiting.</p>';
      props.querySelectorAll("[data-prop]").forEach(function (card) {
        card.querySelector("[data-pub-prop]").addEventListener("click", function () {
          var id = card.getAttribute("data-prop");
          var p = NS.store.proposals().find(function (x) { return x.id === id; });
          if (!p) return;
          var evId = "ev-" + Date.now();
          NS.store.addEvent({
            id: evId,
            title: p.title,
            city: p.city,
            kind: "House",
            date: p.date,
            time: p.time || "9:00 PM",
            blurb: p.note || "A night proposed by a member. The desk published it.",
            cover: p.cover || "assets/dining.jpg",
            themes: ["house"],
            cost: 1,
            status: "published",
            publishedAt: Date.now(),
            createdBy: p.email
          });
          NS.store.updateProposal(id, { status: "published", eventId: evId });
          renderAdmin();
        });
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var page = document.body.getAttribute("data-members");
    ensurePayModal();
    if (page === "home") renderHome();
    if (page === "events") { bindCityFilter(); renderEvents(); }
    if (page === "event") renderEvent();
    if (page === "credits") renderCredits();
    if (page === "propose") bindPropose();
    if (page === "admin") renderAdmin();
  });
})(window);
