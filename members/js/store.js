(function (global) {
  var NS = global.XI = global.XI || {};
  var KEYS = {
    users: "xi.members.users.v1",
    session: "xi.members.session.v1",
    requests: "xi.members.requests.v1",
    reminders: "xi.members.reminders.v1"
  };
  var DEMO = {
    id: "demo-member",
    name: "Guest of the House",
    email: "member@xi.demo",
    password: "xi-demo-2026",
    phone: "9175550100",
    seeded: true
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

  function seed() {
    var users = read(KEYS.users, []);
    var hasDemo = users.some(function (u) { return u.email === DEMO.email; });
    if (!hasDemo) {
      users.unshift(DEMO);
      write(KEYS.users, users);
    }
  }

  NS.store = {
    keys: KEYS,
    seed: seed,
    users: function () {
      seed();
      return read(KEYS.users, []);
    },
    saveUsers: function (users) {
      write(KEYS.users, users);
    },
    session: function () {
      return read(KEYS.session, null);
    },
    setSession: function (s) {
      write(KEYS.session, s);
    },
    clearSession: function () {
      localStorage.removeItem(KEYS.session);
    },
    requests: function () {
      return read(KEYS.requests, []);
    },
    addRequest: function (req) {
      var all = read(KEYS.requests, []);
      all.unshift(req);
      write(KEYS.requests, all);
    },
    reminders: function () {
      return read(KEYS.reminders, []);
    },
    addReminder: function (rem) {
      var all = read(KEYS.reminders, []);
      all.unshift(rem);
      write(KEYS.reminders, all);
    }
  };

  seed();
})(window);
