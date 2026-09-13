(function (global) {
  var NS = global.XI = global.XI || {};

  function norm(email) {
    return String(email || "").trim().toLowerCase();
  }

  function findUser(email) {
    var e = norm(email);
    return NS.store.users().find(function (u) { return u.email === e; }) || null;
  }

  NS.auth = {
    current: function () {
      var s = NS.store.session();
      if (!s || !s.email) return null;
      return findUser(s.email);
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
        phone: String(data.phone || "").trim()
      };
      var users = NS.store.users();
      users.push(user);
      NS.store.saveUsers(users);
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
        note: String(data.note || "").trim(),
        at: Date.now()
      });
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
        var users = NS.store.users().map(function (x) {
          if (x.email === u.email) return Object.assign({}, x, { password: password });
          return x;
        });
        NS.store.saveUsers(users);
      }
      return { ok: true, found: true };
    },
    require: function () {
      if (!this.current()) {
        window.location.replace("login.html");
        return null;
      }
      return this.current();
    }
  };
})(window);
