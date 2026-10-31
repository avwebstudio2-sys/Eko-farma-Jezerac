/*
 * Sve što se najčešće mijenja nalazi se ovdje: broj za WhatsApp, cijene i proizvodi.
 * Nakon izmjene dovoljno je osvježiti stranicu, nema dodatnog koraka.
 */
window.FARMA = {
  // Broj na koji stižu narudžbe: međunarodni format, bez "+" i razmaka.
  whatsapp: '38761366168',

  phones: [
    { label: '061 366 168', href: 'tel:+38761366168' },
    { label: '061 278 300', href: 'tel:+38761278300' },
  ],
  email: 'ekofarma.jezerac@gmail.com',

  // Sati koji se nude u polju "Vremenski period dostave".
  deliveryHours: { from: 7, to: 21 },

  products: [
    // Jaja: fiksna cijena, besplatna dostava. tray = [kolona, redova], eggScale = veličina jajeta na crtežu.
    { id: 'mala', group: 'jaja', name: 'Mala školjka', desc: '10 jaja', price: 4, eggs: 10, tray: [5, 2], eggScale: 0.94, wide: true, max: 99 },
    { id: 'S', group: 'jaja', name: 'Velika školjka', klasa: 'S', desc: '30 jaja', price: 6, eggs: 30, tray: [6, 5], eggScale: 0.72, max: 99 },
    { id: 'M', group: 'jaja', name: 'Velika školjka', klasa: 'M', desc: '30 jaja', price: 9, eggs: 30, tray: [6, 5], eggScale: 0.84, max: 99 },
    { id: 'L', group: 'jaja', name: 'Velika školjka', klasa: 'L', desc: '30 jaja', price: 10, eggs: 30, tray: [6, 5], eggScale: 0.94, max: 99 },
    { id: 'XL', group: 'jaja', name: 'Velika školjka', klasa: 'XL', desc: '30 jaja', price: 12, eggs: 30, tray: [6, 5], eggScale: 1.05, max: 99 },

    // Životinje: bez cijene (price: null), cijena i termin se dogovaraju s kupcem.
    { id: 'pilici', group: 'dogovor', name: 'Jednodnevni pilići', desc: 'Domaći, prirodno hranjeni. Pasmina Leghorn.', price: null, image: 'assets/img/pilici-blizu.webp', imageSize: [900, 606], alt: 'Jednodnevni pilići na farmi', max: 999 },
    { id: 'pilenke', group: 'dogovor', name: '18-sedmične pilenke', desc: 'Mlade koke iz našeg uzgoja.', price: null, image: 'assets/img/pilenke.webp', imageSize: [538, 400], alt: 'Pilenke u objektu na farmi', max: 999 },
    { id: 'ovce', group: 'dogovor', name: 'Janjad, ovnovi i kurbani', desc: 'Ovce pasmine Romanovska.', price: null, image: 'assets/img/janje.webp', imageSize: [900, 900], alt: 'Janje uz majku', max: 99 },
  ],
};
