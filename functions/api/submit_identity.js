import { jsonResponse, getUserFromRequest, validateRealName, validateIdCard, maskIdCard, encryptIdCard, getChinaTime } from '../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const user = await getUserFromRequest(request, env);
  if (!user) return jsonResponse({ success: false, message: '请先登录' }, 401);
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ success: false, message: '参数错误' }, 400);
  }
  const realName = (body.real_name || '').trim();
  const idCard = (body.id_card || '').trim().toUpperCase();

  if (!validateRealName(realName)) {
    return jsonResponse({ success: false, message: '请输入真实的中文姓名（2-20个字）' }, 400);
  }
  if (!validateIdCard(idCard)) {
    return jsonResponse({ success: false, message: '你的身份证不是真实的，请检查后重新填写' }, 400);
  }

  try {
    const enc = await encryptIdCard(idCard, env);
    const mask = maskIdCard(idCard);
    const now = getChinaTime();
    const existing = await env.DB.prepare('SELECT id FROM identities WHERE user_id = ?').bind(user.id).first();
    if (existing) {
      await env.DB.prepare('UPDATE identities SET real_name = ?, id_card_enc = ?, id_card_mask = ?, status = ?, reject_reason = ?, updated_at = ? WHERE user_id = ?')
        .bind(realName, enc, mask, 'pending', '', now, user.id).run();
    } else {
      await env.DB.prepare('INSERT INTO identities (user_id, real_name, id_card_enc, id_card_mask, status, reject_reason, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)')
        .bind(user.id, realName, enc, mask, 'pending', '', now, now).run();
    }
    return jsonResponse({ success: true, status: 'pending', message: '提交成功，将在24小时内完成审核' });
  } catch (e) {
    return jsonResponse({ success: false, message: '提交失败，请稍后重试' }, 500);
  }
}
