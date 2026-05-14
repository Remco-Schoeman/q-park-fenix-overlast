# Q-Park Fenix overlast — Q-Park Actie Nu!

Een buurt-actiesite voor bewoners rond de Veerlaan in Rotterdam-Katendrecht, opgezet om druk uit te oefenen op Q-Park inzake de geluidsoverlast die wordt veroorzaakt door een **defecte ventilator** in parkeergarage **Q-Park Fenix**. Q-Park geeft aan dat het vervangings­onderdeel pas medio juli wordt geleverd; de site vraagt Q-Park, DCMR en MVGM om interim-maatregelen binnen 7 dagen. De site is specifiek voor deze ene actie gebouwd — niet generiek, niet bedoeld voor andere buurtinitiatieven.

Live: <https://q-park-fenix-overlast.remco-schoeman.workers.dev/>

## Wat de site doet

- **Landingspagina** met probleemschets, live teller en oproep om aan te sluiten.
- **Aansluit-formulier**: alleen postcode + huisnummer worden op de server bewaard. Geen namen, e-mailadressen, telefoonnummers, IP-adressen, cookies, analytics.
- **Persoonlijke gegevens** (naam, adres, e-mail) blijven uitsluitend in `localStorage` van de eigen browser en worden lokaal gebruikt om de brieven automatisch in te vullen.
- **Vier sporen**:
  1. **Klachtbrief Q-Park** (`brief-qpark.html`) — vooraf opgesteld, vul-en-verstuur.
  2. **Klachtmelding DCMR** (`brief-dcmr.html`) — handhavings­verzoek bij DCMR Milieudienst Rijnmond.
  3. **Contacten** (`contacten.html`) — klantenservice Q-Park, MVGM Wonen Rotterdam, DCMR melddesk.
  4. **Geluidsdagboek** (`dagboek.html`) — datum, tijdvak, intensiteit en notitie per voorval; volledig in `localStorage`, met export als tekst of `.txt`-bestand.
- **Colofon + privacy** (`privacy.html`) met zelf-verwijderknop (per verwijdertoken) en een knop om alle browser­gegevens te wissen.

## Architectuur

```
              +----------------------------------------------+
              |  Cloudflare Worker: q-park-fenix-overlast    |
              |                                              |
              |  - statische assets (HTML/CSS/JS)            |
              |  - /api/count, /api/register, /api/admin     |
              |                                              |
              |  Binding: ASSETS (statische bestanden)       |
              |  Binding: DB    (D1: q-park-overlast-db)     |
              |  Secret:  ADMIN_KEY                          |
              +----------------------------------------------+
                              |
                              | uitsluitend
                              | postcode + huisnummer + tijd
                              v
                  +---------------------------+
                  |  D1: q-park-overlast-db   |
                  +---------------------------+
```

Eén Worker bedient zowel de statische pagina's als de API. Dezelfde origin, dus geen CORS-acrobatiek. Auto-deploy bij elke push naar `main` via de Cloudflare-Git-integratie.

## Cloudflare-resources

| Onderdeel  | Naam                          |
|------------|-------------------------------|
| Worker     | `q-park-fenix-overlast`       |
| D1-database | `q-park-overlast-db`         |
| Worker-config | [wrangler.jsonc](wrangler.jsonc) |

## Bestandsstructuur

```
/
├── index.html              -- Landing
├── acties.html             -- Profiel + actie-hub
├── brief-qpark.html        -- Brief A (Q-Park)
├── brief-dcmr.html         -- Brief B (DCMR)
├── contacten.html          -- Contactlijst
├── dagboek.html            -- Geluidsdagboek (localStorage)
├── privacy.html            -- Colofon + AVG-knoppen
├── assets/
│   ├── styles.css
│   ├── config.js           -- BuurtConfig.apiBase ("" = same-origin)
│   ├── storage.js          -- localStorage-helper
│   ├── main.js             -- counter / forms / privacy
│   ├── diary.js            -- dagboek-logica
│   └── templates.js        -- brieven-rendering
├── src/
│   └── index.js            -- Cloudflare Worker (API + assets fallback)
├── schema.sql              -- D1-schema
├── wrangler.jsonc          -- Worker-config (D1-blok uncommenten na setup)
├── package.json            -- npm scripts (dev / deploy / db:apply / secret:admin)
├── DEPLOYMENT.md           -- Stap-voor-stap gratis hosting
├── INSTRUCTIES.md          -- Beknopte versie
└── README.md
```

## Lokaal draaien

Volledig lokaal (inclusief lokale D1-database):

```powershell
npm install
npm run db:apply:local
npm run dev
```

Wrangler serveert site én API op `http://localhost:8787`.

Alleen de statische site, zonder de API:

```powershell
python -m http.server 8080
```

Open <http://localhost:8080/>. De counter geeft "—" omdat er geen Worker tussen zit.

## Privacy in één zin

> Postcode en huisnummer staan op onze server. Verder niets. Alle overige gegevens blijven in jouw browser.
