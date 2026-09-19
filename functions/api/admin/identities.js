import { adminJson, requireAdmin } from '../../_admin.js';
import { decryptIdCard } from '../../_utils.js';

export async function onRequestGet(context) {
  const fail = await requireAdmin(context);
  if (fail) return fail;
  const { request, env } = context;
  const status = new URL(request.url).searchParams.get('status') || 'pending';
  try {
    let rows;
    if (status === 'all') {
      rows = await env.DB.prepare(
        `SELECT i.id,i.user_id,i.real_name,i.id_card_enc,i.id_card_mask,i.status,i.reject_reason,i.created_at,u.username,u.email
         FROM identities i JOIN users u ON i.user_id=u.id ORDER BY i.id DESC LIMIT 100`
      ).all();
    } else {
      rows = await env.DB.prepare(
        `SELECT i.id,i.user_id,i.real_name,i.id_card_enc,i.id_card_mask,i.status,i.reject_reason,i.created_at,u.username,u.email
         FROM identities i JOIN users u ON i.user_id=u.id WHERE i.status=? ORDER BY i.id DESC LIMIT 100`
      ).bind(status).all();
    }
    const list = [];
    for (const r of rows.results) {
      const full = await decryptIdCard(r.id_card_enc, env);
      list.push({
        id: r.id,
        user_id: r.user_id,
        username: r.username,
        email: r.email,
        real_name: r.real_name,
        id_card: full || r.id_card_mask,
        id_card_mask: r.id_card_mask,
        status: r.status,
        reject_reason: r.reject_reason || '',
        created_at: r.created_at
      });
    }
    return adminJson({ success: true, identities: list });
  } catch (e) {
    return adminJson({ success: false, message: '查询失败: ' + e.message }, 500);
  }
}
