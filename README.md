# Two Different Socks – Website

Reine HTML/CSS-Seite. Kein Baukasten, kein Build, keine laufenden Kosten fürs Hosting.

```
index.html          Startseite (Wäscheleine, Über mich, Blog-Vorschau, Kontakt)
blog.html           Blog-Übersicht mit Filter
blog/               Beiträge + vorlage.html
impressum.html      Impressum (ausfüllen!)
datenschutz.html    Datenschutz (ausfüllen!)
404.html            Fehlerseite
assets/style.css    Alle Farben und Styles (Projektfarben ganz oben)
assets/img/         Logos, Socken, Favicon
```

## Online stellen (Cloudflare Pages, kostenlos)

1. Konto auf dash.cloudflare.com anlegen.
2. **Workers & Pages → Erstellen → Pages → Assets hochladen** (Direct Upload).
3. Projektname `twodifferentsocks`, den Ordner hochladen → Deploy.
4. Die Seite läuft sofort unter `twodifferentsocks.pages.dev`.

Später besser: Ordner in ein GitHub-Repo legen und Cloudflare Pages damit verbinden. Dann geht jede Änderung automatisch online.

## Domain verbinden

1. In Cloudflare Pages: **Benutzerdefinierte Domains → Domain hinzufügen** (`twodifferentsocks.de` bzw. `.club`).
2. Cloudflare zeigt die DNS-Einträge an (meist ein CNAME auf `twodifferentsocks.pages.dev`).
3. Diese Einträge bei Squarespace unter **Domains → DNS-Einstellungen** eintragen.
4. Danach kann die Squarespace-Website (und der Shop) gekündigt werden. Die Domain selbst bleibt bei Squarespace oder wird zu Cloudflare umgezogen.

## Neuer Blogbeitrag

1. `blog/vorlage.html` kopieren, z. B. als `blog/mein-titel.html`, und die markierten Stellen ausfüllen.
2. In `blog.html` oben einen neuen `post-card`-Block einfügen (`data-cat`: `tds`, `p4k`, `vin` oder `mwi`).
3. Optional auch auf der Startseite unter „Neues aus der Werkstatt“ austauschen.

## Über-mich-Foto

Foto als `assets/img/ich.jpg` speichern (Hochformat 4:5, ca. 920 × 1150 px). In `index.html` den Block
`me__placeholder` löschen und die auskommentierte `<img>`-Zeile darunter aktivieren.

## Schriften lokal einbinden (DSGVO)

Aktuell kommen Bricolage Grotesque und Inter von Google Fonts. In Deutschland gilt das als Datenschutz-Risiko.
Vor dem Livegang lokal einbinden:

1. Beide Schriften als `.woff2` laden (z. B. über gwfh.mranftl.com), in `assets/fonts/` legen.
2. Die `@font-face`-Regeln in `assets/style.css` einfügen.
3. In allen HTML-Dateien die drei Zeilen mit `fonts.googleapis.com` / `fonts.gstatic.com` löschen.

## Platzhalter

Alles mit gelbem Hintergrund (`class="placeholder"`) ist noch auszufüllen: Name, Ort, Datum, Impressum, Datenschutz,
Links zu Places4Kids und VINWEAR (`href="#"` in `index.html`), Instagram-Link.

### Passwortschutz

`/hq` ist serverseitig geschützt durch die Edge Function `netlify/edge-functions/hq-auth.ts`
(Login-Seite, Cookie 30 Tage, `/hq/logout` meldet ab). In Netlify unter
**Site configuration → Environment variables** anlegen:

- `HQ_PASSWORD` – das Login-Passwort
- `HQ_SECRET` – langer Zufallswert (z. B. 40+ Zeichen), signiert das Cookie

Fehlt eins, bleibt `/hq` zu (503). Edge Functions laufen nur, wenn Netlify aus dem
Git-Repo baut – nicht bei Drag-&-Drop-Uploads.

## HQ (`/hq`)

Internes Dashboard unter `twodifferentsocks.de/hq`: Lagebericht über alle Projekte, Projekte an der Leine
(VINWEAR verlinkt auf sein eigenes HQ) und für „Mein Wunsch ist …“ die Teams mit ihren Agenten
(Paula · Vertrieb & Partner, Mia · Marketing, Lotte · Design, Ben · IT & Technik, Theo · Finanzen, Klara · Recht).

```
hq/index.html   Gerüst
hq/hq.css       Look (Schwarz-Weiß, Projekte in ihren Farben, keine externen Schriften)
hq/hq.js        baut die Seite aus den Daten
hq/data.json    alle Inhalte – nur diese Datei ändern, um Zahlen und Meldungen zu aktualisieren
```

Die Seite ist per `noindex` (Meta-Tag + `X-Robots-Tag` in `netlify.toml`) von Suchmaschinen ausgenommen,
aber **nicht passwortgeschützt**. Deshalb stehen in `data.json` keine Geheimnisse: keine Zugangsdaten,
keine E-Mails oder Telefonnummern, keine Umsätze anderer Projekte. Ein echter Login (Netlify Identity
oder eine Function wie beim VINWEAR-HQ) kann später dazukommen.
