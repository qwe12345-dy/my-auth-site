import { verifyPassword, generateToken, jsonResponse, verifyTurnstile } from '../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, message: '请求格式错误' }, 400);
  }
  const account = (body.account || '').trim();
  const password = body.password || '';
  const turnstileToken = body.turnstile_token || '';
  if (!account || !password) {
    return jsonResponse({ success: false, message: '账号和密码不能为空' }, 400);
  }
  if (env.TURNSTILE_SECRET_KEY) {
    const turnstileOk = await verifyTurnstile(turnstileToken, env);
    if (!turnstileOk) {
      return jsonResponse({ success: false, message: '人机验证失败，请重试' }, 400);
    }
  }
  try {
    const user = await env.DB.prepare('SELECT * FROM users WHERE username = ? OR email = ?').bind(account, account).first();
    if (!user) {
      return jsonResponse({ success: false, message: '账号不存在' }, 400);
    }
    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return jsonResponse({ success: false, message: '密码错误' }, 400);
    }
    const token = generateToken();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await env.DB.prepare('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)').bind(user.id, token, expires).run();
    const response = jsonResponse({
      success: true,
      message: '登录成功',
      user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar, bio: user.bio }
    });
    response.headers.set('Set-Cookie', `session_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
    return response;
  } catch (e) {
    return jsonResponse({ success: false, message: '登录失败: ' + e.message }, 500);
  }
}
