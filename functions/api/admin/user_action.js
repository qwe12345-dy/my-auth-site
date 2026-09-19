import { adminJson, requireAdmin } from '../../_admin.js';

export async function onRequestPost(context) {
  const fail = await requireAdmin(context);
  if (fail) return fail;
  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return adminJson({ success: false, message: '参数错误' }, 400);
  }
  const action = body.action;
  const userId = parseInt(body.user_id, 10);
  if (!userId) return adminJson({ success: false, message: '缺少用户ID' }, 400);
  try {
    if (action === 'set_coins') {
      const coins = Math.max(0, parseInt(body.coins, 10) || 0);
      await env.DB.prepare('UPDATE users SET r_coins=? WHERE id=?').bind(coins, userId).run();
      return adminJson({ success: true, message: 'R币已设置为 ' + coins });
    }
    if (action === 'add_coins') {
      const coins = parseInt(body.coins, 10) || 0;
      await env.DB.prepare('UPDATE users SET r_coins=MAX(0,r_coins+?) WHERE id=?').bind(coins, userId).run();
      return adminJson({ success: true, message: '已调整 ' + (coins >= 0 ? '+' : '') + coins + ' R币' });
    }
    if (action === 'ban') {
      await env.DB.prepare('UPDATE users SET banned=1 WHERE id=?').bind(userId).run();
      await env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(userId).run();
      return adminJson({ success: true, message: '已封禁，该用户已被强制下线' });
    }
    if (action === 'unban') {
      await env.DB.prepare('UPDATE users SET banned=0 WHERE id=?').bind(userId).run();
      return adminJson({ success: true, message: '已解封' });
    }
    if (action === 'delete') {
      for (const sql of [
        'DELETE FROM sessions WHERE user_id=?',
        'DELETE FROM identities WHERE user_id=?',
        'DELETE FROM ad_views WHERE user_id=?',
        'DELETE FROM checkins WHERE user_id=?',
        'DELETE FROM user_plays WHERE user_id=?',
        'DELETE FROM likes WHERE user_id=?',
        'DELETE FROM favorites WHERE user_id=?',
        'DELETE FROM comments WHERE user_id=?',
        'DELETE FROM games WHERE user_id=?'
      ]) {
        await env.DB.prepare(sql).bind(userId).run();
      }
      await env.DB.prepare('DELETE FROM users WHERE id=?').bind(userId).run();
      return adminJson({ success: true, message: '用户及其数据已删除' });
    }
    return adminJson({ success: false, message: '未知操作' }, 400);
  } catch (e) {
    return adminJson({ success: false, message: '操作失败: ' + e.message }, 500);
  }
}
