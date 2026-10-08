/* Password lock for the published presentation. The static site ships only an encrypted copy
   of the content (content.enc.json, AES-256-GCM with a PBKDF2-SHA256 key from the password);
   this unlocks it in the browser. scripts/lock.js writes the same format in Node, and the
   admin panel uses lock() to re-encrypt on every save. */
(function () {
  'use strict';

  const te = new TextEncoder();
  const td = new TextDecoder();
  const toB64 = (buf) => {
    const bytes = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  };
  const fromB64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

  async function key(password, salt, iter) {
    const base = await crypto.subtle.importKey('raw', te.encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }

  // resolves to the decrypted text, or rejects when the password is wrong
  async function unlock(box, password) {
    const k = await key(password, fromB64(box.salt), box.iter);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(box.iv) }, k, fromB64(box.data));
    return td.decode(plain);
  }

  async function lock(text, password, iter = 250000) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const k = await key(password, salt, iter);
    const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, te.encode(text));
    return { v: 1, kdf: 'PBKDF2-SHA256', iter, salt: toB64(salt), iv: toB64(iv), data: toB64(data) };
  }

  window.MFC_LOCK = { lock, unlock };
})();
