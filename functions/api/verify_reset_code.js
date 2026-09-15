import { jsonResponse } from '../_utils.js';

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
  if (!email || !code) {
    return jsonResponse({ success: false, message: '邮箱和验证码不能为空' }, 400);
  }
  try {
    const record = await env.DB.prepare(
      'SELECT * FROM email_codes WHERE email = ? AND code = ? AND used = 0 AND expires_at > datetime("now") ORDER BY id DESC LIMIT 1'
    ).bind(email, code).first();
    if (!record) {
      return jsonResponse({ success: false, message: '验证码错误或已过期' }, 400);
    }
    return jsonResponse({ success: true, message: '验证成功' });
  } catch (e) {
    return jsonResponse({ success: false, message: '验证失败: ' + e.message }, 500);
  }
}
