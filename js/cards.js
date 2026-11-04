/*
 * Kartice školjki. Isti HTML koristi preglednik (shop.js) i skripta scripts/prerender.js,
 * koja kartice unaprijed upisuje u webshop.html, da ih pretraživači vide i bez JavaScripta.
 */
(function (root) {
  'use strict';

  const money = (n) => `${Number.isInteger(n) ? n : n.toFixed(2).replace('.', ',')} KM`;
  const perEgg = (p) => `${(p.price / p.eggs).toFixed(2).replace('.', ',')} KM po jajetu`;

  /* ---------- Crtež školjke s jajima ---------- */

  const EGG_TONES = ['cream', 'tan', 'brown', 'tan', 'cream'];

  function trayMarkup(p) {
    const [cols, rows] = p.tray;
    const cell = 24;
    const pad = 8;
    const width = cols * cell + pad * 2;
    const height = rows * cell + pad * 2;
    let eggs = '';
    for (let i = 0; i < cols * rows; i += 1) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = pad + cell * col + cell / 2;
      const y = pad + cell * row + cell / 2;
      const tone = EGG_TONES[(i * 7 + row * 3) % EGG_TONES.length];
      const tilt = ((i * 47) % 50) - 25;
      eggs += `<circle class="tray-well" cx="${x}" cy="${y}" r="11"/>`
        + `<g transform="translate(${x} ${y})"><g class="tray-egg" style="--i:${i}">`
        + `<use href="#egg-${tone}" transform="rotate(${tilt}) scale(${p.eggScale})"/></g></g>`;
    }
    return `<svg class="tray" viewBox="0 0 ${width} ${height}" aria-hidden="true">`
      + `<rect class="tray-base" width="${width}" height="${height}" rx="12"/>${eggs}</svg>`;
  }

  /* ---------- Kartice proizvoda ---------- */

  function stepperMarkup(p, { hidden = false } = {}) {
    return `<div class="stepper" role="group" aria-label="Količina: ${p.name}" data-stepper${hidden ? ' hidden' : ''}>
      <button type="button" data-step="-1" aria-label="Smanji količinu: ${p.name}">−</button>
      <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" value="0" aria-label="Količina: ${p.name}" data-qty>
      <button type="button" data-step="1" aria-label="Povećaj količinu: ${p.name}">+</button>
    </div>`;
  }

  // Kartica kreće sa praznom korpom: vidi se "Dodaj u korpu", a brojač je skriven.
  const cardMarkup = (p) => `
    <article class="pcard" data-product="${p.id}">
      <div class="pcard-media">
        ${trayMarkup(p)}
        <span class="pcard-badge">${p.badge}</span>
        <span class="pcard-count" aria-hidden="true" data-badge hidden></span>
      </div>
      <div class="pcard-body">
        <h2>${p.name}</h2>
        <p class="pcard-desc">${p.desc}</p>
        <p class="pcard-price">${money(p.price)}<small>${perEgg(p)}</small></p>
        <div class="pcard-action">
          <button class="btn btn-wide" type="button" data-add>Dodaj u korpu<span class="sr-only">: ${p.name}</span></button>
          ${stepperMarkup(p, { hidden: true })}
        </div>
      </div>
    </article>`;

  // Kratki otisak školjki i cijena: ako je isti kao u HTML-u, kartice se ne iscrtavaju ponovo.
  function productsKey(products) {
    const text = JSON.stringify(products);
    let hash = 5381;
    for (let i = 0; i < text.length; i += 1) hash = ((hash * 33) ^ text.charCodeAt(i)) >>> 0;
    return hash.toString(36);
  }

  root.FarmaCards = {
    money,
    perEgg,
    stepperMarkup,
    cardsMarkup: (products) => products.map(cardMarkup).join(''),
    productsKey,
  };
})(window);
