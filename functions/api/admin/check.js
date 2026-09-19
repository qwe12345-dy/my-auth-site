import { adminJson, isAdmin } from '../../_admin.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const ok = await isAdmin(request, env);
  return adminJson({ success: ok, logged: ok });
}
