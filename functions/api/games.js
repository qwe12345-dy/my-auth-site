import { jsonResponse, getUserFromRequest } from '../_utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');
  const user = await getUserFromRequest(request, env);
  try {
    let games;
    if (userId) {
      const isSelf = user && user.id == userId;
      if (isSelf) {
        games = await env.DB.prepare(
          'SELECT g.*, u.username as author_name FROM games g JOIN users u ON g.user_id = u.id WHERE g.user_id = ? ORDER BY g.created_at DESC'
        ).bind(userId).all();
      } else {
        games = await env.DB.prepare(
          'SELECT g.*, u.username as author_name FROM games g JOIN users u ON g.user_id = u.id WHERE g.user_id = ? AND g.status = ? ORDER BY g.created_at DESC'
        ).bind(userId, 'approved').all();
      }
    } else {
      games = await env.DB.prepare(
        'SELECT g.*, u.username as author_name FROM games g JOIN users u ON g.user_id = u.id WHERE g.status = ? ORDER BY g.created_at DESC LIMIT 50'
      ).bind('approved').all();
    }
    const list = games.results.map(g => ({
      id: g.id,
      user_id: g.user_id,
      title: g.title,
      description: g.description,
      icon: g.icon,
      status: g.status,
      reject_reason: g.reject_reason,
      likes_count: g.likes_count,
      favorites_count: g.favorites_count,
      comments_count: g.comments_count,
      created_at: g.created_at,
      author_name: g.author_name
    }));
    return jsonResponse({ success: true, games: list });
  } catch (e) {
    return jsonResponse({ success: false, message: '获取失败: ' + e.message }, 500);
  }
}
