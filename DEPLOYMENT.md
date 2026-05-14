# Deployment — gratis hosting

Doel: de site én de backend volledig gratis online krijgen, op een manier die schaalt tot vele honderden buurtbewoners zonder dat er ooit een rekening hoeft te komen. Geschatte tijd: **30–45 minuten**.

## Wat we gebruiken (en waarom gratis)

| Onderdeel | Dienst | Gratis tier |
|---|---|---|
| Statische site (HTML/CSS/JS) | **Cloudflare Pages** | Onbeperkte bandbreedte, 500 deploys/maand. |
| API (postcode-opslag) | **Cloudflare Worker** | 100.000 requests/dag gratis. |
| Database | **Cloudflare D1** (SQLite) | 5 GB opslag + 5 mln read rows/dag gratis. |
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
npx wrangler d1 create buurtdossier
```

Wrangler print iets als:

```
✅ Successfully created DB 'buurtdossier'
database_id = "12345678-aaaa-bbbb-cccc-1234567890ab"
```

Plak die `database_id` in `worker/wrangler.toml` op de regel `database_id = "..."`.

## Stap 4 — Pas het database-schema toe

```powershell
npx wrangler d1 execute buurtdossier --file=./schema.sql --remote
```

Klaar — de tabel `registrations` staat nu in D1.

## Stap 5 — Zet een admin-secret (voor `/api/admin/list`)

```powershell
npx wrangler secret put ADMIN_KEY
```

Wrangler vraagt om de waarde — kies een lang random wachtwoord en bewaar het in je password­manager. Met deze key kun je later via `https://<worker-url>/api/admin/list?key=...` een geanonimiseerd overzicht ophalen (uitsluitend postcode + huisnummer + tijdstip) om aan Q-Park / DCMR / MVGM te tonen.

## Stap 6 — Deploy de Worker

```powershell
npx wrangler deploy
```

Output bevat een URL, ongeveer:

```
https://buurtdossier-api.<jouw-account>.workers.dev
```

Test hem:

```powershell
curl https://buurtdossier-api.<jouw-account>.workers.dev/api/count
# -> {"count":0}
```

## Stap 7 — Zet de API-URL in de site

Open `assets/config.js` en plak de Worker-URL:

```js
window.BuurtConfig = {
  apiBase: "https://buurtdossier-api.<jouw-account>.workers.dev"
};
```

## Stap 8 — Deploy de site naar Cloudflare Pages

### Optie A — Direct vanuit deze map (geen GitHub nodig)

```powershell
cd C:\dev\prive\q-park-overlast
npx wrangler pages deploy . --project-name=buurtdossier
```

De eerste keer maakt Wrangler het project aan en geeft een URL terug zoals `https://buurtdossier.pages.dev`.

### Optie B — Vanuit een GitHub-repo (aanbevolen voor doorlopende updates)

1. Push deze map naar een GitHub-repository (privé of openbaar).
2. Cloudflare dashboard → **Workers & Pages → Create application → Pages → Connect to Git**.
3. Kies de repository, framework preset **None**, build command **leeg**, output directory **`/`** (root).
4. **Save and Deploy**.

Elke commit op `main` triggert een nieuwe deploy.

## Stap 9 — CORS strakker zetten

Standaard staat de Worker open voor `*`. Zodra je een vaste site-URL hebt:

1. Open `worker/wrangler.toml`.
2. Zet `ALLOWED_ORIGIN = "https://buurtdossier.pages.dev"` (of je eigen domein).
3. Run `npx wrangler deploy` opnieuw.

## Stap 10 — (Optioneel) Eigen domein

Cloudflare Pages én Workers kunnen een custom domein krijgen via het Cloudflare-dashboard. Voor een buurt­actie volstaat `buurtdossier.pages.dev` ruim, maar `genoegisgenoeg.nl` (of vergelijkbaar) leest beter op een flyer.

---

## Onderhoud

### Periodiek aantal en lijst exporteren
```powershell
curl "https://buurtdossier-api.<jouw-account>.workers.dev/api/admin/list?key=<ADMIN_KEY>"
```

Dit geeft JSON terug die je in Excel of als bewijsstuk kunt gebruiken bij vervolg­brieven.

### Inzending van bewoner verwijderen
Een bewoner kan zelf via de pagina **Colofon** zijn aansluiting verwijderen (de browser bewaart hun verwijdertoken). Verloor de bewoner zijn verwijdertoken? Vraag postcode en huisnummer en run handmatig:

```powershell
npx wrangler d1 execute buurtdossier --command "DELETE FROM registrations WHERE postcode = '3072 AS' AND huisnummer = '12B';" --remote
```

### Een nieuwe brief toevoegen
Kopieer `brief-qpark.html`, pas de inhoud, geadresseerde en `BuurtTemplates.render…` aanroep aan, voeg de kaart toe op `index.html` en `acties.html`.

---

## Volledig alternatief: GitHub Pages + Cloudflare Worker

Wil je de site op GitHub Pages hosten (en alleen de Worker bij Cloudflare):

1. Push deze map naar een publieke GitHub repository.
2. Repository **Settings → Pages → Source: Deploy from branch → `main` / root**.
3. GitHub geeft een URL als `https://<jij>.github.io/<repo>/`.
4. Volg stap 1–7 hierboven voor de Worker.
5. Zet `ALLOWED_ORIGIN` in de Worker op die GitHub-Pages-URL.

Werkt identiek; alleen de hostingleverancier verschilt.
