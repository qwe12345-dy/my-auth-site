import { jsonResponse, getUserFromRequest } from '../_utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return jsonResponse({ success: false, message: '未登录' }, 401);
  }
  return jsonResponse({ success: true, user });
}
