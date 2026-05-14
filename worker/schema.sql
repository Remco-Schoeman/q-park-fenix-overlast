-- Q-Park Fenix overlast — D1 schema
-- Slaat uitsluitend postcode + huisnummer op, plus een tijdstip
-- en een willekeurig verwijdertoken zodat een bewoner zijn
-- inzending zelf weer kan wissen. Geen namen, e-mailadressen,
-- telefoonnummers of IP-adressen.

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
