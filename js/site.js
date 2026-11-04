/* Zajedničko za obje stranice: galerija, broj u korpi i godina u podnožju. */
(function () {
  'use strict';

  const { products, whatsapp } = window.FARMA;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  /* ---------- Zaglavlje dobija pozadinu tek na skrolu ---------- */

  const top = $('.top');
  const markScrolled = () => top.classList.toggle('is-scrolled', window.scrollY > 10);
  markScrolled();
  window.addEventListener('scroll', markScrolled, { passive: true });

  /* ---------- Dijalozi se zatvaraju blagim nestajanjem, i na Escape ---------- */

  function closeDialog(dialog) {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    dialog.classList.add('is-closing');
    window.setTimeout(() => {
      dialog.classList.remove('is-closing');
      dialog.close();
    }, 180);
  }

  $$('dialog').forEach((dialog) => {
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      closeDialog(dialog);
    });
  });

  window.FarmaUI = { closeDialog };

  /* ---------- Galerija ---------- */

  const lightbox = $('#lightbox');
  if (lightbox) {
    const image = $('[data-lb-img]', lightbox);
    const caption = $('[data-lb-caption]', lightbox);
    const items = $$('[data-gallery] .g-item');
    let current = 0;

    // Svaka nova fotografija se blago pojavi, umjesto da naglo zamijeni prethodnu.
    image.addEventListener('load', () => {
      image.classList.remove('is-in');
      void image.offsetWidth;
      image.classList.add('is-in');
    });

    const show = (index) => {
      current = (index + items.length) % items.length;
      image.src = items[current].dataset.full;
      image.alt = $('img', items[current]).alt;
      caption.textContent = items[current].dataset.caption;
    };

    items.forEach((item, index) => {
      item.addEventListener('click', () => {
        show(index);
        lightbox.showModal();
      });
    });

    $('[data-lb-close]', lightbox).addEventListener('click', () => closeDialog(lightbox));
    $('[data-lb-prev]', lightbox).addEventListener('click', () => show(current - 1));
    $('[data-lb-next]', lightbox).addEventListener('click', () => show(current + 1));
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox || event.target.matches('figure')) closeDialog(lightbox);
    });
    lightbox.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') show(current - 1);
      if (event.key === 'ArrowRight') show(current + 1);
    });
    lightbox.addEventListener('close', () => items[current].focus({ preventScroll: true }));
  }

  /* ---------- Broj u korpi (na webshopu ga vodi shop.js) ---------- */

  function showSavedCount() {
    const badge = $('[data-cart-count]');
    if (!badge) return;
    let count = 0;
    try {
      const saved = JSON.parse(localStorage.getItem('jezerac-korpa')) || {};
      count = products.reduce((sum, p) => sum + (Number.parseInt(saved[p.id], 10) || 0), 0);
    } catch { /* privatni prozor */ }
    badge.textContent = count;
    badge.hidden = count === 0;
  }

  if (!$('[data-shop]')) {
    showSavedCount();
    // Povratak dugmetom "nazad" ne učitava stranicu ponovo.
    window.addEventListener('pageshow', showSavedCount);
  }

  /* ---------- Sitnice ---------- */

  const contact = $('[data-wa-contact]');
  if (contact) {
    contact.href = `https://wa.me/${whatsapp}?text=${encodeURIComponent('Zdravo, imam pitanje u vezi s Eko farmom "Jezerac".')}`;
  }

  $('[data-year]').textContent = new Date().getFullYear();
})();
