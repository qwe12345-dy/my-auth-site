import { jsonResponse, getUserFromRequest, getChinaTime, moderateContent } from '../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const user = await getUserFromRequest(request, env);
  if (!user) return jsonResponse({ success: false, message: '请先登录' }, 401);

  const idRow = await env.DB.prepare("SELECT status FROM identities WHERE user_id = ? AND status = 'approved'").bind(user.id).first();
  if (!idRow) {
    return jsonResponse({ success: false, code: 'NEED_REALNAME', message: '请你实名认证后才能发送动态' }, 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, message: '请求格式错误' }, 400);
  }
  const title = (body.title || '').trim();
  const content = (body.content || '').trim();
  const image = body.image || '';
  if (!title || !content) {
    return jsonResponse({ success: false, message: '标题和内容不能为空' }, 400);
  }
  if (title.length > 50) {
    return jsonResponse({ success: false, message: '标题不能超过50字' }, 400);
  }
  if (content.length > 1000) {
    return jsonResponse({ success: false, message: '内容不能超过1000字' }, 400);
  }
  const titleCheck = moderateContent(title);
  if (!titleCheck.passed) {
    return jsonResponse({ success: false, message: '标题' + titleCheck.reason }, 400);
  }
  const contentCheck = moderateContent(content);
  if (!contentCheck.passed) {
    return jsonResponse({ success: false, message: '内容' + contentCheck.reason }, 400);
  }
  const chinaTime = getChinaTime();
  try {
    const result = await env.DB.prepare(
      'INSERT INTO posts (user_id, title, content, image, status, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(user.id, title, content, image, 'approved', chinaTime).run();
    return jsonResponse({ success: true, message: '发布成功', post_id: result.meta.last_row_id });
  } catch (e) {
    return jsonResponse({ success: false, message: '发布失败: ' + e.message }, 500);
  }
}
