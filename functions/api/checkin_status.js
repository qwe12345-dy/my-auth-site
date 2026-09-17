import { jsonResponse, getUserFromRequest } from '../_utils.js';

const CHECKIN_DAYS = {
  17: 30,
  18: 50,
  20: 88
};

export async function onRequestGet(context) {
  const { request, env } = context;
  const user = await getUserFromRequest(request, env);
  if (!user) return jsonResponse({ success: false, message: '请先登录' }, 401);
  try {
    const now = new Date(Date.now() + 8 * 60 * 60 * 1000);
    const month = now.getUTCMonth() + 1;
    const day = now.getUTCDate();
    const year = now.getUTCFullYear();

    const active = month === 9 && day >= 17 && day <= 30;
    const todayCanCheckin = month === 9 && CHECKIN_DAYS.hasOwnProperty(day);

    const records = await env.DB.prepare(
      "SELECT checkin_date, reward FROM checkins WHERE user_id = ? AND checkin_date LIKE ?"
    ).bind(user.id, year + '-09-%').all();

    const checkedMap = {};
    records.results.forEach(r => {
      const d = parseInt(r.checkin_date.substring(8));
      checkedMap[d] = r.reward;
    });

    const days = [17, 18, 20].map(d => ({
      day: d,
      reward: CHECKIN_DAYS[d],
      checked: checkedMap.hasOwnProperty(d)
    }));

    let todayChecked = false;
    if (todayCanCheckin) {
      todayChecked = checkedMap.hasOwnProperty(day);
    }

    return jsonResponse({
      success: true,
      active: active,
      todayCanCheckin: todayCanCheckin,
      todayChecked: todayChecked,
      todayReward: todayCanCheckin ? CHECKIN_DAYS[day] : 0,
      days: days
    });
  } catch (e) {
    return jsonResponse({ success: false, message: '获取失败: ' + e.message }, 500);
  }
}
