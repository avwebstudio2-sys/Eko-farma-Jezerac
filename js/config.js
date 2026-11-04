/*
 * Sve što se najčešće mijenja nalazi se ovdje: broj za WhatsApp, cijene i školjke.
 * Nakon izmjene pokrenuti "node scripts/prerender.js", da i HTML za pretraživače dobije nove cijene.
 */
window.FARMA = {
  // Javna adresa stranice, bez "/" na kraju. Nakon promjene (npr. prelazak na vlastitu domenu)
  // pokrenuti "node scripts/prerender.js", koji je upiše u HTML, robots.txt i sitemap.xml.
  siteUrl: 'https://eko-farma-jezerac.vercel.app',

  // Broj na koji stižu narudžbe: međunarodni format, bez "+" i razmaka.
  whatsapp: '38761366168',
  email: 'ekofarma.jezerac@gmail.com',

  // Sati koji se nude u polju "Vrijeme dostave".
  deliveryHours: { from: 7, to: 23 },

  // badge = oznaka na kartici, tray = [kolona, redova] i eggScale = veličina jajeta na crtežu školjke.
  products: [
    { id: 'mala', name: 'Mala školjka', badge: 'Mala', desc: '10 jaja', price: 4, eggs: 10, tray: [5, 2], eggScale: 0.94, max: 99 },
    { id: 'S', name: 'Velika školjka S', badge: 'S', desc: '30 jaja', price: 6, eggs: 30, tray: [6, 5], eggScale: 0.72, max: 99 },
    { id: 'M', name: 'Velika školjka M', badge: 'M', desc: '30 jaja', price: 9, eggs: 30, tray: [6, 5], eggScale: 0.84, max: 99 },
    { id: 'L', name: 'Velika školjka L', badge: 'L', desc: '30 jaja', price: 10, eggs: 30, tray: [6, 5], eggScale: 0.94, max: 99 },
    { id: 'XL', name: 'Velika školjka XL', badge: 'XL', desc: '30 jaja', price: 12, eggs: 30, tray: [6, 5], eggScale: 1.05, max: 99 },
  ],
};
