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
    function revealVisible() {
      for (var i = 0; i < items.length; i++) {
        var el = items[i];
        if (el.classList.contains('in')) continue;
        var r = el.getBoundingClientRect();
        if (r.bottom > 60 && r.top < window.innerHeight - 24 && r.height > 0) {
          el.classList.add('in');
          ro.unobserve(el);
        }
      }
    }
    window.addEventListener('scroll', revealVisible, { passive: true });
    window.addEventListener('resize', revealVisible);
    revealVisible();
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

/* ================= Page background, sliders, marquee, parallax, rotator, count-up ================= */
(function () {
  'use strict';
  var motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var staticShots = !!window.DCG_STATIC_SHOTS;
  var lerpOn = motionOK && !staticShots;
  var mqDesk = window.matchMedia('(min-width: 901px)');

  /* ---------- Scroll-driven page background ---------- */
  var BG = {
    white: [255, 255, 255],
    mist:  [241, 247, 248],
    navy:  [11, 37, 69],
    ink:   [7, 26, 51],
    teal:  [14, 124, 134]
  };
  var pageBg = document.getElementById('page-bg');
  var bgSections = Array.prototype.slice.call(document.querySelectorAll('[data-bg]'));

  function rgb(c) { return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; }
  function mix(a, b, t) {
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }
  function lum(c) { return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; }
  function nameOf(el) { return (el && el.getAttribute('data-bg')) || 'white'; }
  function colorOf(el) { return BG[nameOf(el)] || BG.white; }

  function applyTheme(c, nameHint) {
    var L = lum(c);
    var theme = 'light';
    if (nameHint === 'teal' && L < 0.45) theme = 'teal';
    else if (L < 0.45) theme = 'dark';
    if (document.documentElement.getAttribute('data-theme') !== theme) {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }

  function currentBg() {
    if (!bgSections.length) return { color: BG.white, name: 'white' };
    var viewH = window.innerHeight;
    var visible = [];
    var i, r, vis, a, b, tot, t, c, name;
    for (i = 0; i < bgSections.length; i++) {
      r = bgSections[i].getBoundingClientRect();
      vis = Math.min(r.bottom, viewH) - Math.max(r.top, 0);
      if (vis > 0) visible.push({ el: bgSections[i], vis: vis });
    }
    if (!visible.length) {
      // Fall back to the last section whose top has crossed mid-viewport
      var mid = viewH * 0.45;
      var active = bgSections[0];
      for (i = 0; i < bgSections.length; i++) {
        if (bgSections[i].getBoundingClientRect().top <= mid) active = bgSections[i];
      }
      return { color: colorOf(active), name: nameOf(active) };
    }
    visible.sort(function (x, y) { return y.vis - x.vis; });
    a = visible[0];
    b = visible[1];
    name = nameOf(a.el);
    c = colorOf(a.el);
    if (lerpOn && b) {
      tot = a.vis + b.vis;
      t = tot ? b.vis / tot : 0;
      c = mix(c, colorOf(b.el), t);
      if (t > 0.5) name = nameOf(b.el);
    }
    return { color: c, name: name };
  }

  function paintBg() {
    if (!pageBg || !bgSections.length) return;
    var state = currentBg();
    pageBg.style.backgroundColor = rgb(state.color);
    applyTheme(state.color, state.name);
  }

  if (pageBg && bgSections.length) {
    document.body.setAttribute('data-bg-on', '');
    paintBg();
    window.addEventListener('scroll', paintBg, { passive: true });
    window.addEventListener('resize', paintBg);
  }

  /* ---------- Peeking / pinned sliders ---------- */
  var sliders = [];

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function enhanceSlider(root) {
    var track = root.querySelector('.carousel-track');
    if (!track) return;
    var slides = Array.prototype.filter.call(track.children, function (el) {
      return el.nodeType === 1 && el.tagName !== 'BUTTON';
    });
    if (slides.length < 2) return;

    var index = 0;
    var auto = 0;
    var hovered = false;
    var inView = true;
    var dragging = false;
    var moved = false;
    var startX = 0, startScroll = 0, startY = 0;
    var pinActive = false;
    var pinWrap = root.closest('.pin-services');
    var canPin = root.getAttribute('data-pin') === 'desktop' && !!pinWrap;
    var fracCur = root.querySelector('.frac-now');
    var fracTot = root.querySelector('.frac-total');
    var bar = root.querySelector('.slide-progress .bar');
    var autoplay = !staticShots && motionOK && root.getAttribute('data-slider') === 'hero';
    var interval = 6500;

    root.querySelectorAll('img[loading="lazy"]').forEach(function (img) { img.loading = 'eager'; });
    if (fracTot) fracTot.textContent = pad2(slides.length);
    root.classList.add('is-on');
    track.setAttribute('tabindex', '0');
    track.setAttribute('role', 'list');

    function gap() {
      var s = window.getComputedStyle(track);
      return parseFloat(s.columnGap || s.gap) || 0;
    }
    function slideSpan() {
      return slides[0].getBoundingClientRect().width + gap();
    }
    function maxScroll() {
      if (pinActive) return Math.max(0, track.scrollWidth - track.parentElement.clientWidth);
      return Math.max(0, track.scrollWidth - track.clientWidth);
    }
    function pinRange() {
      if (!pinWrap) return { start: 0, end: 0, height: 0 };
      var stage = pinWrap.querySelector('.pin-stage') || pinWrap;
      var extra = Math.max(maxScroll(), 1);
      return {
        start: pinWrap.getBoundingClientRect().top + window.scrollY,
        extra: extra,
        height: stage.offsetHeight
      };
    }

    function setIndex(i, fromScroll) {
      index = Math.max(0, Math.min(slides.length - 1, i));
      if (fracCur) fracCur.textContent = pad2(index + 1);
      var max = maxScroll();
      var progress = max ? (pinActive ? getPinX() : track.scrollLeft) / max : (index / (slides.length - 1));
      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;
      if (bar) bar.style.transform = 'scaleX(' + (progress || (index + 1) / slides.length) + ')';
    }

    function getPinX() {
      var r = pinRange();
      var y = window.scrollY - r.start;
      var travel = r.extra;
      var t = travel ? y / travel : 0;
      if (t < 0) t = 0;
      if (t > 1) t = 1;
      return t * travel;
    }

    function applyPin() {
      if (!pinActive) return;
      var x = getPinX();
      track.style.transform = 'translateX(' + (-x) + 'px)';
      var span = slideSpan() || 1;
      setIndex(Math.round(x / span), true);
    }

    function go(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      if (pinActive) {
        var r = pinRange();
        var x = i * slideSpan();
        var t = r.extra ? x / r.extra : 0;
        window.scrollTo({ top: r.start + t * r.extra, behavior: motionOK ? 'smooth' : 'auto' });
      } else {
        var left = slides[i].offsetLeft;
        track.scrollTo({ left: left, behavior: motionOK ? 'smooth' : 'auto' });
      }
      setIndex(i);
    }

    function syncFromScroll() {
      if (pinActive) return;
      var span = slideSpan() || 1;
      setIndex(Math.round(track.scrollLeft / span), true);
    }

    function updatePinMode() {
      var want = canPin && mqDesk.matches && motionOK && !staticShots;
      if (want === pinActive) {
        if (pinActive) {
          // Keep spacer in sync with current card width
          var extra = maxScroll();
          pinWrap.style.height = (pinWrap.querySelector('.pin-stage').offsetHeight + extra) + 'px';
          applyPin();
        }
        return;
      }
      pinActive = want;
      if (want) {
        document.body.classList.add('pin-ok');
        pinWrap.style.height = (pinWrap.querySelector('.pin-stage').offsetHeight + maxScroll()) + 'px';
        track.style.transform = '';
        track.scrollLeft = 0;
        applyPin();
      } else {
        document.body.classList.remove('pin-ok');
        pinWrap.style.height = '';
        track.style.transform = '';
        go(index);
      }
    }

    root.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-dir]');
      if (!btn || !root.contains(btn)) return;
      go(index + (btn.getAttribute('data-dir') === 'next' ? 1 : -1));
      stopAuto();
    });

    track.addEventListener('scroll', function () { syncFromScroll(); }, { passive: true });

    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        go(index + (e.key === 'ArrowRight' ? 1 : -1));
        stopAuto();
      } else if (e.key === 'Home') { e.preventDefault(); go(0); }
      else if (e.key === 'End') { e.preventDefault(); go(slides.length - 1); }
    });

    function onPointerDown(e) {
      if (e.pointerType === 'touch' && !pinActive) return; // native swipe
      if (e.button && e.button !== 0) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startY = window.scrollY;
      startScroll = pinActive ? getPinX() : track.scrollLeft;
      try { track.setPointerCapture(e.pointerId); } catch (err) {}
      stopAuto();
    }
    function onPointerMove(e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      if (pinActive) {
        var r = pinRange();
        var x = startScroll - dx;
        if (x < 0) x = 0;
        if (x > r.extra) x = r.extra;
        window.scrollTo(0, r.start + x);
      } else {
        track.scrollLeft = startScroll - dx;
      }
    }
    function onPointerUp() {
      if (!dragging) return;
      dragging = false;
      if (!pinActive) {
        var span = slideSpan() || 1;
        go(Math.round(track.scrollLeft / span));
      }
    }
    track.addEventListener('pointerdown', onPointerDown);
    track.addEventListener('pointermove', onPointerMove);
    track.addEventListener('pointerup', onPointerUp);
    track.addEventListener('pointercancel', onPointerUp);
    track.addEventListener('click', function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);

    root.addEventListener('mouseenter', function () { hovered = true; });
    root.addEventListener('mouseleave', function () { hovered = false; });
    root.addEventListener('focusin', function () { hovered = true; });
    root.addEventListener('focusout', function () { hovered = false; });

    function tick() {
      if (hovered || document.hidden || !inView || !autoplay) return;
      go(index >= slides.length - 1 ? 0 : index + 1);
    }
    function startAuto() {
      if (!autoplay) return;
      stopAuto();
      auto = window.setInterval(tick, interval);
    }
    function stopAuto() {
      if (auto) { window.clearInterval(auto); auto = 0; }
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0] && entries[0].isIntersecting;
      }, { threshold: 0.2 }).observe(root);
    }

    if (canPin) {
      window.addEventListener('scroll', function () { if (pinActive) applyPin(); }, { passive: true });
    }
    window.addEventListener('resize', function () {
      updatePinMode();
      if (!pinActive) syncFromScroll();
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopAuto();
      else startAuto();
    });

    function reset() {
      stopAuto();
      if (pinActive) {
        var r = pinRange();
        window.scrollTo(0, r.start);
        applyPin();
      } else {
        track.scrollTo({ left: 0, behavior: 'auto' });
      }
      setIndex(0);
    }
    function freeze() { stopAuto(); }

    updatePinMode();
    setIndex(0);
    startAuto();

    sliders.push({ root: root, go: go, reset: reset, freeze: freeze, count: slides.length });
  }

  if (motionOK) {
    document.querySelectorAll('[data-slider]').forEach(enhanceSlider);
  } else {
    // Still paint theme, but leave carousels as grids; fill any visible totals just in case
    document.querySelectorAll('[data-slider]').forEach(function (root) {
      var track = root.querySelector('.carousel-track');
      var n = track ? track.children.length : 0;
      var tot = root.querySelector('.frac-total');
      if (tot && n) tot.textContent = pad2(n);
    });
  }

  window.DCGMotion = {
    reset: function () { sliders.forEach(function (s) { s.reset(); }); paintBg(); },
    freeze: function () { sliders.forEach(function (s) { s.freeze(); }); }
  };

  /* ---------- Marquee: pause on hover / focus (CSS does the scrolling) ---------- */
  document.querySelectorAll('.marquee').forEach(function (el) {
    var inner = el.querySelector('.mq-inner');
    if (!inner) return;
    el.addEventListener('mouseenter', function () { inner.style.animationPlayState = 'paused'; });
    el.addEventListener('mouseleave', function () { if (motionOK) inner.style.animationPlayState = ''; });
    el.addEventListener('focusin', function () { inner.style.animationPlayState = 'paused'; });
    el.addEventListener('focusout', function () { if (motionOK) inner.style.animationPlayState = ''; });
  });

  /* ---------- Hero line rotator ---------- */
  document.querySelectorAll('.rotator').forEach(function (el) {
    var words = el.querySelectorAll('.rw');
    if (words.length < 2 || !motionOK) return;
    var i = 0;
    el.setAttribute('aria-live', 'polite');
    window.setInterval(function () {
      words[i].classList.remove('on');
      i = (i + 1) % words.length;
      words[i].classList.add('on');
    }, 3200);
  });

  /* ---------- Count-up ---------- */
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (!target) return;
    if (!motionOK) { el.textContent = String(target); return; }
    var start = 0, t0 = null, dur = 1100;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(start + (target - start) * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var ioCount = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCount(en.target); ioCount.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('[data-count]').forEach(function (el) { ioCount.observe(el); });
  } else {
    document.querySelectorAll('[data-count]').forEach(animateCount);
  }

  /* ---------- Light parallax on desktop photographs ---------- */
  if (motionOK && window.matchMedia('(pointer:fine) and (min-width:901px)').matches && !staticShots) {
    var layers = document.querySelectorAll('.has-media .media img, .photo-full img, .svc-media img, .hero-card .photo img');
    if (layers.length) {
      var ticking = false;
      function shift() {
        ticking = false;
        var mid = window.innerHeight / 2;
        layers.forEach(function (img) {
          var r = img.getBoundingClientRect();
          if (r.bottom < 0 || r.top > window.innerHeight) return;
          var d = (r.top + r.height / 2 - mid) / window.innerHeight;
          img.style.transform = 'translate3d(0,' + (d * -16) + 'px,0) scale(1.06)';
        });
      }
      window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(shift); }
      }, { passive: true });
    }
  }

  /* ---------- Process: the sticky numeral already works in CSS.
      Nudge the visible number to the step nearest the pin. ---------- */
  var pin = document.querySelector('.process-pin');
  if (pin && motionOK) {
    var num = pin.querySelector('.process-num');
    var steps = pin.querySelectorAll('.step');
    if (num && steps.length && 'IntersectionObserver' in window) {
      var ioPin = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var i = Array.prototype.indexOf.call(steps, en.target);
          if (i >= 0) num.textContent = (i + 1 < 10 ? '0' : '') + (i + 1);
        });
      }, { rootMargin: '-30% 0px -50% 0px', threshold: 0.2 });
      steps.forEach(function (s) { ioPin.observe(s); });
    }
  }
})();
