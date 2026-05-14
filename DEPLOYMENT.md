# Deployment — gratis hosting

De Q-Park Fenix actiesite én de aansluit-API draaien in **één** Cloudflare Worker (`q-park-fenix-overlast`). De statische pagina's en `/api/*` delen dezelfde origin, zodat CORS niet nodig is. De Cloudflare-Git-integratie deployt automatisch bij elke push naar `main`. Geschatte set-uptijd voor wie nog niets gedaan heeft: **15–25 minuten**.

## Wat we gebruiken (en waarom gratis)

| Onderdeel | Dienst | Gratis tier |
|---|---|---|
| Statische site + API | **Cloudflare Worker** (`q-park-fenix-overlast`) | 100.000 requests/dag gratis. |
| Database | **Cloudflare D1** (`q-park-overlast-db`, SQLite) | 5 GB opslag + 5 mln read rows/dag gratis. |
| Auto-deploy | **Cloudflare Workers Git-integratie** | Onbeperkt, gekoppeld aan deze GitHub-repo. |
| Domein (optioneel) | Eigen domein bij elke registrar | Vanaf ~€10/jr; ook prima zonder. |

De Worker zelf wordt geconfigureerd via `wrangler.jsonc` in de root. De Git-integratie staat al; iedere push naar `main` triggert een nieuwe deploy.

---

## Stap 1 — Wrangler lokaal installeren

Op een machine met Node.js 18+:

```powershell
cd C:\dev\prive\q-park-overlast
npm install
npx wrangler login
```

`wrangler login` opent een browser en koppelt je Cloudflare-account.

## Stap 2 — Maak de D1-database

```powershell
npm run db:create
```

Wrangler print iets als:

```
✅ Successfully created DB 'q-park-overlast-db'
[[d1_databases]]
binding = "DB"
database_name = "q-park-overlast-db"
database_id = "12345678-aaaa-bbbb-cccc-1234567890ab"
```

Noteer die `database_id` — je hebt hem zo nodig.

## Stap 3 — Schema toepassen op de remote D1

```powershell
npm run db:apply
```

Klaar — de tabel `registrations` staat nu in D1.

## Stap 4 — D1 koppelen in `wrangler.jsonc`

Open [wrangler.jsonc](wrangler.jsonc). Onderin staat een gecommentarieerd D1-blok met instructies; volg de vier kleine stappen die daar staan:

1. Plak je `database_id` (uit stap 2) in.
2. Verwijder de `//` voor het `d1_databases`-blok.
3. Zet een komma achter de `}` van het `assets`-blok.
4. Commit en push.

Cloudflare detecteert de push, leest `wrangler.jsonc` en deployt automatisch met de nieuwe binding.

## Stap 5 — Zet een admin-secret (voor `/api/admin/list`)

```powershell
npm run secret:admin
```

Wrangler vraagt om een waarde — kies een lang random wachtwoord en bewaar het in je password­manager. Met deze key kun je later via `https://q-park-fenix-overlast.remco-schoeman.workers.dev/api/admin/list?key=...` een geanonimiseerd overzicht ophalen (uitsluitend postcode + huisnummer + tijdstip).

## Stap 6 — Verifieer dat de API draait

```powershell
curl https://q-park-fenix-overlast.remco-schoeman.workers.dev/api/count
# -> {"count":0}
```

Zo lang dit `{"count":0}` (of een hoger getal) retourneert, doet de Worker zijn werk en is de D1 gekoppeld. Op de site verschijnt de teller automatisch in plaats van het streepje.

---

## Lokaal draaien (optioneel)

Voor lokale ontwikkeling tegen een lokale D1:

```powershell
npm run db:apply:local
npm run dev
```

Wrangler serveert de site én de API op `http://localhost:8787`. Dit is bedoeld voor het testen van wijzigingen voordat je pusht.

## Onderhoud

### Aantal en lijst exporteren

```powershell
curl "https://q-park-fenix-overlast.remco-schoeman.workers.dev/api/admin/list?key=<ADMIN_KEY>"
```

Geeft JSON terug die je in Excel of als bewijsstuk kunt gebruiken bij vervolg­brieven.

### Inzending van een bewoner verwijderen

Een bewoner kan zelf via de pagina **Colofon** zijn aansluiting verwijderen (de browser bewaart hun verwijdertoken). Verloor de bewoner zijn verwijdertoken? Vraag postcode en huisnummer en run handmatig:

```powershell
npx wrangler d1 execute q-park-overlast-db --command "DELETE FROM registrations WHERE postcode = '3072 AS' AND huisnummer = '12B';" --remote
```

### De brieven of teksten bijwerken

Alle HTML/CSS/JS staat in de root. Commit een wijziging, push, en Cloudflare deployt vanzelf. Geen build-stap nodig.
