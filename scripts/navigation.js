'use strict';

// ── Navbar scroll style ──
// Fades in once the user scrolls past the hero so it doesn't compete with
// the hero content on first load.

function initNavbar() {
  const navbar = document.getElementById('navigation-bar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 55);
  }, { passive: true });
}


// ── Footer visibility ──
// Desktop: footer is a fixed glass bar — appears once past the hero.
// Mobile:  footer is also fixed but transparent — appears when the contact
//          section is in view so no extra scroll is needed to see it.

function initFooter() {
  const footer  = document.querySelector('.site-footer');
  const hero    = document.getElementById('hero');
  const contact = document.getElementById('contact');
  if (!footer || !hero) return;

  function update() {
    const isMobile = window.innerWidth < 1024;
    let shouldShow;

    if (isMobile && contact) {
      shouldShow = window.scrollY >= contact.offsetTop - window.innerHeight * 0.5;
    } else {
      shouldShow = window.scrollY > hero.offsetTop + hero.offsetHeight * 0.5;
    }

    footer.classList.toggle('visible', shouldShow);
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
}


// ── Active navigation link ──
// Marks the matching nav link active based on scroll position.
// On desktop, About is a sticky sidebar so we map it back to "hero".

function initActiveNav() {
  const navLinks    = document.querySelectorAll('.navigation-link[data-section], .mobile-navigation-icon[data-section]');
  const scrollables = Array.from(document.querySelectorAll('section[id], aside#about'));

  function updateActiveLink() {
    let activeId = scrollables[0]?.id ?? '';

    scrollables.forEach(section => {
      if (window.scrollY >= section.offsetTop - 130) activeId = section.id;
    });

    if (activeId === 'about' && window.innerWidth >= 1024) activeId = 'hero';

    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.section === activeId);
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  window.addEventListener('resize', updateActiveLink, { passive: true });
  updateActiveLink();
}


// ── Navigation bubble ──
// Shared factory for the morphing highlight bubble on both desktop text nav
// and mobile icon nav. The bubble slides to its target with a spring easing.
//
// Click-locking: when a link is clicked we move the bubble immediately and
// hold it there, ignoring intermediate sections during the scroll animation.
// The lock releases once the page arrives, or after a 1s safety timeout.

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

    const { left, width } = getMetrics(link);
    currentLink = link;

    indicatorEl.style.transition = [
      'left 0.30s cubic-bezier(0.34, 1.56, 0.64, 1)',
      'width 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
    ].join(', ');

    indicatorEl.style.left  = left  + 'px';
    indicatorEl.style.width = width + 'px';
  }

  let clickedLink  = null;
  let clickTimeout = null;

  links.forEach(link => {
    link.addEventListener('click', () => {
      clickedLink = link;
      morphTo(link);

      clearTimeout(clickTimeout);
      clickTimeout = setTimeout(() => { clickedLink = null; }, 1000);
    });
  });

  const observer = new MutationObserver(() => {
    const active = links.find(l => l.classList.contains('active'));
    if (!active || active === currentLink) return;

    if (clickedLink) {
      if (active === clickedLink) {
        clickedLink = null;
        clearTimeout(clickTimeout);
      } else {
        return;
      }
    }

    morphTo(active);
  });

  links.forEach(link => {
    observer.observe(link, { attributes: true, attributeFilter: ['class'] });
  });

  setTimeout(() => {
    const active = links.find(l => l.classList.contains('active')) || links[0];
    snapTo(active);
  }, initialDelayMs);
}

function initNavBubble() {
  const containerEl = document.getElementById('navigation-links-container');
  const indicatorEl = document.getElementById('navigation-indicator');
  const links       = Array.from(document.querySelectorAll('.navigation-link[data-section]'));

  createNavBubble({
    containerEl,
    indicatorEl,
    links,
    initialDelayMs: 100,
    getMetrics(link) {
      const containerRect = containerEl.getBoundingClientRect();
      const linkRect      = link.getBoundingClientRect();
      return {
        left:  linkRect.left - containerRect.left,
        width: linkRect.width,
      };
    },
  });
}

function initMobileNavBubble() {
  const containerEl = document.querySelector('.mobile-navigation-icons');
  const indicatorEl = document.getElementById('mobile-navigation-indicator');
  const links       = Array.from(document.querySelectorAll('.mobile-navigation-icon[data-section]'));

  createNavBubble({
    containerEl,
    indicatorEl,
    links,
    initialDelayMs: 150,
    getMetrics(link) {
      const containerRect = containerEl.getBoundingClientRect();
      const linkRect      = link.getBoundingClientRect();
      return {
        left:  linkRect.left - containerRect.left,
        width: link.offsetWidth,
      };
    },
  });
}
