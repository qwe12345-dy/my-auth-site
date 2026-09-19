import { jsonResponse } from '../_utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const postId = url.searchParams.get('post_id');
  if (!postId) return jsonResponse({ success: false, message: '帖子ID不能为空' }, 400);
  try {
    const comments = await env.DB.prepare(
      'SELECT c.*, u.username, u.avatar FROM post_comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = ? AND c.status = ? ORDER BY c.created_at DESC LIMIT 200'
    ).bind(postId, 'normal').all();
    const list = comments.results.map(c => ({
      id: c.id,
      post_id: c.post_id,
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
