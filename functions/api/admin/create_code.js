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
    return adminJson({ success: false, message: '请求格式错误' }, 400);
  }
  const code = (body.code || '').trim().toUpperCase();
  const coins = parseInt(body.coins);
  let maxUses = parseInt(body.max_uses || '1');
  const onePerUser = body.one_per_user ? 1 : 0;
  const singlePerson = body.single_person ? 1 : 0;
  let expireAt = (body.expire_at || '').trim();

  if (!code) return adminJson({ success: false, message: '兑换码不能为空' }, 400);
  if (!coins || coins <= 0) return adminJson({ success: false, message: 'R币数量不合法' }, 400);
  if (singlePerson) maxUses = 1;
  if (!maxUses || maxUses <= 0) maxUses = 1;

  if (expireAt) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(expireAt)) expireAt += ' 23:59:59';
  }

  const exists = await env.DB.prepare('SELECT id FROM redeem_codes WHERE code = ?').bind(code).first();
  if (exists) return adminJson({ success: false, message: '该兑换码已存在' }, 400);

  const now = getChinaTime();
  try {
    await env.DB.prepare(
      'INSERT INTO redeem_codes (code, coins, max_uses, used_count, one_per_user, expire_at, created_at) VALUES (?, ?, ?, 0, ?, ?, ?)'
    ).bind(code, coins, maxUses, onePerUser, expireAt || null, now).run();
    return adminJson({ success: true, message: '创建成功' });
  } catch (e) {
    return adminJson({ success: false, message: '创建失败: ' + e.message }, 500);
  }
}
