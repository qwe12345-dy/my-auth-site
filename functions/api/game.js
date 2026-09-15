import { jsonResponse, getUserFromRequest } from '../_utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const gameId = url.searchParams.get('id');
  if (!gameId) return jsonResponse({ success: false, message: '游戏ID不能为空' }, 400);
  const user = await getUserFromRequest(request, env);
  try {
    const game = await env.DB.prepare(
      'SELECT g.*, u.username as author_name, u.avatar as author_avatar FROM games g JOIN users u ON g.user_id = u.id WHERE g.id = ?'
    ).bind(gameId).first();
    if (!game) return jsonResponse({ success: false, message: '游戏不存在' }, 404);
    if (game.status === 'rejected' && (!user || user.id !== game.user_id)) {
      return jsonResponse({ success: false, message: '该游戏因违规已被下架' }, 403);
    }
    let liked = false;
    let favorited = false;
    if (user) {
      const like = await env.DB.prepare('SELECT id FROM likes WHERE user_id = ? AND game_id = ?').bind(user.id, gameId).first();
      liked = !!like;
      const fav = await env.DB.prepare('SELECT id FROM favorites WHERE user_id = ? AND game_id = ?').bind(user.id, gameId).first();
      favorited = !!fav;
    }
    return jsonResponse({
      success: true,
      game: {
        id: game.id,
        user_id: game.user_id,
        title: game.title,
        description: game.description,
        icon: game.icon,
        status: game.status,
        reject_reason: game.reject_reason,
        likes_count: game.likes_count,
        favorites_count: game.favorites_count,
        comments_count: game.comments_count,
        created_at: game.created_at,
        updated_at: game.updated_at,
        author_name: game.author_name,
        author_avatar: game.author_avatar,
        html_code: game.html_code,
        liked: liked,
        favorited: favorited,
        is_owner: user ? user.id === game.user_id : false
      }
    });
  } catch (e) {
    return jsonResponse({ success: false, message: '获取失败: ' + e.message }, 500);
  }
}
