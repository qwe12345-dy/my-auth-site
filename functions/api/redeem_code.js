import { jsonResponse, getUserFromRequest, getChinaTime } from '../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const user = await getUserFromRequest(request, env);
  if (!user) return jsonResponse({ success: false, message: '请先登录' }, 401);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ success: false, message: '请求格式错误' }, 400);
  }
  const code = (body.code || '').trim().toUpperCase();
  if (!code) return jsonResponse({ success: false, message: '请输入兑换码' }, 400);

  try {
    const row = await env.DB.prepare('SELECT * FROM redeem_codes WHERE code = ?').bind(code).first();
    if (!row) return jsonResponse({ success: false, message: '兑换码不存在' }, 404);

    const now = getChinaTime();
    if (row.expire_at && row.expire_at < now) {
      return jsonResponse({ success: false, message: '兑换码已过期' }, 400);
    }
    if (row.used_count >= row.max_uses) {
      return jsonResponse({ success: false, message: '兑换码已被用完' }, 400);
    }
    if (row.one_per_user) {
      const used = await env.DB.prepare('SELECT id FROM code_uses WHERE code_id = ? AND user_id = ?').bind(row.id, user.id).first();
      if (used) return jsonResponse({ success: false, message: '你已经使用过该兑换码' }, 400);
    }

    await env.DB.prepare('UPDATE redeem_codes SET used_count = used_count + 1 WHERE id = ?').bind(row.id).run();
    await env.DB.prepare('INSERT INTO code_uses (code_id, user_id, used_at) VALUES (?, ?, ?)').bind(row.id, user.id, now).run();
    await env.DB.prepare('UPDATE users SET r_coins = r_coins + ? WHERE id = ?').bind(row.coins, user.id).run();

    return jsonResponse({ success: true, message: '兑换成功，获得 ' + row.coins + ' R币', coins: row.coins });
  } catch (e) {
    return jsonResponse({ success: false, message: '兑换失败: ' + e.message }, 500);
  }
}
