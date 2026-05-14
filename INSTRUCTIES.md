# Instructies — Q-Park Fenix actiesite

De site staat live op <https://q-park-fenix-overlast.remco-schoeman.workers.dev/>. Onderstaande stappen activeren de aansluit-teller en het registratie-formulier door de D1-database aan de Worker te hangen. Uitvoerige uitleg staat in [DEPLOYMENT.md](DEPLOYMENT.md).

## 1. Installeer Wrangler

```powershell
cd C:\dev\prive\q-park-overlast
npm install
npx wrangler login
```

## 2. Maak de D1-database

```powershell
npm run db:create
```

Noteer de `database_id` uit de uitvoer.

## 3. Pas het schema toe

```powershell
npm run db:apply
```

## 4. Koppel D1 in `wrangler.jsonc`

Open [wrangler.jsonc](wrangler.jsonc), volg de inline instructies (4 kleine stappen). Daarna:

```powershell
git add wrangler.jsonc
git commit -m "Koppel q-park-overlast-db aan Worker"
git push
```

Cloudflare deployt automatisch.

## 5. Admin-secret (optioneel, voor het overzicht)

```powershell
npm run secret:admin
```

## Daarna

- Deel de URL via flyers, WhatsApp-groep, brievenbus in de buurt rond de Veerlaan.
- Volg het aantal aansluitingen op de site (teller op de homepage) of via
  `https://q-park-fenix-overlast.remco-schoeman.workers.dev/api/count`.
- Exporteer de lijst (alleen postcode + huisnummer + tijd) met `/api/admin/list?key=…`.
- Pas brieven of teksten aan door de HTML te editen en te pushen — Cloudflare bouwt en deployt vanzelf.
