/* Zajedničko za obje stranice: broj u korpi, cjenovnik na početnoj i godina u podnožju. */
(function () {
  'use strict';

  const { products, whatsapp } = window.FARMA;
  const $ = (selector) => document.querySelector(selector);

  /* ---------- Cjenovnik na početnoj stranici ---------- */

  const strip = $('[data-strip]');
  if (strip) {
    strip.innerHTML = products.map((p, i) => `
      <li style="--c:var(--${p.color});--i:${i}">
        <a class="strip-item" href="webshop.html#p-${p.id}">
          <span class="strip-text">
            <span class="strip-name">${p.name}</span>
            <span class="strip-desc">${p.desc}</span>
          </span>
          <b class="strip-price">${p.price} KM</b>
          <svg class="egg" viewBox="0 0 100 126" style="--scale:${p.egg}" aria-hidden="true"><use href="#egg"/><text x="50" y="88" text-anchor="middle">${p.mark}</text></svg>
        </a>
      </li>`).join('');
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
