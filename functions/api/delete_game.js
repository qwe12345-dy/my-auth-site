import { jsonResponse, getUserFromRequest } from '../_utils.js';

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
  const game = await env.DB.prepare('SELECT * FROM games WHERE id = ?').bind(gameId).first();
  if (!game) return jsonResponse({ success: false, message: '游戏不存在' }, 404);
  if (game.user_id !== user.id) return jsonResponse({ success: false, message: '只能删除自己的游戏' }, 403);
  try {
    await env.DB.prepare('DELETE FROM games WHERE id = ?').bind(gameId).run();
    await env.DB.prepare('DELETE FROM likes WHERE game_id = ?').bind(gameId).run();
    await env.DB.prepare('DELETE FROM favorites WHERE game_id = ?').bind(gameId).run();
    await env.DB.prepare('DELETE FROM comments WHERE game_id = ?').bind(gameId).run();
    return jsonResponse({ success: true, message: '删除成功' });
  } catch (e) {
    return jsonResponse({ success: false, message: '删除失败: ' + e.message }, 500);
  }
}
