# Q-Park Fenix overlast — Genoeg is Genoeg

Een buurt-actiesite voor bewoners rond de Veerlaan in Rotterdam-Katendrecht, opgezet om druk uit te oefenen op Q-Park inzake de structurele geluidsoverlast vanuit parkeergarage **Q-Park Fenix**. De site is specifiek voor deze ene actie gebouwd — niet generiek, niet bedoeld voor andere buurtinitiatieven.

## Wat de site doet

- **Landingspagina** met probleemschets, live teller en oproep om aan te sluiten.
- **Aansluit-formulier**: alleen postcode + huisnummer worden op de server bewaard. Geen namen, e-mailadressen, telefoonnummers, IP-adressen, cookies, analytics.
- **Persoonlijke gegevens** (naam, adres, e-mail) blijven uitsluitend in `localStorage` van de eigen browser en worden lokaal gebruikt om de brieven automatisch in te vullen.
- **Drie acties**:
  1. **Klachtbrief Q-Park** (`brief-qpark.html`) — vooraf opgesteld, vul-en-verstuur.
  2. **Klachtmelding DCMR** (`brief-dcmr.html`) — handhavings­verzoek bij DCMR Milieudienst Rijnmond.
  3. **Contacten** (`contacten.html`) — klantenservice Q-Park, MVGM Wonen Rotterdam, DCMR melddesk.
- **Colofon + privacy** (`privacy.html`) met zelf-verwijderknop (per verwijdertoken) en een knop om alle browser­gegevens te wissen.

## Architectuur

```
+-----------------------------+        +--------------------------------+
| Statische site              |        | Cloudflare Worker (API)        |
| (HTML / CSS / vanilla JS)   | -----> | q-park-overlast-api            |
| Cloudflare Pages of GitHub  |  CORS  | + Cloudflare D1                |
| Pages — gratis              |        |   q-park-overlast-db           |
|                             |        |                                |
|                             |        | uitsluitend postcode +         |
|                             |        | huisnummer worden opgeslagen   |
+-----------------------------+        +--------------------------------+
```

Geen frameworks, geen bundler, geen npm-build voor de site zelf. Eén `<script>` per pagina.

## Cloudflare-resources

| Onderdeel  | Naam                          |
|------------|-------------------------------|
| D1-database | `q-park-overlast-db`         |
| Worker     | `q-park-overlast-api`         |
| Pages-project (suggestie) | `q-park-overlast` |

## Bestandsstructuur

```
/
├── index.html              -- Landing
├── acties.html             -- Profiel + actie-hub
├── brief-qpark.html        -- Brief A (Q-Park)
├── brief-dcmr.html         -- Brief B (DCMR)
├── contacten.html          -- Contactlijst
├── privacy.html            -- Colofon + AVG-knoppen
├── assets/
│   ├── styles.css
│   ├── config.js           -- BuurtConfig.apiBase (in te vullen na deploy)
│   ├── storage.js          -- localStorage-helper
│   ├── main.js             -- counter / forms / privacy
│   └── templates.js        -- brieven-rendering
├── worker/
│   ├── worker.js           -- API (Cloudflare Worker)
│   ├── wrangler.toml       -- Worker-config (in te vullen: database_id)
│   ├── schema.sql          -- D1 schema
│   └── package.json        -- scripts: dev / deploy / db:create / db:apply
├── DEPLOYMENT.md           -- Stap-voor-stap gratis hosting
├── INSTRUCTIES.md          -- Beknopte versie
└── README.md
```

## Lokaal draaien

Een statische site werkt direct in de browser. Open `index.html` in een browser, of run een mini-webserver:

```powershell
# Python (komt op Windows mee in 3.x)
python -m http.server 8080

# of, met Node:
npx serve .
```

De counter en het aanmeldformulier doen niets totdat `assets/config.js` is bijgewerkt met de URL van een gedeployde Worker. Zie [DEPLOYMENT.md](DEPLOYMENT.md).

## Privacy in één zin

> Postcode en huisnummer staan op onze server. Verder niets. Alle overige gegevens blijven in jouw browser.
