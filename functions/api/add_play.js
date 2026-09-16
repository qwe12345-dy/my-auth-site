import { jsonResponse } from '../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
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
    await env.DB.prepare('UPDATE games SET play_count = play_count + 1 WHERE id = ?').bind(gameId).run();
    const game = await env.DB.prepare('SELECT play_count FROM games WHERE id = ?').bind(gameId).first();
    return jsonResponse({ success: true, play_count: game ? game.play_count : 0 });
  } catch (e) {
    return jsonResponse({ success: false, message: '失败: ' + e.message }, 500);
  }
}
