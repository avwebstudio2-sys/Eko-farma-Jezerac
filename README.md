# Eko farma "Jezerac"

Web stranica s mini webshopom za Eko farmu "Jezerac" iz Velike Bukovice kod Travnika.
Kupac odabere proizvode i unese podatke, a stranica otvori WhatsApp s gotovom porukom za farmu.

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
| Cijene jaja | `price` kod proizvoda |
| Cijena za piliće, pilenke i ovce | `price` (sada `null`, što se prikazuje kao "Po dogovoru") |
| Sati u polju za dostavu | `deliveryHours` |

## Struktura

```
index.html        sadržaj stranice
css/styles.css    izgled i animacije
js/config.js      proizvodi, cijene i kontakt
js/shop.js        korpa, forma i poruka za WhatsApp
js/site.js        meni, otkrivanje sekcija i galerija
assets/img/       logo i fotografije
```

## Objavljivanje

Stranica radi na svakom statičkom hostingu. Za GitHub Pages: **Settings → Pages → Deploy from a branch → `main` / root**.

U `index.html` polje `og:image` pokazuje na GitHub Pages adresu. Ako stranica dobije drugu domenu, treba ga promijeniti.

## Porijeklo fotografija

- Facebook stranica farme: `farma-magla`, `pogled-magla`, `pilici-blizu`, `pilici-1`, `pilenke`
- Postojeća Lovable stranica: `farma-jutro`, `jaja`, `kokosi`, `ovce`, `janje`, `kuca`, logo
