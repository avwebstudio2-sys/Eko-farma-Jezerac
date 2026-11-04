# Eko farma "Jezerac"

Web stranica i mini webshop za Eko farmu "Jezerac" iz Velike Bukovice kod Travnika.
Kupac odabere školjke i unese podatke, a stranica otvori WhatsApp s gotovom porukom za farmu.

Čisti HTML, CSS i JavaScript: nema instalacije ni koraka izgradnje na serveru.

## Pokretanje

Pokrenuti lokalni server u ovoj mapi (linkovi na početnu vode na `./`, pa direktno otvaranje datoteke nije dovoljno):

```bash
python -m http.server 4173
```

## Izmjene koje se najčešće rade

Sve je u [`js/config.js`](js/config.js):

| Šta | Polje |
| --- | --- |
| Adresa stranice (domena) | `siteUrl` |
| Broj na koji stižu narudžbe | `whatsapp` (međunarodni format, bez `+` i razmaka) |
| Cijene i školjke | `products` |
| Sati u polju za dostavu | `deliveryHours` |

Nakon izmjene cijena, školjki ili domene pokrenuti:

```bash
node scripts/prerender.js
```

Skripta upisuje kartice školjki u `webshop.html` (da ih pretraživači vide bez JavaScripta), JSON-LD podatke o farmi i cijenama, canonical i Open Graph adrese, te pravi `robots.txt` i `sitemap.xml`. Ako se zaboravi, kupci i dalje vide tačne cijene iz `config.js`, ali pretraživači vide stare.

## SEO

- Naslov, opis, canonical, robots, Open Graph i Twitter oznake su u `<head>` obje stranice.
- Podaci o farmi (adresa, telefoni, područje dostave, način plaćanja, cijene) su u JSON-LD bloku između oznaka `json-ld:start` i `json-ld:end`. Ne mijenjati ih ručno, nego kroz `scripts/prerender.js`.
- `vercel.json` preusmjerava `/index.html` na `/` i postavlja keširanje za slike i fontove.
- Fontovi (Quicksand i Nunito, licenca SIL OFL u `assets/fonts`) su na samoj stranici, bez učitavanja s Google Fonts.
- Slika za dijeljenje (`assets/img/og.jpg`) je prvi ekran početne. Kad se promijeni, povećati `?v=` u `OG_IMAGE` u `scripts/prerender.js` i pokrenuti skriptu, da je Facebook i WhatsApp preuzmu ponovo.

## Sigurnost

`vercel.json` šalje sigurnosna zaglavlja za sve stranice: Content-Security-Policy (skripte, stilovi, fontovi i slike samo sa stranice, mapa samo s Googlea, bez ugrađivanja stranice u tuđi okvir), X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy i Cross-Origin-Opener-Policy.

Novi vanjski sadržaj (skripta, font, iframe, analitika) neće raditi dok se njegova adresa ne doda u Content-Security-Policy.

## Struktura

```
favicon.ico        ikona preglednika, amblem iz logotipa farme (i favicon-32.png, favicon-192.png u assets/img)
index.html         početna: hero s kombijem koji vodi u webshop, o nama, pokretna traka, galerija, kontakt s mapom
webshop.html       webshop: kartice školjki, korpa, podaci za dostavu
robots.txt         pravi ga scripts/prerender.js
sitemap.xml        pravi ga scripts/prerender.js
vercel.json        sigurnosna zaglavlja, preusmjerenje /index.html na / i keširanje
css/styles.css     izgled i animacije obje stranice, s fontovima
js/config.js       domena, školjke, cijene i kontakt
js/site.js         zaglavlje na skrolu, galerija, dijalozi, broj u korpi
js/pickers.js      iskočni meniji za datum i sat, na bosanskom
js/cards.js        HTML kartica školjki (koristi ga i shop.js i scripts/prerender.js)
js/shop.js         korpa, forma i poruka za WhatsApp
scripts/           prerender.js (ne objavljuje se, vidi .vercelignore)
assets/fonts/      Quicksand i Nunito, latinica i slova č, ć, đ, š, ž
assets/img/        logo, svijetli logo, logo studija, fotografije, ikone i slika za dijeljenje (og.jpg)
```

## Objavljivanje

Stranica se objavljuje na Vercelu iz grane `main`. Glavna (kanonska) adresa je https://ekofarmajezerac.com, a privremena https://eko-farma-jezerac.vercel.app.

Domena je registrovana kod Hostingera. Da bi radila, na Vercelu (Project, Settings, Domains) dodati `ekofarmajezerac.com` i `www.ekofarmajezerac.com`, u Hostingerovom DNS-u upisati zapise koje Vercel tada prikaže, pa na Vercelu podesiti da www i vercel.app adresa preusmjeravaju na `ekofarmajezerac.com`.

Za promjenu domene: promijeniti `siteUrl` u `js/config.js`, pokrenuti `node scripts/prerender.js` i objaviti.

## Fotografije

Sve fotografije je poslao vlasnik farme.

| Gdje | Datoteka |
| --- | --- |
| Hero | `assets/img/hero.webp` (položena, 4:3) |
| O nama, pravougaona slika | `assets/img/o-nama.webp` (uspravna, oko 4:5) |
| O nama, slika u obliku jajeta | `assets/img/o-nama-pile.webp` |
| Brda s farmom i kućama oko ceste u heroju | `assets/img/brda.svg`, a na telefonu `assets/img/brda-telefon.svg` |
| Galerija | `assets/img/galerija/`: original (do 1400 px) za pregled preko cijelog ekrana, te `-800` i `-480` verzije za sličice; jedan `button.g-item` po slici u `index.html` |
| Logo u zaglavlju | `assets/img/logo-320.webp` i `logo-svijetli-320.webp` (veći `logo.webp` je za JSON-LD) |
