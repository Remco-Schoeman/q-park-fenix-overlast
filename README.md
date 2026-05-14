# Buurtdossier — Genoeg is Genoeg

Buurt-mobilisatie tegen geluidsoverlast van **Q-Park Fenix** op de Veerlaan in Rotterdam-Katendrecht. Statische site + minimalistische backend, volledig gratis te hosten.

## Wat de site doet

- **Landingspagina** met probleemschets, live teller en oproep om aan te sluiten.
- **Aansluit-formulier**: enkel postcode + huisnummer worden op de server bewaard. Geen namen, e-mailadressen, telefoonnummers, IP-adressen, cookies, analytics.
- **Persoonlijke gegevens** (naam, adres, e-mail) blijven uitsluitend in `localStorage` van de eigen browser en worden gebruikt om de brieven automatisch in te vullen.
- **Drie acties**:
  1. **Klachtbrief Q-Park** (`brief-qpark.html`) — vooraf opgesteld, vul-en-verstuur.
  2. **Klachtmelding DCMR** (`brief-dcmr.html`) — handhavings­verzoek bij DCMR Milieudienst Rijnmond.
  3. **Contacten** (`contacten.html`) — klantenservice Q-Park, MVGM Wonen Rotterdam, DCMR melddesk.
- **Colofon + privacy** (`privacy.html`) met zelf-verwijderknop (per verwijdertoken) en een knop om alle browser­gegevens te wissen.

## Architectuur

```
+-----------------------------+        +--------------------------------+
| Statische site              |        | Cloudflare Worker (API)        |
| (HTML / CSS / vanilla JS)   | -----> | + Cloudflare D1 (SQLite)       |
| Cloudflare Pages of GitHub  |  CORS  |                                |
| Pages — gratis              |        | uitsluitend postcode +         |
|                             |        | huisnummer worden opgeslagen   |
+-----------------------------+        +--------------------------------+
```

Geen frameworks, geen bundler, geen npm-build voor de site zelf. Eén `<script>` per pagina.

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
│   ├── config.js           -- BuurtConfig.apiBase (vul na deploy)
│   ├── storage.js          -- localStorage-helper
│   ├── main.js             -- counter / forms / privacy
│   └── templates.js        -- brieven-rendering
├── worker/
│   ├── worker.js           -- API (Cloudflare Worker)
│   ├── wrangler.toml       -- Worker-config (vul database_id)
│   ├── schema.sql          -- D1 schema
│   └── package.json        -- scripts: dev / deploy / db:create / db:apply
├── DEPLOYMENT.md           -- Stap-voor-stap gratis hosting
└── README.md
```

## Snelle start lokaal

Een statische site werkt direct in de browser. Open `index.html` in een browser, of run een mini-webserver:

```
# Python (komt op Windows mee in 3.x)
python -m http.server 8080

# of, met Node:
npx serve .
```

De counter en het aanmeldformulier doen niets totdat `assets/config.js` is bijgewerkt met de URL van een gedeployde Worker. Zie [DEPLOYMENT.md](DEPLOYMENT.md).

## Privacy in één zin

> Postcode en huisnummer staan op onze server. Verder niets. Alle overige gegevens blijven in jouw browser.

## Licentie

Gebruik vrij voor jouw eigen buurtactie. Geen garanties.
