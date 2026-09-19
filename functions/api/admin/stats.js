import { adminJson, requireAdmin } from '../../_admin.js';
import { getChinaTime } from '../../_utils.js';

export async function onRequestGet(context) {
  const fail = await requireAdmin(context);
  if (fail) return fail;
  const { env } = context;
  try {
    const today = getChinaTime().substring(0, 10);
    const q = async sql => (await env.DB.prepare(sql).first()).c;
    const users = await q('SELECT COUNT(*) c FROM users');
    const newUsersToday = await q(`SELECT COUNT(*) c FROM users WHERE date(created_at,'+8 hours')='${today}'`);
    const games = await q('SELECT COUNT(*) c FROM games');
    const pendingGames = await q("SELECT COUNT(*) c FROM games WHERE status='pending'");
    const rejectedGames = await q("SELECT COUNT(*) c FROM games WHERE status='rejected'");
    const comments = await q('SELECT COUNT(*) c FROM comments');
    const pendingIds = await q("SELECT COUNT(*) c FROM identities WHERE status='pending'");
    const approvedIds = await q("SELECT COUNT(*) c FROM identities WHERE status='approved'");
    const adTotal = await q('SELECT COUNT(*) c FROM ad_views');
    const adToday = await q(`SELECT COUNT(*) c FROM ad_views WHERE view_date='${today}'`);
    const totalPlays = await q('SELECT COALESCE(SUM(play_count),0) c FROM games');
    const totalLikes = await q('SELECT COALESCE(SUM(likes_count),0) c FROM games');
    const totalFavs = await q('SELECT COALESCE(SUM(favorites_count),0) c FROM games');
    const coinRow = await env.DB.prepare('SELECT COALESCE(SUM(r_coins),0) c FROM users').first();
    const bannedUsers = await q('SELECT COUNT(*) c FROM users WHERE banned=1');
    return adminJson({
      success: true,
      stats: {
        users, newUsersToday, bannedUsers,
        games, pendingGames, rejectedGames,
        comments, pendingIds, approvedIds,
        adTotal, adToday,
        totalPlays, totalLikes, totalFavs,
        totalCoins: coinRow.c
      }
    });
  } catch (e) {
    return adminJson({ success: false, message: '统计失败: ' + e.message }, 500);
  }
}
