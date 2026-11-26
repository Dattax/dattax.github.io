/* Datta Consulting Group: shared site behaviour */
(function () {
  'use strict';

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  function setMenu(open) {
    if (!toggle || !nav) { return; }
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('menu-open', open);
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) { setMenu(false); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setMenu(false); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 900) { setMenu(false); } });
  }

  /* ---------- GA4 event helper (no-op until gtag exists) ---------- */
  function send(name, params) {
    params = params || {};
    params.page_path = location.pathname;
    if (typeof window.gtag === 'function') { window.gtag('event', name, params); }
    else if (window.DCG_DEBUG_TRACKING) { console.log('[track]', name, params); }
  }
  window.dcgTrack = send;

  /* ---------- Click tracking ----------
     tel:   links -> phone_click
     mailto: links -> email_click
     any element with data-track -> cta_click (cta_id, location, label)           */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('a[href^="tel:"], a[href^="mailto:"], [data-track]');
    if (!el) { return; }
    var href = el.getAttribute('href') || '';
    var loc = el.getAttribute('data-track-location') || '';
    var label = el.getAttribute('data-track-label') || (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    var id = el.getAttribute('data-track') || '';
    if (href.indexOf('tel:') === 0) { send('phone_click', { link_url: href, location: loc, label: label }); }
    else if (href.indexOf('mailto:') === 0) { send('email_click', { link_url: href, location: loc, label: label }); }
    else { send('cta_click', { cta_id: id, location: loc, label: label, link_url: href }); }
  });

  /* ---------- Forms ----------
     The contact form is UI only for now. It validates, reports form_submit,
     and tells the visitor it is not connected yet. Replace the handler body
     (or set a real action URL and remove the preventDefault) when a backend exists. */
  document.querySelectorAll('form[data-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var hp = form.querySelector('[name="website"]');          // honeypot field
      if (hp && hp.value) { return; }
      var wired = form.getAttribute('data-wired') === 'true';
      send('form_submit', { form_id: form.getAttribute('data-form'), location: form.getAttribute('data-track-location') || '', wired: wired });
      var status = form.querySelector('.form-status');
      if (!wired && status) {
        status.hidden = false;
        status.textContent = 'Preview only: this form is not connected yet, so nothing was sent. Please call (001) 858 395 3287 or email contact@dattaconsultinggroup.com.';
      }
    });
  });

  /* ---------- Products/services: highlight chip for the section in view ---------- */
  var chips = document.querySelectorAll('.chips a[href^="#"]');
  if (chips.length && 'IntersectionObserver' in window) {
    var map = {};
    chips.forEach(function (c) { map[c.getAttribute('href').slice(1)] = c; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          chips.forEach(function (c) { c.classList.remove('on'); });
          map[en.target.id].classList.add('on');
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) { io.observe(s); } });
  }
})();

/* ================= Blueprint layer: reveals, spotlight, figure crosshair ================= */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Scroll reveal. Elements with .rv are visible by default without JS (see CSS: only hidden under .js). */
  var items = document.querySelectorAll('.rv');
  if (!('IntersectionObserver' in window) || reduce) {
    items.forEach(function (el) { el.classList.add('in'); });
  } else {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); ro.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { ro.observe(el); });
  }

  /* Spotlight follows the pointer on cards (skipped for reduced motion). */
  if (!reduce) {
    document.querySelectorAll('.spot').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
    /* Crosshair lines in diagram figures follow the pointer. */
    document.querySelectorAll('.fig').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--cx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--cy', (e.clientY - r.top) + 'px');
      });
      el.addEventListener('pointerleave', function () { el.style.removeProperty('--cx'); el.style.removeProperty('--cy'); });
    });
  }
})();

/* ================= Sliders, marquee, parallax, rotator, count-up ================= */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motionOK = !reduce;

  function kids(el, sel) { return Array.prototype.slice.call(el.querySelectorAll(sel)); }

  /* Generic slider: used for the hero, services, products. Pauses on hover, focus, hidden tab. */
  function dcgSlider(root, opts) {
    opts = opts || {};
    var slides = kids(root, opts.slide || ':scope > .slides > .slide, :scope > .carousel-track > *');
    if (!slides.length) return;
    var btns = root.querySelector('.slide-dots');
    var prev = root.querySelector('.slide-prev, [data-dir="prev"]');
    var next = root.querySelector('.slide-next, [data-dir="next"]');
    var i = 0, timer = null, interval = opts.interval || 5500;
    var autoplay = motionOK && opts.autoplay !== false && slides.length > 1 && !window.DCG_STATIC_SHOTS;
    var frozen = false;

    if (btns && !btns.children.length) {
      slides.forEach(function (_, n) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Go to slide ' + (n + 1));
        btns.appendChild(b);
      });
    }
    var dots = btns ? kids(btns, 'button') : [];

    function perView() {
      if (!opts.scroll) return 1;
      var track = root.querySelector('.carousel-track');
      if (!track || !slides[0]) return 1;
      var tw = track.clientWidth, sw = slides[0].getBoundingClientRect().width;
      if (!tw || !sw) return 1;
      return Math.max(1, Math.round(tw / sw));
    }
    function scrollToSlide(idx, user) {
      var track = root.querySelector('.carousel-track');
      if (!track || !slides[idx]) return;
      var first = slides[0];
      var left = slides[idx].offsetLeft - first.offsetLeft;
      track.scrollTo({ left: left, behavior: user && motionOK ? 'smooth' : 'auto' });
    }
    function go(n, user) {
      if (!slides.length) return;
      var pv = perView();
      var maxStart = Math.max(0, slides.length - pv);
      i = (n + slides.length) % slides.length;
      var startAt = Math.min(i, maxStart);
      slides.forEach(function (s, k) {
        s.classList.toggle('is-on', k === i);
        s.setAttribute('aria-hidden', (k >= startAt && k < startAt + pv) ? 'false' : 'true');
      });
      dots.forEach(function (d, k) { d.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      if (opts.scroll) scrollToSlide(startAt, user);
      if (user) restart();
    }
    function restart() {
      if (!autoplay || frozen) return;
      clearInterval(timer);
      timer = setInterval(function () { go(i + 1); }, interval);
    }
    function stop() { clearInterval(timer); timer = null; }
    function freeze() { frozen = true; autoplay = false; stop(); go(0); }

    if (!root.hasAttribute('tabindex')) root.setAttribute('tabindex', '0');
    root.classList.add('is-on');
    go(0);
    if (prev) prev.addEventListener('click', function () { go(i - 1, true); });
    if (next) next.addEventListener('click', function () { go(i + 1, true); });
    dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k, true); }); });
    root.addEventListener('keydown', function (e) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1, true); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1, true); }
    });
    var x0 = null;
    root.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    root.addEventListener('pointerup', function (e) {
      if (x0 == null) return;
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1), true);
    });
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', restart);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', function (e) {
      if (!root.contains(e.relatedTarget)) restart();
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else restart();
    });
    if ('IntersectionObserver' in window) {
      var vis = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) restart();
          else stop();
        });
      }, { threshold: 0.15 });
      vis.observe(root);
    }
    if (autoplay) restart();
    var api = { go: go, stop: stop, freeze: freeze, root: root };
    window.DCGMotion.sliders.push(api);
    return api;
  }

  window.DCGMotion = window.DCGMotion || { sliders: [] };
  window.DCGMotion.reset = function () {
    this.sliders.forEach(function (s) { s.freeze(); });
  };

  kids(document, '[data-slider]').forEach(function (el) {
    /* Reduced motion: leave carousels as stacked grids and the hero on its first photo. */
    if (!motionOK) return;
    var type = el.getAttribute('data-slider');
    dcgSlider(el, {
      autoplay: true,
      interval: type === 'hero' ? 6000 : 5500,
      scroll: type !== 'hero',
      slide: type === 'hero' ? ':scope .slide' : ':scope .carousel-track > *'
    });
  });

  /* Rotating phrases */
  kids(document, '[data-rotator]').forEach(function (el) {
    var spans = kids(el, 'span');
    if (!spans.length) return;
    spans[0].classList.add('is-on');
    if (!motionOK || spans.length < 2) return;
    var i = 0, t;
    function tick() {
      spans[i].classList.remove('is-on');
      i = (i + 1) % spans.length;
      spans[i].classList.add('is-on');
    }
    function start() { t = setInterval(tick, 4000); }
    function stop() { clearInterval(t); }
    el.addEventListener('mouseenter', stop);
    el.addEventListener('mouseleave', start);
    el.addEventListener('focusin', stop);
    el.addEventListener('focusout', start);
    start();
  });

  /* Count-up for letter figures */
  kids(document, '[data-count]').forEach(function (el) {
    var target = el.getAttribute('data-count');
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var num = parseFloat(String(target).replace(/[^\d.]/g, ''));
    if (isNaN(num)) return;
    var startVal = 0;
    function render(v) {
      var shown = (num >= 1000) ? Math.round(v).toLocaleString('en-US') : String(Math.round(v));
      el.textContent = prefix + shown + suffix;
    }
    if (!motionOK || !('IntersectionObserver' in window)) { render(num); return; }
    el.textContent = prefix + '0' + suffix;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(el);
        var t0 = performance.now(), dur = 900;
        function frame(now) {
          var p = Math.min(1, (now - t0) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          render(startVal + (num - startVal) * eased);
          if (p < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      });
    }, { threshold: 0.4 });
    io.observe(el.closest('.stat') || el);
  });

  /* Subtle parallax on photos (desktop only) */
  if (motionOK && window.innerWidth > 900) {
    var photos = kids(document, '.parallax-img');
    if (photos.length) {
      var ticking = false;
      function update() {
        ticking = false;
        photos.forEach(function (img) {
          var r = img.getBoundingClientRect();
          if (r.bottom < 0 || r.top > window.innerHeight) return;
          var mid = r.top + r.height / 2 - window.innerHeight / 2;
          var y = Math.max(-24, Math.min(24, mid * -0.06));
          img.style.transform = 'scale(1.08) translateY(' + y + 'px)';
        });
      }
      window.addEventListener('scroll', function () {
        if (!ticking) { requestAnimationFrame(update); ticking = true; }
      }, { passive: true });
      update();
    }
  }

  /* Process section: update the sticky large number from data-step */
  var pin = document.querySelector('.process-pin');
  if (pin && 'IntersectionObserver' in window) {
    var label = pin.querySelector('.pin-num');
    var steps = kids(pin, '[data-step]');
    if (label && steps.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) label.textContent = en.target.getAttribute('data-step');
        });
      }, { rootMargin: '-40% 0px -40% 0px', threshold: 0.2 });
      steps.forEach(function (s) { io.observe(s); });
    }
  }
})();
