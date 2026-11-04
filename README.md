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
favicon.ico       ikona preglednika, amblem iz logotipa farme (i favicon-32.png, favicon-192.png u assets/img)
index.html        početna: hero s kamionom koji vodi u webshop, pokretna traka, o nama, galerija, kontakt s mapom
webshop.html      webshop: kartice školjki, korpa, podaci za dostavu
css/styles.css    izgled i animacije obje stranice
js/config.js      školjke, cijene i kontakt
js/site.js        zaglavlje na skrolu, galerija na početnoj, broj u korpi
js/pickers.js     iskočni meniji za datum i sat, na bosanskom
js/shop.js        kartice, korpa, forma i poruka za WhatsApp
assets/img/       logo, svijetli logo za hero, sivi logo za pozadinu, logo studija, fotografije i ikone
```

## Objavljivanje

Glavna adresa stranice je https://eko-farma-jezerac.vercel.app (Vercel, grana `main`).

U obje HTML datoteke polje `og:image` pokazuje na tu adresu. Ako stranica dobije drugu domenu, treba ga promijeniti.

## Fotografije

Sve fotografije je poslao vlasnik farme.

| Gdje | Datoteka |
| --- | --- |
| Hero | `assets/img/hero.webp` (položena, 4:3) |
| O nama, pravougaona slika | `assets/img/o-nama.webp` (uspravna, oko 4:5) |
| O nama, slika u obliku jajeta | `assets/img/o-nama-pile.webp` |
| Brda s farmom i kućama oko ceste u heroju | `assets/img/brda.svg`, a na telefonu `assets/img/brda-telefon.svg` |
| Galerija | `assets/img/galerija/`, jedan `button.g-item` po slici u `index.html` |
