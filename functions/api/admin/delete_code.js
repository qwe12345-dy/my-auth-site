import { adminJson, requireAdmin } from '../../_admin.js';

export async function onRequestPost(context) {
  const fail = await requireAdmin(context);
  if (fail) return fail;
  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return adminJson({ success: false, message: '请求格式错误' }, 400);
  }
  const id = body.id;
  if (!id) return adminJson({ success: false, message: 'ID不能为空' }, 400);
  try {
    await env.DB.prepare('DELETE FROM redeem_codes WHERE id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM code_uses WHERE code_id = ?').bind(id).run();
    return adminJson({ success: true, message: '删除成功' });
  } catch (e) {
    return adminJson({ success: false, message: '删除失败: ' + e.message }, 500);
  }
}
