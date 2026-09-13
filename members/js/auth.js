(function (global) {
  var NS = global.XI = global.XI || {};

  function norm(email) {
    return String(email || "").trim().toLowerCase();
  }

  function findUser(email) {
    var e = norm(email);
    return NS.store.users().find(function (u) { return u.email === e; }) || null;
  }

  function saveUser(next) {
    var users = NS.store.users().map(function (u) {
      return u.email === next.email ? next : u;
    });
    if (!users.some(function (u) { return u.email === next.email; })) users.push(next);
    NS.store.saveUsers(users);
    return next;
  }

  NS.auth = {
    current: function () {
      var s = NS.store.session();
      if (!s || !s.email) return null;
      return findUser(s.email);
    },
    isAdmin: function (user) {
      var u = user || this.current();
      return !!(u && u.role === "admin");
    },
    login: function (email, password) {
      var u = findUser(email);
      if (!u || u.password !== String(password || "")) {
        return { ok: false, error: "That name is not on tonight’s list." };
      }
      NS.store.setSession({ email: u.email, at: Date.now() });
      return { ok: true, user: u };
    },
    signup: function (data) {
      var email = norm(data.email);
      var name = String(data.name || "").trim();
      var password = String(data.password || "");
      if (!email || !password || !name) {
        return { ok: false, error: "The house needs a name, an email, and a key." };
      }
      if (password.length < 8) {
        return { ok: false, error: "Choose a key of at least eight characters." };
      }
      if (findUser(email)) {
        return { ok: false, error: "This address is already on the list. Sign in." };
      }
      var user = {
        id: "u-" + Date.now(),
        name: name,
        email: email,
        password: password,
        phone: String(data.phone || "").trim(),
        role: "member",
        credits: 3
      };
      saveUser(user);
      NS.store.addLedger({
        id: "led-" + Date.now(),
        email: user.email,
        kind: "seed",
        amount: 3,
        note: "Welcome balance",
        at: Date.now()
      });
      NS.store.setSession({ email: user.email, at: Date.now() });
      return { ok: true, user: user };
    },
    logout: function () {
      NS.store.clearSession();
    },
    requestAccess: function (data) {
      var email = norm(data.email);
      var name = String(data.name || "").trim();
      if (!email || !name) {
        return { ok: false, error: "Leave a name and an email. The house writes back." };
      }
      NS.store.addRequest({
        id: "r-" + Date.now(),
        name: name,
        email: email,
        phone: String(data.phone || "").trim(),
        company: String(data.company || "").trim(),
        note: String(data.note || "").trim(),
        status: "pending",
        at: Date.now()
      });
      return { ok: true };
    },
    approveRequest: function (id) {
      var req = NS.store.requests().find(function (r) { return r.id === id; });
      if (!req) return { ok: false, error: "That request is no longer on the desk." };
      NS.store.updateRequest(id, { status: "approved", decidedAt: Date.now() });
      if (!findUser(req.email)) {
        var user = {
          id: "u-" + Date.now(),
          name: req.name,
          email: req.email,
          password: "xi-guest-2026",
          phone: req.phone || "",
          role: "member",
          credits: 3
        };
        saveUser(user);
        NS.store.addLedger({
          id: "led-" + Date.now(),
          email: user.email,
          kind: "seed",
          amount: 3,
          note: "Written in by the desk",
          at: Date.now()
        });
      }
      return { ok: true };
    },
    denyRequest: function (id) {
      NS.store.updateRequest(id, { status: "denied", decidedAt: Date.now() });
      return { ok: true };
    },
    reset: function (email, newPassword) {
      var u = findUser(email);
      var password = String(newPassword || "");
      if (!u) return { ok: true, found: false };
      if (password) {
        if (password.length < 8) {
          return { ok: false, error: "Choose a key of at least eight characters." };
        }
        saveUser(Object.assign({}, u, { password: password }));
      }
      return { ok: true, found: true };
    },
    require: function (opts) {
      var user = this.current();
      if (!user) {
        window.location.replace("login.html");
        return null;
      }
      if (opts && opts.admin && !this.isAdmin(user)) {
        window.location.replace("./");
        return null;
      }
      return user;
    },
    credit: function (email, amount, kind, note, extra) {
      var u = findUser(email);
      if (!u) return { ok: false, error: "No member on that address." };
      var next = Object.assign({}, u, { credits: (u.credits || 0) + amount });
      if (next.credits < 0) return { ok: false, error: "The house needs more credits for this night." };
      saveUser(next);
      NS.store.addLedger(Object.assign({
        id: "led-" + Date.now(),
        email: next.email,
        kind: kind || (amount >= 0 ? "buy" : "spend"),
        amount: amount,
        note: note || "",
        at: Date.now()
      }, extra || {}));
      return { ok: true, user: next };
    },
    findUser: findUser
  };
})(window);
