import { jsonResponse, getUserFromRequest, getChinaTime } from '../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const user = await getUserFromRequest(request, env);
  if (!user) return jsonResponse({ success: false, message: '请先登录' }, 401);
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, message: '请求格式错误' }, 400);
  }
  const gameId = body.game_id;
  if (!gameId) return jsonResponse({ success: false, message: '游戏ID不能为空' }, 400);
  try {
    const exist = await env.DB.prepare('SELECT id FROM favorites WHERE user_id = ? AND game_id = ?').bind(user.id, gameId).first();
    if (exist) {
      await env.DB.prepare('DELETE FROM favorites WHERE id = ?').bind(exist.id).run();
      await env.DB.prepare('UPDATE games SET favorites_count = favorites_count - 1 WHERE id = ?').bind(gameId).run();
      return jsonResponse({ success: true, favorited: false, message: '已取消收藏' });
    } else {
      const chinaTime = getChinaTime();
      await env.DB.prepare('INSERT INTO favorites (user_id, game_id, created_at) VALUES (?, ?, ?)').bind(user.id, gameId, chinaTime).run();
      await env.DB.prepare('UPDATE games SET favorites_count = favorites_count + 1 WHERE id = ?').bind(gameId).run();
      return jsonResponse({ success: true, favorited: true, message: '收藏成功' });
    }
  } catch (e) {
    return jsonResponse({ success: false, message: '操作失败: ' + e.message }, 500);
  }
}
