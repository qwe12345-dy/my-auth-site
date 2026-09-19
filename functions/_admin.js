function adminJson(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

function adminSecret(env) {
  return (env && env.ADMIN_SECRET) || 'czgf-admin-default-secret-2026-please-change';
}

function adminCreds(env) {
  return {
    user: (env && env.ADMIN_USER) || 'root',
    pass: (env && env.ADMIN_PASS) || 'root'
  };
}

async function hmacKey(env) {
  const enc = new TextEncoder();
  return crypto.subtle.importKey('raw', enc.encode(adminSecret(env)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

function b64url(buf) {
  let bin = '';
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlToBytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}

async function signAdminToken(env) {
  const exp = Date.now() + 12 * 3600 * 1000;
  const payload = 'admin.' + exp;
  const key = await hmacKey(env);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return payload + '.' + b64url(new Uint8Array(sig));
}

async function isAdmin(request, env) {
  try {
    const cookie = request.headers.get('Cookie') || '';
    const m = cookie.match(/admin_token=([^;]+)/);
    if (!m) return false;
    const token = m[1];
    const idx = token.lastIndexOf('.');
    if (idx < 0) return false;
    const payload = token.substring(0, idx);
    const sigB64 = token.substring(idx + 1);
    const parts = payload.split('.');
    if (parts.length !== 2 || parts[0] !== 'admin') return false;
    const exp = parseInt(parts[1], 10);
    if (!exp || Date.now() > exp) return false;
    const key = await hmacKey(env);
    const sig = b64urlToBytes(sigB64);
    return crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode(payload));
  } catch (e) {
    return false;
  }
}

async function requireAdmin(context) {
  const { request, env } = context;
  const ok = await isAdmin(request, env);
  if (!ok) return adminJson({ success: false, message: '未登录或登录已过期' }, 401);
  return null;
}

export { adminJson, adminCreds, signAdminToken, isAdmin, requireAdmin };
