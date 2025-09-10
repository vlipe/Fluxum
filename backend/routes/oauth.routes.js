const express = require('express');
const { Issuer, generators } = require('openid-client');
const { query } = require('../database/db');
const { v4: uuid } = require('uuid');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const argon2 = require('argon2');


const router = express.Router();

const RAW_FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const FRONTEND_URLS = RAW_FRONTEND_URL.split(',').map(s => s.trim()).filter(Boolean);

async function hasValidRefresh(req) {
  const rt = req.cookies && req.cookies.refreshToken;
  if (!rt) return false;
  const q = await query(
    'SELECT expires_at, revoked_at FROM refresh_tokens WHERE token=$1 LIMIT 1',
    [rt]
  );
  if (q.rowCount === 0) return false;
  const row = q.rows[0];
  if (row.revoked_at) return false;
  return new Date(row.expires_at).getTime() > Date.now();
}


function oauthTempCookieOpts(req) {
  const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
  const host  = req.headers['x-forwarded-host'] || req.headers.host || '';
  const isLocal = proto === 'http' && (host.startsWith('localhost:') || host.startsWith('127.0.0.1:'));

  return {
    httpOnly: true,
   
    sameSite: isLocal ? 'lax' : 'none',
    secure:   isLocal ? false  : true,
    path: '/api/auth',
    maxAge: 10 * 60 * 1000
  };
}


function pickFrontendBase(req) {
  const fromCookieG = req.cookies.g_front;
  const fromCookieH = req.cookies.gh_front;
  if (fromCookieG) return fromCookieG;
  if (fromCookieH) return fromCookieH;
  const origin = String(req.headers.origin || '').trim();
  if (origin && FRONTEND_URLS.includes(origin)) return origin;
  const local = FRONTEND_URLS.find(u => u.includes('localhost'));
  if (local) return local;
  const httpsPublic = FRONTEND_URLS.find(u => u.startsWith('https://'));
  return httpsPublic || FRONTEND_URLS[0];
}

function apiBase(req) {
  const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_EXPIRES_DAYS = parseInt(process.env.REFRESH_EXPIRES_DAYS || '30', 10);

function signAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}
async function createRefresh(userId, familyId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
  await query(
    `INSERT INTO refresh_tokens (user_id, token, family_id, expires_at) VALUES ($1, $2, $3, $4)`,
    [userId, token, familyId, expiresAt]
  );
  return token;
}
function refreshCookieOpts(req) {
  const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  const isLocal = proto === 'http' && (/^localhost:/.test(host) || /^127\.0\.0\.1:/.test(host));

  const hasCrossSiteHttps = (process.env.FRONTEND_URL || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .some(u => u.startsWith('https://') && !u.includes('localhost'));

  const sameSite = isLocal ? 'lax' : (hasCrossSiteHttps ? 'none' : 'lax');
  const secure = isLocal ? false : (hasCrossSiteHttps || process.env.NODE_ENV === 'production');

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/api/auth',
    maxAge: (parseInt(process.env.REFRESH_EXPIRES_DAYS || '30', 10)) * 24 * 60 * 60 * 1000
  };
}


let googleIssuer;
async function getGoogleClient(req) {
  if (!googleIssuer) googleIssuer = await Issuer.discover('https://accounts.google.com');
  return new googleIssuer.Client({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uris: [`${apiBase(req)}/api/auth/google/callback`],
    response_types: ['code']
  });
}

router.get('/google/start', async (req, res) => {
  try {
    const client = await getGoogleClient(req);
    const code_verifier = generators.codeVerifier();
    const code_challenge = generators.codeChallenge(code_verifier);
    const state = crypto.randomBytes(24).toString('hex');

    const cookieBasePath = '/api/auth';
    const pkceOpts = oauthTempCookieOpts(req);

   
    const frontBase = (req.headers.origin && FRONTEND_URLS.includes(req.headers.origin))
      ? req.headers.origin
      : pickFrontendBase(req);

   
    res.clearCookie('g_pkce',  { path: cookieBasePath });
    res.clearCookie('g_state', { path: cookieBasePath });
    res.clearCookie('g_front', { path: cookieBasePath });

   
    res.cookie('g_pkce',  code_verifier, pkceOpts);
    res.cookie('g_state', state,         pkceOpts);
    res.cookie('g_front', frontBase,     pkceOpts);

    
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const authorizationUrl = client.authorizationUrl({
      scope: 'openid email profile',
      code_challenge,
      code_challenge_method: 'S256',
      state,
      prompt: 'select_account',
      redirect_uri: `${apiBase(req)}/api/auth/google/callback`
    });

    return res.redirect(authorizationUrl);
  } catch (e) {
    req.log?.error?.(e, 'google/start error');
    return res.status(500).json({ error: 'Erro ao iniciar login Google' });
  }
});




router.get('/google/callback', async (req, res) => {
  try {
    const client = await getGoogleClient(req);
    const params = client.callbackParams(req);

    const cookieBasePath = '/api/auth';
    const code_verifier = req.cookies.g_pkce;
    const stateCookie   = req.cookies.g_state;
    const frontBase     = req.cookies.g_front;

    // Log útil
    req.log?.warn?.({
      hasPkce: !!code_verifier,
      stateCookie,
      stateParam: params.state
    }, 'google/callback state check');

   
    res.clearCookie('g_pkce',  { path: cookieBasePath });
    res.clearCookie('g_state', { path: cookieBasePath });
    res.clearCookie('g_front', { path: cookieBasePath });

    
    if (!code_verifier || !stateCookie || stateCookie !== params.state) {
      
      if (await hasValidRefresh(req)) {
        const base = frontBase || pickFrontendBase(req);
        return res.redirect(`${base.replace(/\/+$/, '')}/oauth/success`);
      }
      return res.status(400).send('State/PKCE inválidos');
    }

    
    const tokenSet = await client.callback(
      `${apiBase(req)}/api/auth/google/callback`,
      params,
      { code_verifier, state: stateCookie }
    );

    const claims = tokenSet.claims();
    const email = String(claims.email || '').toLowerCase().trim();
    const name  = claims.name || claims.given_name || 'Usuário';
    if (!email || !claims.email_verified) {
      return res.status(400).send('Email ausente ou não verificado no Google');
    }

   
    const found = await query('SELECT id, name, email, role FROM users WHERE email=$1 LIMIT 1', [email]);
    let user;
    if (found.rowCount) {
      user = found.rows[0];
      if (!user.name && name) {
        await query('UPDATE users SET name=$1, updated_at=NOW() WHERE id=$2', [name, user.id]);
        user.name = name;
      }
    } else {
      const placeholderHash = await argon2.hash(crypto.randomBytes(32).toString('hex'));
      const ins = await query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, name, email, role, created_at, updated_at`,
        [name, email, placeholderHash]
      );
      user = ins.rows[0];
    }

    
    const accessToken  = signAccessToken(user);
    const familyId     = uuid();
    const refreshToken = await createRefresh(user.id, familyId);
    res.cookie('refreshToken', refreshToken, refreshCookieOpts(req));

    const base = frontBase || pickFrontendBase(req);
    return res.redirect(`${base.replace(/\/+$/, '')}/oauth/success`);
  } catch (e) {
    req.log?.error?.(e, 'google/callback error');
    return res.status(500).send('Erro no callback do Google');
  }
});



let fetchFn = globalThis.fetch ? globalThis.fetch.bind(globalThis) : null;
if (!fetchFn) {
  try {

    fetchFn = require('node-fetch');
  } catch {
  
    fetchFn = require('undici').fetch;
  }
}


router.get('/github/start', async (req, res) => {
  try {
    const state = generators.state();
    const cookieBasePath = '/api/auth';
    const tmpOpts = oauthTempCookieOpts(req);

    const frontBase = (req.headers.origin && FRONTEND_URLS.includes(req.headers.origin))
      ? req.headers.origin
      : pickFrontendBase(req);

    
    res.clearCookie('g_pkce',   { path: cookieBasePath });
    res.clearCookie('g_state',  { path: cookieBasePath });
    res.clearCookie('g_front',  { path: cookieBasePath });
    res.clearCookie('gh_state', { path: cookieBasePath });
    res.clearCookie('gh_front', { path: cookieBasePath });

    res.cookie('gh_state', state,     tmpOpts);
    res.cookie('gh_front', frontBase, tmpOpts);

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      redirect_uri: `${apiBase(req)}/api/auth/github/callback`,
      scope: 'user:email',
      state
    });

    return res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
  } catch (e) {
    req.log?.error?.(e, 'github/start error');
    res.status(500).json({ error: 'Erro ao iniciar login GitHub' });
  }
});



router.get('/github/callback', async (req, res) => {
  try {
    const { code, state } = req.query || {};
    const cookieBasePath = '/api/auth';
    const stateCookie = req.cookies.gh_state;
    const frontBase = req.cookies.gh_front;

    req.log?.warn?.({ stateCookie, stateParam: state }, 'github/callback state check');

    res.clearCookie('gh_state', { path: cookieBasePath });
    res.clearCookie('gh_front', { path: cookieBasePath });

    if (!code || !state || state !== stateCookie) {
      if (await hasValidRefresh(req)) {
        const base = frontBase || pickFrontendBase(req);
        return res.redirect(`${base.replace(/\/+$/, '')}/oauth/success`);
      }
      return res.status(400).send('State inválido');
    }

    const tokenResp = await fetchFn('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${apiBase(req)}/api/auth/github/callback`
      })
    });
    const tokenJson = await tokenResp.json();
    if (!tokenResp.ok || !tokenJson.access_token) return res.status(400).send('Falha ao trocar code por token');
    const ghToken = tokenJson.access_token;

    const headers = { 'Authorization': `Bearer ${ghToken}`, 'User-Agent': 'fluxum-app', 'Accept': 'application/vnd.github+json' };
    const userResp = await fetchFn('https://api.github.com/user', { headers });
    const userJson = await userResp.json();
    if (!userResp.ok) return res.status(400).send('Falha ao obter perfil do GitHub');

    const emailsResp = await fetchFn('https://api.github.com/user/emails', { headers });
    const emailsJson = await emailsResp.json();
    if (!emailsResp.ok || !Array.isArray(emailsJson)) return res.status(400).send('Falha ao obter email do GitHub');

    const primaryVerified = emailsJson.find(e => e.primary && e.verified);
    const anyVerified = emailsJson.find(e => e.verified);
    const email = ((primaryVerified && primaryVerified.email) || (anyVerified && anyVerified.email) || '').toLowerCase().trim();
    if (!email) return res.status(400).send('Não recebemos email verificado do GitHub');

    const name = userJson.name || userJson.login || 'Usuário GitHub';

    const found = await query('SELECT id, name, email, role FROM users WHERE email=$1 LIMIT 1', [email]);
    let user;
    if (found.rowCount) {
      user = found.rows[0];
      if (!user.name && name) {
        await query('UPDATE users SET name=$1, updated_at=NOW() WHERE id=$2', [name, user.id]);
        user.name = name;
      }
    } else {
      const placeholderHash = await argon2.hash(crypto.randomBytes(32).toString('hex'));
      const ins = await query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, name, email, role, created_at, updated_at`,
        [name, email, placeholderHash]
      );
      user = ins.rows[0];
    }

    const accessToken = signAccessToken(user);
    const familyId = uuid();
    const refreshToken = await createRefresh(user.id, familyId);
    res.cookie('refreshToken', refreshToken, refreshCookieOpts(req));

    const base = frontBase || pickFrontendBase(req);
    return res.redirect(`${base.replace(/\/+$/, '')}/oauth/success`);
  } catch (e) {
    req.log?.error?.(e, 'github/callback error');
    res.status(500).send('Erro no callback do GitHub');
  }
});

module.exports = router;
