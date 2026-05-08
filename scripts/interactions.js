'use strict';

// Ripple effect on nav links and buttons; bounce animation on project cards.

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
