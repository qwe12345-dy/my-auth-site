import { jsonResponse, getUserFromRequest } from '../_utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const user = await getUserFromRequest(request, env);
  if (!user) return jsonResponse({ success: false, message: '请先登录' }, 401);
  try {
    const row = await env.DB.prepare('SELECT real_name, id_card_mask, status, reject_reason, created_at FROM identities WHERE user_id = ?').bind(user.id).first();
    if (!row) {
      return jsonResponse({ success: true, verified: false, status: 'none' });
    }
    return jsonResponse({
      success: true,
      verified: true,
      status: row.status,
      real_name: row.real_name,
      id_card_mask: row.id_card_mask,
      reject_reason: row.reject_reason || ''
    });
  } catch (e) {
    return jsonResponse({ success: true, verified: false, status: 'none' });
  }
}
