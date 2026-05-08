'use strict';

// ── Full-page scroll (desktop only) ──
// Wheel, keyboard, and swipe are intercepted and mapped to whole-section
// jumps. Mobile relies entirely on CSS scroll-snap instead.

function initFullPageScroll() {
  const sections = Array.from(document.querySelectorAll('section[id]'));
  if (!sections.length) return;

  let isDesktop = window.innerWidth >= 1024;
  window.addEventListener('resize', () => {
    isDesktop = window.innerWidth >= 1024;
  }, { passive: true });

  let currentIndex = 0;
  let scrollLocked = false;
  const LOCK_MS    = 950;

  function syncCurrentIndex() {
    const midpoint = window.scrollY + window.innerHeight * 0.45;
    sections.forEach((section, i) => {
      if (section.offsetTop <= midpoint) currentIndex = i;
    });
  }
  window.addEventListener('scroll', syncCurrentIndex, { passive: true });

  function scrollToSection(index) {
    if (scrollLocked || index < 0 || index >= sections.length) return;

    scrollLocked = true;
    currentIndex = index;
    sections[index].scrollIntoView({ behavior: 'smooth', block: 'start' });

    setTimeout(() => { scrollLocked = false; }, LOCK_MS);
  }

  // Wheel — passive:false required so we can call preventDefault
  window.addEventListener('wheel', e => {
    if (!isDesktop) return;

    let el = e.target;
    while (el && el !== document.documentElement) {
      const overflow = window.getComputedStyle(el).overflowY;
      if ((overflow === 'auto' || overflow === 'scroll') && el.scrollHeight > el.clientHeight) return;
      el = el.parentElement;
    }

    e.preventDefault();
    scrollToSection(currentIndex + (e.deltaY > 0 ? 1 : -1));
  }, { passive: false });

  // Keyboard — arrow and page keys
  document.addEventListener('keydown', e => {
    if (!isDesktop) return;

    const directionByKey = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1 };
    if (directionByKey[e.key] === undefined) return;

    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

    e.preventDefault();
    scrollToSection(currentIndex + directionByKey[e.key]);
  });

  // Touch — vertical swipe > 50px triggers a section jump
  let touchStartY = 0;

  window.addEventListener('touchstart', e => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchend', e => {
    if (!isDesktop) return;
    const delta = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(delta) > 50) scrollToSection(currentIndex + (delta > 0 ? 1 : -1));
  }, { passive: true });
}


// ── Mobile deliberate swipe ──
// CSS scroll-snap handles mobile, but on sections with clipped overflow the
// browser's snap detection can lag. This touch handler navigates explicitly
// to the adjacent section on any swipe > 50px, bypassing that ambiguity.

function initMobileSwipe() {
  const sections = Array.from(document.querySelectorAll('.page-section'));
  if (!sections.length) return;

  let startY = 0;

  function nearestIndex() {
    const mid = window.scrollY + window.innerHeight * 0.45;
    let idx = 0;
    sections.forEach((s, i) => { if (s.offsetTop <= mid) idx = i; });
    return idx;
  }

  window.addEventListener('touchstart', e => {
    startY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchend', e => {
    if (window.innerWidth >= 1024) return;

    const delta = startY - e.changedTouches[0].clientY;
    if (Math.abs(delta) < 50) return;

    const target = nearestIndex() + (delta > 0 ? 1 : -1);
    if (target >= 0 && target < sections.length) {
      sections[target].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, { passive: true });
}


// ── Anchor scroll ──
// Delegated listener handles every internal anchor. preventDefault keeps
// the address bar clean regardless of which section is active.

function initAnchorScroll() {
  document.addEventListener('click', e => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;

    e.preventDefault();

    const href   = anchor.getAttribute('href');
    const target = href && href !== '#' ? document.querySelector(href) : null;

    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
}
