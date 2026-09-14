import { generateCode, jsonResponse, checkEmailDomain, sendEmailJS, verifyTurnstile } from '../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, message: '请求格式错误' }, 400);
  }
  const email = (body.email || '').trim();
  const turnstileToken = body.turnstile_token || '';
  if (!email) {
    return jsonResponse({ success: false, message: '邮箱不能为空' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ success: false, message: '邮箱格式不正确' }, 400);
  }
  const domainCheck = checkEmailDomain(email);
  if (!domainCheck.valid) {
    return jsonResponse({ success: false, message: domainCheck.message }, 400);
  }
  if (env.TURNSTILE_SECRET_KEY) {
    const turnstileOk = await verifyTurnstile(turnstileToken, env);
    if (!turnstileOk) {
      return jsonResponse({ success: false, message: '人机验证失败，请重试' }, 400);
    }
  }
  try {
    const exist = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (exist) {
      return jsonResponse({ success: false, message: '该邮箱已被注册' }, 400);
    }
    const code = generateCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await env.DB.prepare('INSERT INTO email_codes (email, code, expires_at) VALUES (?, ?, ?)').bind(email, code, expires).run();
    const sent = await sendEmailJS(email, code);
    if (!sent) {
      return jsonResponse({ success: false, message: '验证码发送失败，请稍后重试' }, 500);
    }
    return jsonResponse({ success: true, message: '验证码已发送，有效期10分钟' });
  } catch (e) {
    return jsonResponse({ success: false, message: '发送失败: ' + e.message }, 500);
  }
}
