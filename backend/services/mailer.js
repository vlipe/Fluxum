// services/mailer.js
const nodemailer = require('nodemailer');

const MODE = (process.env.EMAIL_MODE || 'auto').toLowerCase(); 
const ALLOW_REAL = process.env.ALLOW_REAL_EMAILS === 'true';
const DEV_EMAIL_DOMAINS = (process.env.DEV_EMAIL_DOMAINS || 'example.com,mailinator.com')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

function isDevEmail(email) {
  const e = String(email || '').toLowerCase();
  return DEV_EMAIL_DOMAINS.some(d => e.endsWith('@' + d));
}

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

const transporter = smtpConfigured()
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      logger: true,
      debug: true
    })
  : null;

function shouldSendReal(email) {
  if (MODE === 'console') return false;
  if (MODE === 'smtp') {
    if (!ALLOW_REAL && process.env.NODE_ENV !== 'production') return false;
    if (isDevEmail(email)) return false;
    return Boolean(transporter);
  }
  // auto
  if (!transporter) return false;
  if (isDevEmail(email)) return false;
  if (!ALLOW_REAL && process.env.NODE_ENV !== 'production') return false;
  return true;
}

async function sendPasswordReset(email, name, link) {
  const from =
    process.env.EMAIL_FROM ||
    `no-reply@${new URL(process.env.FRONTEND_URL || 'http://localhost').hostname}`;

  const subject = 'Redefinição de senha';
  const text = [
    `Olá ${name || ''},`,
    '',
    `Recebemos um pedido para redefinir sua senha.`,
    `Se foi você, use o link (válido por tempo limitado):`,
    link,
    '',
    `Se você não solicitou, ignore este e-mail.`
  ].join('\n');

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial">
      <p>Olá ${name || ''},</p>
      <p>Recebemos um pedido para redefinir sua senha. Se foi você, clique abaixo.</p>
      <p><a href="${link}" style="display:inline-block;padding:10px 16px;
      background:#0d6efd;color:#fff;text-decoration:none;border-radius:6px">Redefinir senha</a></p>
      <p>Ou copie e cole:<br><code>${link}</code></p>
      <p style="color:#666">Se você não solicitou, ignore este e-mail.</p>
    </div>
  `;

  const willSend = shouldSendReal(email);
  console.log('[MAILER]', {
    mode: MODE, allowReal: ALLOW_REAL, nodeEnv: process.env.NODE_ENV,
    smtp: !!transporter, devDomain: isDevEmail(email), willSend, to: email
  });

  if (willSend) {
    // se falhar, a exceção sobe para a rota (a rota loga o erro e vai para o log)
    await transporter.sendMail({ from, to: email, subject, text, html });
    return { sent: true, mode: 'smtp' };
  } else {
    console.log(`[DEV] Link de reset para ${email}: ${link}`);
    return { sent: false, mode: 'console', preview: link };
  }
}

module.exports = { sendPasswordReset };
