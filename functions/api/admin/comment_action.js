import { adminJson, requireAdmin } from '../../_admin.js';

export async function onRequestPost(context) {
  const fail = await requireAdmin(context);
  if (fail) return fail;
  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return adminJson({ success: false, message: '参数错误' }, 400);
  }
  const commentId = parseInt(body.comment_id, 10);
  if (!commentId) return adminJson({ success: false, message: '缺少评论ID' }, 400);
  try {
    const row = await env.DB.prepare('SELECT game_id FROM comments WHERE id=?').bind(commentId).first();
    if (!row) return adminJson({ success: false, message: '评论不存在' }, 404);
    await env.DB.prepare('DELETE FROM comments WHERE id=?').bind(commentId).run();
    await env.DB.prepare('UPDATE games SET comments_count=(SELECT COUNT(*) FROM comments WHERE game_id=?) WHERE id=?').bind(row.game_id, row.game_id).run();
    return adminJson({ success: true, message: '评论已删除' });
  } catch (e) {
    return adminJson({ success: false, message: '操作失败: ' + e.message }, 500);
  }
}
