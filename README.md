# Eko farma "Jezerac"

Web stranica i mini webshop za Eko farmu "Jezerac" iz Velike Bukovice kod Travnika.
Kupac odabere školjke i unese podatke, a stranica otvori WhatsApp s gotovom porukom za farmu.

Čisti HTML, CSS i JavaScript: nema instalacije ni koraka izgradnje.

## Pokretanje

Dovoljno je otvoriti `index.html` ili pokrenuti lokalni server:

```bash
python -m http.server 4173
```

## Izmjene koje se najčešće rade

Sve je u [`js/config.js`](js/config.js):

| Šta | Polje |
| --- | --- |
| Broj na koji stižu narudžbe | `whatsapp` (međunarodni format, bez `+` i razmaka) |
| Cijene školjki | `price` kod proizvoda |
| Sati u polju za dostavu | `deliveryHours` |

## Struktura

```
index.html        početna: hero, poziv na webshop, o nama, galerija, kontakt s mapom
webshop.html      webshop: kartice školjki, korpa, podaci za dostavu
css/styles.css    izgled i animacije obje stranice
js/config.js      školjke, cijene i kontakt
js/site.js        zaglavlje na skrolu, galerija na početnoj, broj u korpi
js/shop.js        kartice, korpa, forma i poruka za WhatsApp
assets/img/       logo, svijetli logo za hero, sivi logo za pozadinu, fotografije i ikone
```

## Objavljivanje

Glavna adresa stranice je https://eko-farma-jezerac.vercel.app (Vercel, grana `main`).

U obje HTML datoteke polje `og:image` pokazuje na tu adresu. Ako stranica dobije drugu domenu, treba ga promijeniti.

## Fotografije

Sve fotografije su privremeno preuzete s Facebook stranice farme, dok vlasnik ne pošalje svoje.

| Gdje | Datoteka |
| --- | --- |
| Hero, pozadina na računaru | `assets/img/hero-siroka.webp` (položena, oko 16:9) |
| Hero, pozadina na telefonu | `assets/img/hero-farma.webp` (uspravna, oko 5:6) |
| O nama, veće jaje | `assets/img/o-nama.webp` (uspravna, oko 4:5) |
| O nama, manje jaje | `assets/img/galerija/pilici.webp` |
| Galerija | `assets/img/galerija/`, jedan `button.g-item` po slici u `index.html` |
