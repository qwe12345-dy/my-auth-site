import { adminJson, requireAdmin } from '../../_admin.js';

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
  const gameId = parseInt(body.game_id, 10);
  if (!gameId) return adminJson({ success: false, message: '缺少游戏ID' }, 400);
  try {
    if (action === 'approve') {
      await env.DB.prepare("UPDATE games SET status='approved', reject_reason='' WHERE id=?").bind(gameId).run();
      return adminJson({ success: true, message: '已通过审核' });
    }
    if (action === 'reject') {
      const reason = (body.reason || '内容违规').toString().substring(0, 200);
      await env.DB.prepare("UPDATE games SET status='rejected', reject_reason=? WHERE id=?").bind(reason, gameId).run();
      return adminJson({ success: true, message: '已标记违规' });
    }
    if (action === 'delete') {
      for (const sql of [
        'DELETE FROM comments WHERE game_id=?',
        'DELETE FROM likes WHERE game_id=?',
        'DELETE FROM favorites WHERE game_id=?',
        'DELETE FROM user_plays WHERE game_id=?'
      ]) {
        await env.DB.prepare(sql).bind(gameId).run();
      }
      await env.DB.prepare('DELETE FROM games WHERE id=?').bind(gameId).run();
      return adminJson({ success: true, message: '游戏已删除' });
    }
    return adminJson({ success: false, message: '未知操作' }, 400);
  } catch (e) {
    return adminJson({ success: false, message: '操作失败: ' + e.message }, 500);
  }
}
