-- Q-Park Fenix overlast — D1 schema (Cloudflare D1, SQLite).
--
-- Slaat uitsluitend postcode + huisnummer + tijdstip op, plus een
-- willekeurig verwijdertoken zodat een bewoner zijn eigen inzending
-- kan wissen. Geen naam, e-mail, telefoonnummer of IP-adres.
--
-- Toepassen op de remote D1:
--   npx wrangler d1 execute q-park-overlast-db --file=./schema.sql --remote
-- Toepassen op de lokale D1 (voor wrangler dev):
--   npx wrangler d1 execute q-park-overlast-db --file=./schema.sql --local

CREATE TABLE IF NOT EXISTS registrations (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    postcode      TEXT    NOT NULL,
    huisnummer    TEXT    NOT NULL,
    created_at    INTEGER NOT NULL,
    delete_token  TEXT    NOT NULL UNIQUE,
    UNIQUE(postcode, huisnummer)
);

CREATE INDEX IF NOT EXISTS idx_registrations_postcode ON registrations(postcode);
CREATE INDEX IF NOT EXISTS idx_registrations_created ON registrations(created_at);
