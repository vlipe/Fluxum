const jwt = require("jsonwebtoken");
const { pool } = require("../database/db");
const argon2 = require("argon2");
const crypto = require("crypto");

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || "120m";
const REFRESH_EXPIRES = `${process.env.REFRESH_EXPIRES_DAYS || 7}d`;
const RESET_EXPIRES_MIN = parseInt(process.env.RESET_EXPIRES_MIN || "30", 10);
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").split(",")[0];

function signAccess(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
  
}
function signRefresh(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
}



exports.register = async (req, res) => {
  const { name, email, password, account_id } = req.body;
  if (!name || !email || !password || !account_id) return res.status(400).json({ error: "Dados inválidos" });
  const hash = await argon2.hash(password);
  const { rows } = await pool.query(
    "INSERT INTO users (name,email,password_hash,account_id) VALUES ($1,$2,$3,$4) RETURNING id,name,email,account_id",
    [name, email.trim().toLowerCase(), hash, account_id]
  );
  const u = rows[0];
  // no login/refresh:
const accessToken = signAccessToken({
  sub: user.id,                
  role: user.role,
  account_id: Number(user.account_id), 
  email: user.email
});

  // no login/refresh:
const refreshToken = signRefresh({
  sub: user.id,                
  role: user.role,
  account_id: Number(user.account_id), 
  email: user.email
});

  res.cookie("rt", refreshToken, { httpOnly: true, sameSite: "lax", secure: false, path: "/api/auth" });
  return res.status(201).json({ accessToken, user: { id: u.id, name: u.name, email: u.email, account_id: u.account_id } });
};

exports.login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Credenciais inválidas" });
  const { rows } = await pool.query("SELECT id,name,email,password_hash,account_id FROM users WHERE email=$1 LIMIT 1", [String(email).trim().toLowerCase()]);
  if (!rows.length) return res.status(401).json({ error: "Credenciais inválidas" });
  const u = rows[0];
  const ok = await argon2.verify(u.password_hash, password);
  if (!ok) return res.status(401).json({ error: "Credenciais inválidas" });
  const accessToken = signAccess({ sub: String(u.id), email: u.email, account_id: u.account_id, role: "user" });
  const refreshToken = signRefresh({ sub: String(u.id), account_id: u.account_id });
  res.cookie("rt", refreshToken, { httpOnly: true, sameSite: "lax", secure: false, path: "/api/auth" });
  return res.json({ accessToken, user: { id: u.id, name: u.name, email: u.email, account_id: u.account_id } });
};

exports.refresh = async (req, res) => {
  const raw = req.cookies?.rt || "";
  if (!raw) return res.status(401).json({ error: "Sem refresh" });
  try {
    const payload = jwt.verify(raw, REFRESH_SECRET);
    const { rows } = await pool.query("SELECT id,email,account_id FROM users WHERE id=$1 LIMIT 1", [payload.sub]);
    if (!rows.length) return res.status(401).json({ error: "Inválido" });
    const u = rows[0];
    const accessToken = signAccess({ sub: String(u.id), email: u.email, account_id: u.account_id, role: "user" });
    return res.json({ accessToken });
  } catch {
    return res.status(401).json({ error: "Inválido" });
  }
};

exports.logout = async (_req, res) => {
  res.clearCookie("rt", { path: "/api/auth" });
  return res.status(204).send();
};

exports.forgotPassword = async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const okResp = () => res.status(202).json({ message: "Se o e-mail existir, enviaremos instruções." });
  if (!email) return okResp();

  try {
    const u = await pool.query("SELECT id, name, email FROM users WHERE email=$1 LIMIT 1", [email]);
    if (u.rowCount === 0) return okResp();
    const user = u.rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + RESET_EXPIRES_MIN * 60 * 1000);

    await pool.query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at, ip, user_agent)
       VALUES ($1,$2,$3,$4,$5)`,
      [user.id, tokenHash, expiresAt, req.ip || null, req.headers["user-agent"] || null]
    );

    const link = `${FRONTEND_URL.replace(/\/+$/,"")}/reset-password?token=${encodeURIComponent(token)}`;

    try {
      const { sendPasswordReset } = require("../services/mailer");
      await sendPasswordReset(user.email, user.name, link);
    } catch {
      if (process.env.NODE_ENV !== "production") console.log("[DEV] reset link:", link);
    }

    return okResp();
  } catch {
    return okResp();
  }
};

exports.validateResetToken = async (req, res) => {
  const token = String(req.query?.token || "");
  if (!token) return res.status(400).json({ valid: false });
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const t = await pool.query("SELECT expires_at, used_at FROM password_resets WHERE token_hash=$1 LIMIT 1", [tokenHash]);
  if (t.rowCount === 0) return res.json({ valid: false });
  const row = t.rows[0];
  const valid = !row.used_at && new Date(row.expires_at).getTime() >= Date.now();
  return res.json({ valid });
};

exports.resetPassword = async (req, res) => {
  const token = String(req.body?.token || "");
  const newPassword = String(req.body?.password || "");
  const confirm = req.body?.confirmPassword != null ? String(req.body.confirmPassword) : null;
  if (!token || newPassword.length < 6) return res.status(400).json({ error: "Token inválido e/ou senha muito curta" });
  if (confirm !== null && confirm !== newPassword) return res.status(400).json({ error: "As senhas não coincidem" });

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  try {
    const t = await pool.query(
      "SELECT id, user_id, expires_at, used_at FROM password_resets WHERE token_hash=$1 LIMIT 1",
      [tokenHash]
    );
    if (t.rowCount === 0) return res.status(400).json({ error: "Token inválido" });
    const row = t.rows[0];
    if (row.used_at) return res.status(400).json({ error: "Token já utilizado" });
    if (new Date(row.expires_at).getTime() < Date.now()) return res.status(400).json({ error: "Token expirado" });

    const password_hash = await argon2.hash(newPassword);

    await pool.query("BEGIN");
    await pool.query("UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2", [password_hash, row.user_id]);
    await pool.query("UPDATE password_resets SET used_at=NOW() WHERE id=$1", [row.id]);
    await pool.query("COMMIT");

    res.clearCookie("rt", { path: "/api/auth" });
    return res.status(204).send();
  } catch (e) {
    await pool.query("ROLLBACK").catch(() => {});
    return res.status(500).json({ error: "Erro ao redefinir senha" });
  }
};
