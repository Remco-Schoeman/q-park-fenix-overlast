# Instructies — Buurtdossier in vijf stappen

Beknopte versie voor wie de site snel online wil zetten. De uitvoerige uitleg staat in [DEPLOYMENT.md](DEPLOYMENT.md).

## 1. Probeer de site eerst lokaal

```powershell
cd C:\dev\prive\q-park-overlast
python -m http.server 8080
```

Open <http://localhost:8080/> in je browser. De counter staat op `—` (logisch, er is nog geen backend) en het aansluitformulier geeft een nette foutmelding. Alle overige pagina's, brieven en localStorage werken al volledig.

## 2. Pas eventueel de tekst aan op je eigen situatie

Aandachtspunten:

- **`index.html`** — kop, lede, problem-blok. Pas plekken aan als jouw situatie afwijkt (locatie, type overlast, e.d.).
- **`brief-qpark.html`** — onderwerp en briefinhoud. Als je al een eigen brief had, zet die op de plaats van `<div class="letter__body">…`.
- **`brief-dcmr.html`** — idem.
- **`contacten.html`** — telefoonnummers en e-mailadressen.
- **`privacy.html`** — punt 06 (contact­adres): zet je eigen contactmail neer.
- **`assets/styles.css`** — wijzig kleuren via de `:root`-variabelen bovenaan.

## 3. Zet de backend online (gratis)

Volg [DEPLOYMENT.md](DEPLOYMENT.md), hoofdstuk "Stap 2" t/m "Stap 6". Resultaat: een Cloudflare Worker-URL.

## 4. Plak de Worker-URL in `assets/config.js`

```js
window.BuurtConfig = {
  apiBase: "https://buurtdossier-api.<jouw-account>.workers.dev"
};
```

## 5. Zet de site online (gratis)

```powershell
cd C:\dev\prive\q-park-overlast
npx wrangler pages deploy . --project-name=buurtdossier
```

Of via GitHub → Cloudflare Pages. Beide opties staan in DEPLOYMENT.md.

---

## Daarna

- Deel de URL via flyers, WhatsApp-groep, brievenbus.
- Tel hoeveel adressen zich aansluiten via `https://…workers.dev/api/count`.
- Exporteer de lijst (alleen postcode + huisnummer + tijd) met `/api/admin/list?key=…` als je bewijs nodig hebt voor Q-Park, DCMR of MVGM.
