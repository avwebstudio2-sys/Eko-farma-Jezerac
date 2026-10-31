/* Zajedničko za obje stranice: cjenovnik, galerija, broj u korpi i godina u podnožju. */
(function () {
  'use strict';

  const { products, whatsapp } = window.FARMA;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  /* ---------- Cjenovnik na početnoj stranici ---------- */

  const strip = $('[data-strip]');
  if (strip) {
    strip.innerHTML = products.map((p) => `
      <li>
        <a class="strip-item tone-${p.tone}" href="webshop.html#p-${p.id}">
          <span class="strip-text">
            <span class="strip-name">${p.name}</span>
            <span class="strip-desc">${p.desc}</span>
          </span>
          <b class="strip-price">${p.price} KM</b>
          <svg class="egg" viewBox="0 0 100 126" style="--scale:${p.egg}" aria-hidden="true"><use href="#egg"/><text x="50" y="88" text-anchor="middle">${p.mark}</text></svg>
          <span class="strip-go" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
        </a>
      </li>`).join('');
  }

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
      caption.textContent = $('span', items[current]).textContent;
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
