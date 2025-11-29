// utils/cookies.js
function refreshCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  const cross = String(process.env.CROSS_SITE_COOKIES || '').toLowerCase() === 'true';

  const sameSite = cross ? 'none' : 'lax';
  const secure = cross ? true : isProd; // em localhost http, false; em cross-site/https, true

  const maxAge = Number(process.env.REFRESH_EXPIRES_DAYS || 30) * 24 * 60 * 60 * 1000;

  return {
    httpOnly: true,
    sameSite,         // 'none' quando front/back estão em hosts/portas diferentes
    secure,           // NUNCA true em http://localhost
    path: '/api/auth/refresh', // ou '/', se preferir ler em outras rotas
    maxAge,           // persistente (não só session-cookie)
  };
}

module.exports = { refreshCookieOptions };
