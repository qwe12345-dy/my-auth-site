import { adminJson, requireAdmin } from '../../_admin.js';

export async function onRequestGet(context) {
  const fail = await requireAdmin(context);
  if (fail) return fail;
  const { request, env } = context;
  const url = new URL(request.url);
  const search = (url.searchParams.get('search') || '').trim();
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const size = 30;
  const offset = (page - 1) * size;
  try {
    let rows;
    if (search) {
      const kw = '%' + search + '%';
      rows = await env.DB.prepare(
        `SELECT u.id,u.username,u.email,u.r_coins,u.banned,u.created_at,
          (SELECT COUNT(*) FROM games g WHERE g.user_id=u.id) AS game_count,
          (SELECT i.status FROM identities i WHERE i.user_id=u.id) AS id_status
         FROM users u WHERE u.username LIKE ? OR u.email LIKE ? OR CAST(u.id AS TEXT)=?
         ORDER BY u.id DESC LIMIT ? OFFSET ?`
      ).bind(kw, kw, search, size, offset).all();
    } else {
      rows = await env.DB.prepare(
        `SELECT u.id,u.username,u.email,u.r_coins,u.banned,u.created_at,
          (SELECT COUNT(*) FROM games g WHERE g.user_id=u.id) AS game_count,
          (SELECT i.status FROM identities i WHERE i.user_id=u.id) AS id_status
         FROM users u ORDER BY u.id DESC LIMIT ? OFFSET ?`
      ).bind(size, offset).all();
    }
    const total = (await env.DB.prepare('SELECT COUNT(*) c FROM users').first()).c;
    return adminJson({ success: true, users: rows.results, total, page, pages: Math.ceil(total / size) });
  } catch (e) {
    return adminJson({ success: false, message: '查询失败: ' + e.message }, 500);
  }
}
