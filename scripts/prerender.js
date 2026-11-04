/*
 * Upisuje u HTML ono što pretraživači trebaju vidjeti i bez JavaScripta:
 * kartice školjki u webshopu, JSON-LD podatke o farmi i proizvodima, adresu stranice
 * (canonical, og:url, slike za dijeljenje), te pravi robots.txt i sitemap.xml.
 *
 * Pokrenuti nakon izmjene cijena, školjki ili domene u js/config.js:
 *   node scripts/prerender.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
globalThis.window = {};
require(path.join(ROOT, 'js/config.js'));
require(path.join(ROOT, 'js/cards.js'));

const { products, siteUrl, email } = window.FARMA;
const { cardsMarkup, productsKey } = window.FarmaCards;
const SITE = siteUrl.replace(/\/$/, '');
const NAME = 'Eko farma "Jezerac"';
const FARM_ID = `${SITE}/#farma`;
const SITE_ID = `${SITE}/#web`;
// Broj verzije natjera Facebook i WhatsApp da preuzmu novu sliku umjesto zapamćene.
const OG_IMAGE = `${SITE}/assets/img/og.jpg?v=2`;

// Stranice koje se indeksiraju, s putanjom kakva ide u canonical i sitemap.
const PAGES = [
  { file: 'index.html', path: '/' },
  { file: 'webshop.html', path: '/webshop.html' },
];

/* ---------- Podaci o farmi (isti kao na stranici: kontakt sekcija i podnožje) ---------- */

const prices = products.map((p) => p.price);
const farm = {
  '@type': 'LocalBusiness',
  '@id': FARM_ID,
  name: NAME,
  description: 'Proizvodnja, prodaja i dostava domaćih, konzumnih jaja na području Travnika.',
  url: `${SITE}/`,
  logo: `${SITE}/assets/img/logo.webp`,
  image: [OG_IMAGE, `${SITE}/assets/img/hero.webp`],
  telephone: '+387 61 366 168',
  email,
  foundingDate: '2025',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Velika Bukovica bb',
    addressLocality: 'Travnik',
    addressCountry: 'BA',
  },
  areaServed: { '@type': 'City', name: 'Travnik' },
  hasMap: 'https://www.google.com/maps/search/?api=1&query=Velika+Bukovica%2C+Travnik',
  contactPoint: ['+387 61 366 168', '+387 61 278 300'].map((telephone) => ({
    '@type': 'ContactPoint',
    telephone,
    contactType: 'sales',
    areaServed: 'BA',
    availableLanguage: 'bs',
  })),
  priceRange: `${Math.min(...prices)}–${Math.max(...prices)} KM`,
  currenciesAccepted: 'BAM',
  paymentAccepted: 'Gotovina pri preuzimanju (pouzećem)',
  sameAs: ['https://www.facebook.com/p/Eko-farma-Jezerac-61575950756251/'],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Domaća jaja u školjkama',
    itemListElement: [
      ...products.map((p) => ({
        '@type': 'Offer',
        price: String(p.price),
        priceCurrency: 'BAM',
        url: `${SITE}/webshop.html`,
        itemOffered: { '@type': 'Product', name: p.name, description: `Školjka domaćih konzumnih jaja (${p.desc})` },
      })),
      {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'BAM',
        itemOffered: { '@type': 'Service', name: 'Dostava jaja na kućnu adresu', areaServed: { '@type': 'City', name: 'Travnik' } },
      },
    ],
  },
};

const website = {
  '@type': 'WebSite',
  '@id': SITE_ID,
  url: `${SITE}/`,
  name: NAME,
  inLanguage: 'bs-Latn',
  publisher: { '@id': FARM_ID },
};

const titleOf = (html) => html.match(/<title>([^<]*)<\/title>/)[1];

const webpage = (page, html, extra = {}) => ({
  '@type': 'WebPage',
  '@id': `${SITE}${page.path}#stranica`,
  url: `${SITE}${page.path}`,
  name: titleOf(html),
  inLanguage: 'bs-Latn',
  isPartOf: { '@id': SITE_ID },
  about: { '@id': FARM_ID },
  ...extra,
});

function graphFor(page, html) {
  if (page.file === 'index.html') {
    return [farm, website, webpage(page, html, { primaryImageOfPage: { '@type': 'ImageObject', url: `${SITE}/assets/img/hero.webp` } })];
  }
  return [
    farm,
    website,
    webpage(page, html, { breadcrumb: { '@id': `${SITE}${page.path}#put` } }),
    {
      '@type': 'BreadcrumbList',
      '@id': `${SITE}${page.path}#put`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Početna', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Webshop', item: `${SITE}${page.path}` },
      ],
    },
    {
      '@type': 'ItemList',
      name: 'Školjke s jajima',
      itemListElement: products.map((p, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: p.name,
          description: `Školjka domaćih konzumnih jaja (${p.desc})`,
          brand: { '@type': 'Brand', name: NAME },
          offers: {
            '@type': 'Offer',
            price: String(p.price),
            priceCurrency: 'BAM',
            url: `${SITE}${page.path}`,
            seller: { '@id': FARM_ID },
          },
        },
      })),
    },
  ];
}

/* ---------- Upisivanje u HTML ---------- */

function replaceOnce(html, pattern, replacement, label) {
  if (!pattern.test(html)) throw new Error(`Nije pronađeno: ${label}`);
  return html.replace(pattern, replacement);
}

for (const page of PAGES) {
  const file = path.join(ROOT, page.file);
  let html = fs.readFileSync(file, 'utf8');
  const url = `${SITE}${page.path}`;

  html = replaceOnce(html, /<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`, 'canonical');
  html = replaceOnce(html, /<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`, 'og:url');
  html = replaceOnce(html, /<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${OG_IMAGE}">`, 'og:image');
  html = replaceOnce(html, /<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${OG_IMAGE}">`, 'twitter:image');

  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graphFor(page, html) }, null, 2).replace(/</g, '\\u003c');
  html = replaceOnce(
    html,
    /<!-- json-ld:start -->[\s\S]*?<!-- json-ld:end -->/,
    `<!-- json-ld:start -->\n  <script type="application/ld+json">\n${json}\n  </script>\n  <!-- json-ld:end -->`,
    'json-ld oznake',
  );

  if (page.file === 'webshop.html') {
    html = replaceOnce(html, /<div class="products" data-products[^>]*>/, `<div class="products" data-products data-key="${productsKey(products)}">`, 'lista proizvoda');
    html = replaceOnce(
      html,
      /<!-- proizvodi:start -->[\s\S]*?<!-- proizvodi:end -->/,
      () => `<!-- proizvodi:start -->${cardsMarkup(products)}\n            <!-- proizvodi:end -->`,
      'oznake za proizvode',
    );
  }

  fs.writeFileSync(file, html);
  console.log('upisano:', page.file);
}

/* ---------- robots.txt i sitemap.xml ---------- */

fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
fs.writeFileSync(
  path.join(ROOT, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + PAGES.map((page) => `  <url>\n    <loc>${SITE}${page.path}</loc>\n  </url>\n`).join('')
    + '</urlset>\n',
);
console.log('upisano: robots.txt, sitemap.xml');
