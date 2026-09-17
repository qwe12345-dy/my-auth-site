import { jsonResponse, getUserFromRequest } from '../_utils.js';

const CHECKIN_DAYS = {
  17: 30,
  18: 50,
  20: 88
};

export async function onRequestPost(context) {
  const { request, env } = context;
  const user = await getUserFromRequest(request, env);
  if (!user) return jsonResponse({ success: false, message: '请先登录' }, 401);
  try {
    const now = new Date(Date.now() + 8 * 60 * 60 * 1000);
    const month = now.getUTCMonth() + 1;
    const day = now.getUTCDate();
    const year = now.getUTCFullYear();

    if (month !== 9 || !CHECKIN_DAYS.hasOwnProperty(day)) {
      return jsonResponse({ success: false, message: '今天不是签到日' }, 400);
    }

    const dateStr = year + '-09-' + (day < 10 ? '0' + day : day);
    const exist = await env.DB.prepare('SELECT id FROM checkins WHERE user_id = ? AND checkin_date = ?').bind(user.id, dateStr).first();
    if (exist) {
      return jsonResponse({ success: false, message: '今天已经签到过了' }, 400);
    }

    const reward = CHECKIN_DAYS[day];
    await env.DB.batch([
      env.DB.prepare('INSERT INTO checkins (user_id, checkin_date, reward) VALUES (?, ?, ?)').bind(user.id, dateStr, reward),
      env.DB.prepare('UPDATE users SET r_coins = r_coins + ? WHERE id = ?').bind(reward, user.id)
    ]);

    const updated = await env.DB.prepare('SELECT r_coins FROM users WHERE id = ?').bind(user.id).first();
    return jsonResponse({ success: true, message: '签到成功', reward: reward, balance: updated.r_coins });
  } catch (e) {
    return jsonResponse({ success: false, message: '签到失败: ' + e.message }, 500);
  }
}
