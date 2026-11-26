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
        status.textContent = 'Preview only: this form is not connected yet, so nothing was sent. Please call (858) 395-3287 or email contact@dattaconsultinggroup.com.';
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

/* ================= Sliders, marquee, rotator, count-up ================= */
(function () {
  'use strict';
  var motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var staticShots = !!window.DCG_STATIC_SHOTS;

  /* ---------- Peeking sliders: click, drag, swipe; gentle hero autoplay ---------- */
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
    var startX = 0, startScroll = 0;
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
      return Math.max(0, track.scrollWidth - track.clientWidth);
    }

    function setIndex(i) {
      index = Math.max(0, Math.min(slides.length - 1, i));
      if (fracCur) fracCur.textContent = pad2(index + 1);
      var max = maxScroll();
      var progress = max ? track.scrollLeft / max : (index / (slides.length - 1));
      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;
      if (bar) bar.style.transform = 'scaleX(' + (progress || (index + 1) / slides.length) + ')';
    }

    function go(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      var left = slides[i].offsetLeft;
      track.scrollTo({ left: left, behavior: motionOK ? 'smooth' : 'auto' });
      setIndex(i);
    }

    function syncFromScroll() {
      var span = slideSpan() || 1;
      setIndex(Math.round(track.scrollLeft / span));
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
      if (e.pointerType === 'touch') return; // native swipe
      if (e.button && e.button !== 0) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startScroll = track.scrollLeft;
      try { track.setPointerCapture(e.pointerId); } catch (err) {}
      stopAuto();
    }
    function onPointerMove(e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = startScroll - dx;
    }
    function onPointerUp() {
      if (!dragging) return;
      dragging = false;
      var span = slideSpan() || 1;
      go(Math.round(track.scrollLeft / span));
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

    window.addEventListener('resize', syncFromScroll);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopAuto();
      else startAuto();
    });

    function reset() {
      stopAuto();
      track.scrollTo({ left: 0, behavior: 'auto' });
      setIndex(0);
    }
    function freeze() { stopAuto(); }

    setIndex(0);
    startAuto();
    sliders.push({ root: root, go: go, reset: reset, freeze: freeze, count: slides.length });
  }

  if (motionOK) {
    document.querySelectorAll('[data-slider]').forEach(enhanceSlider);
  } else {
    document.querySelectorAll('[data-slider]').forEach(function (root) {
      var track = root.querySelector('.carousel-track');
      var n = track ? track.children.length : 0;
      var tot = root.querySelector('.frac-total');
      if (tot && n) tot.textContent = pad2(n);
    });
  }

  window.DCGMotion = {
    reset: function () { sliders.forEach(function (s) { s.reset(); }); },
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
})();
