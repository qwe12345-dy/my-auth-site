import { adminJson, requireAdmin } from '../../_admin.js';

export async function onRequestGet(context) {
  const fail = await requireAdmin(context);
  if (fail) return fail;
  const { env } = context;
  try {
    const rows = await env.DB.prepare(
      'SELECT id, code, coins, max_uses, used_count, one_per_user, expire_at, created_at FROM redeem_codes ORDER BY id DESC LIMIT 200'
    ).all();
    return adminJson({ success: true, codes: rows.results });
  } catch (e) {
    return adminJson({ success: false, message: '获取失败: ' + e.message }, 500);
  }
}
