import { adminJson, requireAdmin } from '../../_admin.js';

export async function onRequestGet(context) {
  const fail = await requireAdmin(context);
  if (fail) return fail;
  const { request, env } = context;
  const id = parseInt(new URL(request.url).searchParams.get('id') || '0', 10);
  if (!id) return adminJson({ success: false, message: '缺少ID' }, 400);
  try {
    const row = await env.DB.prepare(
      `SELECT g.id,g.title,g.description,g.html_code,g.status,g.reject_reason,g.created_at,u.username AS author_name,u.id AS author_id
       FROM games g JOIN users u ON g.user_id=u.id WHERE g.id=?`
    ).bind(id).first();
    if (!row) return adminJson({ success: false, message: '游戏不存在' }, 404);
    return adminJson({ success: true, game: row });
  } catch (e) {
    return adminJson({ success: false, message: '查询失败: ' + e.message }, 500);
  }
}
