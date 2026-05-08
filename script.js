'use strict';

/* Portfolio — script.js
   Frutiger Night (dark) · Frutiger Aero (light) */

// Tell the browser not to restore the previous scroll position on refresh.
// Without this, browsers memorise where you were and jump back there,
// which breaks the full-page scroll logic and skips the hero entirely.
history.scrollRestoration = 'manual';


// ── Full-page scroll (desktop only) ──

// On desktop, wheel / keyboard / swipe are intercepted and mapped to
// whole-section jumps. Mobile relies entirely on CSS scroll-snap instead.

function initFullPageScroll() {
  const sections = Array.from(document.querySelectorAll('section[id]'));
  if (!sections.length) return;

  // Re-evaluated on every resize so breakpoint changes take effect live.
  let isDesktop = window.innerWidth >= 1024;
  window.addEventListener('resize', () => {
    isDesktop = window.innerWidth >= 1024;
  }, { passive: true });

  let currentIndex  = 0;
  let scrollLocked  = false;
  const LOCK_MS     = 950; // long enough for the smooth-scroll to finish

  // Keep currentIndex in sync while the user scrolls freely
  // (e.g. after a keyboard jump or a programmatic scroll).
  function syncCurrentIndex() {
    const midpoint = window.scrollY + window.innerHeight * 0.45;
    sections.forEach((section, i) => {
      if (section.offsetTop <= midpoint) currentIndex = i;
    });
  }
  window.addEventListener('scroll', syncCurrentIndex, { passive: true });

  // Scroll to a section by index and lock input briefly so rapid events
  // don't chain multiple jumps before the first one finishes.
  function scrollToSection(index) {
    if (scrollLocked || index < 0 || index >= sections.length) return;

    scrollLocked = true;
    currentIndex = index;
    sections[index].scrollIntoView({ behavior: 'smooth', block: 'start' });

    setTimeout(() => { scrollLocked = false; }, LOCK_MS);
  }

  // Wheel — passive:false is required so we can call preventDefault
  // and prevent the browser from also doing its native scroll.
  window.addEventListener('wheel', e => {
    if (!isDesktop) return;

    // Let scrollable inner containers (e.g. a long card) scroll normally.
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

    // Don't hijack keys while the user is typing in a form field.
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

    e.preventDefault();
    scrollToSection(currentIndex + directionByKey[e.key]);
  });

  // Touch — treat a vertical swipe > 50px as a section jump
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


// ── Theme toggle ──

// The button always shows the opposite icon to the current theme,
// so clicking it feels like "switch to this" rather than "toggle".
// Priority order: saved preference → system preference → light.

function initTheme() {
  const html       = document.documentElement;
  const toggleBtn  = document.getElementById('theme-toggle');
  const toggleIcon = document.getElementById('theme-icon');

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('portfolio-theme', theme);

    if (toggleIcon) {
      toggleIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  }

  toggleBtn?.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  applyTheme(localStorage.getItem('portfolio-theme') || systemPreference);
}


// ── Navbar scroll style ──

// The navbar starts invisible and fades in once the user scrolls past the
// hero, so it doesn't compete with the hero content on first load.

function initNavbar() {
  const navbar = document.getElementById('navigation-bar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 55);
  }, { passive: true });
}


// ── Active navigation link ──

// Watches the scroll position and marks the matching nav link as active.
// On desktop, the About section is a sticky sidebar (always visible),
// so we map it back to "hero" to avoid a permanently highlighted About link.

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

// A shared factory that powers the morphing highlight bubble on both the
// desktop text nav and the mobile icon nav. The bubble slides directly to
// its target with a spring easing — no bouncing through intermediate items.
//
// Click-locking: when a link is clicked we immediately move the bubble to
// the destination and hold it there. Without this lock, the MutationObserver
// would nudge the bubble through every section the page scrolls past on the
// way to the target (e.g. Skills → Contact would briefly highlight Projects
// and Experience). The lock is released when the page arrives at the target
// section, or after a 1-second safety timeout.

function createNavBubble({ containerEl, indicatorEl, links, getMetrics, initialDelayMs = 100 }) {
  if (!containerEl || !indicatorEl || !links.length) return;

  let currentLink = null;

  // Instantly place the bubble without any transition (used on first load).
  function snapTo(link) {
    const { left, width } = getMetrics(link);

    indicatorEl.style.transition = 'none';
    indicatorEl.style.left       = left  + 'px';
    indicatorEl.style.width      = width + 'px';
    indicatorEl.style.opacity    = '1';

    currentLink = link;
  }

  // Animate the bubble to a new link with a spring slide.
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

  // Click lock state
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

  // Watch for active-class changes driven by scroll position.
  const observer = new MutationObserver(() => {
    const active = links.find(l => l.classList.contains('active'));
    if (!active || active === currentLink) return;

    if (clickedLink) {
      if (active === clickedLink) {
        // We've arrived — release the click lock.
        clickedLink = null;
        clearTimeout(clickTimeout);
      } else {
        // Still scrolling toward the destination — ignore intermediate sections.
        return;
      }
    }

    morphTo(active);
  });

  links.forEach(link => {
    observer.observe(link, { attributes: true, attributeFilter: ['class'] });
  });

  // Place the bubble after the layout has settled.
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


// ── Interactions ──

// Ripple effect on nav links and buttons, bounce animation on project cards.

function initInteractions() {
  const rippleTargets = document.querySelectorAll(
    '.navigation-link, .glossy-button-primary, .glossy-button-secondary, .navigation-logo'
  );

  rippleTargets.forEach(el => {
    el.addEventListener('click', function (e) {
      const rect   = this.getBoundingClientRect();
      const size   = Math.max(rect.width, rect.height) * 1.6;

      const ripple = document.createElement('span');
      ripple.className = 'ripple-element';
      ripple.style.cssText = [
        `width:  ${size}px`,
        `height: ${size}px`,
        `left:   ${e.clientX - rect.left - size / 2}px`,
        `top:    ${e.clientY - rect.top  - size / 2}px`,
      ].join('; ');

      this.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });

  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', function (e) {
      // Don't trigger the bounce if the user clicked a link inside the card.
      if (e.target.closest('.project-link')) return;

      this.style.transition = 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)';
      this.style.transform  = 'translateY(-10px) scale(1.015)';

      setTimeout(() => {
        this.style.transform  = '';
        this.style.transition = '';
      }, 220);
    });
  });
}


// ── Contact form ──

// shuffleBag returns an object that draws items in a shuffled order.
// Once the deck runs out it reshuffles and deals again, but guarantees
// the first item of the new deck is never the same as the last item shown —
// so it always feels random without ever immediately repeating.

function shuffleBag(items) {
  let deck = [];
  let lastDrawn = null;

  function refill() {
    deck = [...items].sort(() => Math.random() - 0.5);

    // Swap the first item if it matches the last one we showed.
    if (deck.length > 1 && deck[0] === lastDrawn) {
      const swapIndex = Math.floor(Math.random() * (deck.length - 1)) + 1;
      [deck[0], deck[swapIndex]] = [deck[swapIndex], deck[0]];
    }
  }

  return {
    next() {
      if (!deck.length) refill();
      lastDrawn = deck.pop();
      return lastDrawn;
    },
  };
}

function initContactForm() {
  const form      = document.getElementById('contact-form');
  const submitBtn = document.getElementById('submit-button');
  if (!form) return;

  emailjs.init('1I46WcUrJKRv9YRh_');

  // Each field has its own shuffle bag of fun error messages.
  const fields = [
    {
      input: document.getElementById('field-name'),
      bag: shuffleBag([
        "Can I at least get your name?",
        "Don't be shy, what's your name?",
        "A name would be nice!",
        "Who goes there?",
      ]),
    },
    {
      input: document.getElementById('field-email'),
      bag: shuffleBag([
        "Would love to get back to you!",
        "How do I reach you?",
        "Leave me a way to reply!",
        "An email would help a lot!",
      ]),
    },
    {
      input: document.getElementById('field-message'),
      bag: shuffleBag([
        "How may I help?",
        "Tell me all about your ideas!",
        "Share your secrets with me!",
        "What's on your mind?",
        "Say something, anything!",
      ]),
    },
  ];

  // Shakes the field, swaps the placeholder to a fun message for 2 seconds,
  // then restores the original text. The red border stays until the user types.
  function flashFieldError(field) {
    const input = field.input;
    if (!input || input._flashing) return;

    const originalPlaceholder = input.placeholder;
    const savedValue          = input.value;

    input._flashing   = true;
    input.value       = '';
    input.placeholder = field.bag.next();
    input.classList.add('form-input-flash');

    setTimeout(() => {
      input.value       = savedValue;
      input.placeholder = originalPlaceholder;
      input.classList.remove('form-input-flash');
      input.classList.add('form-input-error');
      input._flashing   = false;
    }, 2000);
  }

  // Clear error styling as soon as the user starts correcting a field.
  fields.forEach(({ input }) => {
    input?.addEventListener('input', () => {
      input.classList.remove('form-input-flash', 'form-input-error');
    });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();

    const [name, email, message] = fields;

    const nameValid    = name.input?.value.trim().length > 0;
    const emailValid   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.input?.value.trim() ?? '');
    const messageValid = message.input?.value.trim().length > 0;

    let hasErrors = false;
    if (!nameValid)    { flashFieldError(name);    hasErrors = true; }
    if (!emailValid)   { flashFieldError(email);   hasErrors = true; }
    if (!messageValid) { flashFieldError(message); hasErrors = true; }
    if (hasErrors) return;

    // Show a loading state while the request is in flight.
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';
    submitBtn.disabled  = true;

    emailjs.sendForm('service_a8frj6a', 'template_2ptfw3a', form)
      .then(() => {
        // Hide the form fields and show a success message for 5 seconds,
        // then restore everything so the user could send another message.
        const formElements = form.querySelectorAll('.form-group, button[type="submit"]');
        formElements.forEach(el => { el.style.display = 'none'; });

        const successMsg = document.createElement('div');
        successMsg.className = 'form-success';
        successMsg.innerHTML = '<i class="fas fa-check-circle"></i> Message sent! I\'ll get back to you soon.';
        form.appendChild(successMsg);

        setTimeout(() => {
          successMsg.remove();
          formElements.forEach(el => { el.style.display = ''; });
          form.reset();
          submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
          submitBtn.disabled  = false;
        }, 5000);
      })
      .catch(() => {
        // Re-enable the button and show a temporary error notice.
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
        submitBtn.disabled  = false;

        const errorMsg = document.createElement('p');
        errorMsg.className   = 'form-send-error';
        errorMsg.textContent = 'Something went wrong — please try again.';
        form.appendChild(errorMsg);

        setTimeout(() => errorMsg.remove(), 4000);
      });
  });
}


// ── Anchor scroll ──

// A single delegated listener handles every internal anchor on the page.
// Calling preventDefault() prevents the browser from appending a hash to
// the URL, so the address bar stays clean no matter which section is active.

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


// ── Startup ──

document.addEventListener('DOMContentLoaded', () => {
  // Snap to the very top before anything else renders, so the hero is always
  // the first thing the user sees — even if the browser tried to scroll down.
  window.scrollTo({ top: 0, behavior: 'instant' });

  initTheme();
  initNavbar();
  initActiveNav();
  initNavBubble();
  initMobileNavBubble();
  initFullPageScroll();
  initInteractions();
  initContactForm();
  initAnchorScroll();
});
