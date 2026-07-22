/* Novaturient Advisory — interactions
   Scroll reveals, counters, header state, mobile menu, quotes, form. */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- page load intro ---------- */
  function markLoaded() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.body.classList.add('loaded');
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', markLoaded);
  } else {
    markLoaded();
  }

  /* ---------- header state ---------- */
  var header = document.getElementById('siteHeader');
  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 30);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('mobileMenu');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', String(!open));
  }
  toggle.addEventListener('click', function () {
    setMenu(!document.body.classList.contains('menu-open'));
  });
  menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false);
  });

  /* ---------- scroll reveals (staggered per viewport batch) ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if ('IntersectionObserver' in window && !prefersReduced) {
    var io = new IntersectionObserver(function (entries) {
      var delay = 0;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.style.setProperty('--rd', delay + 'ms');
        entry.target.classList.add('revealed');
        io.unobserve(entry.target);
        delay += 90;
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('revealed'); });
  }

  /* ---------- animated counters ---------- */
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  if (prefersReduced) {
    counters.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
    counters = [];
  }
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var duration = 1500;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 4); /* easeOutQuart */
      el.textContent = Math.round(eased * target);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        cio.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
  }

  /* ---------- testimonial rotator ---------- */
  var rotator = document.getElementById('quoteRotator');
  if (rotator) {
    var quotes = rotator.querySelectorAll('.quote');
    var dots = rotator.querySelectorAll('.quote-dots button');
    var current = 0;
    var timer = null;

    function show(i) {
      quotes[current].classList.remove('is-active');
      dots[current].classList.remove('is-active');
      dots[current].setAttribute('aria-selected', 'false');
      current = i;
      quotes[current].classList.add('is-active');
      dots[current].classList.add('is-active');
      dots[current].setAttribute('aria-selected', 'true');
    }
    function next() { show((current + 1) % quotes.length); }
    function play() {
      if (prefersReduced) return;
      stop();
      timer = window.setInterval(next, 6500);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () { show(i); play(); });
    });
    rotator.addEventListener('mouseenter', stop);
    rotator.addEventListener('mouseleave', play);
    play();
  }

  /* ---------- contact form (no backend yet: builds an email draft) ---------- */
  var form = document.getElementById('contactForm');
  if (form) {
    var status = document.getElementById('formStatus');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var invalid = false;
      ['f-name', 'f-email', 'f-message'].forEach(function (id) {
        var field = document.getElementById(id);
        var bad = !field.value.trim() ||
          (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value));
        field.classList.toggle('invalid', bad);
        if (bad) invalid = true;
      });
      if (invalid) {
        status.textContent = 'Please complete the highlighted fields.';
        status.classList.add('visible', 'error');
        return;
      }
      var name = document.getElementById('f-name').value.trim();
      var email = document.getElementById('f-email').value.trim();
      var company = document.getElementById('f-company').value.trim();
      var topic = document.getElementById('f-topic').value;
      var message = document.getElementById('f-message').value.trim();

      var subject = encodeURIComponent('Enquiry — ' + topic);
      var body = encodeURIComponent(
        message + '\n\n—\n' + name + (company ? '\n' + company : '') + '\n' + email
      );
      window.location.href = 'mailto:hello@novaturientadvisory.com?subject=' + subject + '&body=' + body;

      status.classList.remove('error');
      status.textContent = 'Thank you — your email draft is ready to send. We respond within two business days.';
      status.classList.add('visible');
      form.reset();
    });
    ['f-name', 'f-email', 'f-message'].forEach(function (id) {
      document.getElementById(id).addEventListener('input', function () {
        this.classList.remove('invalid');
      });
    });
  }

  /* ---------- footer helpers ---------- */
  var toTop = document.getElementById('toTop');
  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  }
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
