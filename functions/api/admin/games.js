import { adminJson, requireAdmin } from '../../_admin.js';

export async function onRequestGet(context) {
  const fail = await requireAdmin(context);
  if (fail) return fail;
  const { request, env } = context;
  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'all';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const size = 20;
  const offset = (page - 1) * size;
  try {
    let rows;
    let total;
    if (status === 'all') {
      rows = await env.DB.prepare(
        `SELECT g.id,g.user_id,g.title,g.description,g.status,g.reject_reason,g.likes_count,g.favorites_count,g.comments_count,g.play_count,g.created_at,u.username AS author_name
         FROM games g JOIN users u ON g.user_id=u.id ORDER BY g.id DESC LIMIT ? OFFSET ?`
      ).bind(size, offset).all();
      total = (await env.DB.prepare('SELECT COUNT(*) c FROM games').first()).c;
    } else {
      rows = await env.DB.prepare(
        `SELECT g.id,g.user_id,g.title,g.description,g.status,g.reject_reason,g.likes_count,g.favorites_count,g.comments_count,g.play_count,g.created_at,u.username AS author_name
         FROM games g JOIN users u ON g.user_id=u.id WHERE g.status=? ORDER BY g.id DESC LIMIT ? OFFSET ?`
      ).bind(status, size, offset).all();
      total = (await env.DB.prepare('SELECT COUNT(*) c FROM games WHERE status=?').bind(status).first()).c;
    }
    return adminJson({ success: true, games: rows.results, total, page, pages: Math.ceil(total / size) });
  } catch (e) {
    return adminJson({ success: false, message: '查询失败: ' + e.message }, 500);
  }
}
