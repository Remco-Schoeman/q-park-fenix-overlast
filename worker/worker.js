/**
 * Buurtdossier — Cloudflare Worker API
 *
 * Endpoints:
 *   GET    /api/count                    -> { count }
 *   POST   /api/register { postcode, huisnummer }
 *          -> { count, token }
 *   DELETE /api/register/:token          -> { ok: true, count }
 *   GET    /api/admin/list?key=...       -> { rows: [{ postcode, huisnummer, created_at }], count }
 *
 * Storage: Cloudflare D1 (SQLite).
 *
 * Bindings required (configured in wrangler.toml):
 *   DB           — D1 database
 *   ADMIN_KEY    — secret string for the admin-list endpoint
 *   ALLOWED_ORIGIN — comma-separated list of allowed CORS origins (or "*")
 *
 * Privacy notes:
 *   - Geen naam, e-mail of telefoonnummer wordt ooit opgeslagen.
 *   - IP-adressen worden niet bewaard buiten de korte logs van Cloudflare.
 *   - Het verwijdertoken is een ondoorzoekbare random string die enkel de
 *     eigenaar (in localStorage) kent.
 */

function corsHeaders(request, env) {
  var allowed = (env && env.ALLOWED_ORIGIN) || "*";
  var origin = request.headers.get("Origin") || "";
  var allowOrigin = "*";
  if (allowed !== "*") {
    var list = allowed.split(",").map(function (s) { return s.trim(); });
    allowOrigin = list.indexOf(origin) !== -1 ? origin : list[0];
  }
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function json(body, init, request, env) {
  init = init || {};
  var headers = Object.assign(
    { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    corsHeaders(request, env),
    init.headers || {}
  );
  return new Response(JSON.stringify(body), { status: init.status || 200, headers: headers });
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

async function getCount(env) {
  var row = await env.DB.prepare("SELECT COUNT(*) AS c FROM registrations").first();
  return row ? Number(row.c || 0) : 0;
}

async function handleCount(request, env) {
  try {
    var n = await getCount(env);
    return json({ count: n }, {}, request, env);
  } catch (e) {
    return json({ error: "Database error" }, { status: 500 }, request, env);
  }
}

async function handleRegister(request, env) {
  var body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "Ongeldige JSON" }, { status: 400 }, request, env);
  }
  var postcode = normalisePostcode(body && body.postcode);
  var huisnummer = normaliseHuisnummer(body && body.huisnummer);
  if (!postcode) return json({ error: "Postcode ongeldig — gebruik 4 cijfers en 2 letters." }, { status: 400 }, request, env);
  if (!huisnummer) return json({ error: "Huisnummer ongeldig." }, { status: 400 }, request, env);

  var existing = await env.DB.prepare(
    "SELECT delete_token FROM registrations WHERE postcode = ? AND huisnummer = ?"
  ).bind(postcode, huisnummer).first();
  if (existing) {
    var n = await getCount(env);
    return json({ count: n, token: existing.delete_token, alreadyRegistered: true }, {}, request, env);
  }

  var token = randomToken();
  var now = Math.floor(Date.now() / 1000);
  try {
    await env.DB.prepare(
      "INSERT INTO registrations (postcode, huisnummer, created_at, delete_token) VALUES (?, ?, ?, ?)"
    ).bind(postcode, huisnummer, now, token).run();
  } catch (e) {
    return json({ error: "Aanmelden mislukt." }, { status: 500 }, request, env);
  }
  var count = await getCount(env);
  return json({ count: count, token: token }, { status: 201 }, request, env);
}

async function handleDelete(request, env, token) {
  if (!token || !/^[0-9a-f]{32,64}$/.test(token)) {
    return json({ error: "Ongeldig verwijdertoken." }, { status: 400 }, request, env);
  }
  var result = await env.DB.prepare(
    "DELETE FROM registrations WHERE delete_token = ?"
  ).bind(token).run();
  if (!result.meta || !result.meta.changes) {
    return json({ error: "Token niet gevonden." }, { status: 404 }, request, env);
  }
  var count = await getCount(env);
  return json({ ok: true, count: count }, {}, request, env);
}

async function handleAdminList(request, env, url) {
  var key = url.searchParams.get("key") || "";
  if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) {
    return json({ error: "Niet geautoriseerd." }, { status: 401 }, request, env);
  }
  var rows = await env.DB.prepare(
    "SELECT postcode, huisnummer, created_at FROM registrations ORDER BY postcode, huisnummer"
  ).all();
  var list = (rows && rows.results) || [];
  return json({ count: list.length, rows: list }, {}, request, env);
}

export default {
  async fetch(request, env, ctx) {
    var url = new URL(request.url);
    var pathname = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    if (request.method === "GET" && pathname === "/api/count") {
      return handleCount(request, env);
    }

    if (request.method === "POST" && pathname === "/api/register") {
      return handleRegister(request, env);
    }

    if (request.method === "DELETE" && pathname.startsWith("/api/register/")) {
      var token = decodeURIComponent(pathname.slice("/api/register/".length));
      return handleDelete(request, env, token);
    }

    if (request.method === "GET" && pathname === "/api/admin/list") {
      return handleAdminList(request, env, url);
    }

    if (pathname === "/" || pathname === "/api") {
      return json({ name: "buurtdossier-api", endpoints: ["/api/count", "/api/register", "/api/register/:token"] }, {}, request, env);
    }

    return json({ error: "Niet gevonden." }, { status: 404 }, request, env);
  }
};
