/* XI Members Club — shared auth, seed data, RSVPs */
(function () {
  'use strict';

  const STORAGE = {
    session: 'xi_session',
    rsvps: 'xi_rsvps',
    profile: 'xi_profile',
    members: 'xi_members',
    events: 'xi_events',
    accessRequests: 'xi_access_requests',
  };

  const DEMO_USERS = {
    'member@xi.test': { password: 'member', role: 'member', name: 'Alex Rivera', phone: '+1 (917) 555-0142' },
    'admin@xi.test': { password: 'admin', role: 'admin', name: 'Jordan Blake', phone: '+1 (646) 555-0198' },
  };

  const SEED_EVENTS = [
    {
      id: 'evt-nyc-spring',
      title: 'Autumn Salon — SoHo',
      city: 'New York',
      venue: 'Private loft, Greene Street',
      date: '2026-10-18',
      time: '19:00',
      endTime: '23:00',
      description: 'An intimate autumn evening of conversation, natural wine, and a live string quartet in a candlelit SoHo loft. Members and one guest.',
      capacity: 40,
    },
    {
      id: 'evt-hamptons-weekend',
      title: 'Hamptons House Weekend',
      city: 'The Hamptons',
      venue: 'XI House, East Hampton',
      date: '2026-10-24',
      time: '16:00',
      endTime: '12:00',
      endDate: '2026-10-26',
      description: 'Two nights at the XI House. Poolside aperitivo, chef\'s table dinner Saturday, and a quiet Sunday brunch before the drive back.',
      capacity: 24,
    },
    {
      id: 'evt-miami-art',
      title: 'Art Basel Members Night',
      city: 'Miami',
      venue: 'Wynwood private gallery',
      date: '2026-12-04',
      time: '20:00',
      endTime: '01:00',
      endDate: '2026-12-05',
      description: 'After-hours access to a curated Wynwood show, followed by a late supper under the palms. Black-tie optional.',
      capacity: 60,
    },
    {
      id: 'evt-nyc-dinner',
      title: 'Members Dinner — Tribeca',
      city: 'New York',
      venue: 'Undisclosed Tribeca address',
      date: '2026-09-26',
      time: '19:30',
      endTime: '22:30',
      description: 'A long table for twelve. Seasonal tasting menu, rare bottles, and no phones at the table.',
      capacity: 12,
    },
    {
      id: 'evt-miami-yacht',
      title: 'Sunset Sail — Biscayne',
      city: 'Miami',
      venue: 'Biscayne Bay marina',
      date: '2026-11-07',
      time: '17:30',
      endTime: '21:00',
      description: 'Champagne on the water as the skyline lights. Limited to twenty members; RSVP early.',
      capacity: 20,
    },
  ];

  const SEED_MEMBERS = [
    { id: 'm1', name: 'Alex Rivera', email: 'member@xi.test', phone: '+1 (917) 555-0142', status: 'approved', city: 'New York' },
    { id: 'm2', name: 'Jordan Blake', email: 'admin@xi.test', phone: '+1 (646) 555-0198', status: 'approved', city: 'New York' },
    { id: 'm3', name: 'Sam Chen', email: 'sam.chen@example.com', phone: '+1 (305) 555-0110', status: 'pending', city: 'Miami' },
    { id: 'm4', name: 'Taylor Morgan', email: 'taylor.m@example.com', phone: '+1 (631) 555-0177', status: 'pending', city: 'Hamptons' },
    { id: 'm5', name: 'Casey Okonkwo', email: 'casey.o@example.com', phone: '+1 (212) 555-0133', status: 'approved', city: 'New York' },
  ];

  /* ——— Storage helpers ——— */
  function getJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function setJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function ensureSeed() {
    if (!localStorage.getItem(STORAGE.events)) {
      setJSON(STORAGE.events, SEED_EVENTS);
    }
    if (!localStorage.getItem(STORAGE.members)) {
      setJSON(STORAGE.members, SEED_MEMBERS);
    }
    if (!localStorage.getItem(STORAGE.rsvps)) {
      setJSON(STORAGE.rsvps, {});
    }
    if (!localStorage.getItem(STORAGE.accessRequests)) {
      setJSON(STORAGE.accessRequests, []);
    }
  }

  /* ——— Auth ——— */
  function getSession() {
    return getJSON(STORAGE.session, null);
  }

  function setSession(session) {
    if (session) setJSON(STORAGE.session, session);
    else localStorage.removeItem(STORAGE.session);
  }

  function login(email, password) {
    const key = (email || '').trim().toLowerCase();
    const user = DEMO_USERS[key];
    if (!user || user.password !== password) {
      return { ok: false, error: 'Invalid credentials' };
    }
    const profile = getProfileFor(key) || {
      email: key,
      name: user.name,
      phone: user.phone,
      smsOptIn: true,
    };
    saveProfile(profile);
    const session = { email: key, role: user.role, name: profile.name };
    setSession(session);
    return { ok: true, session };
  }

  function logout() {
    setSession(null);
  }

  function requireAuth(opts) {
    opts = opts || {};
    const session = getSession();
    if (!session) {
      window.location.href = 'login.html';
      return null;
    }
    if (opts.admin && session.role !== 'admin') {
      window.location.href = 'app.html';
      return null;
    }
    return session;
  }

  /* ——— Profile ——— */
  function getProfileFor(email) {
    const all = getJSON(STORAGE.profile, {});
    return all[email] || null;
  }

  function getProfile() {
    const s = getSession();
    if (!s) return null;
    return getProfileFor(s.email) || { email: s.email, name: s.name, phone: '', smsOptIn: true };
  }

  function saveProfile(profile) {
    const all = getJSON(STORAGE.profile, {});
    all[profile.email] = profile;
    setJSON(STORAGE.profile, all);
    const s = getSession();
    if (s && s.email === profile.email) {
      s.name = profile.name;
      setSession(s);
    }
  }

  /* ——— Events ——— */
  function getEvents() {
    ensureSeed();
    return getJSON(STORAGE.events, SEED_EVENTS);
  }

  function getEvent(id) {
    return getEvents().find(function (e) { return e.id === id; }) || null;
  }

  function saveEvents(events) {
    setJSON(STORAGE.events, events);
  }

  function addEvent(event) {
    const events = getEvents();
    events.push(event);
    saveEvents(events);
    return event;
  }

  function upcomingEvents() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return getEvents()
      .filter(function (e) { return new Date(e.date + 'T12:00:00') >= today; })
      .sort(function (a, b) { return a.date.localeCompare(b.date); });
  }

  /* ——— RSVPs ——— */
  function getAllRsvps() {
    return getJSON(STORAGE.rsvps, {});
  }

  function getRsvp(eventId, email) {
    const all = getAllRsvps();
    const byEvent = all[eventId] || {};
    return byEvent[email] || null;
  }

  function setRsvp(eventId, email, status) {
    const all = getAllRsvps();
    if (!all[eventId]) all[eventId] = {};
    if (status === null || status === '') {
      delete all[eventId][email];
    } else {
      all[eventId][email] = status;
    }
    setJSON(STORAGE.rsvps, all);
  }

  function rsvpCounts(eventId) {
    const byEvent = getAllRsvps()[eventId] || {};
    const counts = { going: 0, maybe: 0, no: 0 };
    Object.keys(byEvent).forEach(function (email) {
      const s = byEvent[email];
      if (counts[s] != null) counts[s]++;
    });
    return counts;
  }

  /* ——— Members / access ——— */
  function getMembers() {
    ensureSeed();
    return getJSON(STORAGE.members, SEED_MEMBERS);
  }

  function saveMembers(members) {
    setJSON(STORAGE.members, members);
  }

  function approveMember(id) {
    const members = getMembers();
    const m = members.find(function (x) { return x.id === id; });
    if (m) {
      m.status = 'approved';
      saveMembers(members);
    }
    return m;
  }

  function requestMailtoHref(req) {
    var to = 'shaun@xiexperiences.com';
    var subject = 'XI members — request access';
    var lines = [
      'Full Name: ' + (req.name || ''),
      'Email: ' + (req.email || ''),
      'Phone: ' + (req.phone || ''),
    ];
    if (req.tier) lines.push('Membership Tier: ' + req.tier);
    if (req.referrer) lines.push('Referrer: ' + req.referrer);
    if (req.message) lines.push('Message: ' + req.message);
    if (req.note) lines.push('Note: ' + req.note);
    return (
      'mailto:' + to +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(lines.join('\n'))
    );
  }

  function addAccessRequest(req) {
    const list = getJSON(STORAGE.accessRequests, []);
    list.push(Object.assign({ id: 'req-' + Date.now(), createdAt: new Date().toISOString(), status: 'pending' }, req));
    setJSON(STORAGE.accessRequests, list);
    const members = getMembers();
    members.push({
      id: 'm-' + Date.now(),
      name: req.name,
      email: req.email,
      phone: req.phone,
      tier: req.tier || '',
      status: 'pending',
      city: '—',
    });
    saveMembers(members);

    var href = requestMailtoHref(req);
    window.setTimeout(function () {
      window.location.assign(href);
    }, 400);
  }

  /* ——— Date formatting ——— */
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function parseDate(iso) {
    const parts = iso.split('-');
    return new Date(+parts[0], +parts[1] - 1, +parts[2]);
  }

  function formatMonth(iso) {
    return MONTHS[parseDate(iso).getMonth()];
  }

  function formatDay(iso) {
    return String(parseDate(iso).getDate());
  }

  function formatYear(iso) {
    return String(parseDate(iso).getFullYear());
  }

  function formatLongDate(iso) {
    const d = parseDate(iso);
    return MONTHS_LONG[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  function formatTime(t) {
    if (!t) return '';
    const parts = t.split(':');
    let h = +parts[0];
    const m = parts[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + m + ' ' + ampm;
  }

  function rsvpLabel(status) {
    if (status === 'going') return 'Going';
    if (status === 'maybe') return 'Maybe';
    if (status === 'no') return 'Not going';
    return 'No RSVP';
  }

  /* ——— UI helpers ——— */
  function toast(msg) {
    let el = document.getElementById('xi-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'xi-toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('show'); }, 2200);
  }

  function renderNav(active) {
    const session = getSession();
    const nav = document.getElementById('site-nav');
    if (!nav) return;

    let links = '';
    if (session) {
      links += '<li><a href="app.html"' + (active === 'home' ? ' class="active"' : '') + '>Home</a></li>';
      links += '<li><a href="events.html"' + (active === 'events' ? ' class="active"' : '') + '>Events</a></li>';
      links += '<li><a href="profile.html"' + (active === 'profile' ? ' class="active"' : '') + '>Profile</a></li>';
      if (session.role === 'admin') {
        links += '<li><a href="admin.html"' + (active === 'admin' ? ' class="active"' : '') + '>Admin</a></li>';
      }
      links += '<li><a href="#" id="nav-logout">Sign out</a></li>';
    } else {
      links += '<li><a href="../index.html"' + (active === 'landing' ? ' class="active"' : '') + '>Home</a></li>';
      links += '<li><a href="request-access.html"' + (active === 'request' ? ' class="active"' : '') + '>Apply</a></li>';
      links += '<li><a href="https://ximembersclub.com/"' + (active === 'login' ? ' class="active"' : '') + '>Login</a></li>';
    }

    nav.innerHTML =
      '<div class="site-nav-inner">' +
        '<a class="nav-brand" href="' + (session ? 'app.html' : '../index.html') + '">' +
          '<span class="xi">XI</span><span class="sub">Members</span>' +
        '</a>' +
        '<button type="button" class="nav-toggle" id="nav-toggle" aria-label="Menu">Menu</button>' +
        '<ul class="nav-links" id="nav-links">' + links + '</ul>' +
        (session ? '<div class="nav-user">' + escapeHtml(session.name.split(' ')[0]) + '</div>' : '') +
      '</div>';

    const toggle = document.getElementById('nav-toggle');
    const list = document.getElementById('nav-links');
    if (toggle && list) {
      toggle.addEventListener('click', function () {
        list.classList.toggle('open');
      });
    }
    const logoutBtn = document.getElementById('nav-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function (e) {
        e.preventDefault();
        logout();
        window.location.href = 'index.html';
      });
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function eventCardHtml(event, email) {
    const status = email ? getRsvp(event.id, email) : null;
    const badge = status
      ? '<span class="rsvp-badge ' + status + '">' + rsvpLabel(status) + '</span>'
      : '';
    return (
      '<a class="card card-link event-card" href="event.html?id=' + encodeURIComponent(event.id) + '">' +
        '<div class="event-date-block">' +
          '<div class="event-month">' + formatMonth(event.date) + '</div>' +
          '<div class="event-day">' + formatDay(event.date) + '</div>' +
          '<div class="event-year">' + formatYear(event.date) + '</div>' +
        '</div>' +
        '<div>' +
          '<div class="event-title">' + escapeHtml(event.title) + '</div>' +
          '<div class="event-meta">' + formatTime(event.time) + ' · ' + escapeHtml(event.venue) + '</div>' +
          '<div class="event-loc">' + escapeHtml(event.city) + '</div>' +
          badge +
        '</div>' +
      '</a>'
    );
  }

  function fakeCalendar(event) {
    toast('Added to calendar (demo)');
  }

  /* Init seed on load */
  ensureSeed();

  window.XI = {
    STORAGE,
    DEMO_USERS,
    getSession,
    setSession,
    login,
    logout,
    requireAuth,
    getProfile,
    saveProfile,
    getEvents,
    getEvent,
    addEvent,
    upcomingEvents,
    getRsvp,
    setRsvp,
    rsvpCounts,
    getAllRsvps,
    getMembers,
    approveMember,
    addAccessRequest,
    formatMonth,
    formatDay,
    formatYear,
    formatLongDate,
    formatTime,
    rsvpLabel,
    toast,
    renderNav,
    escapeHtml,
    eventCardHtml,
    fakeCalendar,
    parseDate,
  };
})();