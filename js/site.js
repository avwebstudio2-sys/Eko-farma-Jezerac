/* Navigacija, otkrivanje sekcija pri skrolanju i pregled galerije. */
(function () {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Meni na telefonu ---------- */

  const toggle = $('[data-nav-toggle]');
  const nav = $('#main-nav');

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Zatvori meni' : 'Otvori meni');
  }

  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      setMenu(false);
      toggle.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (nav.classList.contains('is-open') && !event.target.closest('[data-header]')) setMenu(false);
  });

  /* ---------- Zaglavlje i parallax fotografije ---------- */

  const header = $('[data-header]');
  const heroImage = $('[data-parallax]');
  let ticking = false;

  function onScroll() {
    ticking = false;
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 12);
    if (heroImage && !reduceMotion.matches && y < 900) {
      heroImage.style.setProperty('--parallax', `${Math.round(y * 0.06)}px`);
    }
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  /* ---------- Aktivna stavka menija i otkrivanje sekcija ---------- */

  const revealItems = $$('[data-reveal]');

  if ('IntersectionObserver' in window) {
    const links = new Map($$('a', nav).map((link) => [link.getAttribute('href').slice(1), link]));
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const link = links.get(entry.target.id);
        if (!link) return;
        link.classList.toggle('is-active', entry.isIntersecting);
        if (entry.isIntersecting) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) sectionObserver.observe(section);
    });

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-in'));
  }

  /* ---------- Galerija ---------- */

  const lightbox = $('#lightbox');
  const lbImage = $('[data-lb-img]');
  const lbCaption = $('[data-lb-caption]');
  const items = $$('[data-gallery] .g-item');
  let current = 0;

  function showImage(index) {
    current = (index + items.length) % items.length;
    const item = items[current];
    const thumb = $('img', item);
    lbImage.src = item.dataset.full;
    lbImage.alt = thumb.alt;
    lbCaption.textContent = $('span', item).textContent;
  }

  items.forEach((item, index) => {
    item.addEventListener('click', () => {
      showImage(index);
      lightbox.showModal();
    });
  });

  $('[data-lb-close]').addEventListener('click', () => lightbox.close());
  $('[data-lb-prev]').addEventListener('click', () => showImage(current - 1));
  $('[data-lb-next]').addEventListener('click', () => showImage(current + 1));
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') showImage(current - 1);
    if (event.key === 'ArrowRight') showImage(current + 1);
  });
  lightbox.addEventListener('close', () => {
    if (items[current]) items[current].focus({ preventScroll: true });
  });

  /* ---------- Godina u podnožju ---------- */

  $('[data-year]').textContent = new Date().getFullYear();
})();
