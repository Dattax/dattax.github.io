(function (global) {
  var NS = global.XI = global.XI || {};

  var EVENTS = [
    { id: "bay-table", title: "The Bay Table", city: "Miami", kind: "Dinner", date: "2026-01-24", time: "9:30 PM", blurb: "Water at the window. A late supper." },
    { id: "warm-night", title: "Warm Night", city: "Miami", kind: "House", date: "2026-02-14", time: "10:00 PM", blurb: "Windows open. The air does the rest." },
    { id: "ledger", title: "The Ledger Supper", city: "New York", kind: "Dinner", date: "2026-03-12", time: "8:30 PM", blurb: "A long table after the tape." },
    { id: "high-floor", title: "High Floor, Low Light", city: "New York", kind: "Rooftop", date: "2026-04-18", time: "9:00 PM", blurb: "City evening. Wind off the water." },
    { id: "river", title: "After Hours at the River", city: "New York", kind: "City", date: "2026-05-09", time: "10:30 PM", blurb: "A downtown night with no printed start time." },
    { id: "harbor", title: "The Harbor Table", city: "Hamptons", kind: "Supper", date: "2026-06-20", time: "8:00 PM", blurb: "Water at the window. A Saturday supper." },
    { id: "cedar", title: "Salt & Cedar", city: "Hamptons", kind: "House", date: "2026-07-11", time: "9:00 PM", blurb: "A house evening. Windows open to the marsh." },
    { id: "dune", title: "Dune Evening", city: "Hamptons", kind: "Dune", date: "2026-08-15", time: "7:30 PM", blurb: "Light going early. The kind of night you do not photograph." },
    { id: "heat", title: "After the Heat", city: "Miami", kind: "City", date: "2026-11-07", time: "10:00 PM", blurb: "The city after the sun has done its work." },
    { id: "winter", title: "Winter Correspondence", city: "New York", kind: "Talk", date: "2026-12-05", time: "7:00 PM", blurb: "One question, a fire, no stage." }
  ];

  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DOW = ["S", "M", "T", "W", "T", "F", "S"];

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function ymd(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function parseYmd(s) {
    var p = String(s).split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  function eventsOn(iso) {
    return EVENTS.filter(function (e) { return e.date === iso; });
  }

  function card(ev) {
    return (
      '<article class="night-card">' +
        '<p class="meta">' + ev.kind + " · " + ev.city + "</p>" +
        "<h3>" + ev.title + "</h3>" +
        "<p>" + ev.blurb + "</p>" +
        '<p class="when">' + ev.time + "</p>" +
        '<button type="button" class="cta" data-remind="' + ev.id + '">Text me a reminder</button>' +
      "</article>"
    );
  }

  function bindReminders(scope) {
    scope.querySelectorAll("[data-remind]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openSms(btn.getAttribute("data-remind"));
      });
    });
  }

  function render(viewDate, selectedIso) {
    var root = document.getElementById("cal-root");
    if (!root) return;
    var year = viewDate.getFullYear();
    var month = viewDate.getMonth();
    var startDow = new Date(year, month, 1).getDay();
    var daysIn = new Date(year, month + 1, 0).getDate();
    var todayIso = ymd(new Date());
    var html = "";

    html += '<div class="cal-head">';
    html += '<button type="button" class="cal-nav" data-shift="-1" aria-label="Previous month">‹</button>';
    html += '<h2 class="cal-title">' + MONTHS[month] + " <em>" + year + "</em></h2>";
    html += '<button type="button" class="cal-nav" data-shift="1" aria-label="Next month">›</button>';
    html += "</div>";
    html += '<div class="cal-dow">' + DOW.map(function (d) { return "<span>" + d + "</span>"; }).join("") + "</div>";
    html += '<div class="cal-grid">';

    var i;
    for (i = 0; i < startDow; i++) html += '<div class="cal-cell is-empty"></div>';
    for (i = 1; i <= daysIn; i++) {
      var iso = ymd(new Date(year, month, i));
      var evs = eventsOn(iso);
      var cls = "cal-cell";
      if (iso === todayIso) cls += " is-today";
      if (iso === selectedIso) cls += " is-selected";
      if (evs.length) cls += " has-event";
      html += '<button type="button" class="' + cls + '" data-day="' + iso + '">';
      html += '<span class="num">' + i + "</span>";
      if (evs.length) html += '<span class="dot" aria-hidden="true"></span>';
      html += "</button>";
    }
    html += "</div>";
    root.innerHTML = html;

    root.querySelectorAll("[data-shift]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var next = new Date(year, month + Number(btn.getAttribute("data-shift")), 1);
        render(next, selectedIso);
        paintList(selectedIso);
      });
    });
    root.querySelectorAll("[data-day]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var iso = btn.getAttribute("data-day");
        render(new Date(year, month, 1), iso);
        paintList(iso);
      });
    });
  }

  function paintList(iso) {
    var list = document.getElementById("cal-list");
    if (!list) return;
    if (!iso) {
      list.innerHTML = '<p class="lede">Choose a night.</p>';
      return;
    }
    var d = parseYmd(iso);
    var label = MONTHS[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
    var items = eventsOn(iso);
    if (!items.length) {
      list.innerHTML = '<p class="eyebrow">' + label + '</p><p class="lede">The house is quiet this night.</p>';
      return;
    }
    list.innerHTML = '<p class="eyebrow">' + label + "</p>" + items.map(card).join("");
    bindReminders(list);
  }

  function upcoming() {
    var box = document.getElementById("cal-upcoming");
    if (!box) return;
    var today = ymd(new Date());
    var next = EVENTS.filter(function (e) { return e.date >= today; }).slice(0, 4);
    if (!next.length) next = EVENTS.slice(0, 4);
    box.innerHTML = next.map(card).join("");
    bindReminders(box);
  }

  function openSms(id) {
    var ev = EVENTS.find(function (e) { return e.id === id; });
    var modal = document.getElementById("sms-modal");
    if (!ev || !modal) return;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    modal.setAttribute("data-event", ev.id);
    var preview = modal.querySelector("[data-sms-body]");
    if (preview) {
      preview.textContent = ev.title + " — " + ev.city + ", " + ev.time + ". You're on the list. Reply if you need a car.";
    }
    var title = modal.querySelector("[data-sms-title]");
    if (title) title.textContent = ev.title;
    var user = NS.auth.current();
    var phone = modal.querySelector('[name="phone"]');
    if (phone && user && user.phone && !phone.value) phone.value = user.phone;
    var noteEl = modal.querySelector(".form-note");
    if (noteEl) {
      noteEl.classList.remove("is-on");
      noteEl.textContent = "";
    }
    var bubble = modal.querySelector("[data-sms-sent]");
    if (bubble) bubble.hidden = true;
  }

  function closeSms() {
    var modal = document.getElementById("sms-modal");
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function bindSms() {
    var modal = document.getElementById("sms-modal");
    if (!modal) return;
    modal.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) closeSms();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeSms();
    });
    var form = document.getElementById("sms-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var phone = String(new FormData(form).get("phone") || "").trim();
      if (!phone) {
        NS.ui.note(form, "Leave a number. The house will not send a live text.", false);
        return;
      }
      var id = modal.getAttribute("data-event");
      NS.store.addReminder({
        id: "sms-" + Date.now(),
        eventId: id,
        phone: phone,
        at: Date.now()
      });
      NS.ui.note(form, "Sent. (Prototype — no SMS left the house.)", true);
      var bubble = modal.querySelector("[data-sms-sent]");
      if (bubble) {
        bubble.hidden = false;
        var to = bubble.querySelector("[data-sms-to]");
        if (to) to.textContent = phone;
      }
    });
  }

  function initialMonth() {
    var today = new Date();
    var next = EVENTS.find(function (e) { return e.date >= ymd(today); });
    return next ? parseYmd(next.date) : today;
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!document.getElementById("cal-root")) return;
    if (!NS.auth.current()) return;
    var start = initialMonth();
    var iso = ymd(start);
    render(new Date(start.getFullYear(), start.getMonth(), 1), iso);
    paintList(iso);
    upcoming();
    bindSms();
  });
})(window);
