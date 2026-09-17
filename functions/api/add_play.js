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
  if (!gameId) {
    return jsonResponse({ success: false, message: '游戏ID不能为空' }, 400);
  }
  try {
    const exist = await env.DB.prepare('SELECT id FROM user_plays WHERE user_id = ? AND game_id = ?').bind(user.id, gameId).first();
    if (exist) {
      const game = await env.DB.prepare('SELECT play_count FROM games WHERE id = ?').bind(gameId).first();
      return jsonResponse({ success: true, play_count: game ? game.play_count : 0, counted: false });
    }
    await env.DB.batch([
      env.DB.prepare('INSERT INTO user_plays (user_id, game_id) VALUES (?, ?)').bind(user.id, gameId),
      env.DB.prepare('UPDATE games SET play_count = play_count + 1 WHERE id = ?').bind(gameId)
    ]);
    const game = await env.DB.prepare('SELECT play_count FROM games WHERE id = ?').bind(gameId).first();
    return jsonResponse({ success: true, play_count: game ? game.play_count : 0, counted: true });
  } catch (e) {
    return jsonResponse({ success: false, message: '失败: ' + e.message }, 500);
  }
}
