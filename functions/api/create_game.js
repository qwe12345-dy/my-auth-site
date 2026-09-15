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
  const title = (body.title || '').trim();
  const description = (body.description || '').trim();
  const icon = body.icon || '';
  const htmlCode = body.html_code || '';
  if (!title || !htmlCode) {
    return jsonResponse({ success: false, message: '游戏名称和HTML代码不能为空' }, 400);
  }
  if (title.length > 50) {
    return jsonResponse({ success: false, message: '游戏名称不能超过50字' }, 400);
  }
  const titleCheck = moderateContent(title);
  if (!titleCheck.passed) {
    return jsonResponse({ success: false, message: '游戏名称' + titleCheck.reason }, 400);
  }
  let status = 'approved';
  let rejectReason = '';
  const descCheck = moderateContent(description);
  if (!descCheck.passed) {
    status = 'rejected';
    rejectReason = descCheck.reason;
  }
  const chinaTime = getChinaTime();
  try {
    const result = await env.DB.prepare(
      'INSERT INTO games (user_id, title, description, icon, html_code, status, reject_reason, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(user.id, title, description, icon, htmlCode, status, rejectReason, chinaTime, chinaTime).run();
    const gameId = result.meta.last_row_id;
    return jsonResponse({
      success: true,
      message: status === 'approved' ? '上传成功' : '上传成功，但内容未通过审核',
      game_id: gameId,
      status: status,
      reject_reason: rejectReason
    });
  } catch (e) {
    return jsonResponse({ success: false, message: '上传失败: ' + e.message }, 500);
  }
}
