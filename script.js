'use strict';

/* ══════════════════════════════════════════════
   Portfolio — main.js
   ══════════════════════════════════════════════ */

// ── Full-page section scroll ─────────────────────────
// Desktop only — mobile uses CSS scroll-snap with no JS interception.
function initFullPageScroll() {
  const sections = Array.from(document.querySelectorAll('section[id]'));
  if (!sections.length) return;

  let isDesktop = window.innerWidth >= 1024;
  window.addEventListener('resize', () => { isDesktop = window.innerWidth >= 1024; }, { passive: true });

  let currentIndex = 0;
  let scrollLocked = false;
  const LOCK_DURATION_MS = 950;

  function syncCurrentIndex() {
    const midpoint = window.scrollY + window.innerHeight * 0.45;
    sections.forEach((section, i) => {
      if (section.offsetTop <= midpoint) currentIndex = i;
    });
  }
  window.addEventListener('scroll', syncCurrentIndex, { passive: true });

  function scrollToSection(index) {
    if (scrollLocked || index < 0 || index >= sections.length) return;
    scrollLocked  = true;
    currentIndex  = index;
    sections[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => { scrollLocked = false; }, LOCK_DURATION_MS);
  }

  // passive:false is required to call preventDefault and block native scroll
  window.addEventListener('wheel', e => {
    if (!isDesktop) return;

    // Allow scrolling inside overflow containers (e.g. a scrollable card)
    let el = e.target;
    while (el && el !== document.documentElement) {
      const overflow = window.getComputedStyle(el).overflowY;
      if ((overflow === 'auto' || overflow === 'scroll') && el.scrollHeight > el.clientHeight) return;
      el = el.parentElement;
    }

    e.preventDefault();
    if (!scrollLocked) scrollToSection(currentIndex + (e.deltaY > 0 ? 1 : -1));
  }, { passive: false });

  document.addEventListener('keydown', e => {
    if (!isDesktop) return;
    const directionByKey = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1 };
    if (directionByKey[e.key] === undefined) return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
    e.preventDefault();
    scrollToSection(currentIndex + directionByKey[e.key]);
  });

  let touchStartY = 0;
  window.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchend', e => {
    if (!isDesktop) return;
    const swipeDelta = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(swipeDelta) > 50) scrollToSection(currentIndex + (swipeDelta > 0 ? 1 : -1));
  }, { passive: true });
}

// ── Theme toggle ─────────────────────────────────────
/*
   Single icon-button: sun icon = "switch to light", moon icon = "switch to dark".
   Icon always shows the opposite of the current theme.
*/
function initTheme() {
  const html       = document.documentElement;
  const toggleBtn  = document.getElementById('theme-toggle');
  const toggleIcon = document.getElementById('theme-icon');

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('portfolio-theme', theme);
    if (toggleIcon) toggleIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }

  toggleBtn?.addEventListener('click', () => {
    applyTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  // localStorage takes priority over any default set in HTML
  applyTheme(localStorage.getItem('portfolio-theme') || 'dark');
}

// ── Navbar scroll style ──────────────────────────────
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 55);
  }, { passive: true });
}

// ── Active nav-link indicator ────────────────────────
function initActiveNav() {
  const navLinks    = document.querySelectorAll('.nav-link[data-section], .mobile-nav-icon[data-section]');
  const scrollables = Array.from(document.querySelectorAll('section[id], aside#about'));

  function updateActiveLink() {
    let activeId = scrollables[0]?.id ?? '';
    scrollables.forEach(section => {
      if (window.scrollY >= section.offsetTop - 130) activeId = section.id;
    });
    // About is desktop-only — never highlight it in any nav
    if (activeId === 'about') activeId = 'hero';
    navLinks.forEach(link => link.classList.toggle('active', link.dataset.section === activeId));
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  window.addEventListener('resize', updateActiveLink, { passive: true });
  updateActiveLink();
}

// ── Nav bubble (shared factory) ──────────────────────
/*
   Two-phase morphing animation:
   Phase 1 — bubble stretches toward target (ease-out, ~140 ms).
   Phase 2 — bubble snaps to final size/position (spring cubic-bezier, ~260 ms).

   Used by both the desktop text nav and the mobile icon nav.
*/
function createNavBubble({ containerEl, indicatorEl, links, getMetrics, initialDelayMs = 100 }) {
  if (!containerEl || !indicatorEl || !links.length) return;

  let currentLink = null;

  function snapTo(link) {
    const { left, width } = getMetrics(link);
    indicatorEl.style.transition = 'none';
    indicatorEl.style.left       = left  + 'px';
    indicatorEl.style.width      = width + 'px';
    indicatorEl.style.opacity    = '1';
    currentLink = link;
  }

  function morphTo(link) {
    if (!link || link === currentLink) return;
    if (!currentLink) { snapTo(link); return; }

    const to = getMetrics(link);
    currentLink = link;

    // Direct spring slide — no intermediate stretch over other nav items
    indicatorEl.style.transition =
      'left 0.30s cubic-bezier(0.34,1.56,0.64,1), width 0.22s cubic-bezier(0.34,1.56,0.64,1)';
    indicatorEl.style.left  = to.left  + 'px';
    indicatorEl.style.width = to.width + 'px';
  }

  // Move bubble immediately on click — in sync with the scroll animation
  links.forEach(link => link.addEventListener('click', () => morphTo(link)));

  // Also follow active section changes driven by scroll (catches keyboard nav, etc.)
  const observer = new MutationObserver(() => {
    const active = links.find(l => l.classList.contains('active'));
    if (active && active !== currentLink) morphTo(active);
  });
  links.forEach(link => observer.observe(link, { attributes: true, attributeFilter: ['class'] }));

  // Initial placement after layout settles
  setTimeout(() => {
    const active = links.find(l => l.classList.contains('active')) || links[0];
    snapTo(active);
  }, initialDelayMs);
}

function initNavBubble() {
  const containerEl = document.getElementById('nav-links-container');
  const indicatorEl = document.getElementById('nav-indicator');
  const links       = Array.from(document.querySelectorAll('.nav-link[data-section]'));

  createNavBubble({
    containerEl,
    indicatorEl,
    links,
    initialDelayMs: 100,
    getMetrics(link) {
      const containerRect = containerEl.getBoundingClientRect();
      const linkRect      = link.getBoundingClientRect();
      return { left: linkRect.left - containerRect.left, width: linkRect.width };
    },
  });
}

function initMobileNavBubble() {
  const containerEl = document.querySelector('.mobile-nav-icons');
  const indicatorEl = document.getElementById('mobile-nav-indicator');
  const links       = Array.from(document.querySelectorAll('.mobile-nav-icon[data-section]'));

  createNavBubble({
    containerEl,
    indicatorEl,
    links,
    initialDelayMs: 150,
    getMetrics(link) {
      const containerRect = containerEl.getBoundingClientRect();
      const linkRect      = link.getBoundingClientRect();
      return { left: linkRect.left - containerRect.left, width: link.offsetWidth };
    },
  });
}

// ── Interaction animations ───────────────────────────
function initInteractions() {
  const rippleTargets = document.querySelectorAll(
    '.nav-link, .glossy-btn-primary, .glossy-btn-secondary, .nav-logo'
  );

  rippleTargets.forEach(el => {
    el.addEventListener('click', function (e) {
      const rect   = this.getBoundingClientRect();
      const size   = Math.max(rect.width, rect.height) * 1.6;
      const ripple = document.createElement('span');
      ripple.className  = 'ripple-element';
      ripple.style.cssText =
        `width:${size}px; height:${size}px;` +
        `left:${e.clientX - rect.left - size / 2}px;` +
        `top:${e.clientY - rect.top  - size / 2}px;`;
      this.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });

  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', function (e) {
      if (e.target.closest('.project-link')) return;
      this.style.transition = 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1)';
      this.style.transform  = 'translateY(-10px) scale(1.015)';
      setTimeout(() => { this.style.transform = ''; this.style.transition = ''; }, 220);
    });
  });
}

// ── Contact form ─────────────────────────────────────
function initContactForm() {
  const form       = document.getElementById('contact-form');
  const submitBtn  = document.getElementById('submit-btn');
  const successBox = document.getElementById('form-success');
  if (!form) return;

  // Cache elements once — used for both validation and input listeners
  const fields = [
    { input: document.getElementById('f-name'),    error: document.getElementById('err-name') },
    { input: document.getElementById('f-email'),   error: document.getElementById('err-email') },
    { input: document.getElementById('f-message'), error: document.getElementById('err-message') },
  ];

  function setFieldError(field, hasError) {
    if (field.input) field.input.style.borderColor = hasError ? 'rgba(248,113,113,0.70)' : '';
    if (field.error) field.error.classList.toggle('visible', hasError);
  }

  form.addEventListener('submit', e => {
    e.preventDefault();

    const [name, email, message] = fields;
    const nameValid    = name.input?.value.trim().length > 0;
    const emailValid   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.input?.value.trim() ?? '');
    const messageValid = message.input?.value.trim().length > 0;

    setFieldError(name,    !nameValid);
    setFieldError(email,   !emailValid);
    setFieldError(message, !messageValid);
    if (!nameValid || !emailValid || !messageValid) return;

    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sending…';
      submitBtn.disabled  = true;
    }

    setTimeout(() => {
      form.querySelectorAll('.form-group, button[type="submit"]').forEach(el => {
        el.style.display = 'none';
      });
      successBox?.classList.remove('hidden');
    }, 1400);
  });

  fields.forEach(field => {
    field.input?.addEventListener('input', () => setFieldError(field, false));
  });
}

// ── Init ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavbar();
  initActiveNav();
  initNavBubble();
  initMobileNavBubble();
  initFullPageScroll();
  initInteractions();
  initContactForm();
});
