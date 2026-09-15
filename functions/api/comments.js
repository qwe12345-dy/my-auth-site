import { jsonResponse } from '../_utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const gameId = url.searchParams.get('game_id');
  if (!gameId) return jsonResponse({ success: false, message: '游戏ID不能为空' }, 400);
  try {
    const comments = await env.DB.prepare(
      'SELECT c.*, u.username, u.avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.game_id = ? AND c.status = ? ORDER BY c.created_at DESC LIMIT 100'
    ).bind(gameId, 'normal').all();
    const list = comments.results.map(c => ({
      id: c.id,
      game_id: c.game_id,
      user_id: c.user_id,
      content: c.content,
      username: c.username,
      avatar: c.avatar,
      created_at: c.created_at
    }));
    return jsonResponse({ success: true, comments: list });
  } catch (e) {
    return jsonResponse({ success: false, message: '获取评论失败: ' + e.message }, 500);
  }
}
