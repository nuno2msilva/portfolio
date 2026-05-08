'use strict';

// Tell the browser not to restore the previous scroll position on refresh.
// Without this, browsers memorise where you were and jump back there,
// which breaks the full-page scroll logic and skips the hero entirely.
history.scrollRestoration = 'manual';

document.addEventListener('DOMContentLoaded', () => {
  // Snap to the very top before anything renders so the hero is always first.
  window.scrollTo({ top: 0, behavior: 'instant' });

  initTheme();
  initNavbar();
  initFooter();
  initActiveNav();
  initNavBubble();
  initMobileNavBubble();
  initFullPageScroll();
  initMobileSwipe();
  initInteractions();
  initContactForm();
  initAnchorScroll();
});
