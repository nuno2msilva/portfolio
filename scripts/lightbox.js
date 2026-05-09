'use strict';

function initLightbox() {
  const overlay   = document.getElementById('lightbox');
  const img       = document.getElementById('lightbox-img');
  const closeBtn  = document.getElementById('lightbox-close');
  if (!overlay || !img) return;

  function open(src) {
    img.src = src;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.project-banner[data-image]').forEach(banner => {
    banner.addEventListener('click', () => open(banner.dataset.image));
  });

  closeBtn.addEventListener('click', close);

  overlay.addEventListener('click', e => {
    if (e.target === overlay || e.target === img) close();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) close();
  });
}
