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
  const gameId = body.game_id;
  const title = (body.title || '').trim();
  const description = (body.description || '').trim();
  const icon = body.icon || '';
  const htmlCode = body.html_code || '';
  if (!gameId || !title || !htmlCode) {
    return jsonResponse({ success: false, message: '游戏ID、名称和HTML代码不能为空' }, 400);
  }
  const game = await env.DB.prepare('SELECT * FROM games WHERE id = ?').bind(gameId).first();
  if (!game) return jsonResponse({ success: false, message: '游戏不存在' }, 404);
  if (game.user_id !== user.id) return jsonResponse({ success: false, message: '只能编辑自己的游戏' }, 403);
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
    if (icon) {
      await env.DB.prepare(
        'UPDATE games SET title=?, description=?, icon=?, html_code=?, status=?, reject_reason=?, updated_at=? WHERE id=?'
      ).bind(title, description, icon, htmlCode, status, rejectReason, chinaTime, gameId).run();
    } else {
      await env.DB.prepare(
        'UPDATE games SET title=?, description=?, html_code=?, status=?, reject_reason=?, updated_at=? WHERE id=?'
      ).bind(title, description, htmlCode, status, rejectReason, chinaTime, gameId).run();
    }
    return jsonResponse({
      success: true,
      message: status === 'approved' ? '更新成功' : '更新成功，但内容未通过审核',
      status: status,
      reject_reason: rejectReason
    });
  } catch (e) {
    return jsonResponse({ success: false, message: '更新失败: ' + e.message }, 500);
  }
}
