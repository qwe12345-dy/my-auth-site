import { jsonResponse, getUserFromRequest, getChinaTime } from '../_utils.js';

const DAILY_AD_LIMIT = 15;

export async function onRequestGet(context) {
  const { request, env } = context;
  const user = await getUserFromRequest(request, env);
  if (!user) return jsonResponse({ success: false, message: '请先登录' }, 401);
  let adUsed = 0;
  try {
    const today = getChinaTime().substring(0, 10);
    const row = await env.DB.prepare('SELECT COUNT(*) as c FROM ad_views WHERE user_id = ? AND view_date = ?').bind(user.id, today).first();
    adUsed = row ? row.c : 0;
  } catch (e) {
    adUsed = 0;
  }
  return jsonResponse({
    success: true,
    balance: user.r_coins || 0,
    ad_used: adUsed,
    ad_limit: DAILY_AD_LIMIT,
    ad_remaining: Math.max(0, DAILY_AD_LIMIT - adUsed)
  });
}
