import { adminJson } from '../../_admin.js';

export async function onRequestPost(context) {
  const resp = adminJson({ success: true });
  resp.headers.set('Set-Cookie', 'admin_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  return resp;
}
