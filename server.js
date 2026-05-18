const express = require('express');
const cors    = require('cors');
const { Resend } = require('resend');

const app    = express();
const resend = new Resend(process.env.RESEND_API_KEY);

// ── Config ────────────────────────────────────────────────────────────────────
const FROM_NAME    = process.env.FROM_NAME    || 'ChantierPro';
const FROM_EMAIL   = process.env.FROM_EMAIL   || 'onboarding@resend.dev'; // remplace par ton domaine vérifié
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';                 // ex. https://ton-site.com
// ─────────────────────────────────────────────────────────────────────────────

app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json({ limit: '2mb' }));

// Health check
app.get('/', (_req, res) => res.json({ ok: true, service: 'chantierpro-mailer' }));

// ── POST /send-problem ────────────────────────────────────────────────────────
// Body: { to, stName, title, note, category, chantierName, planName, createdAt, photoB64? }
app.post('/send-problem', async (req, res) => {
  const { to, stName, title, note, category, chantierName, planName, createdAt, photoB64 } = req.body;

  if (!to || !title) {
    return res.status(400).json({ error: 'Champs manquants: to, title requis' });
  }

  const catLabel = {
    problem : '🔴 Problème',
    todo    : '🟡 À faire',
    info    : '🔵 Information',
  }[category] || '📍 Problème';

  const catColor = {
    problem : '#c0392b',
    todo    : '#e67e22',
    info    : '#2980b9',
  }[category] || '#c0392b';

  const dateStr = createdAt
    ? new Date(createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const photoHtml = photoB64
    ? `<div style="margin:16px 0"><img src="${photoB64}" style="max-width:100%;border-radius:8px;border:1px solid #e0e0e0" alt="Photo du problème"></div>`
    : '';

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">

        <!-- Header -->
        <tr>
          <td style="background:${catColor};padding:24px 32px">
            <div style="font-size:22px;font-weight:700;color:#fff">${catLabel}</div>
            <div style="font-size:13px;color:rgba(255,255,255,.85);margin-top:4px">${chantierName || ''} ${planName ? '· ' + planName : ''}</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px">
            <p style="margin:0 0 6px;font-size:13px;color:#888">Bonjour <strong>${stName || 'équipe'}</strong>,</p>
            <p style="margin:0 0 20px;font-size:13px;color:#555">Un problème vous a été assigné sur le chantier <strong>${chantierName || ''}</strong>. Voici les détails :</p>

            <!-- Problem card -->
            <div style="background:#fafafa;border:1.5px solid #e8e8e8;border-left:4px solid ${catColor};border-radius:8px;padding:16px 20px;margin-bottom:20px">
              <div style="font-size:17px;font-weight:700;color:#1a1a1a;margin-bottom:8px">${escHtmlNode(title)}</div>
              ${note ? `<div style="font-size:13px;color:#555;line-height:1.6">${escHtmlNode(note)}</div>` : ''}
              ${photoHtml}
            </div>

            <!-- Meta -->
            <table cellpadding="0" cellspacing="0" style="width:100%;font-size:12px;color:#888;border-collapse:collapse">
              ${chantierName ? `<tr><td style="padding:3px 0;width:90px">Chantier</td><td style="padding:3px 0;color:#333;font-weight:600">${escHtmlNode(chantierName)}</td></tr>` : ''}
              ${planName    ? `<tr><td style="padding:3px 0">Plan</td><td style="padding:3px 0;color:#333">${escHtmlNode(planName)}</td></tr>` : ''}
              <tr><td style="padding:3px 0">Signalé le</td><td style="padding:3px 0;color:#333">${dateStr}</td></tr>
            </table>

            <p style="margin:24px 0 0;font-size:12px;color:#aaa">Cet email a été envoyé automatiquement par ChantierPro. Ne pas répondre directement.</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #eeeeee">
            <div style="font-size:11px;color:#bbb;text-align:center">ChantierPro · Gestion de chantiers</div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const data = await resend.emails.send({
      from   : `${FROM_NAME} <${FROM_EMAIL}>`,
      to     : [to],
      subject: `${catLabel} assigné — ${chantierName || 'Chantier'} : ${title}`,
      html,
    });
    console.log(`[send-problem] OK → ${to} | id=${data.id}`);
    res.json({ ok: true, id: data.id });
  } catch (err) {
    console.error('[send-problem] ERROR', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /send-custom ─────────────────────────────────────────────────────────
// Body: { to, subject, html }  — for future use (daily digest, etc.)
app.post('/send-custom', async (req, res) => {
  const { to, subject, html } = req.body;
  if (!to || !subject || !html) return res.status(400).json({ error: 'to, subject, html requis' });
  try {
    const data = await resend.emails.send({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to: [to], subject, html });
    res.json({ ok: true, id: data.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
function escHtmlNode(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ChantierPro mailer listening on port ${PORT}`));
