'use strict';

// The button shows the opposite icon to the current theme so clicking it
// feels like "switch to this" rather than "toggle".
// Priority: saved preference → system preference → light.

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
