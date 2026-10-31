/*
 * Sve što se najčešće mijenja nalazi se ovdje: broj za WhatsApp, cijene i školjke.
 * Nakon izmjene dovoljno je osvježiti stranicu, nema dodatnog koraka.
 */
window.FARMA = {
  // Broj na koji stižu narudžbe: međunarodni format, bez "+" i razmaka.
  whatsapp: '38761366168',
  email: 'ekofarma.jezerac@gmail.com',

  // Sati koji se nude u polju "Vrijeme dostave".
  deliveryHours: { from: 7, to: 21 },

  // mark = oznaka na jajetu, egg = veličina jajeta na crtežu, tone = boja polja (beige, sand, sage, green, forest).
  products: [
    { id: 'mala', name: 'Mala školjka', desc: '10 jaja', price: 4, eggs: 10, mark: '10', egg: 0.62, tone: 'beige', max: 99 },
    { id: 'S', name: 'Velika školjka S', desc: '30 jaja', price: 6, eggs: 30, mark: 'S', egg: 0.62, tone: 'sand', max: 99 },
    { id: 'M', name: 'Velika školjka M', desc: '30 jaja', price: 9, eggs: 30, mark: 'M', egg: 0.74, tone: 'sage', max: 99 },
    { id: 'L', name: 'Velika školjka L', desc: '30 jaja', price: 10, eggs: 30, mark: 'L', egg: 0.87, tone: 'green', max: 99 },
    { id: 'XL', name: 'Velika školjka XL', desc: '30 jaja', price: 12, eggs: 30, mark: 'XL', egg: 1, tone: 'forest', max: 99 },
  ],
};
