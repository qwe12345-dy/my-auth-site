import { adminJson, adminCreds, signAdminToken } from '../../_admin.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return adminJson({ success: false, message: '请求格式错误' }, 400);
  }
  const creds = adminCreds(env);
  const u = (body.username || '').trim();
  const p = body.password || '';
  if (u !== creds.user || p !== creds.pass) {
    return adminJson({ success: false, message: '账号或密码错误' }, 401);
  }
  const token = await signAdminToken(env);
  const resp = adminJson({ success: true, message: '登录成功' });
  resp.headers.set('Set-Cookie', `admin_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200`);
  return resp;
}
