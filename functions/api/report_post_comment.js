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
  const commentId = body.comment_id;
  if (!commentId) return jsonResponse({ success: false, message: '评论ID不能为空' }, 400);
  const comment = await env.DB.prepare('SELECT * FROM post_comments WHERE id = ?').bind(commentId).first();
  if (!comment) return jsonResponse({ success: false, message: '评论不存在' }, 404);
  if (comment.user_id === user.id) return jsonResponse({ success: false, message: '不能举报自己的评论' }, 400);
  try {
    await env.DB.prepare("UPDATE post_comments SET status = 'reported' WHERE id = ?").bind(commentId).run();
    return jsonResponse({ success: true, message: '举报成功，我们会尽快处理' });
  } catch (e) {
    return jsonResponse({ success: false, message: '举报失败: ' + e.message }, 500);
  }
}
