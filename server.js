'use strict';

const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const ADMIN_DIR = path.join(ROOT, 'admin');
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT, 'data');
const UPLOAD_DIR = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(PUBLIC_DIR, 'uploads');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const DEFAULT_CONTENT_FILE = path.join(ROOT, 'data', 'content.default.json');
const MAX_BACKUPS = 40;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'magus-admin';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const COOKIE_NAME = 'mfc_admin';

for (const dir of [DATA_DIR, BACKUP_DIR, UPLOAD_DIR]) fs.mkdirSync(dir, { recursive: true });
if (!fs.existsSync(CONTENT_FILE)) fs.copyFileSync(DEFAULT_CONTENT_FILE, CONTENT_FILE);

/* ---------- content storage ---------- */

function readContent() {
  return JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
}

function writeContent(content) {
  if (fs.existsSync(CONTENT_FILE)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.copyFileSync(CONTENT_FILE, path.join(BACKUP_DIR, `content-${stamp}.json`));
    pruneBackups();
  }
  const tmp = `${CONTENT_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(content, null, 2));
  fs.renameSync(tmp, CONTENT_FILE);
}

function listBackups() {
  return fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => /^content-[\w-]+\.json$/.test(f))
    .map((f) => ({ name: f, size: fs.statSync(path.join(BACKUP_DIR, f)).size, mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
}

function pruneBackups() {
  listBackups()
    .slice(MAX_BACKUPS)
    .forEach((b) => fs.unlinkSync(path.join(BACKUP_DIR, b.name)));
}

function validateContent(c) {
  if (!c || typeof c !== 'object') return 'Content must be an object.';
  if (!c.settings || typeof c.settings !== 'object') return 'Missing "settings".';
  if (!Array.isArray(c.sections)) return '"sections" must be a list.';
  const ids = new Set();
  for (const s of c.sections) {
    if (!s || typeof s !== 'object' || typeof s.type !== 'string') return 'Every section needs a "type".';
    if (typeof s.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(s.id)) return `Section id "${s.id}" must use lowercase letters, numbers and dashes.`;
    if (ids.has(s.id)) return `Section id "${s.id}" is used twice.`;
    ids.add(s.id);
  }
  return null;
}

/* ---------- auth (signed, http-only cookie) ---------- */

function sign(value) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('base64url');
}

function issueToken() {
  const payload = `${Date.now() + SESSION_TTL_MS}.${crypto.randomBytes(8).toString('hex')}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token) {
  if (typeof token !== 'string') return false;
  const i = token.lastIndexOf('.');
  if (i < 0) return false;
  const payload = token.slice(0, i);
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(token.slice(i + 1));
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return false;
  return Number(payload.split('.')[0]) > Date.now();
}

function readCookie(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

function isAuthed(req) {
  return verifyToken(readCookie(req, COOKIE_NAME));
}

function requireAuth(req, res, next) {
  if (isAuthed(req)) return next();
  res.status(401).json({ error: 'Please sign in again.' });
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

const loginAttempts = new Map();
function tooManyAttempts(ip) {
  const now = Date.now();
  const rec = loginAttempts.get(ip) || { count: 0, since: now };
  if (now - rec.since > 15 * 60 * 1000) {
    rec.count = 0;
    rec.since = now;
  }
  rec.count += 1;
  loginAttempts.set(ip, rec);
  return rec.count > 10;
}

/* ---------- uploads ---------- */

const ALLOWED_TYPES = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
  'video/mp4': '.mp4',
  'video/webm': '.webm'
};

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
      const base = path
        .basename(file.originalname, path.extname(file.originalname))
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'image';
      cb(null, `${base}-${Date.now().toString(36)}${ALLOWED_TYPES[file.mimetype]}`);
    }
  }),
  limits: { fileSize: 40 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES[file.mimetype]) cb(null, true);
    else cb(new Error('Only PNG, JPG, WEBP, GIF, AVIF images or MP4/WEBM videos are allowed.'));
  }
});

/* ---------- app ---------- */

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false }));

app.get('/api/content', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(readContent());
});

app.put('/api/content', requireAuth, (req, res) => {
  const error = validateContent(req.body);
  if (error) return res.status(400).json({ error });
  writeContent(req.body);
  res.json({ ok: true, savedAt: new Date().toISOString() });
});

app.get('/api/content/default', requireAuth, (req, res) => {
  res.json(JSON.parse(fs.readFileSync(DEFAULT_CONTENT_FILE, 'utf8')));
});

app.post('/api/upload', requireAuth, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file received.' });
    res.json({ url: `uploads/${req.file.filename}` });
  });
});

app.get('/api/uploads', requireAuth, (req, res) => {
  const files = fs
    .readdirSync(UPLOAD_DIR)
    .filter((f) => Object.values(ALLOWED_TYPES).includes(path.extname(f).toLowerCase()))
    .map((f) => ({ url: `uploads/${f}`, name: f, mtime: fs.statSync(path.join(UPLOAD_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  const builtIn = fs
    .readdirSync(path.join(PUBLIC_DIR, 'assets', 'img'))
    .filter((f) => /\.(svg|png|jpe?g|webp)$/i.test(f))
    .map((f) => ({ url: `assets/img/${f}`, name: f, builtIn: true }));
  const logos = fs
    .readdirSync(path.join(PUBLIC_DIR, 'assets', 'logos'))
    .filter((f) => /\.(svg|png|jpe?g|webp)$/i.test(f))
    .map((f) => ({ url: `assets/logos/${f}`, name: f, builtIn: true }));
  res.json({ uploads: files, builtIn: [...builtIn, ...logos] });
});

app.delete('/api/uploads/:name', requireAuth, (req, res) => {
  const name = path.basename(req.params.name);
  const file = path.join(UPLOAD_DIR, name);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'File not found.' });
  fs.unlinkSync(file);
  res.json({ ok: true });
});

app.get('/api/backups', requireAuth, (req, res) => res.json(listBackups()));

app.post('/api/backups/:name/restore', requireAuth, (req, res) => {
  const name = path.basename(req.params.name);
  const file = path.join(BACKUP_DIR, name);
  if (!/^content-[\w-]+\.json$/.test(name) || !fs.existsSync(file)) return res.status(404).json({ error: 'Backup not found.' });
  const content = JSON.parse(fs.readFileSync(file, 'utf8'));
  writeContent(content);
  res.json({ ok: true, content });
});

/* admin pages */

app.post('/admin/login', (req, res) => {
  if (tooManyAttempts(req.ip)) return res.redirect('/admin/login?error=locked');
  if (!safeEqual(req.body.password || '', ADMIN_PASSWORD)) return res.redirect('/admin/login?error=1');
  loginAttempts.delete(req.ip);
  res.cookie(COOKIE_NAME, issueToken(), {
    httpOnly: true,
    sameSite: 'strict',
    secure: req.secure,
    maxAge: SESSION_TTL_MS,
    path: '/'
  });
  res.redirect('/admin/');
});

app.post('/admin/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.redirect('/admin/login');
});

app.get('/admin/login', (req, res) => {
  if (isAuthed(req)) return res.redirect('/admin/');
  res.sendFile(path.join(ADMIN_DIR, 'login.html'));
});

// Express matches "/admin" and "/admin/" alike, so normalise to the trailing slash here.
app.get('/admin', (req, res) => {
  if (!req.originalUrl.split('?')[0].endsWith('/')) return res.redirect('/admin/');
  if (!isAuthed(req)) return res.redirect('/admin/login');
  res.sendFile(path.join(ADMIN_DIR, 'index.html'));
});
app.use('/admin', express.static(ADMIN_DIR, { index: false }));

if (UPLOAD_DIR !== path.join(PUBLIC_DIR, 'uploads')) app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

app.listen(PORT, () => {
  console.log(`\n  Presentation  →  http://localhost:${PORT}`);
  console.log(`  Admin panel   →  http://localhost:${PORT}/admin`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log(`\n  Using the default admin password "${ADMIN_PASSWORD}".`);
    console.log('  Set ADMIN_PASSWORD before putting this online.\n');
  }
});
