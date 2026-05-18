# ChantierPro Mailer — Render Setup

## 1. Resend Account (kostenlos, 3000 Mails/Monat)
1. Geh auf https://resend.com → Konto erstellen (kostenlos)
2. **API Keys** → "Create API Key" → kopiere den Key (sieht aus wie `re_xxxxxxxxxxxx`)

## 2. GitHub Repo erstellen
1. Geh auf https://github.com → "New repository" → Name: `chantierpro-mailer`
2. Lade den Inhalt dieses Ordners (`render-server/`) hoch:
   - `server.js`
   - `package.json`
   - `.gitignore`

## 3. Render Web Service
1. Geh auf https://render.com → Konto erstellen (kostenlos)
2. **New → Web Service**
3. GitHub Repo verbinden (`chantierpro-mailer`)
4. Settings:
   - **Name**: `chantierpro-mailer`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free

## 4. Environment Variables auf Render
Unter "Environment" folgende Variablen setzen:

| Key | Value |
|-----|-------|
| `RESEND_API_KEY` | `re_xxxxxxxxxxxx` (dein Key aus Schritt 1) |
| `FROM_NAME` | `ChantierPro` |
| `FROM_EMAIL` | `onboarding@resend.dev` (oder deine Domain wenn verifiziert) |
| `ALLOWED_ORIGIN` | `https://deine-wordpress-seite.com` |

## 5. URL kopieren
Nach dem Deploy bekommst du eine URL wie:
`https://chantierpro-mailer.onrender.com`

Diese URL trägst du in der App ein (Einstellungen → API-URL).

## Eigene Domain (optional aber empfohlen)
Mit eigener Domain kommen Mails nicht im Spam an:
1. In Resend: **Domains → Add Domain** → deine Domain (ex. `wiesen-piront.lu`)
2. DNS-Einträge hinzufügen (Resend zeigt dir genau welche)
3. `FROM_EMAIL` auf Render ändern zu: `noreply@wiesen-piront.lu`

## Test
```
curl -X POST https://chantierpro-mailer.onrender.com/send-problem \
  -H "Content-Type: application/json" \
  -d '{"to":"deine@email.com","stName":"Test ST","title":"Fissure mur nord","category":"problem","chantierName":"Belleg","planName":"RDC"}'
```
