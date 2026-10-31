/* Webshop: korpa, forma i slanje narudžbe na WhatsApp. */
(function () {
  'use strict';

  const { products, whatsapp, email, deliveryHours } = window.FARMA;
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 1000px)');

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
  const hasEggs = () => lines().some((p) => p.group === 'jaja');
  const hasAgreed = () => lines().some((p) => p.group === 'dogovor');
  const total = () => lines().reduce((sum, p) => sum + (p.price || 0) * qtyOf(p.id), 0);
  const eggCount = () => lines().reduce((sum, p) => sum + (p.eggs || 0) * qtyOf(p.id), 0);
  const itemCount = () => lines().reduce((sum, p) => sum + qtyOf(p.id), 0);

  const money = (n) => `${Number.isInteger(n) ? n : n.toFixed(2).replace('.', ',')} KM`;
  const fullName = (p) => (p.klasa ? `${p.name} — ${p.klasa}` : p.name);
  const piecesLabel = (n) => (n % 10 === 1 && n % 100 !== 11 ? `${n} komad` : `${n} komada`);

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

  function cardMarkup(p) {
    const media = p.image
      ? `<img src="${p.image}" width="${p.imageSize[0]}" height="${p.imageSize[1]}" alt="${p.alt}" loading="lazy">`
      : trayMarkup(p);
    const price = p.price === null
      ? '<p class="pcard-price pcard-price--agree">Po dogovoru</p>'
      : `<p class="pcard-price">${money(p.price)}</p>`;
    const klasa = p.klasa ? ` <span class="klasa">${p.klasa}</span>` : '';
    const classes = ['pcard', p.image ? 'pcard--photo' : 'pcard--egg', p.wide ? 'pcard--wide' : ''].join(' ');
    return `<article class="${classes}" data-product="${p.id}" data-state="empty">
      <div class="pcard-media">${media}<span class="pcard-badge" aria-hidden="true" data-badge></span></div>
      <div class="pcard-body">
        <div class="pcard-text">
          <h4 class="pcard-name">${p.name}${klasa}</h4>
          <p class="pcard-desc">${p.desc}</p>
        </div>
        ${price}
        <div class="pcard-action">
          <button class="btn-add" type="button" data-add><svg class="icon"><use href="#i-plus"/></svg> Dodaj<span class="sr-only">: ${fullName(p)}</span></button>
          ${stepperMarkup(p)}
        </div>
      </div>
    </article>`;
  }

  function stepperMarkup(p) {
    return `<div class="stepper" role="group" aria-label="Količina: ${fullName(p)}">
      <button class="step" type="button" data-step="-1" aria-label="Smanji količinu: ${fullName(p)}"><svg class="icon"><use href="#i-minus"/></svg></button>
      <input class="step-input" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="3" value="0" aria-label="Količina: ${fullName(p)}" data-qty>
      <button class="step" type="button" data-step="1" aria-label="Povećaj količinu: ${fullName(p)}"><svg class="icon"><use href="#i-plus"/></svg></button>
    </div>`;
  }

  $$('[data-grid]').forEach((grid) => {
    grid.innerHTML = products.filter((p) => p.group === grid.dataset.grid).map(cardMarkup).join('');
  });

  /* ---------- Reference na elemente ---------- */

  const form = $('#order-form');
  const live = $('[data-live]');
  const itemsEl = $('[data-items]');
  const pill = $('[data-cart-pill]');
  const bar = $('[data-cart-bar]');
  const sendError = $('[data-send-error]');
  const summaryTotal = $('[data-total]');
  const rows = new Map();

  /* ---------- Promjena količine ---------- */

  function setQty(id, value, { fly = null, announce = true } = {}) {
    const p = byId[id];
    const previous = qtyOf(id);
    const next = Math.max(0, Math.min(p.max, Number.isFinite(value) ? value : 0));
    if (next > 0) cart[id] = next; else delete cart[id];

    renderCard(p);
    renderSummary();
    store.set(STORE_CART, cart);

    if (next > previous) {
      playTrayWave(id);
      if (fly) flyToCart(fly, p);
      hideSendError();
    }
    if (announce && next !== previous) {
      const text = next === 0 ? `${fullName(p)} uklonjeno iz korpe.` : `${fullName(p)}: ${piecesLabel(next)}.`;
      live.textContent = `${text} Ukupno ${money(total())}.`;
    }
  }

  function renderCard(p) {
    const card = $(`[data-product="${p.id}"]`);
    const qty = qtyOf(p.id);
    card.dataset.state = qty > 0 ? 'active' : 'empty';
    $('[data-qty]', card).value = qty;
    $('[data-badge]', card).textContent = qty > 0 ? `× ${qty}` : '';
  }

  function renderSummary() {
    const current = lines();
    const empty = current.length === 0;

    // Redovi se ažuriraju po proizvodu, da fokus i animacije ostanu netaknuti.
    for (const [id, row] of rows) {
      if (qtyOf(id) === 0) {
        rows.delete(id);
        row.remove();
      }
    }
    for (const p of current) {
      let row = rows.get(p.id);
      if (!row) {
        row = document.createElement('li');
        row.className = 'summary-item';
        row.dataset.row = p.id;
        row.innerHTML = `<div class="summary-item-text"><b>${fullName(p)}</b><small>${p.eggs ? `${p.desc} · ` : ''}${p.price === null ? 'po dogovoru' : `${money(p.price)} / kom`}</small></div>
          <p class="summary-item-price" data-row-price></p>${stepperMarkup(p)}`;
        rows.set(p.id, row);
      }
      const before = current[current.indexOf(p) + 1];
      const anchor = before ? rows.get(before.id) : null;
      if (row.parentNode !== itemsEl || (anchor && anchor.parentNode === itemsEl && row.nextSibling !== anchor)) {
        itemsEl.insertBefore(row, anchor && anchor.parentNode === itemsEl ? anchor : null);
      }
      $('[data-qty]', row).value = qtyOf(p.id);
      $('[data-row-price]', row).textContent = p.price === null ? '—' : money(p.price * qtyOf(p.id));
    }

    $('[data-empty]').hidden = !empty;
    $('[data-clear]').hidden = empty;

    const sum = total();
    const eggs = eggCount();
    summaryTotal.textContent = !empty && !hasEggs() ? 'Po dogovoru' : money(sum);
    $('[data-line-eggs]').hidden = eggs === 0;
    $('[data-egg-count]').textContent = `${eggs} kom`;
    $('[data-agree]').hidden = !hasAgreed();
    $('[data-delivery-line]').textContent = !empty && !hasEggs() ? 'Po dogovoru' : 'Besplatna';

    const label = !empty && hasEggs() ? `Pošalji narudžbu · ${money(sum)}` : 'Pošalji narudžbu';
    $('[data-send-label]').textContent = label;

    renderPill(empty, sum);
    renderBar(empty, sum);
    syncDeliveryFields();
  }

  function renderPill(empty, sum) {
    pill.href = empty ? '#webshop' : '#narudzba';
    pill.classList.toggle('has-items', !empty);
    $('[data-pill-text]').textContent = empty ? 'Naruči jaja' : (hasEggs() ? money(sum) : 'Korpa');
    const count = $('[data-pill-count]');
    count.hidden = empty;
    count.textContent = itemCount();
    pill.setAttribute('aria-label', empty ? 'Naruči jaja' : `Korpa: ${piecesLabel(itemCount())}, ukupno ${money(sum)}`);
  }

  function renderBar(empty, sum) {
    bar.classList.toggle('has-items', !empty);
    $('[data-bar-total]').textContent = !empty && !hasEggs() ? 'Po dogovoru' : money(sum);
    $('[data-bar-count]').textContent = empty ? '' : piecesLabel(itemCount());
    $('[data-bar-next]').tabIndex = empty ? -1 : 0;
  }

  /* ---------- Dostava: adresa i termin trebaju samo za jaja ---------- */

  function syncDeliveryFields() {
    const onlyAgreed = hasAgreed() && !hasEggs();
    $$('[data-delivery]').forEach((el) => { el.hidden = onlyAgreed; });
    $('[data-form-title]').textContent = onlyAgreed ? 'Vaši podaci' : 'Podaci za dostavu';

    const note = $('[data-form-note]');
    if (onlyAgreed) {
      note.textContent = 'Za piliće, pilenke i ovce dovoljni su nam ime i telefon. Javljamo vam se radi dogovora o cijeni i preuzimanju.';
    } else if (hasAgreed()) {
      note.textContent = 'Jaja dostavljamo na unesenu adresu i termin. Za piliće, pilenke i ovce javljamo vam se radi dogovora.';
    }
    note.hidden = !hasAgreed();
  }

  /* ---------- Animacije ---------- */

  function bump(el) {
    if (!el || reduceMotion.matches) return;
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }

  function playTrayWave(id) {
    if (reduceMotion.matches) return;
    const card = $(`[data-product="${id}"]`);
    card.classList.remove('is-wave');
    void card.offsetWidth;
    card.classList.add('is-wave');
    window.clearTimeout(card.waveTimer);
    card.waveTimer = window.setTimeout(() => card.classList.remove('is-wave'), 1100);
    bump($('[data-badge]', card));
  }

  function flightTarget() {
    if (!desktop.matches) {
      return { x: 44, y: window.innerHeight - 40, onLand: () => bump($('[data-bar-icon]')) };
    }
    const rect = summaryTotal.getBoundingClientRect();
    if (rect.top > 80 && rect.bottom < window.innerHeight) {
      return { x: rect.right - 20, y: rect.top + rect.height / 2, onLand: () => bump(summaryTotal) };
    }
    const pillRect = pill.getBoundingClientRect();
    return { x: pillRect.left + 24, y: pillRect.top + pillRect.height / 2, onLand: () => bump(pill) };
  }

  // Jaje iskoči iz kartice i lukom doleti do korpe.
  function flyToCart(from, p) {
    const target = flightTarget();
    if (reduceMotion.matches || !from.animate) {
      target.onLand();
      return;
    }
    const start = from.getBoundingClientRect();
    const x0 = start.left + start.width / 2;
    const y0 = start.top + start.height / 2;
    const dx = target.x - x0;
    const dy = target.y - y0;
    const lift = Math.max(70, Math.abs(dy) * 0.3);

    const egg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    egg.setAttribute('class', 'fly-egg');
    egg.setAttribute('viewBox', '-11 -12 22 24');
    egg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', p.group === 'jaja' ? '#egg-tan' : '#egg-chick');
    egg.appendChild(use);
    egg.style.left = `${x0 - 16}px`;
    egg.style.top = `${y0 - 18}px`;
    document.body.appendChild(egg);

    const frames = [];
    const steps = 16;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const x = dx * t;
      const y = dy * t - lift * 4 * t * (1 - t);
      const stretch = 1 + 0.18 * Math.sin(Math.PI * t);
      const size = 1.15 - 0.6 * t;
      frames.push({
        transform: `translate(${x}px, ${y}px) rotate(${t * 320}deg) scale(${size / stretch}, ${size * stretch})`,
        opacity: t > 0.92 ? 0.4 : 1,
      });
    }
    const flight = egg.animate(frames, { duration: 620, easing: 'cubic-bezier(.35,.1,.55,1)' });
    flight.onfinish = () => {
      egg.remove();
      target.onLand();
    };
  }

  /* ---------- Događaji na karticama i u korpi ---------- */

  function idFromControl(el) {
    const host = el.closest('[data-product],[data-row]');
    return host ? (host.dataset.product || host.dataset.row) : null;
  }

  document.addEventListener('click', (event) => {
    const add = event.target.closest('[data-add]');
    if (add) {
      const id = idFromControl(add);
      const card = add.closest('[data-product]');
      setQty(id, 1, { fly: $('.pcard-media', card) });
      $('[data-step="1"]', card).focus({ preventScroll: true });
      return;
    }

    const step = event.target.closest('[data-step]');
    if (step) {
      const id = idFromControl(step);
      const delta = Number(step.dataset.step);
      const host = step.closest('[data-product],[data-row]');
      const inCard = host.matches('[data-product]');
      const next = qtyOf(id) + delta;
      setQty(id, next, { fly: delta > 0 && inCard ? $('.pcard-media', host) : null });
      if (next <= 0) {
        // Stepper nestaje, pa fokus prelazi na najbliži smisleni element.
        (inCard ? $('[data-add]', host) : $('#summary-title')).focus({ preventScroll: true });
      }
      return;
    }

    if (event.target.closest('[data-clear]')) {
      lines().forEach((p) => setQty(p.id, 0, { announce: false }));
      live.textContent = 'Korpa je ispražnjena.';
      $('#summary-title').focus({ preventScroll: true });
    }
  });

  document.addEventListener('input', (event) => {
    if (event.target.matches('[data-qty]')) {
      event.target.value = event.target.value.replace(/\D/g, '');
    }
  });

  document.addEventListener('change', (event) => {
    if (event.target.matches('[data-qty]')) {
      const id = idFromControl(event.target);
      const host = event.target.closest('[data-product],[data-row]');
      const next = Number.parseInt(event.target.value, 10) || 0;
      setQty(id, next);
      if (next === 0 && host.matches('[data-product]')) $('[data-add]', host).focus({ preventScroll: true });
    }
  });

  /* ---------- Traka na telefonu se krije dok su forma i sažetak na ekranu ---------- */

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
        if (!from || !to) return 'Odaberite period dostave';
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

  function requiredFields() {
    return hasAgreed() && !hasEggs()
      ? ['ime', 'telefon']
      : ['ime', 'telefon', 'adresa', 'grad', 'datum', 'vrijeme'];
  }

  form.addEventListener('focusout', (event) => {
    const field = event.target.closest('[data-field]');
    if (!field || field.contains(event.relatedTarget)) return;
    const name = field.dataset.field;
    const touched = event.target.value !== '' || field.classList.contains('is-invalid');
    if (touched) showFieldError(name, validateField(name));
  });

  form.addEventListener('input', (event) => {
    const field = event.target.closest('[data-field]');
    if (field && field.classList.contains('is-invalid')) {
      showFieldError(field.dataset.field, validateField(field.dataset.field));
    }
  });

  function showSendError(message) {
    sendError.textContent = message;
    sendError.hidden = false;
  }

  function hideSendError() {
    sendError.hidden = true;
  }

  /* ---------- Poruka za WhatsApp ---------- */

  // Nazivi dana su ovdje jer preglednici nemaju uvijek bosanski jezik u Intl podacima.
  const WEEKDAYS = ['nedjelja', 'ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota'];

  function formatDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return `${WEEKDAYS[new Date(y, m - 1, d).getDay()]}, ${pad2(d)}.${pad2(m)}.${y}.`;
  }

  function buildMessage() {
    const eggLines = lines().filter((p) => p.group === 'jaja');
    const agreedLines = lines().filter((p) => p.group === 'dogovor');
    const out = ['*Nova narudžba — Eko farma "Jezerac"*', ''];

    if (eggLines.length) {
      out.push('*Jaja*');
      eggLines.forEach((p) => out.push(`• ${fullName(p)} (${p.desc}) × ${qtyOf(p.id)} = ${money(p.price * qtyOf(p.id))}`));
      out.push(`*Ukupno: ${money(total())}* (${eggCount()} jaja)`);
      out.push('Dostava besplatna, plaćanje pouzećem.', '');
    }
    if (agreedLines.length) {
      out.push('*Po dogovoru*');
      agreedLines.forEach((p) => out.push(`• ${fullName(p)} × ${qtyOf(p.id)}`));
      out.push('Cijena i termin po dogovoru.', '');
    }

    out.push('*Podaci kupca*');
    out.push(`Ime: ${clean('ime')}`);
    out.push(`Telefon: ${clean('telefon')}`);
    if (eggLines.length) {
      out.push(`Adresa: ${clean('adresa')}, ${clean('grad')}`);
      out.push(`Datum dostave: ${formatDate(form.elements.datum.value)}`);
      out.push(`Vremenski period dostave: ${pad2(form.elements.vrijemeOd.value)}:00 – ${pad2(form.elements.vrijemeDo.value)}:00`);
    }
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

    if (lines().length === 0) {
      showSendError('Odaberite barem jedno pakovanje.');
      $('#proizvodi').scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
      return;
    }
    hideSendError();

    const fields = requiredFields();
    let firstInvalid = null;
    ['ime', 'telefon', 'adresa', 'grad', 'datum', 'vrijeme'].forEach((name) => {
      const message = fields.includes(name) ? validateField(name) : '';
      showFieldError(name, message);
      if (message && !firstInvalid) firstInvalid = name;
    });
    if (firstInvalid) {
      showSendError('Provjerite unesene podatke.');
      const control = $(`[data-field="${firstInvalid}"] input, [data-field="${firstInvalid}"] select`);
      control.focus({ preventScroll: true });
      control.closest('[data-field]').scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' });
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
    const subject = hasEggs() ? `Nova narudžba (${eggCount()} jaja · ${money(total())})` : 'Nova narudžba';
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
    sentDialog.close();
    $('#webshop').scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
  });

  sentDialog.addEventListener('click', (event) => {
    if (event.target === sentDialog) sentDialog.close();
  });

  /* ---------- Početno iscrtavanje ---------- */

  products.forEach(renderCard);
  renderSummary();

  const contactLink = $('[data-wa-contact]');
  contactLink.href = `https://wa.me/${whatsapp}?text=${encodeURIComponent('Zdravo, imam pitanje u vezi s Eko farmom "Jezerac".')}`;
})();
