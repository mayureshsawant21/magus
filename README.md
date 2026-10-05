# Magus Fashion City · Digital Plan & Social Strategy

A scroll-driven presentation of the **Digital Media Plan** and the **Social Media Strategy** for Magus Fashion City, with an admin panel for editing every word, number, image and slide.

- **Presentation:** `http://localhost:3000`
- **Admin panel:** `http://localhost:3000/admin`

## Run it

Requires Node.js 18 or newer.

```bash
npm install
npm start
```

The default admin password is `magus-admin`. **Change it before putting the site online:**

```bash
ADMIN_PASSWORD="choose-a-strong-password" npm start
```

## Presenting

| Key | Action |
| --- | --- |
| `↓` `→` `Space` `PageDown` | Next chapter. In the 10-point playbook, the next point. |
| `↑` `←` `Shift+Space` `PageUp` | Previous |
| `I` or `M` | Chapter index |
| `F` | Fullscreen |
| `Home` / `End` | First / last slide |

You can also scroll or swipe normally. To open the presentation at a particular chapter, add its link id to the address, for example `http://localhost:3000/#media-plan`.

## Editing in the admin panel

- **Global settings:** logos, brand colours, presenter name, browser tab title, and switches for the intro animation and keyboard hint.
- **Slides:** click a slide in the left list to edit it. Drag to reorder, click the eye to hide a slide without deleting it, or use **+ Add slide** to add one of 11 slide types.
- **Accent words:** wrap words in `*asterisks*` in a heading to show them in the gold italic, for example `Meta *Targeting*`.
- **Images and videos:** upload, drag a file onto an image field, or pick from the media library. JPG, PNG, WEBP, GIF, AVIF, MP4 and WEBM are accepted.
- **Media plan table:** edit cells directly, add or move rows and columns, or use **Paste from Excel / Sheets** to replace the whole table at once.
- **Live preview:** updates as you type. Nothing goes live until you press **Save changes** (or `Ctrl/Cmd + S`).
- **Version history** (under **More**): a copy is kept on every save (the last 40), and any of them can be restored. **More** also has download/import of the content as JSON and a reset to the original content.

## Where content lives

| Path | What it is |
| --- | --- |
| `data/content.default.json` | The original content (kept in git) |
| `data/content.json` | Your saved edits (created on first run, not in git) |
| `data/backups/` | Version history |
| `public/uploads/` | Uploaded images and videos |

To keep edits on a host whose disk is wiped on redeploy, point these at a persistent disk:

```bash
DATA_DIR=/var/data/magus UPLOAD_DIR=/var/data/magus/uploads npm start
```

## Hosting

**Option 1: with the admin panel.** Deploy as a Node app on Render, Railway, a VPS or similar, running `npm start`. Set `ADMIN_PASSWORD` (and optionally `SESSION_SECRET`, `PORT`, `DATA_DIR`, `UPLOAD_DIR`) as environment variables.

**Option 2: static, presentation only.** Make your edits locally, then run:

```bash
npm run export
```

This writes a self-contained copy of the presentation, with your current content, to `dist/`. Upload that folder to any static host (Netlify, Vercel, GitHub Pages, cPanel). The admin panel is not included. Serve it over http(s): opening `index.html` directly from disk will not load the content.

## Project layout

```
server.js               Express server: content API, uploads, backups, admin login
admin/                  Admin panel (schema.js defines every editable field)
public/index.html       Presentation shell
public/js/app.js        Renders the slides from content and runs the scroll animations
public/css/style.css    Presentation styles
public/assets/          Logos and illustrations
public/vendor/          GSAP, ScrollTrigger, Lenis and the Fraunces / Manrope fonts (bundled, so it works offline)
scripts/export-static.js  Static export (npm run export)
```

To make a new field editable, add it to the slide type in `admin/schema.js` and read it in the matching renderer in `public/js/app.js`.

## Notes on the content

- The Google CPL is shown as ₹4,814 (₹1,30,000 ÷ 27 leads). The source deck reads "4,8,14".
- The search ad on the Google slide is an illustrative preview and is labelled as such on the slide.
- The illustrations are vector artwork made for this presentation. Replace any of them with real site photos or videos from the admin panel.
