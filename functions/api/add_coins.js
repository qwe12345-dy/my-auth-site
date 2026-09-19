import { jsonResponse, getUserFromRequest, getChinaTime } from '../_utils.js';

const DAILY_AD_LIMIT = 15;

export async function onRequestPost(context) {
  const { request, env } = context;
  const user = await getUserFromRequest(request, env);
  if (!user) return jsonResponse({ success: false, message: '请先登录' }, 401);
  try {
    const today = getChinaTime().substring(0, 10);
    const countRow = await env.DB.prepare('SELECT COUNT(*) as c FROM ad_views WHERE user_id = ? AND view_date = ?').bind(user.id, today).first();
    const used = countRow ? countRow.c : 0;
    if (used >= DAILY_AD_LIMIT) {
      return jsonResponse({ success: false, message: '今日广告次数已用完（15/15），明天再来吧', used: DAILY_AD_LIMIT, limit: DAILY_AD_LIMIT, remaining: 0 });
    }
    const amount = Math.floor(Math.random() * 41) + 20;
    await env.DB.prepare('INSERT INTO ad_views (user_id, view_date) VALUES (?, ?)').bind(user.id, today).run();
    await env.DB.prepare('UPDATE users SET r_coins = r_coins + ? WHERE id = ?').bind(amount, user.id).run();
    const newBalance = (user.r_coins || 0) + amount;
    return jsonResponse({
      success: true,
      message: '获得 ' + amount + ' R币',
      amount: amount,
      balance: newBalance,
      used: used + 1,
      limit: DAILY_AD_LIMIT,
      remaining: DAILY_AD_LIMIT - used - 1
    });
  } catch (e) {
    return jsonResponse({ success: false, message: '领取失败: ' + e.message }, 500);
  }
}
