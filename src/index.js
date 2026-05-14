/**
 * Q-Park Fenix overlast — Cloudflare Worker.
 *
 * Eén Worker bedient zowel de statische site als de aansluit-API:
 *   GET    /api/count                    -> { count }
 *   POST   /api/register                 -> { count, token } | 201
 *   DELETE /api/register/:token          -> { ok: true, count }
 *   GET    /api/admin/list?key=<secret>  -> { rows, count }
 *
 * Alle overige paden worden via env.ASSETS doorgegeven aan de
 * statische-assets-binding (de HTML/CSS/JS van de site).
 *
 * Bindings (zie wrangler.jsonc):
 *   ASSETS       static-assets binding
 *   DB           D1-database "q-park-overlast-db"
 *
 * Secrets:
 *   ADMIN_KEY    geheim wachtwoord voor /api/admin/list
 *
 * Privacy:
 *   - Wij slaan uitsluitend postcode + huisnummer + tijdstip op.
 *   - Geen naam, e-mail, telefoonnummer of IP-adres.
 *   - Het verwijdertoken is een willekeurige string die alleen de
 *     bewoner kent (in zijn localStorage).
 */

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function dbMissing() {
  return json({
    error: "De aansluiten-database is nog niet gekoppeld aan deze Worker. Neem contact op met de beheerder."
  }, 503);
}

function normalisePostcode(input) {
  if (!input) return "";
  var s = String(input).toUpperCase().replace(/\s+/g, "");
  var m = s.match(/^(\d{4})([A-Z]{2})$/);
  if (!m) return "";
  return m[1] + " " + m[2];
}

function normaliseHuisnummer(input) {
  if (!input) return "";
  var s = String(input).trim().toUpperCase().replace(/\s+/g, " ");
  if (!/^[0-9][0-9A-Z\- ]{0,9}$/.test(s)) return "";
  return s.slice(0, 10);
}

function randomToken() {
  var bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  var hex = "";
  for (var i = 0; i < bytes.length; i++) {
    var h = bytes[i].toString(16);
    hex += h.length === 1 ? ("0" + h) : h;
  }
  return hex;
}

async function getCount(db) {
  var row = await db.prepare("SELECT COUNT(*) AS c FROM registrations").first();
  return row ? Number(row.c || 0) : 0;
}

/* ------------------------------------------------------------------ */
/* Handlers                                                            */
/* ------------------------------------------------------------------ */

async function handleCount(env) {
  if (!env.DB) return dbMissing();
  try {
    var n = await getCount(env.DB);
    return json({ count: n });
  } catch (e) {
    return json({ error: "Database error" }, 500);
  }
}

async function handleRegister(request, env) {
  if (!env.DB) return dbMissing();
  var body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "Ongeldige JSON" }, 400);
  }
  var postcode = normalisePostcode(body && body.postcode);
  var huisnummer = normaliseHuisnummer(body && body.huisnummer);
  if (!postcode) return json({ error: "Postcode ongeldig — gebruik 4 cijfers en 2 letters." }, 400);
  if (!huisnummer) return json({ error: "Huisnummer ongeldig." }, 400);

  var existing = await env.DB.prepare(
    "SELECT delete_token FROM registrations WHERE postcode = ? AND huisnummer = ?"
  ).bind(postcode, huisnummer).first();
  if (existing) {
    var n = await getCount(env.DB);
    return json({ count: n, token: existing.delete_token, alreadyRegistered: true });
  }

  var token = randomToken();
  var now = Math.floor(Date.now() / 1000);
  try {
    await env.DB.prepare(
      "INSERT INTO registrations (postcode, huisnummer, created_at, delete_token) VALUES (?, ?, ?, ?)"
    ).bind(postcode, huisnummer, now, token).run();
  } catch (e) {
    return json({ error: "Aanmelden mislukt." }, 500);
  }
  var count = await getCount(env.DB);
  return json({ count: count, token: token }, 201);
}

async function handleDelete(env, token) {
  if (!env.DB) return dbMissing();
  if (!token || !/^[0-9a-f]{32,64}$/.test(token)) {
    return json({ error: "Ongeldig verwijdertoken." }, 400);
  }
  var result = await env.DB.prepare(
    "DELETE FROM registrations WHERE delete_token = ?"
  ).bind(token).run();
  if (!result.meta || !result.meta.changes) {
    return json({ error: "Token niet gevonden." }, 404);
  }
  var count = await getCount(env.DB);
  return json({ ok: true, count: count });
}

async function handleAdmin(request, env, url) {
  if (!env.DB) return dbMissing();
  var key = url.searchParams.get("key") || "";
  if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) {
    return json({ error: "Niet geautoriseerd." }, 401);
  }
  var rows = await env.DB.prepare(
    "SELECT postcode, huisnummer, created_at FROM registrations ORDER BY postcode, huisnummer"
  ).all();
  var list = (rows && rows.results) || [];
  return json({ count: list.length, rows: list });
}

/* ------------------------------------------------------------------ */
/* Router                                                              */
/* ------------------------------------------------------------------ */

export default {
  async fetch(request, env, ctx) {
    var url = new URL(request.url);
    var path = url.pathname;
    var method = request.method;

    // API-routes
    if (path === "/api/count" && method === "GET") {
      return handleCount(env);
    }
    if (path === "/api/register" && method === "POST") {
      return handleRegister(request, env);
    }
    if (path.startsWith("/api/register/") && method === "DELETE") {
      var token = decodeURIComponent(path.slice("/api/register/".length));
      return handleDelete(env, token);
    }
    if (path === "/api/admin/list" && method === "GET") {
      return handleAdmin(request, env, url);
    }
    if (path.startsWith("/api/")) {
      return json({ error: "Niet gevonden." }, 404);
    }

    // Alles wat niet onder /api/ valt: doorzetten naar de statische assets.
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    return new Response("Assets binding ontbreekt.", { status: 500 });
  }
};
