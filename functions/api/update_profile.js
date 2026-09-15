import { jsonResponse, getUserFromRequest, moderateContent, getChinaTime } from '../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return jsonResponse({ success: false, message: '未登录' }, 401);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, message: '请求格式错误' }, 400);
  }
  const bio = (body.bio || '').trim();
  const avatar = body.avatar || '';
  const cover = body.cover || '';
  if (avatar && avatar.length > 500000) {
    return jsonResponse({ success: false, message: '头像图片过大，请压缩后再上传' }, 400);
  }
  if (cover && cover.length > 1000000) {
    return jsonResponse({ success: false, message: '封面图片过大，请压缩后再上传' }, 400);
  }
  const moderation = moderateContent(bio);
  let bioStatus, bioError;
  if (bio === '') {
    bioStatus = 'approved';
    bioError = '';
  } else if (moderation.passed) {
    bioStatus = 'approved';
    bioError = '';
  } else {
    bioStatus = 'rejected';
    bioError = moderation.reason;
  }
  try {
    if (avatar && cover) {
      await env.DB.prepare('UPDATE users SET bio = ?, bio_status = ?, bio_error = ?, avatar = ?, cover = ? WHERE id = ?').bind(bio, bioStatus, bioError, avatar, cover, user.id).run();
    } else if (avatar) {
      await env.DB.prepare('UPDATE users SET bio = ?, bio_status = ?, bio_error = ?, avatar = ? WHERE id = ?').bind(bio, bioStatus, bioError, avatar, user.id).run();
    } else if (cover) {
      await env.DB.prepare('UPDATE users SET bio = ?, bio_status = ?, bio_error = ?, cover = ? WHERE id = ?').bind(bio, bioStatus, bioError, cover, user.id).run();
    } else {
      await env.DB.prepare('UPDATE users SET bio = ?, bio_status = ?, bio_error = ? WHERE id = ?').bind(bio, bioStatus, bioError, user.id).run();
    }
    return jsonResponse({
      success: true,
      message: bioStatus === 'approved' ? '保存成功' : '保存成功，但介绍未通过审核',
      bio_status: bioStatus,
      bio_error: bioError
    });
  } catch (e) {
    return jsonResponse({ success: false, message: '保存失败: ' + e.message }, 500);
  }
}
