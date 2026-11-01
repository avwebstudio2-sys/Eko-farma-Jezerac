/* Birači datuma i sata: iskočni meniji na bosanskom, umjesto onih iz preglednika. */
(function () {
  'use strict';

  // Nazivi su ovdje jer preglednici nemaju uvijek bosanski jezik u Intl podacima.
  const MONTHS = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni', 'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];
  const WEEK = ['Po', 'Ut', 'Sr', 'Če', 'Pe', 'Su', 'Ne'];

  const pad2 = (n) => String(n).padStart(2, '0');
  const toIso = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  const fromIso = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  /* ---------- Zajedničko: otvaranje, zatvaranje i položaj menija ---------- */

  let current = null;

  document.addEventListener('pointerdown', (event) => {
    if (current && !current.root.contains(event.target)) current.close();
  });

  function place(button, pop) {
    pop.classList.remove('is-up');
    const header = document.querySelector('.top').offsetHeight;
    const box = button.getBoundingClientRect();
    const below = window.innerHeight - box.bottom;
    const above = box.top - header;
    if (pop.offsetHeight + 12 > below && above > below) pop.classList.add('is-up');
    const rect = pop.getBoundingClientRect();
    if (rect.top < header || rect.bottom > window.innerHeight) pop.scrollIntoView({ block: 'nearest' });
  }

  function createMenu(root, onOpen) {
    const button = root.querySelector('.picker-btn');
    const pop = root.querySelector('.picker-pop');

    const menu = {
      root,
      open() {
        if (current) current.close();
        current = menu;
        pop.hidden = false;
        button.setAttribute('aria-expanded', 'true');
        onOpen();
        place(button, pop);
      },
      close(refocus = false) {
        if (pop.hidden) return;
        pop.hidden = true;
        button.setAttribute('aria-expanded', 'false');
        if (current === menu) current = null;
        if (refocus) button.focus({ preventScroll: true });
      },
    };

    button.addEventListener('click', () => {
      if (pop.hidden) menu.open(); else menu.close(true);
    });
    root.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !pop.hidden) {
        event.stopPropagation();
        menu.close(true);
      }
    });
    root.addEventListener('focusout', (event) => {
      if (event.relatedTarget && !root.contains(event.relatedTarget)) menu.close();
    });

    return menu;
  }

  /* ---------- Datum ---------- */

  function createDatePicker(root, { min, format }) {
    const input = root.querySelector('input');
    const button = root.querySelector('.picker-btn');
    const text = root.querySelector('.picker-text');
    const pop = root.querySelector('.picker-pop');
    const placeholder = text.textContent;

    pop.innerHTML = `<div class="cal-head">
        <button class="cal-nav" type="button" data-cal-prev aria-label="Prethodni mjesec"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button>
        <strong class="cal-title" aria-live="polite"></strong>
        <button class="cal-nav" type="button" data-cal-next aria-label="Sljedeći mjesec"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button>
      </div>
      <div class="cal-grid"></div>`;

    const title = pop.querySelector('.cal-title');
    const grid = pop.querySelector('.cal-grid');
    const prev = pop.querySelector('[data-cal-prev]');
    let view = new Date();

    // Iscrtava prikazani mjesec i vraća dan koji treba dobiti fokus.
    function render(wanted) {
      const minIso = min();
      const today = toIso(new Date());
      const year = view.getFullYear();
      const month = view.getMonth();
      title.textContent = `${MONTHS[month]} ${year}`;
      prev.disabled = toIso(new Date(year, month, 0)) < minIso;

      const blanks = (new Date(year, month, 1).getDay() + 6) % 7;
      const count = new Date(year, month + 1, 0).getDate();
      const days = [];
      for (let d = 1; d <= count; d += 1) {
        const iso = toIso(new Date(year, month, d));
        days.push(`<button class="cal-day" type="button" tabindex="-1" data-date="${iso}" aria-label="${d}. ${MONTHS[month].toLowerCase()} ${year}."`
          + `${iso < minIso ? ' disabled' : ''}${iso === input.value ? ' aria-pressed="true"' : ''}${iso === today ? ' aria-current="date"' : ''}>${d}</button>`);
      }
      grid.innerHTML = WEEK.map((name) => `<span class="cal-dow">${name}</span>`).join('') + '<span></span>'.repeat(blanks) + days.join('');

      const target = grid.querySelector(`[data-date="${wanted}"]:not(:disabled)`)
        || grid.querySelector('[aria-pressed="true"]:not(:disabled)')
        || grid.querySelector('.cal-day:not(:disabled)');
      if (target) target.tabIndex = 0;
      return target;
    }

    const showMonth = (date) => {
      view = new Date(date.getFullYear(), date.getMonth(), 1);
    };

    const menu = createMenu(root, () => {
      showMonth(fromIso(input.value || min()));
      const target = render(input.value);
      if (target) target.focus({ preventScroll: true });
    });

    function changeMonth(step) {
      showMonth(new Date(view.getFullYear(), view.getMonth() + step, 1));
      render();
    }

    prev.addEventListener('click', () => changeMonth(-1));
    pop.querySelector('[data-cal-next]').addEventListener('click', () => changeMonth(1));

    function setValue(iso) {
      input.value = iso;
      text.textContent = format(iso);
      button.classList.remove('is-empty');
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    grid.addEventListener('click', (event) => {
      const day = event.target.closest('[data-date]');
      if (!day || day.disabled) return;
      setValue(day.dataset.date);
      menu.close(true);
    });

    grid.addEventListener('keydown', (event) => {
      const day = event.target.closest('[data-date]');
      if (!day) return;
      const date = fromIso(day.dataset.date);
      const y = date.getFullYear();
      const m = date.getMonth();
      const d = date.getDate();
      const weekday = (date.getDay() + 6) % 7;
      const steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -weekday, End: 6 - weekday };
      const months = { PageUp: -1, PageDown: 1 };

      let next;
      if (steps[event.key] !== undefined) {
        next = new Date(y, m, d + steps[event.key]);
      } else if (months[event.key] !== undefined) {
        const last = new Date(y, m + months[event.key] + 1, 0).getDate();
        next = new Date(y, m + months[event.key], Math.min(d, last));
      } else {
        return;
      }

      event.preventDefault();
      if (toIso(next) < min()) return;
      showMonth(next);
      const target = render(toIso(next));
      if (target) target.focus();
    });

    return {
      set(iso) {
        input.value = iso;
        text.textContent = format(iso);
        button.classList.remove('is-empty');
      },
      clear() {
        input.value = '';
        text.textContent = placeholder;
        button.classList.add('is-empty');
      },
    };
  }

  /* ---------- Sat ---------- */

  function createHourSelect(root, { hours, isDisabled = () => false, onChange = () => {} }) {
    const input = root.querySelector('input');
    const button = root.querySelector('.picker-btn');
    const text = root.querySelector('.picker-text');
    const pop = root.querySelector('.picker-pop');
    const placeholder = text.textContent;
    const label = button.getAttribute('aria-label');

    const enabled = () => [...pop.querySelectorAll('[role="option"]:not([aria-disabled])')];

    function activate(option) {
      pop.querySelectorAll('.is-active').forEach((el) => el.classList.remove('is-active'));
      if (!option) return;
      option.classList.add('is-active');
      pop.setAttribute('aria-activedescendant', option.id);
      const bottom = option.offsetTop + option.offsetHeight;
      if (option.offsetTop < pop.scrollTop) pop.scrollTop = option.offsetTop - 6;
      else if (bottom > pop.scrollTop + pop.clientHeight) pop.scrollTop = bottom - pop.clientHeight + 6;
    }

    const menu = createMenu(root, () => {
      pop.innerHTML = hours.map((hour) => `<li role="option" id="${input.id}-${hour}" data-hour="${hour}" aria-selected="${String(hour) === input.value}"`
        + `${isDisabled(hour) ? ' aria-disabled="true"' : ''}>${pad2(hour)}:00</li>`).join('');
      pop.focus({ preventScroll: true });
      activate(pop.querySelector('[aria-selected="true"]') || enabled()[0]);
    });

    function choose(hour) {
      input.value = hour;
      text.textContent = `${pad2(hour)}:00`;
      button.classList.remove('is-empty');
      button.setAttribute('aria-label', `${label}: ${text.textContent}`);
      onChange(Number(hour));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      menu.close(true);
    }

    pop.addEventListener('click', (event) => {
      const option = event.target.closest('[data-hour]');
      if (option && !option.hasAttribute('aria-disabled')) choose(option.dataset.hour);
    });

    button.addEventListener('keydown', (event) => {
      if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && pop.hidden) {
        event.preventDefault();
        menu.open();
      }
    });

    pop.addEventListener('keydown', (event) => {
      const list = enabled();
      const at = list.findIndex((el) => el.classList.contains('is-active'));
      const moves = { ArrowDown: Math.min(at + 1, list.length - 1), ArrowUp: Math.max(at - 1, 0), Home: 0, End: list.length - 1 };

      if (moves[event.key] !== undefined) {
        event.preventDefault();
        activate(list[moves[event.key]]);
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (list[at]) choose(list[at].dataset.hour);
      } else if (event.key === 'Tab') {
        menu.close();
      }
    });

    return {
      clear() {
        input.value = '';
        text.textContent = placeholder;
        button.classList.add('is-empty');
        button.setAttribute('aria-label', label);
      },
    };
  }

  window.FarmaPickers = { createDatePicker, createHourSelect };
})();
