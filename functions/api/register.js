import { hashPassword, generateToken, jsonResponse } from '../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, message: '请求格式错误' }, 400);
  }
  const username = (body.username || '').trim();
  const email = (body.email || '').trim();
  const password = body.password || '';
  if (!username || !email || !password) {
    return jsonResponse({ success: false, message: '用户名、邮箱、密码不能为空' }, 400);
  }
  if (username.length < 2 || username.length > 20) {
    return jsonResponse({ success: false, message: '用户名长度2-20位' }, 400);
  }
  if (password.length < 6) {
    return jsonResponse({ success: false, message: '密码至少6位' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ success: false, message: '邮箱格式不正确' }, 400);
  }
  try {
    const exist = await env.DB.prepare('SELECT id FROM users WHERE username = ? OR email = ?').bind(username, email).first();
    if (exist) {
      return jsonResponse({ success: false, message: '用户名或邮箱已被注册' }, 400);
    }
    const hashed = await hashPassword(password);
    const result = await env.DB.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').bind(username, email, hashed).run();
    const userId = result.meta.last_row_id;
    const token = generateToken();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await env.DB.prepare('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)').bind(userId, token, expires).run();
    const response = jsonResponse({ success: true, message: '注册成功', user: { id: userId, username, email } });
    response.headers.set('Set-Cookie', `session_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
    return response;
  } catch (e) {
    return jsonResponse({ success: false, message: '注册失败: ' + e.message }, 500);
  }
}
