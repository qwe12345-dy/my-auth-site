import { jsonResponse, getUserFromRequest } from '../_utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');
  try {
    let rows;
    if (userId) {
      rows = await env.DB.prepare(
        'SELECT p.*, u.username as author_name, u.avatar as author_avatar FROM posts p JOIN users u ON p.user_id = u.id WHERE p.user_id = ? AND p.status = ? ORDER BY p.created_at DESC LIMIT 100'
      ).bind(userId, 'approved').all();
    } else {
      rows = await env.DB.prepare(
        'SELECT p.*, u.username as author_name, u.avatar as author_avatar FROM posts p JOIN users u ON p.user_id = u.id WHERE p.status = ? ORDER BY p.created_at DESC LIMIT 100'
      ).bind('approved').all();
    }
    const list = rows.results.map(p => ({
      id: p.id,
      user_id: p.user_id,
      title: p.title,
      content: p.content,
      image: p.image,
      comments_count: p.comments_count,
      created_at: p.created_at,
      author_name: p.author_name,
      author_avatar: p.author_avatar
    }));
    return jsonResponse({ success: true, posts: list });
  } catch (e) {
    return jsonResponse({ success: false, message: '获取失败: ' + e.message }, 500);
  }
}
