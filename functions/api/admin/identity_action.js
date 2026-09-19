import { adminJson, requireAdmin } from '../../_admin.js';
import { getChinaTime } from '../../_utils.js';

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
  const action = body.action;
  const userId = parseInt(body.user_id, 10);
  if (!userId) return adminJson({ success: false, message: '缺少用户ID' }, 400);
  try {
    if (action === 'approve') {
      await env.DB.prepare("UPDATE identities SET status='approved', reject_reason='', updated_at=? WHERE user_id=?").bind(getChinaTime(), userId).run();
      return adminJson({ success: true, message: '已通过实名认证' });
    }
    if (action === 'reject') {
      const reason = (body.reason || '身份信息不真实').toString().substring(0, 200);
      await env.DB.prepare("UPDATE identities SET status='rejected', reject_reason=?, updated_at=? WHERE user_id=?").bind(reason, getChinaTime(), userId).run();
      return adminJson({ success: true, message: '已驳回' });
    }
    return adminJson({ success: false, message: '未知操作' }, 400);
  } catch (e) {
    return adminJson({ success: false, message: '操作失败: ' + e.message }, 500);
  }
}
