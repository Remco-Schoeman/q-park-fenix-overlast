# Deployment — gratis hosting

Doel: de Q-Park Fenix actiesite én de backend volledig gratis online krijgen, op een manier die schaalt tot vele honderden buurtbewoners zonder dat er ooit een rekening komt. Geschatte tijd: **30–45 minuten**.

## Wat we gebruiken (en waarom gratis)

| Onderdeel | Dienst | Gratis tier |
|---|---|---|
| Statische site (HTML/CSS/JS) | **Cloudflare Pages** | Onbeperkte bandbreedte, 500 deploys/maand. |
| API (postcode-opslag) | **Cloudflare Worker** (`q-park-overlast-api`) | 100.000 requests/dag gratis. |
| Database | **Cloudflare D1** (`q-park-overlast-db`, SQLite) | 5 GB opslag + 5 mln read rows/dag gratis. |
| Domein (optioneel) | Eigen domein bij elke registrar | Vanaf ~€10/jr; ook prima zonder. |

> Alternatief voor de site: **GitHub Pages** is ook gratis en goed. De Worker + D1 staan los; die kunnen ernaast blijven draaien.

---

## Stap 1 — Cloudflare-account

1. Maak een gratis account op <https://dash.cloudflare.com/sign-up>.
2. Bevestig je e-mailadres.

Geen creditcard nodig voor het gratis pad.

## Stap 2 — Installeer Wrangler (de Cloudflare CLI)

Op een machine met Node.js 18+:

```powershell
cd C:\dev\prive\q-park-overlast\worker
npm install
npx wrangler login
```

`wrangler login` opent een browser om je Cloudflare-account te koppelen.

## Stap 3 — Maak de D1-database

```powershell
npx wrangler d1 create q-park-overlast-db
```

Wrangler print iets als:

```
✅ Successfully created DB 'q-park-overlast-db'
database_id = "12345678-aaaa-bbbb-cccc-1234567890ab"
```

Plak die `database_id` in `worker/wrangler.toml` op de regel `database_id = "..."`.

## Stap 4 — Pas het database-schema toe

```powershell
npx wrangler d1 execute q-park-overlast-db --file=./schema.sql --remote
```

Klaar — de tabel `registrations` staat nu in D1.

## Stap 5 — Zet een admin-secret (voor `/api/admin/list`)

```powershell
npx wrangler secret put ADMIN_KEY
```

Wrangler vraagt om de waarde — kies een lang random wachtwoord en bewaar het in je password­manager. Met deze key kun je later via `https://<worker-url>/api/admin/list?key=...` een geanonimiseerd overzicht ophalen (uitsluitend postcode + huisnummer + tijdstip) om aan Q-Park, DCMR en MVGM te tonen.

## Stap 6 — Deploy de Worker

```powershell
npx wrangler deploy
```

Output bevat een URL, ongeveer:

```
https://q-park-overlast-api.<jouw-account>.workers.dev
```

Test hem:

```powershell
curl https://q-park-overlast-api.<jouw-account>.workers.dev/api/count
# -> {"count":0}
```

## Stap 7 — Zet de API-URL in de site

Open `assets/config.js` en plak de Worker-URL:

```js
window.BuurtConfig = {
  apiBase: "https://q-park-overlast-api.<jouw-account>.workers.dev"
};
```

## Stap 8 — Deploy de site naar Cloudflare Pages

### Optie A — Direct vanuit deze map (geen GitHub nodig)

```powershell
cd C:\dev\prive\q-park-overlast
npx wrangler pages deploy . --project-name=q-park-overlast
```

De eerste keer maakt Wrangler het project aan en geeft een URL terug zoals `https://q-park-overlast.pages.dev`.

### Optie B — Vanuit de GitHub-repo (aanbevolen voor doorlopende updates)

1. De repository staat op <https://github.com/Remco-Schoeman/q-park-fenix-overlast>.
2. Cloudflare dashboard → **Workers & Pages → Create application → Pages → Connect to Git**.
3. Kies `q-park-fenix-overlast`, framework preset **None**, build command **leeg**, output directory **`/`** (root).
4. **Save and Deploy**.

Elke commit op `main` triggert een nieuwe deploy.

## Stap 9 — CORS strakker zetten

Standaard staat de Worker open voor `*`. Zodra je een vaste site-URL hebt:

1. Open `worker/wrangler.toml`.
2. Zet `ALLOWED_ORIGIN = "https://q-park-overlast.pages.dev"` (of het eigen domein).
3. Run `npx wrangler deploy` opnieuw.

## Stap 10 — (Optioneel) Eigen domein

Cloudflare Pages én Workers kunnen een custom domein krijgen via het Cloudflare-dashboard. `q-park-overlast.pages.dev` werkt prima, maar een eigen domein als `genoegisgenoeg.nl` of `qparkfenix-overlast.nl` leest beter op een flyer.

---

## Onderhoud

### Periodiek aantal en lijst exporteren

```powershell
curl "https://q-park-overlast-api.<jouw-account>.workers.dev/api/admin/list?key=<ADMIN_KEY>"
```

Dit geeft JSON terug die je in Excel of als bewijsstuk kunt gebruiken bij vervolg­brieven.

### Inzending van bewoner verwijderen

Een bewoner kan zelf via de pagina **Colofon** zijn aansluiting verwijderen (de browser bewaart hun verwijdertoken). Verloor de bewoner zijn verwijdertoken? Vraag postcode en huisnummer en run handmatig:

```powershell
npx wrangler d1 execute q-park-overlast-db --command "DELETE FROM registrations WHERE postcode = '3072 AS' AND huisnummer = '12B';" --remote
```

### De brieven bijwerken

De inhoud van [brief-qpark.html](brief-qpark.html) en [brief-dcmr.html](brief-dcmr.html) is statisch HTML — pas direct aan en commit. De `<span class="fill" data-fill="...">`-elementen worden automatisch met de localStorage-data van de gebruiker gevuld.

---

## Volledig alternatief: GitHub Pages + Cloudflare Worker

Wil je de site op GitHub Pages hosten in plaats van Cloudflare Pages, met de Worker bij Cloudflare:

1. GitHub repo **Settings → Pages → Source: Deploy from branch → `main` / root**.
2. GitHub geeft een URL als `https://remco-schoeman.github.io/q-park-fenix-overlast/`.
3. Volg stap 1–7 hierboven voor de Worker.
4. Zet `ALLOWED_ORIGIN` in de Worker op die GitHub-Pages-URL.

Werkt identiek; alleen de hostingleverancier verschilt.
