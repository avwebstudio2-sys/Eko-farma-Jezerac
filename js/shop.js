/* Webshop: korpa, forma i slanje narudžbe na WhatsApp. */
(function () {
  'use strict';

  const { products, whatsapp, email, deliveryHours } = window.FARMA;
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  /* ---------- Trajno pamćenje (samo na uređaju kupca) ---------- */

  const STORE_CART = 'jezerac-korpa';
  const STORE_CUSTOMER = 'jezerac-kupac';
  const store = {
    get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* privatni prozor */ } },
    remove(key) { try { localStorage.removeItem(key); } catch { /* privatni prozor */ } },
  };

  /* ---------- Stanje korpe ---------- */

  const cart = {};
  const saved = store.get(STORE_CART) || {};
  for (const p of products) {
    const qty = Number.parseInt(saved[p.id], 10);
    if (qty > 0) cart[p.id] = Math.min(qty, p.max);
  }

  const qtyOf = (id) => cart[id] || 0;
  const lines = () => products.filter((p) => qtyOf(p.id) > 0);
  const total = () => lines().reduce((sum, p) => sum + p.price * qtyOf(p.id), 0);
  const eggCount = () => lines().reduce((sum, p) => sum + p.eggs * qtyOf(p.id), 0);
  const itemCount = () => lines().reduce((sum, p) => sum + qtyOf(p.id), 0);

  const money = (n) => `${Number.isInteger(n) ? n : n.toFixed(2).replace('.', ',')} KM`;
  const shellsLabel = (n) => {
    if (n % 10 === 1 && n % 100 !== 11) return `${n} školjka`;
    if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) return `${n} školjke`;
    return `${n} školjki`;
  };

  /* ---------- Polja sa školjkama ---------- */

  $('[data-tiles]').innerHTML = products.map((p) => `
    <article class="tile" id="p-${p.id}" data-product="${p.id}" style="--c:var(--${p.color})">
      <div class="tile-art">
        <svg class="egg" viewBox="0 0 100 126" style="--scale:${p.egg}" aria-hidden="true"><use href="#egg"/><text x="50" y="88" text-anchor="middle">${p.mark}</text></svg>
      </div>
      <div class="tile-text">
        <h2>${p.name}</h2>
        <p>${p.desc}</p>
      </div>
      <p class="tile-price">${money(p.price)}</p>
      <div class="tile-action">
        <button class="add" type="button" data-add>Dodaj<span class="sr-only">: ${p.name}</span></button>
        <div class="stepper" role="group" aria-label="Količina: ${p.name}" data-stepper hidden>
          <button type="button" data-step="-1" aria-label="Smanji količinu: ${p.name}">−</button>
          <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" value="0" aria-label="Količina: ${p.name}" data-qty>
          <button type="button" data-step="1" aria-label="Povećaj količinu: ${p.name}">+</button>
        </div>
      </div>
    </article>`).join('');

  /* ---------- Reference na elemente ---------- */

  const form = $('#order-form');
  const live = $('[data-live]');
  const itemsEl = $('[data-items]');
  const bar = $('[data-bar]');
  const sendButton = $('[data-send]');
  const sendError = $('[data-send-error]');
  const totalEl = $('[data-total]');
  const rows = new Map();

  /* ---------- Promjena količine ---------- */

  function setQty(id, value, { announce = true } = {}) {
    const p = byId[id];
    const previous = qtyOf(id);
    const next = Math.max(0, Math.min(p.max, Number.isFinite(value) ? value : 0));
    if (next > 0) cart[id] = next; else delete cart[id];

    renderTile(p);
    renderOrder();
    store.set(STORE_CART, cart);

    if (next > previous) {
      replay($('.tile-art', $(`[data-product="${id}"]`)), 'hop');
      replay(totalEl, 'bump');
      hideSendError();
    }
    if (announce && next !== previous) {
      const text = next === 0 ? `${p.name} uklonjena iz korpe.` : `${p.name}: ${next}.`;
      live.textContent = `${text} Ukupno ${money(total())}.`;
    }
  }

  function renderTile(p) {
    const tile = $(`[data-product="${p.id}"]`);
    const qty = qtyOf(p.id);
    $('[data-add]', tile).hidden = qty > 0;
    $('[data-stepper]', tile).hidden = qty === 0;
    $('[data-qty]', tile).value = qty;
  }

  function renderOrder() {
    const current = lines();
    const empty = current.length === 0;

    // Redovi se ažuriraju po proizvodu, da fokus i animacije ostanu netaknuti.
    for (const [id, row] of rows) {
      if (qtyOf(id) === 0) {
        rows.delete(id);
        row.remove();
      }
    }
    current.forEach((p, index) => {
      let row = rows.get(p.id);
      if (!row) {
        row = document.createElement('li');
        row.dataset.row = p.id;
        row.style.setProperty('--c', `var(--${p.color})`);
        row.innerHTML = `<span class="order-name">${p.name}<small data-row-detail></small></span>
          <b data-row-price></b>
          <button type="button" data-remove aria-label="Ukloni: ${p.name}">×</button>`;
        rows.set(p.id, row);
      }
      const next = current[index + 1] ? rows.get(current[index + 1].id) : null;
      const anchor = next && next.parentNode === itemsEl ? next : null;
      if (row.parentNode !== itemsEl || row.nextSibling !== anchor) itemsEl.insertBefore(row, anchor);
      $('[data-row-detail]', row).textContent = `${qtyOf(p.id)} × ${money(p.price)}`;
      $('[data-row-price]', row).textContent = money(p.price * qtyOf(p.id));
    });

    $('[data-empty]').hidden = !empty;
    $('[data-total-row]').hidden = empty;
    totalEl.textContent = money(total());
    sendButton.hidden = empty;
    form.hidden = empty;

    const count = $('[data-cart-count]');
    count.textContent = itemCount();
    count.hidden = empty;

    bar.classList.toggle('has-items', !empty);
    $('[data-bar-total]').textContent = money(total());
    $('[data-bar-count]').textContent = empty ? '' : shellsLabel(itemCount());
    $('[data-bar-next]').tabIndex = empty ? -1 : 0;

    renderSend();
  }

  // Dugme vodi kroz korake: prvo do podataka, a kad su popunjeni, šalje.
  function renderSend() {
    const ready = isReady();
    sendButton.classList.toggle('btn-send', ready);
    $('[data-send-icon]').hidden = !ready;
    $('[data-send-fine]').hidden = !ready;
    $('[data-send-label]').textContent = ready ? `Pošalji na WhatsApp · ${money(total())}` : 'Dalje: podaci za dostavu';
  }

  /* ---------- Animacije ---------- */

  function replay(el, name) {
    if (!el || reduceMotion.matches) return;
    el.classList.remove(name);
    void el.offsetWidth;
    el.classList.add(name);
  }

  /* ---------- Događaji u poljima i korpi ---------- */

  document.addEventListener('click', (event) => {
    const add = event.target.closest('[data-add]');
    if (add) {
      const tile = add.closest('[data-product]');
      setQty(tile.dataset.product, 1);
      $('[data-step="1"]', tile).focus({ preventScroll: true });
      return;
    }

    const step = event.target.closest('[data-step]');
    if (step) {
      const tile = step.closest('[data-product]');
      const next = qtyOf(tile.dataset.product) + Number(step.dataset.step);
      setQty(tile.dataset.product, next);
      if (next <= 0) $('[data-add]', tile).focus({ preventScroll: true });
      return;
    }

    const remove = event.target.closest('[data-remove]');
    if (remove) {
      setQty(remove.closest('[data-row]').dataset.row, 0);
      $('#order-title').focus({ preventScroll: true });
    }
  });

  document.addEventListener('input', (event) => {
    if (event.target.matches('[data-qty]')) {
      event.target.value = event.target.value.replace(/\D/g, '');
    }
  });

  document.addEventListener('change', (event) => {
    if (event.target.matches('[data-qty]')) {
      const tile = event.target.closest('[data-product]');
      const next = Number.parseInt(event.target.value, 10) || 0;
      setQty(tile.dataset.product, next);
      if (next === 0) $('[data-add]', tile).focus({ preventScroll: true });
    }
  });

  /* ---------- Traka na telefonu se krije dok su forma i korpa na ekranu ---------- */

  if ('IntersectionObserver' in window) {
    const visible = new Set();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.add(entry.target); else visible.delete(entry.target);
      });
      bar.classList.toggle('is-covered', visible.size > 0);
    }, { rootMargin: '0px 0px -25% 0px' });
    $$('[data-checkout]').forEach((el) => observer.observe(el));
  }

  /* ---------- Forma ---------- */

  const REQUIRED = ['ime', 'telefon', 'adresa', 'grad', 'datum', 'vrijeme'];
  const pad2 = (n) => String(n).padStart(2, '0');

  function localToday() {
    const now = new Date();
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  }

  function fillHours() {
    const options = ['<option value="">Sat</option>'];
    for (let h = deliveryHours.from; h <= deliveryHours.to; h += 1) {
      options.push(`<option value="${h}">${pad2(h)}:00</option>`);
    }
    $('#vrijemeOd').innerHTML = options.join('');
    $('#vrijemeDo').innerHTML = options.join('');
  }

  fillHours();
  form.elements.datum.min = localToday();

  const customer = store.get(STORE_CUSTOMER);
  if (customer) {
    ['ime', 'telefon', 'adresa', 'grad'].forEach((name) => {
      if (typeof customer[name] === 'string') form.elements[name].value = customer[name];
    });
  }

  const clean = (name) => form.elements[name].value.replace(/\s+/g, ' ').trim();

  function validateField(name) {
    switch (name) {
      case 'ime':
        return clean('ime').length >= 2 ? '' : 'Unesite ime i prezime';
      case 'telefon': {
        const phone = clean('telefon');
        if (!phone) return 'Unesite broj telefona';
        return /^[+0-9 ()\-/]+$/.test(phone) && phone.replace(/\D/g, '').length >= 6 ? '' : 'Neispravan broj';
      }
      case 'adresa':
        return clean('adresa').length >= 5 ? '' : 'Unesite kućnu adresu';
      case 'grad':
        return clean('grad').length >= 2 ? '' : 'Unesite grad';
      case 'datum': {
        const value = form.elements.datum.value;
        if (!value) return 'Odaberite datum dostave';
        return value >= localToday() ? '' : 'Datum dostave ne može biti u prošlosti';
      }
      case 'vrijeme': {
        const from = form.elements.vrijemeOd.value;
        const to = form.elements.vrijemeDo.value;
        if (!from || !to) return 'Odaberite vrijeme dostave';
        return Number(to) > Number(from) ? '' : 'Krajnji sat mora biti veći od početnog';
      }
      default:
        return '';
    }
  }

  function showFieldError(name, message) {
    const field = $(`[data-field="${name}"]`);
    field.classList.toggle('is-invalid', Boolean(message));
    $(`#err-${name}`).textContent = message;
    $$('input, select', field).forEach((control) => {
      if (message) control.setAttribute('aria-invalid', 'true');
      else control.removeAttribute('aria-invalid');
    });
  }

  function isReady() {
    return lines().length > 0 && REQUIRED.every((name) => !validateField(name));
  }

  const isUntouched = () => $$('input, select', form).every((control) => !control.value);

  form.addEventListener('focusout', (event) => {
    const field = event.target.closest('[data-field]');
    if (!field || field.contains(event.relatedTarget)) return;
    const name = field.dataset.field;
    const touched = event.target.value !== '' || field.classList.contains('is-invalid');
    if (touched) showFieldError(name, validateField(name));
  });

  function onFormChange(event) {
    const field = event.target.closest('[data-field]');
    if (field && field.classList.contains('is-invalid')) {
      showFieldError(field.dataset.field, validateField(field.dataset.field));
    }
    renderSend();
  }

  form.addEventListener('input', onFormChange);
  form.addEventListener('change', onFormChange);

  function showSendError(message) {
    sendError.textContent = message;
    sendError.hidden = false;
  }

  function hideSendError() {
    sendError.hidden = true;
  }

  function goToField(name) {
    const control = $(`[data-field="${name}"] input, [data-field="${name}"] select`);
    control.focus({ preventScroll: true });
    control.closest('[data-field]').scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' });
  }

  /* ---------- Poruka za WhatsApp ---------- */

  // Nazivi dana su ovdje jer preglednici nemaju uvijek bosanski jezik u Intl podacima.
  const WEEKDAYS = ['nedjelja', 'ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota'];

  function formatDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return `${WEEKDAYS[new Date(y, m - 1, d).getDay()]}, ${pad2(d)}.${pad2(m)}.${y}.`;
  }

  function buildMessage() {
    const out = ['*Nova narudžba, Eko farma "Jezerac"*', ''];

    lines().forEach((p) => out.push(`• ${p.name} (${p.desc}) × ${qtyOf(p.id)} = ${money(p.price * qtyOf(p.id))}`));
    out.push(`*Ukupno: ${money(total())}* (${eggCount()} jaja)`);
    out.push('Dostava besplatna, plaćanje pri preuzimanju.', '');

    out.push('*Podaci kupca*');
    out.push(`Ime: ${clean('ime')}`);
    out.push(`Telefon: ${clean('telefon')}`);
    out.push(`Adresa: ${clean('adresa')}, ${clean('grad')}`);
    out.push(`Datum dostave: ${formatDate(form.elements.datum.value)}`);
    out.push(`Vrijeme dostave: ${pad2(form.elements.vrijemeOd.value)}:00 do ${pad2(form.elements.vrijemeDo.value)}:00`);
    const note = form.elements.napomena.value.trim();
    if (note) out.push(`Napomena: ${note}`);

    return out.join('\n');
  }

  const whatsappUrl = (text) => `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`;

  function openExternal(url) {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  /* ---------- Slanje ---------- */

  const sentDialog = $('#sent-dialog');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (lines().length === 0) return;
    hideSendError();

    const invalid = REQUIRED.filter((name) => validateField(name));
    if (invalid.length) {
      // Prazna forma nije greška: kupac je tek stigao do ovog koraka.
      if (!isUntouched()) {
        REQUIRED.forEach((name) => showFieldError(name, validateField(name)));
        showSendError('Provjerite unesene podatke.');
      }
      goToField(invalid[0]);
      return;
    }

    const text = buildMessage();
    const url = whatsappUrl(text);

    store.set(STORE_CUSTOMER, {
      ime: clean('ime'),
      telefon: clean('telefon'),
      adresa: clean('adresa'),
      grad: clean('grad'),
    });
    // Korpa ostaje do "Nova narudžba", ali poslije osvježavanja stranice kreće se ispočetka.
    store.remove(STORE_CART);

    openExternal(url);

    $('[data-sent-wa]').href = url;
    const subject = `Nova narudžba (${eggCount()} jaja, ${money(total())})`;
    $('[data-sent-mail]').href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text.replace(/\*/g, ''))}`;
    sentDialog.showModal();
  });

  $('[data-sent-close]').addEventListener('click', () => sentDialog.close());

  $('[data-sent-new]').addEventListener('click', () => {
    lines().forEach((p) => setQty(p.id, 0, { announce: false }));
    form.elements.datum.value = '';
    form.elements.vrijemeOd.value = '';
    form.elements.vrijemeDo.value = '';
    form.elements.napomena.value = '';
    renderSend();
    sentDialog.close();
    window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  });

  sentDialog.addEventListener('click', (event) => {
    if (event.target === sentDialog) sentDialog.close();
  });

  /* ---------- Početno iscrtavanje ---------- */

  products.forEach(renderTile);
  renderOrder();

  // Polja nastaju tek ovdje, pa preglednik sam ne može skočiti na školjku iz linka s početne.
  const linked = location.hash.length > 1 && document.getElementById(location.hash.slice(1));
  if (linked) linked.scrollIntoView({ block: 'center', behavior: 'instant' });
})();
