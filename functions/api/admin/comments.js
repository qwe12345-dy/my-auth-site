import { adminJson, requireAdmin } from '../../_admin.js';

export async function onRequestGet(context) {
  const fail = await requireAdmin(context);
  if (fail) return fail;
  const { request, env } = context;
  const page = Math.max(1, parseInt(new URL(request.url).searchParams.get('page') || '1', 10));
  const size = 30;
  const offset = (page - 1) * size;
  try {
    const rows = await env.DB.prepare(
      `SELECT c.id,c.game_id,c.user_id,c.content,c.status,c.created_at,u.username AS author_name,g.title AS game_title
       FROM comments c JOIN users u ON c.user_id=u.id JOIN games g ON c.game_id=g.id
       ORDER BY c.id DESC LIMIT ? OFFSET ?`
    ).bind(size, offset).all();
    const total = (await env.DB.prepare('SELECT COUNT(*) c FROM comments').first()).c;
    return adminJson({ success: true, comments: rows.results, total, page, pages: Math.ceil(total / size) });
  } catch (e) {
    return adminJson({ success: false, message: '查询失败: ' + e.message }, 500);
  }
}
