/* Where the admin panel reads and writes content.
   - "server": the Node server in server.js (npm start), signed in with the admin password.
   - "github": the static site on GitHub Pages. Saves are commits to the repository made with
     a fine-grained access token, and GitHub Actions republishes the site after each one. */
(function () {
  'use strict';

  class AuthError extends Error {}

  const bytesToB64 = (bytes) => {
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  };
  const textToB64 = (t) => bytesToB64(new TextEncoder().encode(t));
  const b64ToText = (b) => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\s/g, '')), (c) => c.charCodeAt(0)));

  const EXT = {
    'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif',
    'image/avif': '.avif', 'video/mp4': '.mp4', 'video/webm': '.webm'
  };
  const MEDIA_RE = /\.(png|jpe?g|webp|gif|avif|svg|mp4|webm)$/i;

  /* ------------------------------------------------------------ Node server */

  function serverBackend() {
    async function api(path, opts = {}) {
      const res = await fetch('../api/' + path, { credentials: 'same-origin', ...opts });
      if (res.status === 401) throw new AuthError('Your session has ended. Please sign in again.');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Request failed');
      return data;
    }
    return {
      mode: 'server',
      uploadsBase: null,
      load: () => api('content'),
      defaults: () => api('content/default'),
      async save(content) {
        await api('content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(content) });
        return { message: 'Saved. The presentation is up to date.' };
      },
      async upload(file) {
        const fd = new FormData();
        fd.append('file', file);
        return (await api('upload', { method: 'POST', body: fd })).url;
      },
      library: () => api('uploads'),
      remove: (item) => api('uploads/' + encodeURIComponent(item.name), { method: 'DELETE' }),
      async versions() {
        return (await api('backups')).map((b) => ({ id: b.name, date: b.mtime, label: '' }));
      },
      restoreSaves: true,
      async restore(v) {
        return (await api(`backups/${encodeURIComponent(v.id)}/restore`, { method: 'POST' })).content;
      },
      async signOut() {
        await fetch('../admin/logout', { method: 'POST', credentials: 'same-origin' });
        location.href = 'login';
      },
      onAuthError() {
        setTimeout(() => (location.href = 'login'), 1500);
      }
    };
  }

  /* ------------------------------------------------------------------ GitHub */

  function githubBackend(cfg) {
    const base = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}`;
    const enc = (p) => p.split('/').map(encodeURIComponent).join('/');
    let contentSha = null;

    async function gh(path, opts = {}) {
      const res = await fetch(base + path, {
        ...opts,
        cache: 'no-store',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${cfg.token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          ...(opts.body ? { 'Content-Type': 'application/json' } : {})
        }
      });
      if (res.status === 401) throw new AuthError('GitHub did not accept the access token. Please connect again.');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(
          res.status === 403
            ? 'The access token is not allowed to do this. It needs "Contents: Read and write" on this repository.'
            : data.message || `GitHub request failed (${res.status})`
        );
        err.status = res.status;
        throw err;
      }
      return data;
    }

    const getFile = (p, ref = cfg.branch) => gh(`/contents/${enc(p)}?ref=${encodeURIComponent(ref)}`);
    const putFile = (p, content, message, sha) =>
      gh(`/contents/${enc(p)}`, { method: 'PUT', body: JSON.stringify({ message, content, branch: cfg.branch, ...(sha ? { sha } : {}) }) });
    const listDir = async (dir) => {
      try {
        const out = await gh(`/contents/${enc(dir)}?ref=${encodeURIComponent(cfg.branch)}`);
        return Array.isArray(out) ? out : [];
      } catch (e) {
        if (e.status === 404) return [];
        throw e;
      }
    };
    const readJSON = async (p, ref) => JSON.parse(b64ToText((await getFile(p, ref)).content));

    // The presentation password, needed to re-encrypt the locked copy. Checked against the
    // current encrypted file and kept for this tab only.
    let encFile = null;
    async function sitePassword() {
      const ok = async (pw) => {
        try {
          await window.MFC_LOCK.unlock(encFile.box, pw);
          return true;
        } catch (e) {
          return false;
        }
      };
      let pw = null;
      try {
        pw = sessionStorage.getItem('mfc.unlock');
      } catch (e) {
        /* ignore */
      }
      if (pw && (await ok(pw))) return pw;
      let ask = 'The presentation is password locked. Enter its password to publish this save:';
      for (;;) {
        pw = window.prompt(ask);
        if (pw === null) throw new Error('Not saved: the presentation password is needed to publish the locked deck.');
        if (await ok(pw)) break;
        ask = 'That password did not match the locked presentation. Try again:';
      }
      try {
        sessionStorage.setItem('mfc.unlock', pw);
      } catch (e) {
        /* ignore */
      }
      return pw;
    }

    return {
      mode: 'github',
      cfg,
      uploadsBase: `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch.split('/').map(encodeURIComponent).join('/')}/public/uploads/`,
      liveUrl: `https://${cfg.owner.toLowerCase()}.github.io/${cfg.repo}/`,

      async check() {
        const repo = await gh('');
        if (repo.permissions && repo.permissions.push === false) throw new Error('This GitHub account cannot write to the repository.');
        await getFile('data/content.default.json');
        return repo;
      },

      async load() {
        // a locked deck keeps an encrypted copy next to the content; saves must refresh it
        try {
          const e = await getFile('data/content.enc.json');
          encFile = { sha: e.sha, box: JSON.parse(b64ToText(e.content)) };
        } catch (e) {
          if (e.status !== 404) throw e;
          encFile = null;
        }
        try {
          const f = await getFile('data/content.json');
          contentSha = f.sha;
          return JSON.parse(b64ToText(f.content));
        } catch (e) {
          if (e.status !== 404) throw e;
          contentSha = null;
          return this.defaults();
        }
      },

      defaults: () => readJSON('data/content.default.json'),

      async save(content) {
        const text = JSON.stringify(content, null, 2) + '\n';
        const body = textToB64(text);
        const msg = 'Update presentation content';
        const password = encFile ? await sitePassword() : null;
        let res;
        try {
          res = await putFile('data/content.json', body, msg, contentSha);
        } catch (e) {
          if (e.status !== 409 && e.status !== 422) throw e;
          // the file changed on GitHub since it was loaded: write on top of the latest version
          const latest = await getFile('data/content.json').catch(() => null);
          contentSha = latest && latest.sha;
          res = await putFile('data/content.json', body, msg, contentSha);
        }
        contentSha = res.content.sha;
        if (encFile) {
          // re-lock the published copy with the new content
          const box = await window.MFC_LOCK.lock(text, password);
          const latest = await getFile('data/content.enc.json').catch(() => null);
          const encRes = await putFile('data/content.enc.json', textToB64(JSON.stringify(box) + '\n'), 'Update locked presentation copy', latest ? latest.sha : encFile.sha);
          encFile = { sha: encRes.content.sha, box };
          res = encRes;
        }
        return { message: 'Saved to GitHub. The live site updates in about a minute.', commit: res.commit.sha };
      },

      async upload(file) {
        const ext = EXT[file.type];
        if (!ext) throw new Error('Only PNG, JPG, WEBP, GIF, AVIF images or MP4/WEBM videos are allowed.');
        if (file.size > 25 * 1024 * 1024) throw new Error('That file is over 25 MB. Please compress it first.');
        const stem = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'image';
        const name = `${stem}-${Date.now().toString(36)}${ext}`;
        await putFile(`public/uploads/${name}`, bytesToB64(new Uint8Array(await file.arrayBuffer())), `Upload ${name}`);
        return `uploads/${name}`;
      },

      async library() {
        const [up, img, logos] = await Promise.all([listDir('public/uploads'), listDir('public/assets/img'), listDir('public/assets/logos')]);
        const media = (f) => f.type === 'file' && MEDIA_RE.test(f.name);
        return {
          uploads: up.filter(media).map((f) => ({ url: `uploads/${f.name}`, name: f.name, sha: f.sha })),
          builtIn: [
            ...img.filter(media).map((f) => ({ url: `assets/img/${f.name}`, name: f.name, builtIn: true })),
            ...logos.filter(media).map((f) => ({ url: `assets/logos/${f.name}`, name: f.name, builtIn: true }))
          ]
        };
      },

      remove: (item) =>
        gh(`/contents/${enc('public/uploads/' + item.name)}`, {
          method: 'DELETE',
          body: JSON.stringify({ message: `Delete ${item.name}`, sha: item.sha, branch: cfg.branch })
        }),

      async versions() {
        const commits = await gh(`/commits?path=data/content.json&sha=${encodeURIComponent(cfg.branch)}&per_page=40`);
        return commits.map((c) => ({ id: c.sha, date: c.commit.author.date, label: c.commit.message.split('\n')[0] }));
      },

      restoreSaves: false,
      restore: (v) => readJSON('data/content.json', v.id),

      // Follows the GitHub Actions run that republishes the site. Needs "Actions: Read" on the token;
      // without it this quietly reports nothing.
      async publishStatus(commitSha) {
        try {
          const runs = await gh(`/actions/runs?head_sha=${commitSha}&per_page=5`);
          const run = (runs.workflow_runs || [])[0];
          if (!run) return { state: 'queued' };
          if (run.status !== 'completed') return { state: 'running', url: run.html_url };
          return { state: run.conclusion === 'success' ? 'done' : 'failed', url: run.html_url };
        } catch (e) {
          return { state: 'unknown' };
        }
      },

      signOut() {
        forgetToken();
        location.reload();
      },
      onAuthError() {
        forgetToken();
        setTimeout(() => location.reload(), 1500);
      }
    };
  }

  /* ---------------------------------------------------------- token storage */

  const KEY = 'mfc.github';
  function savedConfig() {
    for (const store of [sessionStorage, localStorage]) {
      try {
        const v = JSON.parse(store.getItem(KEY) || 'null');
        if (v && v.token) return v;
      } catch (e) {
        /* ignore */
      }
    }
    return null;
  }
  function rememberToken(cfg, persist) {
    forgetToken();
    try {
      (persist ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(cfg));
    } catch (e) {
      /* private mode: the token lasts for this page only */
    }
  }
  function forgetToken() {
    try {
      localStorage.removeItem(KEY);
      sessionStorage.removeItem(KEY);
    } catch (e) {
      /* ignore */
    }
  }

  // Repository details: github.json (written by the deploy workflow), else the *.github.io address.
  async function repoDefaults() {
    try {
      const res = await fetch('github.json', { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e) {
      /* fall through */
    }
    const m = location.hostname.match(/^([^.]+)\.github\.io$/i);
    const repo = location.pathname.split('/').filter(Boolean)[0];
    return { owner: m ? m[1] : '', repo: m && repo !== 'admin' ? repo : '', branch: 'main' };
  }

  async function detect() {
    try {
      const res = await fetch('../api/content', { cache: 'no-store', credentials: 'same-origin' });
      if (res.ok && (res.headers.get('content-type') || '').includes('json')) return 'server';
    } catch (e) {
      /* no server */
    }
    return 'github';
  }

  window.MFC_BACKEND = { AuthError, detect, serverBackend, githubBackend, savedConfig, rememberToken, forgetToken, repoDefaults };
})();
