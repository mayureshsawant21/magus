'use strict';

/* Builds a static copy of the site in ./dist: the presentation with the current content,
   plus the admin panel, which on a static host saves edits to GitHub (see admin/backend.js).
   The GitHub Pages workflow runs this on every push; it also works for Netlify, Vercel etc. */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist');
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT, 'data');
const UPLOAD_DIR = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(ROOT, 'public', 'uploads');

const contentFile = fs.existsSync(path.join(DATA_DIR, 'content.json'))
  ? path.join(DATA_DIR, 'content.json')
  : path.join(ROOT, 'data', 'content.default.json');

fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, 'public'), OUT, { recursive: true });
if (UPLOAD_DIR !== path.join(ROOT, 'public', 'uploads') && fs.existsSync(UPLOAD_DIR)) {
  fs.cpSync(UPLOAD_DIR, path.join(OUT, 'uploads'), { recursive: true });
}
// Password lock: when the deck is locked only the encrypted copy is published, never content.json.
// With SITE_PASSWORD set (a repository secret in the workflow) it is encrypted fresh from the
// current content; otherwise the committed data/content.enc.json is used (the admin panel
// re-encrypts it on every save).
const encFile = path.join(DATA_DIR, 'content.enc.json');
let locked = false;
if (process.env.SITE_PASSWORD) {
  const { lock } = require('./lock');
  const session = fs.existsSync(encFile) ? JSON.parse(fs.readFileSync(encFile, 'utf8')).session || '' : '';
  fs.writeFileSync(path.join(OUT, 'content.enc.json'), JSON.stringify(lock(fs.readFileSync(contentFile, 'utf8'), process.env.SITE_PASSWORD, session)) + '\n');
  locked = true;
} else if (fs.existsSync(encFile)) {
  fs.copyFileSync(encFile, path.join(OUT, 'content.enc.json'));
  locked = true;
} else {
  fs.copyFileSync(contentFile, path.join(OUT, 'content.json'));
}

// admin panel (the password login page belongs to the Node server, so it is left out)
fs.cpSync(path.join(ROOT, 'admin'), path.join(OUT, 'admin'), {
  recursive: true,
  filter: (src) => path.basename(src) !== 'login.html'
});

// repository details for the admin's GitHub connection, when building in GitHub Actions
if (process.env.GITHUB_REPOSITORY) {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
  const branch = process.env.GITHUB_REF_NAME || 'main';
  fs.writeFileSync(path.join(OUT, 'admin', 'github.json'), JSON.stringify({ owner, repo, branch }, null, 2));
}
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

console.log(`Static presentation written to ${path.relative(ROOT, OUT)}/ (content from ${path.relative(ROOT, contentFile)}${locked ? ', password locked' : ''}).`);
console.log('Serve it over http(s); opening index.html directly from disk will not load the content.');
