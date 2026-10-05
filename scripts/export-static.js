'use strict';

/* Builds a plain static copy of the presentation in ./dist, using the content
   currently saved through the admin panel. Upload ./dist to any static host
   (Netlify, Vercel, GitHub Pages, S3, cPanel...). The admin panel is not included. */

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
fs.copyFileSync(contentFile, path.join(OUT, 'content.json'));

console.log(`Static presentation written to ${path.relative(ROOT, OUT)}/ (content from ${path.relative(ROOT, contentFile)}).`);
console.log('Serve it over http(s); opening index.html directly from disk will not load the content.');
