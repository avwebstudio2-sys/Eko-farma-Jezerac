/*
 * Sve što se najčešće mijenja nalazi se ovdje: broj za WhatsApp, cijene i školjke.
 * Nakon izmjene dovoljno je osvježiti stranicu, nema dodatnog koraka.
 */
window.FARMA = {
  // Broj farme za kontakt i narudžbe: međunarodni format, bez "+" i razmaka.
  whatsapp: '38761366168',
  // PRIVREMENO, za test dostave narudžbi. Poslije testa obrisati ovaj red, pa narudžbe opet idu na broj iznad.
  orderWhatsapp: '38762287834',
  email: 'ekofarma.jezerac@gmail.com',

  // Sati koji se nude u polju "Vrijeme dostave".
  deliveryHours: { from: 7, to: 21 },

  // badge = oznaka na kartici, tray = [kolona, redova] i eggScale = veličina jajeta na crtežu školjke.
  products: [
    { id: 'mala', name: 'Mala školjka', badge: 'Mala', desc: '10 jaja', price: 4, eggs: 10, tray: [5, 2], eggScale: 0.94, max: 99 },
    { id: 'S', name: 'Velika školjka S', badge: 'S', desc: '30 jaja', price: 6, eggs: 30, tray: [6, 5], eggScale: 0.72, max: 99 },
    { id: 'M', name: 'Velika školjka M', badge: 'M', desc: '30 jaja', price: 9, eggs: 30, tray: [6, 5], eggScale: 0.84, max: 99 },
    { id: 'L', name: 'Velika školjka L', badge: 'L', desc: '30 jaja', price: 10, eggs: 30, tray: [6, 5], eggScale: 0.94, max: 99 },
    { id: 'XL', name: 'Velika školjka XL', badge: 'XL', desc: '30 jaja', price: 12, eggs: 30, tray: [6, 5], eggScale: 1.05, max: 99 },
  ],
};
