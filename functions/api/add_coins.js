import { jsonResponse, getUserFromRequest } from '../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const user = await getUserFromRequest(request, env);
  if (!user) return jsonResponse({ success: false, message: '请先登录' }, 401);
  try {
    const amount = Math.floor(Math.random() * 41) + 20;
    await env.DB.prepare('UPDATE users SET r_coins = r_coins + ? WHERE id = ?').bind(amount, user.id).run();
    const newBalance = (user.r_coins || 0) + amount;
    return jsonResponse({ success: true, message: '获得 ' + amount + ' R币', amount: amount, balance: newBalance });
  } catch (e) {
    return jsonResponse({ success: false, message: '领取失败: ' + e.message }, 500);
  }
}
