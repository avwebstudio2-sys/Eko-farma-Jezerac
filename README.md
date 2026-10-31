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
index.html        početna: hero, cjenovnik, o nama, galerija, kontakt
webshop.html      webshop: školjke, podaci za dostavu, narudžba
css/styles.css    izgled i animacije obje stranice
js/config.js      školjke, cijene i kontakt
js/site.js        cjenovnik i galerija na početnoj, broj u korpi
js/shop.js        korpa, forma i poruka za WhatsApp
assets/img/       logo, sivi logo za pozadinu, fotografije i ikone
```

## Objavljivanje

Stranica radi na svakom statičkom hostingu. Za GitHub Pages: **Settings → Pages → Deploy from a branch → `main` / root**.

U obje HTML datoteke polje `og:image` pokazuje na GitHub Pages adresu. Ako stranica dobije drugu domenu, treba ga promijeniti.

## Fotografije

Sve fotografije su privremeno preuzete s Facebook stranice farme, dok vlasnik ne pošalje svoje.

| Gdje | Datoteka |
| --- | --- |
| Hero, u obliku jajeta | `assets/img/hero-farma.webp` (uspravna, oko 5:6) |
| O nama | `assets/img/o-nama.webp` (uspravna, oko 4:5) |
| Galerija | `assets/img/galerija/`, jedan `button.g-item` po slici u `index.html` |
