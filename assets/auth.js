(async function () {
  try {
    const r = await fetch('/api/user', { credentials: 'include' });
    if (r.status === 401) {
      location.replace('login.html');
    }
  } catch (e) {
    location.replace('login.html');
  }
})();
