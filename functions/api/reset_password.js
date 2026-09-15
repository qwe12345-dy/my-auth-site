import { hashPassword, jsonResponse } from '../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, message: '请求格式错误' }, 400);
  }
  const email = (body.email || '').trim();
  const code = (body.code || '').trim();
  const password = body.password || '';
  if (!email || !code || !password) {
    return jsonResponse({ success: false, message: '邮箱、验证码、新密码不能为空' }, 400);
  }
  if (password.length < 6) {
    return jsonResponse({ success: false, message: '密码至少6位' }, 400);
  }
  try {
    const codeRecord = await env.DB.prepare(
      'SELECT * FROM email_codes WHERE email = ? AND code = ? AND used = 0 AND expires_at > datetime("now") ORDER BY id DESC LIMIT 1'
    ).bind(email, code).first();
    if (!codeRecord) {
      return jsonResponse({ success: false, message: '验证码错误或已过期' }, 400);
    }
    const user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (!user) {
      return jsonResponse({ success: false, message: '用户不存在' }, 404);
    }
    const hashed = await hashPassword(password);
    await env.DB.prepare('UPDATE users SET password = ? WHERE id = ?').bind(hashed, user.id).run();
    await env.DB.prepare('UPDATE email_codes SET used = 1 WHERE id = ?').bind(codeRecord.id).run();
    return jsonResponse({ success: true, message: '密码重置成功' });
  } catch (e) {
    return jsonResponse({ success: false, message: '重置失败: ' + e.message }, 500);
  }
}
