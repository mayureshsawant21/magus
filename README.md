# Magus Fashion City · Digital Plan & Social Strategy

A scroll-driven presentation of the **Digital Media Plan** and the **Social Media Strategy** for Magus Fashion City, with an admin panel for editing every word, number, image and slide.

## Live on GitHub Pages

- **Presentation:** https://mayureshsawant21.github.io/magus/
- **Admin panel:** https://mayureshsawant21.github.io/magus/admin/

Every push to the repository rebuilds the site automatically (`.github/workflows/pages.yml`), and so does every **Save** in the admin panel.

**One-time setup:** in the repository go to **Settings → Pages** and set **Source** to **GitHub Actions**.

### Signing in to the admin panel on GitHub Pages

GitHub Pages cannot run a server, so the admin panel saves your edits straight to the repository using a GitHub access token:

1. Open the admin panel and follow the link to create a **fine-grained token**.
2. Under **Repository access**, choose **Only select repositories** and pick `magus`.
3. Under **Permissions → Repository**, set **Contents** to **Read and write**. Optionally, set **Actions** to **Read** so the admin can show when the live site has updated.
4. Paste the token into the admin panel and press **Connect**.

The token is kept only in your browser. Each save is a commit to `data/content.json`, and uploaded images go to `public/uploads/`. The live site updates about a minute later. The live preview inside the admin panel updates instantly as you type.

## Run it on your own computer (optional)

Requires Node.js 18 or newer.

```bash
npm install
ADMIN_PASSWORD="choose-a-strong-password" npm start
```

The presentation opens at `http://localhost:3000` and the admin panel at `http://localhost:3000/admin`, which signs in with that password instead of a token. Without `ADMIN_PASSWORD`, the password is `magus-admin`.

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
| `data/content.json` | The current content (what the admin panel edits) |
| `data/backups/` | Version history |
| `public/uploads/` | Uploaded images and videos |

To keep edits on a host whose disk is wiped on redeploy, point these at a persistent disk:

```bash
DATA_DIR=/var/data/magus UPLOAD_DIR=/var/data/magus/uploads npm start
```

## Hosting

**GitHub Pages** is set up already (see the top of this file).

**Your own Node server.** Deploy as a Node app on Render, Railway, a VPS or similar, running `npm start`. Set `ADMIN_PASSWORD` (and optionally `SESSION_SECRET`, `PORT`, `DATA_DIR`, `UPLOAD_DIR`) as environment variables.

**Another static host.** Run:

```bash
npm run export
```

This writes the presentation, with the current content, plus the admin panel to `dist/`. Upload that folder to any static host. There, the admin panel saves through GitHub as described above. Serve it over http(s): opening `index.html` directly from disk will not load the content.

## Project layout

```
server.js               Express server: content API, uploads, backups, admin login
admin/                  Admin panel (schema.js defines every editable field; backend.js saves to the server or GitHub)
.github/workflows/      GitHub Pages publishing
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

## Password lock

The published deck is password protected. GitHub Pages only serves `content.enc.json`, an
AES-256-GCM encrypted copy of the content, and the loader screen asks for the password before
anything is shown. The password is not stored anywhere in the repository.

- Saving in the admin panel re-encrypts the copy (it asks for the presentation password once per tab).
- To change the password: `SITE_PASSWORD='new password' node scripts/lock.js --end-sessions`, then commit `data/content.enc.json`.
- To sign everyone out (open tabs go back to the lock screen within a minute): `SITE_PASSWORD='…' node scripts/lock.js --end-sessions`, then commit.
- Optional: add a repository secret `SITE_PASSWORD` and every build re-encrypts from `data/content.json`.
- To remove the lock, delete `data/content.enc.json`.

The repository itself is public, so `data/content.json` can still be read on GitHub. Make the
repository private to close that too.
