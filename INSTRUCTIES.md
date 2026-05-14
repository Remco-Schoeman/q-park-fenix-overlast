# Instructies — Q-Park Fenix actiesite in vijf stappen

Beknopte versie om de site online te krijgen. De uitvoerige uitleg staat in [DEPLOYMENT.md](DEPLOYMENT.md).

## 1. Bekijk de site eerst lokaal

```powershell
cd C:\dev\prive\q-park-overlast
python -m http.server 8080
```

Open <http://localhost:8080/> in je browser. De counter staat op `—` (logisch, er is nog geen backend) en het aansluitformulier geeft een nette foutmelding. Alle overige pagina's, brieven en localStorage werken al volledig.

## 2. Loop de inhoud nog één keer door

Aandachtspunten:

- **`index.html`** — kop, lede, problem-blok. Controleer of de exacte locatie- en overlastomschrijving klopt met de huidige situatie.
- **`brief-qpark.html`** — onderwerp en briefinhoud. Vervang `<div class="letter__body">…` door je eigen Q-Park-brief als die al beschikbaar is.
- **`brief-dcmr.html`** — idem voor DCMR.
- **`contacten.html`** — verifieer dat telefoonnummers en e-mailadressen van Q-Park, DCMR en MVGM nog kloppen.
- **`privacy.html`** — punt 06 (contact­adres): zet je eigen contact-e-mail neer.
- **`assets/styles.css`** — wijzig kleuren via de `:root`-variabelen bovenaan als gewenst.

## 3. Zet de backend online (gratis)

Volg [DEPLOYMENT.md](DEPLOYMENT.md), stap 2 t/m 6. Resultaat: een Cloudflare Worker op `https://q-park-overlast-api.<jouw-account>.workers.dev`.

## 4. Plak de Worker-URL in `assets/config.js`

```js
window.BuurtConfig = {
  apiBase: "https://q-park-overlast-api.<jouw-account>.workers.dev"
};
```

## 5. Zet de site online (gratis)

```powershell
cd C:\dev\prive\q-park-overlast
npx wrangler pages deploy . --project-name=q-park-overlast
```

Of via GitHub → Cloudflare Pages. Beide opties staan in DEPLOYMENT.md.

---

## Daarna

- Deel de URL via flyers, WhatsApp-groep, brievenbus in de buurt rond de Veerlaan.
- Volg het aantal aansluitingen via `https://q-park-overlast-api.<jouw-account>.workers.dev/api/count`.
- Exporteer de lijst (alleen postcode + huisnummer + tijd) met `/api/admin/list?key=…` zodra je bewijs nodig hebt voor Q-Park, DCMR of MVGM.
