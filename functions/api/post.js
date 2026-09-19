import { jsonResponse } from '../_utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return jsonResponse({ success: false, message: '帖子ID不能为空' }, 400);
  try {
    const p = await env.DB.prepare(
      'SELECT p.*, u.username as author_name, u.avatar as author_avatar FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ? AND p.status = ?'
    ).bind(id, 'approved').first();
    if (!p) return jsonResponse({ success: false, message: '动态不存在或已删除' }, 404);
    return jsonResponse({
      success: true,
      post: {
        id: p.id,
        user_id: p.user_id,
        title: p.title,
        content: p.content,
        image: p.image,
        comments_count: p.comments_count,
        created_at: p.created_at,
        author_name: p.author_name,
        author_avatar: p.author_avatar
      }
    });
  } catch (e) {
    return jsonResponse({ success: false, message: '获取失败: ' + e.message }, 500);
  }
}
