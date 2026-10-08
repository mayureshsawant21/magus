'use strict';

/* Encrypts the presentation content with the site password, in the format public/js/lock.js
   unlocks (AES-256-GCM, key from PBKDF2-SHA256).

     SITE_PASSWORD=… node scripts/lock.js     writes data/content.enc.json from data/content.json

   The password is never stored in the repository. */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function lock(text, password, iter = 250000) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(password, salt, iter, 32, 'sha256');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(text, 'utf8'), cipher.final(), cipher.getAuthTag()]);
  return { v: 1, kdf: 'PBKDF2-SHA256', iter, salt: salt.toString('base64'), iv: iv.toString('base64'), data: data.toString('base64') };
}

function unlock(box, password) {
  const key = crypto.pbkdf2Sync(password, Buffer.from(box.salt, 'base64'), box.iter, 32, 'sha256');
  const raw = Buffer.from(box.data, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(box.iv, 'base64'));
  decipher.setAuthTag(raw.subarray(raw.length - 16));
  return Buffer.concat([decipher.update(raw.subarray(0, raw.length - 16)), decipher.final()]).toString('utf8');
}

module.exports = { lock, unlock };

if (require.main === module) {
  const password = process.env.SITE_PASSWORD;
  if (!password) {
    console.error('Set SITE_PASSWORD to the presentation password.');
    process.exit(1);
  }
  const root = path.join(__dirname, '..');
  const text = fs.readFileSync(path.join(root, 'data', 'content.json'), 'utf8');
  fs.writeFileSync(path.join(root, 'data', 'content.enc.json'), JSON.stringify(lock(text, password)) + '\n');
  console.log('Wrote data/content.enc.json');
}
