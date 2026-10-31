/* Zajedničko za obje stranice: galerija, broj u korpi i godina u podnožju. */
(function () {
  'use strict';

  const { products, whatsapp } = window.FARMA;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  /* ---------- Najniža cijena u pozivu na početnoj ---------- */

  const minPrice = $('[data-min-price]');
  if (minPrice) minPrice.textContent = `${Math.min(...products.map((p) => p.price))} KM`;

  /* ---------- Galerija ---------- */

  const lightbox = $('#lightbox');
  if (lightbox) {
    const image = $('[data-lb-img]', lightbox);
    const caption = $('[data-lb-caption]', lightbox);
    const items = $$('[data-gallery] .g-item');
    let current = 0;

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

    $('[data-lb-close]', lightbox).addEventListener('click', () => lightbox.close());
    $('[data-lb-prev]', lightbox).addEventListener('click', () => show(current - 1));
    $('[data-lb-next]', lightbox).addEventListener('click', () => show(current + 1));
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox || event.target.matches('figure')) lightbox.close();
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
