import { jsonResponse, getUserFromRequest } from '../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const u = await getUserFromRequest(request, env);
  if (!u) return jsonResponse({ s: false, m: 'NL' }, 401);
  let b;
  try { b = await request.json(); } catch { return jsonResponse({ s: false, m: 'BE' }, 400); }
  const amt = parseInt(b.amt);
  const tu = (b.tu || '').trim();
  if (!amt || amt < 1 || amt > 15000) return jsonResponse({ s: false, m: 'AR' }, 400);
  if (!tu) return jsonResponse({ s: false, m: 'TR' }, 400);
  if ((u.r_coins || 0) < amt) return jsonResponse({ s: false, m: 'NB' }, 400);
  try {
    let target;
    if (/^\d+$/.test(tu)) {
      target = await env.DB.prepare('SELECT id, username, r_coins FROM users WHERE id = ?').bind(parseInt(tu)).first();
    } else {
      target = await env.DB.prepare('SELECT id, username, r_coins FROM users WHERE username = ?').bind(tu).first();
    }
    if (!target) return jsonResponse({ s: false, m: 'TU' }, 404);
    if (target.id === u.id) return jsonResponse({ s: false, m: 'SF' }, 400);
    await env.DB.batch([
      env.DB.prepare('UPDATE users SET r_coins = r_coins - ? WHERE id = ?').bind(amt, u.id),
      env.DB.prepare('UPDATE users SET r_coins = r_coins + ? WHERE id = ?').bind(amt, target.id)
    ]);
    return jsonResponse({ s: true, m: 'OK', nb: (u.r_coins || 0) - amt, tn: target.username });
  } catch (e) {
    return jsonResponse({ s: false, m: 'ERR' }, 500);
  }
}
