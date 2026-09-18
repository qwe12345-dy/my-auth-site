export async function onRequestGet(context) {
  const url = new URL(context.request.url).searchParams.get('url');
  if (!url || (url.indexOf('smooth-survey.com') < 0 && url.indexOf('zesty-career.com') < 0)) {
    return new Response('bad', { status: 400 });
  }
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36',
        'Referer': 'https://theyuse.ccwu.cc/'
      }
    });
    const text = await resp.text();
    return new Response(text, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      }
    });
  } catch (e) {
    return new Response('error', { status: 500 });
  }
}
