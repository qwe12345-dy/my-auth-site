import { jsonResponse, getUserFromRequest, getChinaTime, moderateContent } from '../_utils.js';

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
  const postId = body.post_id;
  const content = (body.content || '').trim();
  if (!postId || !content) {
    return jsonResponse({ success: false, message: '帖子ID和评论内容不能为空' }, 400);
  }
  if (content.length > 500) {
    return jsonResponse({ success: false, message: '评论不能超过500字' }, 400);
  }
  const check = moderateContent(content);
  if (!check.passed) {
    return jsonResponse({ success: false, message: '评论' + check.reason }, 400);
  }
  const post = await env.DB.prepare('SELECT id FROM posts WHERE id = ?').bind(postId).first();
  if (!post) return jsonResponse({ success: false, message: '动态不存在' }, 404);
  const chinaTime = getChinaTime();
  try {
    await env.DB.prepare('INSERT INTO post_comments (post_id, user_id, content, created_at) VALUES (?, ?, ?, ?)').bind(postId, user.id, content, chinaTime).run();
    await env.DB.prepare('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?').bind(postId).run();
    return jsonResponse({ success: true, message: '评论成功' });
  } catch (e) {
    return jsonResponse({ success: false, message: '评论失败: ' + e.message }, 500);
  }
}
