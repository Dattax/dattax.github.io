(function (global) {
  var NS = global.XI = global.XI || {};
  var KEYS = {
    users: "xi.club.users.v1",
    session: "xi.members.session.v1",
    requests: "xi.club.requests.v1",
    events: "xi.club.events.v1",
    rsvps: "xi.club.rsvps.v1",
    guests: "xi.club.guests.v1",
    media: "xi.club.media.v1",
    ledger: "xi.club.ledger.v1",
    proposals: "xi.club.proposals.v1",
    reminders: "xi.members.reminders.v1"
  };

  var COVERS = [
    { id: "rooftop", src: "assets/rooftop.jpg", label: "Rooftop" },
    { id: "hamptons", src: "assets/hamptons.jpg", label: "Hamptons" },
    { id: "miami", src: "assets/miami.jpg", label: "Miami" },
    { id: "dining", src: "assets/dining.jpg", label: "Dining" },
    { id: "night", src: "assets/night.jpg", label: "Night" },
    { id: "house", src: "assets/house.jpg", label: "House" },
    { id: "music", src: "assets/music.jpg", label: "Music" }
  ];

  var THEMES = [
    { id: "rooftop", label: "Rooftop" },
    { id: "dinner", label: "Dinner" },
    { id: "house", label: "House" },
    { id: "water", label: "Water" },
    { id: "after", label: "After hours" },
    { id: "low", label: "Low light" },
    { id: "salt", label: "Salt air" },
    { id: "fire", label: "Fire" },
    { id: "spa", label: "Spa" },
    { id: "play", label: "Play" }
  ];

  var PACKS = [
    { id: "five", credits: 5, label: "Five nights", price: "$550" },
    { id: "xi", credits: 11, label: "XI pack", price: "$1,100" },
    { id: "season", credits: 22, label: "Season", price: "$2,200" }
  ];

  var DEMO_MEMBER = {
    id: "demo-member",
    name: "Guest of the House",
    email: "member@xi.demo",
    password: "xi-demo-2026",
    phone: "9175550100",
    role: "member",
    credits: 11,
    seeded: true
  };

  var DEMO_ADMIN = {
    id: "demo-admin",
    name: "House Desk",
    email: "admin@xi.demo",
    password: "xi-admin-2026",
    phone: "9175550101",
    role: "admin",
    credits: 99,
    seeded: true
  };

  var SEED_EVENTS = [
    {
      id: "pickleball",
      title: "XI Pickleball Social",
      city: "New York",
      kind: "Play",
      date: "2026-09-16",
      time: "6:00 PM",
      blurb: "Clinic, round robin, then drinks. The night starts on the court.",
      cover: "assets/music.jpg",
      themes: ["play", "after"],
      cost: 1,
      status: "published",
      publishedAt: 1
    },
    {
      id: "high-floor",
      title: "High Floor, Low Light",
      city: "New York",
      kind: "Rooftop",
      date: "2026-10-03",
      time: "9:00 PM",
      blurb: "City evening. Wind off the water. A late supper above the street.",
      cover: "assets/rooftop.jpg",
      themes: ["rooftop", "low", "dinner"],
      cost: 1,
      status: "published",
      publishedAt: 2
    },
    {
      id: "othership",
      title: "XI Othership Spa",
      city: "New York",
      kind: "Spa",
      date: "2026-10-22",
      time: "7:30 PM",
      blurb: "Sauna, ice, breath. Then the room opens for a quiet drink.",
      cover: "assets/dining.jpg",
      themes: ["spa", "low"],
      cost: 1,
      status: "published",
      publishedAt: 3
    },
    {
      id: "harbor",
      title: "The Harbor Table",
      city: "Hamptons",
      kind: "Supper",
      date: "2026-10-31",
      time: "8:00 PM",
      blurb: "Water at the window. A Saturday supper on the East End.",
      cover: "assets/hamptons.jpg",
      themes: ["dinner", "salt", "water"],
      cost: 1,
      status: "published",
      publishedAt: 4
    },
    {
      id: "ledger",
      title: "The Ledger Supper",
      city: "New York",
      kind: "Dinner",
      date: "2026-11-07",
      time: "8:30 PM",
      blurb: "A long table after the tape. No printed start beyond the hour.",
      cover: "assets/dining.jpg",
      themes: ["dinner", "low"],
      cost: 1,
      status: "published",
      publishedAt: 5
    },
    {
      id: "casino",
      title: "XI Casino Night",
      city: "New York",
      kind: "House",
      date: "2026-11-19",
      time: "9:00 PM",
      blurb: "Blackjack, poker, roulette. Cocktails and a prize no one photographs.",
      cover: "assets/night.jpg",
      themes: ["house", "after", "play"],
      cost: 1,
      status: "published",
      publishedAt: 6
    },
    {
      id: "warm-night",
      title: "Warm Night",
      city: "Miami",
      kind: "House",
      date: "2026-11-28",
      time: "10:00 PM",
      blurb: "Windows open. The air does the rest.",
      cover: "assets/miami.jpg",
      themes: ["house", "water", "after"],
      cost: 1,
      status: "published",
      publishedAt: 7
    },
    {
      id: "holiday",
      title: "XI Holiday Party",
      city: "New York",
      kind: "House",
      date: "2026-12-17",
      time: "8:00 PM",
      blurb: "An upscale close to the year. Cocktails, a DJ, a gift at the door.",
      cover: "assets/house.jpg",
      themes: ["house", "fire", "after"],
      cost: 1,
      status: "published",
      publishedAt: 8
    },
    {
      id: "bay-table",
      title: "The Bay Table",
      city: "Miami",
      kind: "Dinner",
      date: "2027-01-24",
      time: "9:30 PM",
      blurb: "Water at the window. A late supper on the bay.",
      cover: "assets/miami.jpg",
      themes: ["dinner", "water"],
      cost: 1,
      status: "published",
      publishedAt: 9
    }
  ];

  var SEED_GUESTS = [
    { id: "g-seed-1", eventId: "high-floor", hostEmail: "member@xi.demo", name: "A. Moreau", at: 1 },
    { id: "g-seed-2", eventId: "high-floor", hostEmail: "admin@xi.demo", name: "House list", at: 2 },
    { id: "g-seed-3", eventId: "harbor", hostEmail: "member@xi.demo", name: "L. Voss", at: 3 }
  ];

  var SEED_MEDIA = [
    { id: "m-seed-1", eventId: "high-floor", email: "house", src: "assets/rooftop.jpg", name: "The terrace", at: 1 },
    { id: "m-seed-2", eventId: "high-floor", email: "house", src: "assets/dining.jpg", name: "The table", at: 2 },
    { id: "m-seed-3", eventId: "harbor", email: "house", src: "assets/hamptons.jpg", name: "East End", at: 3 },
    { id: "m-seed-4", eventId: "warm-night", email: "house", src: "assets/miami.jpg", name: "The bay", at: 4 },
    { id: "m-seed-5", eventId: "ledger", email: "house", src: "assets/dining.jpg", name: "After the tape", at: 5 },
    { id: "m-seed-6", eventId: "casino", email: "house", src: "assets/night.jpg", name: "Low light", at: 6 }
  ];

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

  function ensureSeeded(key, seed, idField) {
    var all = read(key, []);
    if (!all.length) {
      write(key, seed.slice());
      return seed.slice();
    }
    var have = {};
    all.forEach(function (item) { have[item[idField || "id"]] = true; });
    var added = false;
    seed.forEach(function (item) {
      if (!have[item[idField || "id"]]) {
        all.push(item);
        added = true;
      }
    });
    if (added) write(key, all);
    return all;
  }

  function seedUsers() {
    var users = read(KEYS.users, []);
    var byEmail = {};
    users.forEach(function (u) { byEmail[u.email] = u; });
    [DEMO_MEMBER, DEMO_ADMIN].forEach(function (demo) {
      if (!byEmail[demo.email]) {
        users.unshift(demo);
        byEmail[demo.email] = demo;
      } else {
        var cur = byEmail[demo.email];
        if (!cur.role) cur.role = demo.role;
        if (typeof cur.credits !== "number") cur.credits = demo.credits;
      }
    });
    write(KEYS.users, users);
    return users;
  }

  function seedLedger() {
    var ledger = read(KEYS.ledger, []);
    if (ledger.length) return ledger;
    ledger = [
      { id: "led-seed-m", email: DEMO_MEMBER.email, kind: "seed", amount: 11, note: "Opening balance — the house wrote you in", at: 1 },
      { id: "led-seed-a", email: DEMO_ADMIN.email, kind: "seed", amount: 99, note: "Desk float", at: 1 }
    ];
    write(KEYS.ledger, ledger);
    return ledger;
  }

  function seed() {
    seedUsers();
    ensureSeeded(KEYS.events, SEED_EVENTS);
    ensureSeeded(KEYS.guests, SEED_GUESTS);
    ensureSeeded(KEYS.media, SEED_MEDIA);
    seedLedger();
    if (!read(KEYS.requests, null)) write(KEYS.requests, []);
    if (!read(KEYS.rsvps, null)) write(KEYS.rsvps, []);
    if (!read(KEYS.proposals, null)) write(KEYS.proposals, []);
  }

  function list(key) {
    seed();
    return read(key, []);
  }

  function save(key, items) {
    write(key, items);
  }

  function prepend(key, item) {
    var all = list(key);
    all.unshift(item);
    write(key, all);
    return item;
  }

  function updateById(key, id, patch) {
    var all = list(key).map(function (item) {
      if (item.id === id) return Object.assign({}, item, patch);
      return item;
    });
    write(key, all);
    return all.find(function (item) { return item.id === id; }) || null;
  }

  NS.store = {
    keys: KEYS,
    covers: COVERS,
    themes: THEMES,
    packs: PACKS,
    seed: seed,
    users: function () { return list(KEYS.users); },
    saveUsers: function (users) { save(KEYS.users, users); },
    session: function () { return read(KEYS.session, null); },
    setSession: function (s) { write(KEYS.session, s); },
    clearSession: function () { localStorage.removeItem(KEYS.session); },
    requests: function () { return list(KEYS.requests); },
    addRequest: function (req) { return prepend(KEYS.requests, req); },
    updateRequest: function (id, patch) { return updateById(KEYS.requests, id, patch); },
    events: function () { return list(KEYS.events); },
    saveEvents: function (events) { save(KEYS.events, events); },
    addEvent: function (ev) { return prepend(KEYS.events, ev); },
    updateEvent: function (id, patch) { return updateById(KEYS.events, id, patch); },
    rsvps: function () { return list(KEYS.rsvps); },
    addRsvp: function (r) { return prepend(KEYS.rsvps, r); },
    guests: function () { return list(KEYS.guests); },
    addGuest: function (g) { return prepend(KEYS.guests, g); },
    media: function () { return list(KEYS.media); },
    addMedia: function (m) { return prepend(KEYS.media, m); },
    ledger: function () { return list(KEYS.ledger); },
    addLedger: function (row) { return prepend(KEYS.ledger, row); },
    proposals: function () { return list(KEYS.proposals); },
    addProposal: function (p) { return prepend(KEYS.proposals, p); },
    updateProposal: function (id, patch) { return updateById(KEYS.proposals, id, patch); },
    reminders: function () { return list(KEYS.reminders); },
    addReminder: function (rem) { return prepend(KEYS.reminders, rem); }
  };

  seed();
})(window);
