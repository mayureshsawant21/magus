/* Presentation Studio: structured editor for the presentation content.
   Forms are generated from MFC_SCHEMA; every edit updates the live preview
   immediately and is written to the server when you press Save. */
(function () {
  'use strict';

  const { SECTION_TYPES, COMMON_FIELDS, SETTINGS_FIELDS } = window.MFC_SCHEMA;
  const ICON_PATHS = window.MFC_ICON_PATHS || {};

  const state = {
    content: null,
    savedJSON: '',
    selected: 'settings',
    preview: localStorage.getItem('mfc.preview') || 'desktop',
    openItems: new WeakSet(),
    previewReady: false
  };

  /* ----------------------------------------------------------------- utils */

  const $ = (sel, root = document) => root.querySelector(sel);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const pad = (n) => String(n).padStart(2, '0');
  const plain = (v) => String(v ?? '').replace(/\*/g, '');

  // tiny DOM builder: h('div', { class: 'x', onclick: fn }, child, 'text')
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'value') el.value = v;
      else if (k === 'checked') el.checked = !!v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    kids.flat(Infinity).forEach((c) => {
      if (c == null || c === false) return;
      el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
    });
    return el;
  }

  const icon = (name) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name] || ''}</svg>`;

  const assetUrl = (u) =>
    !u ? '' : /^(https?:|data:|\/)/.test(u) ? u : B && B.uploadsBase && /^uploads\//.test(u) ? B.uploadsBase + u.slice(8) : '../' + u;
  const isVideo = (u) => /\.(mp4|webm)(\?|$)/i.test(u || '');

  function toast(msg, kind = '') {
    const t = $('#toast');
    t.textContent = msg;
    t.className = 'toast is-on ' + kind;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => (t.className = 'toast'), 2600);
  }

  // Storage backend (local server or GitHub), picked in start(). See backend.js.
  const BK = window.MFC_BACKEND;
  let B = null;

  // Runs a backend call; a lost sign-in is reported once and sends you back to sign in.
  async function call(fn) {
    try {
      return await fn();
    } catch (e) {
      if (e instanceof BK.AuthError) {
        toast(e.message, 'is-error');
        B.onAuthError();
        e.handled = true;
      }
      throw e;
    }
  }

  /* ------------------------------------------------------------ dirty state */

  function isDirty() {
    return JSON.stringify(state.content) !== state.savedJSON;
  }

  function setStatus() {
    const el = $('#status');
    const dirty = isDirty();
    el.classList.toggle('is-dirty', dirty);
    $('.status-text', el).textContent = dirty ? 'Unsaved changes' : 'All changes saved';
    $('#saveBtn').disabled = !dirty;
  }

  let previewTimer = null;
  let sideTimer = null;
  function changed() {
    setStatus();
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => pushPreview(), 450);
    clearTimeout(sideTimer);
    sideTimer = setTimeout(renderSide, 250);
  }

  /* ---------------------------------------------------------------- preview */

  function pushPreview(focus) {
    const frame = $('#previewFrame');
    if (!state.previewReady || !state.content || !frame.contentWindow || state.preview === 'off') return;
    frame.contentWindow.postMessage({ type: 'mfc:preview', content: state.content, focus: focus || null, uploadsBase: B && B.uploadsBase }, location.origin);
  }

  function focusPreview() {
    const s = currentSection();
    clearTimeout(previewTimer);
    pushPreview(s && s.enabled !== false ? s.id : null);
  }

  function layoutPreview() {
    const pane = $('#previewPane');
    const wrap = $('#previewWrap');
    const frame = $('#previewFrame');
    document.body.dataset.preview = state.preview;
    document.querySelectorAll('[data-preview]').forEach((b) => b.classList.toggle('is-on', b.dataset.preview === state.preview));
    if (state.preview === 'off') return;
    const availW = pane.clientWidth - 32;
    const availH = pane.clientHeight - 70;
    const baseW = state.preview === 'mobile' ? 390 : 1440;
    const baseH = state.preview === 'mobile' ? 844 : 900;
    const scale = Math.min(availW / baseW, state.preview === 'mobile' ? availH / baseH : 1);
    frame.style.width = baseW + 'px';
    frame.style.height = (state.preview === 'mobile' ? baseH : availH / scale) + 'px';
    frame.style.transform = `scale(${scale})`;
    wrap.style.width = baseW * scale + 'px';
    wrap.style.height = (state.preview === 'mobile' ? baseH * scale : availH) + 'px';
  }

  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data) return;
    if (e.data.type === 'mfc:ready') {
      state.previewReady = true;
      if (!state.content) return;
      if (isDirty()) pushPreview();
      focusPreview();
    }
  });

  /* ---------------------------------------------------------------- sidebar */

  function currentSection() {
    return typeof state.selected === 'number' ? state.content.sections[state.selected] : null;
  }

  function select(which) {
    state.selected = which;
    renderSide();
    renderEditor();
    $('#editor').scrollTop = 0;
    focusPreview();
  }

  let dragFrom = null;
  function renderSide() {
    const list = $('#sideList');
    const secs = state.content.sections;
    list.innerHTML = '';
    let visibleN = 0;
    secs.forEach((s, i) => {
      const visible = s.enabled !== false;
      if (visible) visibleN += 1;
      const type = SECTION_TYPES[s.type];
      const li = h(
        'li',
        {
          class: 'side-item' + (state.selected === i ? ' is-active' : '') + (visible ? '' : ' is-hidden'),
          draggable: 'true',
          ondragstart: (e) => {
            dragFrom = i;
            li.classList.add('is-dragging');
            e.dataTransfer.effectAllowed = 'move';
          },
          ondragend: () => li.classList.remove('is-dragging'),
          ondragover: (e) => {
            e.preventDefault();
            li.classList.add('is-over');
          },
          ondragleave: () => li.classList.remove('is-over'),
          ondrop: (e) => {
            e.preventDefault();
            li.classList.remove('is-over');
            if (dragFrom == null || dragFrom === i) return;
            moveSection(dragFrom, i);
            dragFrom = null;
          }
        },
        h('span', { class: 'side-grip', 'aria-hidden': 'true' }, '⋮⋮'),
        h(
          'button',
          { type: 'button', class: 'side-main', onclick: () => select(i) },
          h('span', { class: 'side-num' }, visible ? pad(visibleN) : '—'),
          h('span', { class: 'side-text' }, h('strong', {}, s.navLabel || plain(s.title) || 'Untitled'), h('small', {}, type ? type.label : s.type))
        ),
        h('button', {
          type: 'button',
          class: 'side-eye',
          title: visible ? 'Hide this slide' : 'Show this slide',
          'aria-label': visible ? 'Hide this slide' : 'Show this slide',
          html: visible
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6"/></svg>',
          onclick: () => {
            s.enabled = !visible;
            changed();
            renderSide();
            if (state.selected === i) renderEditor();
          }
        })
      );
      list.appendChild(li);
    });
    document.querySelector('.side-settings').classList.toggle('is-active', state.selected === 'settings');
  }

  function moveSection(from, to) {
    const secs = state.content.sections;
    const [s] = secs.splice(from, 1);
    secs.splice(to, 0, s);
    if (state.selected === from) state.selected = to;
    else if (typeof state.selected === 'number') {
      if (from < state.selected && to >= state.selected) state.selected -= 1;
      else if (from > state.selected && to <= state.selected) state.selected += 1;
    }
    changed();
    renderSide();
    renderEditor();
  }

  function uniqueId(base) {
    const ids = new Set(state.content.sections.map((s) => s.id));
    let id = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'slide';
    if (!ids.has(id)) return id;
    let n = 2;
    while (ids.has(`${id}-${n}`)) n += 1;
    return `${id}-${n}`;
  }

  /* ------------------------------------------------------------ field kinds */

  function emptyFor(fields) {
    const o = {};
    fields.forEach((f) => {
      if (f.type === 'strings') o[f.key] = [];
      else if (f.type === 'list') o[f.key] = [];
      else if (f.type === 'object') o[f.key] = emptyFor(f.fields);
      else if (f.type === 'toggle') o[f.key] = false;
      else if (f.type === 'select') o[f.key] = typeof f.options[0] === 'string' ? f.options[0] : f.options[0].value;
      else if (f.type === 'icon') o[f.key] = 'sparkle';
      else o[f.key] = '';
    });
    return o;
  }

  function fieldWrap(f, control, extra) {
    return h(
      'div',
      { class: `field field--${f.type}${f.width === 'half' ? ' field--half' : ''}` },
      f.label && f.type !== 'toggle' ? h('label', { class: 'field-label' }, f.label) : null,
      control,
      f.accent ? h('p', { class: 'field-help' }, 'Tip: wrap words in *asterisks* to show them in the gold italic accent.') : null,
      f.help ? h('p', { class: 'field-help' }, f.help) : null,
      extra || null
    );
  }

  function renderFields(fields, obj, ctx = {}) {
    return h('div', { class: 'fields' }, fields.map((f) => renderField(f, obj, ctx)));
  }

  function renderField(f, obj, ctx) {
    const set = (v) => {
      obj[f.key] = v;
      changed();
    };
    const val = obj[f.key];

    switch (f.type) {
      case 'text':
        return fieldWrap(f, h('input', { type: 'text', value: val ?? '', placeholder: f.placeholder || '', oninput: (e) => set(e.target.value) }));

      case 'textarea':
        return fieldWrap(f, h('textarea', { rows: f.rows || 3, oninput: (e) => set(e.target.value) }, val ?? ''));

      case 'slug': {
        const input = h('input', {
          type: 'text',
          value: val ?? '',
          oninput: (e) => {
            const clean = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
            if (clean !== e.target.value) e.target.value = clean;
            set(clean);
            const dup = state.content.sections.filter((s) => s.id === clean).length > 1;
            input.classList.toggle('is-invalid', dup || !/^[a-z0-9][a-z0-9-]*$/.test(clean));
          }
        });
        return fieldWrap(f, input);
      }

      case 'select': {
        const opts = f.options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
        return fieldWrap(
          f,
          h(
            'select',
            {
              onchange: (e) => {
                set(e.target.value);
                if (ctx.rerender) ctx.rerender();
              }
            },
            opts.map((o) => h('option', { value: o.value, selected: o.value === val ? 'selected' : null }, o.label))
          )
        );
      }

      case 'toggle':
        return fieldWrap(
          f,
          h(
            'label',
            { class: 'switch' },
            h('input', { type: 'checkbox', checked: !!val, onchange: (e) => set(e.target.checked) }),
            h('span', { class: 'switch-track' }),
            h('span', { class: 'switch-label' }, f.label)
          )
        );

      case 'color': {
        const text = h('input', {
          type: 'text',
          value: val || '',
          class: 'color-text',
          oninput: (e) => {
            if (/^#[0-9a-f]{6}$/i.test(e.target.value)) {
              picker.value = e.target.value;
              set(e.target.value);
            }
          }
        });
        const picker = h('input', {
          type: 'color',
          value: /^#[0-9a-f]{6}$/i.test(val || '') ? val : '#000000',
          oninput: (e) => {
            text.value = e.target.value;
            set(e.target.value);
          }
        });
        return fieldWrap(f, h('div', { class: 'color-row' }, picker, text));
      }

      case 'icon': {
        const grid = h('div', { class: 'icon-grid' });
        const draw = () => {
          grid.innerHTML = '';
          f.options.forEach((name) =>
            grid.appendChild(
              h('button', {
                type: 'button',
                class: 'icon-pick' + (obj[f.key] === name ? ' is-on' : ''),
                title: name,
                html: icon(name),
                onclick: () => {
                  set(name);
                  draw();
                }
              })
            )
          );
        };
        draw();
        return fieldWrap(f, grid);
      }

      case 'image':
        return fieldWrap(f, imageControl(obj, f.key));

      case 'strings':
        if (!Array.isArray(obj[f.key])) obj[f.key] = [];
        return fieldWrap(f, stringsControl(f, obj[f.key]));

      case 'list':
        if (!Array.isArray(obj[f.key])) obj[f.key] = [];
        return fieldWrap(f, listControl(f, obj[f.key]));

      case 'object':
        if (!obj[f.key] || typeof obj[f.key] !== 'object') obj[f.key] = emptyFor(f.fields);
        return h('fieldset', { class: 'group' }, h('legend', {}, f.label), renderFields(f.fields, obj[f.key], ctx));

      case 'table':
        return fieldWrap(f, tableControl(obj));

      case 'columnPicker': {
        if (!Array.isArray(obj[f.key])) obj[f.key] = [];
        const box = h('div', { class: 'checks' });
        const draw = () => {
          box.innerHTML = '';
          (obj.columns || []).forEach((c, i) => {
            box.appendChild(
              h(
                'label',
                { class: 'check' },
                h('input', {
                  type: 'checkbox',
                  checked: obj[f.key].includes(i),
                  onchange: (e) => {
                    const arr = obj[f.key].filter((x) => x !== i);
                    if (e.target.checked) arr.push(i);
                    obj[f.key] = arr.sort((a, b) => a - b);
                    changed();
                  }
                }),
                h('span', {}, c || `Column ${i + 1}`)
              )
            );
          });
        };
        draw();
        state.redrawColumns = draw;
        return fieldWrap(f, box);
      }

      default:
        return fieldWrap(f, h('input', { type: 'text', value: val ?? '', oninput: (e) => set(e.target.value) }));
    }
  }

  /* image: preview, library, upload, URL, drag & drop */
  function imageControl(obj, key) {
    const wrap = h('div', { class: 'img-field' });
    const draw = () => {
      const url = obj[key] || '';
      wrap.innerHTML = '';
      const thumb = h(
        'div',
        { class: 'img-thumb' + (url ? '' : ' is-empty') },
        url ? (isVideo(url) ? h('video', { src: assetUrl(url), muted: true, autoplay: true, loop: true, playsinline: true }) : h('img', { src: assetUrl(url), alt: '' })) : h('span', {}, 'No image')
      );
      const urlInput = h('input', {
        type: 'text',
        value: url,
        placeholder: 'uploads/photo.jpg or https://…',
        onchange: (e) => {
          obj[key] = e.target.value.trim();
          changed();
          draw();
        }
      });
      const fileInput = h('input', {
        type: 'file',
        accept: 'image/*,video/mp4,video/webm',
        hidden: true,
        onchange: async (e) => {
          const file = e.target.files[0];
          if (file) await uploadInto(file);
        }
      });
      const uploadInto = async (file) => {
        wrap.classList.add('is-busy');
        try {
          const url2 = await uploadFile(file);
          obj[key] = url2;
          changed();
          draw();
          toast('Uploaded');
        } catch (err) {
          toast(err.message, 'is-error');
        } finally {
          wrap.classList.remove('is-busy');
        }
      };
      wrap.ondragover = (e) => {
        e.preventDefault();
        wrap.classList.add('is-over');
      };
      wrap.ondragleave = () => wrap.classList.remove('is-over');
      wrap.ondrop = (e) => {
        e.preventDefault();
        wrap.classList.remove('is-over');
        const file = e.dataTransfer.files[0];
        if (file) uploadInto(file);
      };
      wrap.append(
        thumb,
        h(
          'div',
          { class: 'img-side' },
          h(
            'div',
            { class: 'btn-row' },
            h('button', { type: 'button', class: 'btn btn-small', onclick: () => fileInput.click() }, 'Upload'),
            h(
              'button',
              {
                type: 'button',
                class: 'btn btn-small btn-ghost',
                onclick: () =>
                  openLibrary((picked) => {
                    obj[key] = picked;
                    changed();
                    draw();
                  })
              },
              'Choose from library'
            ),
            url
              ? h(
                  'button',
                  {
                    type: 'button',
                    class: 'btn btn-small btn-quiet',
                    onclick: () => {
                      obj[key] = '';
                      changed();
                      draw();
                    }
                  },
                  'Remove'
                )
              : null
          ),
          urlInput,
          h('p', { class: 'field-help' }, 'Drop a file here to upload. JPG, PNG, WEBP, GIF or MP4.'),
          fileInput
        )
      );
    };
    draw();
    return wrap;
  }

  const uploadFile = (file) => call(() => B.upload(file));

  const moveBtns = (arr, i, redraw) => [
    h('button', { type: 'button', class: 'mini', title: 'Move up', disabled: i === 0 ? true : null, onclick: () => { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; changed(); redraw(); } }, '↑'),
    h('button', { type: 'button', class: 'mini', title: 'Move down', disabled: i === arr.length - 1 ? true : null, onclick: () => { [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; changed(); redraw(); } }, '↓')
  ];

  /* list of plain strings */
  function stringsControl(f, arr) {
    const box = h('div', { class: 'strings' });
    let bulk = false;
    const draw = () => {
      box.innerHTML = '';
      if (bulk) {
        const ta = h('textarea', { rows: Math.max(6, arr.length + 1) }, arr.join('\n'));
        box.append(
          ta,
          h(
            'div',
            { class: 'btn-row' },
            h('button', { type: 'button', class: 'btn btn-small', onclick: () => { arr.splice(0, arr.length, ...ta.value.split('\n').map((s) => s.trim()).filter(Boolean)); bulk = false; changed(); draw(); } }, 'Apply'),
            h('button', { type: 'button', class: 'btn btn-small btn-quiet', onclick: () => { bulk = false; draw(); } }, 'Cancel')
          )
        );
        return;
      }
      arr.forEach((v, i) => {
        const input = f.multiline
          ? h('textarea', { rows: 2, oninput: (e) => { arr[i] = e.target.value; changed(); } }, v)
          : h('input', { type: 'text', value: v, oninput: (e) => { arr[i] = e.target.value; changed(); }, onkeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); arr.splice(i + 1, 0, ''); changed(); draw(); box.querySelectorAll('input')[i + 1]?.focus(); } } });
        box.appendChild(
          h(
            'div',
            { class: 'string-row' },
            h('span', { class: 'string-n' }, pad(i + 1)),
            input,
            ...moveBtns(arr, i, draw),
            h('button', { type: 'button', class: 'mini mini-del', title: 'Remove', onclick: () => { arr.splice(i, 1); changed(); draw(); } }, '×')
          )
        );
      });
      box.appendChild(
        h(
          'div',
          { class: 'btn-row' },
          h('button', { type: 'button', class: 'btn btn-small btn-ghost', onclick: () => { arr.push(''); changed(); draw(); const all = box.querySelectorAll('input, textarea'); all[all.length - 1]?.focus(); } }, `+ Add ${(f.itemLabel || 'item').toLowerCase()}`),
          h('button', { type: 'button', class: 'btn btn-small btn-quiet', onclick: () => { bulk = true; draw(); } }, 'Edit as text (one per line)')
        )
      );
    };
    draw();
    return box;
  }

  /* repeatable groups of fields */
  function listControl(f, arr) {
    const box = h('div', { class: 'list' });
    const draw = () => {
      box.innerHTML = '';
      arr.forEach((item, i) => {
        const open = state.openItems.has(item);
        const title = plain(item[f.titleKey]) || `${f.itemLabel || 'Item'} ${i + 1}`;
        const card = h(
          'div',
          { class: 'item' + (open ? ' is-open' : '') },
          h(
            'div',
            { class: 'item-head' },
            h(
              'button',
              {
                type: 'button',
                class: 'item-toggle',
                onclick: () => {
                  open ? state.openItems.delete(item) : state.openItems.add(item);
                  draw();
                }
              },
              h('span', { class: 'item-n' }, pad(i + 1)),
              h('span', { class: 'item-title' }, title),
              h('span', { class: 'item-caret' }, open ? '−' : '+')
            ),
            ...moveBtns(arr, i, draw),
            h('button', { type: 'button', class: 'mini', title: 'Duplicate', onclick: () => { const c = clone(item); arr.splice(i + 1, 0, c); state.openItems.add(c); changed(); draw(); } }, '⧉'),
            h('button', { type: 'button', class: 'mini mini-del', title: 'Delete', onclick: () => { if (confirm(`Delete "${title}"?`)) { arr.splice(i, 1); changed(); draw(); } } }, '×')
          ),
          open ? h('div', { class: 'item-body' }, renderFields(f.fields, item, { rerender: draw })) : null
        );
        box.appendChild(card);
      });
      box.appendChild(
        h(
          'button',
          {
            type: 'button',
            class: 'btn btn-small btn-ghost',
            onclick: () => {
              const n = emptyFor(f.fields);
              arr.push(n);
              state.openItems.add(n);
              changed();
              draw();
            }
          },
          `+ Add ${(f.itemLabel || 'item').toLowerCase()}`
        )
      );
    };
    draw();
    return box;
  }

  /* spreadsheet-like table editor (edits section.columns + section.rows) */
  function tableControl(sec) {
    if (!Array.isArray(sec.columns)) sec.columns = [];
    if (!Array.isArray(sec.rows)) sec.rows = [];
    const box = h('div', { class: 'table-edit' });
    const fixRows = () => sec.rows.forEach((r) => { while (r.length < sec.columns.length) r.push(''); r.length = sec.columns.length; });
    const draw = () => {
      fixRows();
      box.innerHTML = '';
      const table = h('table', {},
        h('thead', {}, h('tr', {},
          h('th', { class: 'te-corner' }),
          sec.columns.map((c, ci) => h('th', {},
            h('input', { type: 'text', value: c, class: 'te-col', oninput: (e) => { sec.columns[ci] = e.target.value; changed(); if (state.redrawColumns) state.redrawColumns(); } }),
            h('div', { class: 'te-col-tools' },
              h('button', { type: 'button', class: 'mini', title: 'Move left', disabled: ci === 0 ? true : null, onclick: () => { swapCol(ci, ci - 1); } }, '←'),
              h('button', { type: 'button', class: 'mini', title: 'Move right', disabled: ci === sec.columns.length - 1 ? true : null, onclick: () => { swapCol(ci, ci + 1); } }, '→'),
              h('button', { type: 'button', class: 'mini mini-del', title: 'Delete column', onclick: () => { if (confirm(`Delete column "${c}"?`)) { sec.columns.splice(ci, 1); sec.rows.forEach((r) => r.splice(ci, 1)); sec.chartColumns = (sec.chartColumns || []).filter((x) => x !== ci).map((x) => (x > ci ? x - 1 : x)); changed(); draw(); } } }, '×')
            )
          ))
        )),
        h('tbody', {}, sec.rows.map((r, ri) => h('tr', {},
          h('td', { class: 'te-row-tools' },
            h('span', {}, pad(ri + 1)),
            ...moveBtns(sec.rows, ri, draw),
            h('button', { type: 'button', class: 'mini mini-del', title: 'Delete row', onclick: () => { sec.rows.splice(ri, 1); changed(); draw(); } }, '×')
          ),
          sec.columns.map((_, ci) => h('td', {}, h('textarea', { rows: 1, oninput: (e) => { r[ci] = e.target.value; changed(); } }, r[ci] ?? '')))
        )))
      );
      box.append(
        h('div', { class: 'te-scroll' }, table),
        h('div', { class: 'btn-row' },
          h('button', { type: 'button', class: 'btn btn-small btn-ghost', onclick: () => { sec.rows.push(sec.columns.map(() => '')); changed(); draw(); } }, '+ Add row'),
          h('button', { type: 'button', class: 'btn btn-small btn-ghost', onclick: () => { sec.columns.push(`Column ${sec.columns.length + 1}`); changed(); draw(); } }, '+ Add column'),
          h('button', { type: 'button', class: 'btn btn-small btn-quiet', onclick: pasteDialog }, 'Paste from Excel / Sheets…')
        )
      );
      if (state.redrawColumns) state.redrawColumns();
    };
    const swapCol = (a, b) => {
      [sec.columns[a], sec.columns[b]] = [sec.columns[b], sec.columns[a]];
      sec.rows.forEach((r) => ([r[a], r[b]] = [r[b], r[a]]));
      sec.chartColumns = (sec.chartColumns || []).map((x) => (x === a ? b : x === b ? a : x));
      changed();
      draw();
    };
    const pasteDialog = () => {
      const ta = h('textarea', { rows: 10, placeholder: 'Copy the cells (including the header row) from Excel or Google Sheets and paste them here.' });
      openModal('Paste a table', h('div', { class: 'stack' },
        h('p', { class: 'muted' }, 'The first line becomes the column headings. This replaces the current table.'),
        ta,
        h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn btn-primary', onclick: () => {
          const lines = ta.value.replace(/\r/g, '').split('\n').filter((l) => l.trim());
          if (!lines.length) return;
          const cells = lines.map((l) => (l.includes('\t') ? l.split('\t') : l.split(/\s{2,}|,(?=\S)/)).map((c) => c.trim()));
          sec.columns = cells[0];
          sec.rows = cells.slice(1);
          sec.chartColumns = [];
          changed();
          closeModal();
          draw();
        } }, 'Replace table'))
      ));
      setTimeout(() => ta.focus(), 50);
    };
    draw();
    return box;
  }

  /* --------------------------------------------------------------- editor */

  function renderEditor() {
    const ed = $('#editor');
    ed.innerHTML = '';
    state.redrawColumns = null;

    if (state.selected === 'settings') {
      if (!state.content.settings) state.content.settings = {};
      ed.append(
        h('header', { class: 'ed-head' }, h('div', {}, h('p', { class: 'ed-kicker' }, 'Global'), h('h1', {}, 'Settings'), h('p', { class: 'muted' }, 'Logos, colours and details used across every slide.'))),
        h('div', { class: 'card' }, renderFields(SETTINGS_FIELDS, state.content.settings))
      );
      return;
    }

    const i = state.selected;
    const s = state.content.sections[i];
    if (!s) return select('settings');
    const type = SECTION_TYPES[s.type];
    const body = h('div', { class: 'card' }, renderFields(type ? type.fields : [], s));

    ed.append(
      h(
        'header',
        { class: 'ed-head' },
        h('div', {}, h('p', { class: 'ed-kicker' }, `Slide ${pad(i + 1)} · ${type ? type.label : s.type}`), h('h1', {}, s.navLabel || plain(s.title) || 'Untitled'), type ? h('p', { class: 'muted' }, type.description) : null),
        h(
          'div',
          { class: 'btn-row' },
          h('button', { type: 'button', class: 'btn btn-small btn-ghost', onclick: () => focusPreview() }, 'Show in preview'),
          h('button', { type: 'button', class: 'btn btn-small btn-ghost', onclick: () => duplicateSection(i) }, 'Duplicate'),
          h('button', { type: 'button', class: 'btn btn-small btn-danger', onclick: () => deleteSection(i) }, 'Delete')
        )
      ),
      h('div', { class: 'card card--quiet' }, h('p', { class: 'card-title' }, 'Slide basics'), renderFields(
        [{ key: 'enabled', label: 'Show this slide in the presentation', type: 'toggle' }, ...COMMON_FIELDS],
        s,
        {}
      )),
      body
    );
    if (s.enabled === undefined) s.enabled = true;
  }

  function duplicateSection(i) {
    const c = clone(state.content.sections[i]);
    c.id = uniqueId(c.id + '-copy');
    c.navLabel = (c.navLabel || '') + ' (copy)';
    state.content.sections.splice(i + 1, 0, c);
    changed();
    select(i + 1);
  }

  function deleteSection(i) {
    const s = state.content.sections[i];
    if (!confirm(`Delete the slide "${s.navLabel || plain(s.title)}"? You can still restore it from Version history after saving.`)) return;
    state.content.sections.splice(i, 1);
    changed();
    select(Math.min(i, state.content.sections.length - 1) >= 0 ? Math.min(i, state.content.sections.length - 1) : 'settings');
  }

  function addSectionDialog() {
    const grid = h(
      'div',
      { class: 'type-grid' },
      Object.entries(SECTION_TYPES).map(([key, t]) =>
        h(
          'button',
          {
            type: 'button',
            class: 'type-card',
            onclick: () => {
              const s = { id: uniqueId(key), type: key, enabled: true, theme: 'light', navLabel: t.label, ...clone(t.defaults) };
              const at = typeof state.selected === 'number' ? state.selected + 1 : state.content.sections.length;
              state.content.sections.splice(at, 0, s);
              closeModal();
              changed();
              select(at);
            }
          },
          h('strong', {}, t.label),
          h('span', {}, t.description)
        )
      )
    );
    openModal('Add a slide', grid);
  }

  /* ---------------------------------------------------------------- modals */

  function openModal(title, body) {
    $('#modalTitle').textContent = title;
    const mb = $('#modalBody');
    mb.innerHTML = '';
    mb.appendChild(body);
    $('#modal').hidden = false;
  }
  function closeModal() {
    $('#modal').hidden = true;
  }

  async function openLibrary(onPick) {
    const body = h('div', { class: 'library' }, h('p', { class: 'muted' }, 'Loading…'));
    openModal('Media library', body);
    const draw = async () => {
      let data;
      try {
        data = await call(() => B.library());
      } catch (e) {
        body.innerHTML = '';
        body.append(h('p', { class: 'muted' }, e.message));
        return;
      }
      const tile = (it, canDelete) =>
        h(
          'div',
          { class: 'lib-tile' },
          h(
            'button',
            { type: 'button', class: 'lib-pick', onclick: () => { onPick(it.url); closeModal(); } },
            isVideo(it.url) ? h('video', { src: assetUrl(it.url), muted: true }) : h('img', { src: assetUrl(it.url), alt: '', loading: 'lazy' }),
            h('span', {}, it.name)
          ),
          canDelete
            ? h('button', {
                type: 'button',
                class: 'lib-del',
                title: 'Delete file',
                onclick: async () => {
                  if (!confirm(`Delete ${it.name}? Slides using it will show an empty space.`)) return;
                  try {
                    await call(() => B.remove(it));
                  } catch (err) {
                    if (!err.handled) toast(err.message, 'is-error');
                  }
                  draw();
                }
              }, '×')
            : null
        );
      const input = h('input', {
        type: 'file',
        accept: 'image/*,video/mp4,video/webm',
        multiple: true,
        hidden: true,
        onchange: async (e) => {
          for (const file of e.target.files) {
            try {
              await uploadFile(file);
            } catch (err) {
              toast(err.message, 'is-error');
            }
          }
          draw();
        }
      });
      const drop = h(
        'div',
        {
          class: 'lib-drop',
          ondragover: (e) => { e.preventDefault(); drop.classList.add('is-over'); },
          ondragleave: () => drop.classList.remove('is-over'),
          ondrop: async (e) => {
            e.preventDefault();
            drop.classList.remove('is-over');
            for (const file of e.dataTransfer.files) {
              try { await uploadFile(file); } catch (err) { toast(err.message, 'is-error'); }
            }
            draw();
          }
        },
        h('p', {}, 'Drop photos or videos here, or '),
        h('button', { type: 'button', class: 'btn btn-small', onclick: () => input.click() }, 'Choose files'),
        input
      );
      body.innerHTML = '';
      body.append(
        drop,
        h('h3', {}, `Your uploads (${data.uploads.length})`),
        data.uploads.length ? h('div', { class: 'lib-grid' }, data.uploads.map((it) => tile(it, true))) : h('p', { class: 'muted' }, 'Nothing uploaded yet.'),
        h('h3', {}, 'Built-in illustrations & logos'),
        h('div', { class: 'lib-grid' }, data.builtIn.map((it) => tile(it, false)))
      );
    };
    draw();
  }

  async function openBackups() {
    const body = h('div', { class: 'stack' }, h('p', { class: 'muted' }, 'Loading…'));
    openModal('Version history', body);
    try {
      const list = await call(() => B.versions());
      body.innerHTML = '';
      body.append(
        h(
          'p',
          { class: 'muted' },
          B.restoreSaves
            ? 'A copy is kept every time you save (last 40). Restoring replaces the live content.'
            : 'Every save is a commit on GitHub. Opening an earlier version loads it into the editor; press Save changes to make it live again.'
        )
      );
      if (!list.length) body.append(h('p', {}, 'No earlier versions yet.'));
      list.forEach((b) =>
        body.append(
          h(
            'div',
            { class: 'backup-row' },
            h('span', {}, new Date(b.date).toLocaleString(), b.label ? h('small', { class: 'muted' }, ' · ' + b.label) : null),
            h('button', {
              type: 'button',
              class: 'btn btn-small',
              onclick: async () => {
                if (isDirty() && !confirm('You have unsaved changes. Restore this version anyway?')) return;
                try {
                  const restored = await call(() => B.restore(b));
                  load(restored, { asSaved: B.restoreSaves });
                  closeModal();
                  toast(B.restoreSaves ? 'Version restored' : 'Earlier version loaded. Press Save changes to make it live.');
                } catch (err) {
                  if (!err.handled) toast(err.message, 'is-error');
                }
              }
            }, B.restoreSaves ? 'Restore' : 'Open')
          )
        )
      );
    } catch (e) {
      body.innerHTML = '';
      body.append(h('p', {}, e.message));
    }
  }

  /* ------------------------------------------------------------- save/load */

  // After a GitHub save, follow the publish run so the status shows when the live site has caught up.
  let publishTimer = null;
  function followPublish(commit) {
    clearTimeout(publishTimer);
    const text = $('.publish-text');
    const el = $('#publish');
    el.hidden = false;
    el.className = 'bar-publish is-running';
    text.textContent = 'Publishing to the live site…';
    const started = Date.now();
    const tick = async () => {
      const st = await B.publishStatus(commit);
      if (st.url) el.href = st.url;
      if (st.state === 'done') {
        el.className = 'bar-publish is-done';
        text.textContent = 'Live site updated';
        return;
      }
      if (st.state === 'failed') {
        el.className = 'bar-publish is-failed';
        text.textContent = 'Publishing failed. Click for details';
        return;
      }
      if (st.state === 'unknown' || Date.now() - started > 6 * 60 * 1000) {
        el.className = 'bar-publish';
        text.textContent = 'Live site updates in about a minute';
        return;
      }
      publishTimer = setTimeout(tick, 6000);
    };
    publishTimer = setTimeout(tick, 4000);
  }

  async function save() {
    if (!isDirty()) return;
    const ids = state.content.sections.map((s) => s.id);
    const bad = ids.find((id, i) => !/^[a-z0-9][a-z0-9-]*$/.test(id || '') || ids.indexOf(id) !== i);
    if (bad !== undefined) {
      toast(`Slide link id "${bad}" is empty, invalid or used twice.`, 'is-error');
      return;
    }
    const btn = $('#saveBtn');
    btn.disabled = true;
    btn.textContent = 'Saving…';
    try {
      const snapshot = JSON.stringify(state.content);
      const res = await call(() => B.save(JSON.parse(snapshot)));
      state.savedJSON = snapshot;
      toast(res.message);
      if (res.commit) followPublish(res.commit);
    } catch (e) {
      if (!e.handled) toast(e.message, 'is-error');
    } finally {
      btn.textContent = 'Save changes';
      setStatus();
    }
  }

  function load(content, { asSaved = true } = {}) {
    state.content = content;
    if (asSaved) state.savedJSON = JSON.stringify(content);
    if (typeof state.selected === 'number' && !content.sections[state.selected]) state.selected = 'settings';
    renderSide();
    renderEditor();
    setStatus();
    pushPreview();
  }

  function bindChrome() {
    $('#saveBtn').addEventListener('click', save);
    $('#addSectionBtn').addEventListener('click', addSectionDialog);
    document.querySelector('.side-settings').addEventListener('click', () => select('settings'));
    $('#modal').addEventListener('click', (e) => {
      if (e.target.id === 'modal' || e.target.closest('[data-close]')) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      }
      if (e.key === 'Escape') {
        closeModal();
        $('#morePop').hidden = true;
      }
    });
    window.addEventListener('beforeunload', (e) => {
      if (isDirty()) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    document.querySelectorAll('[data-preview]').forEach((b) =>
      b.addEventListener('click', () => {
        state.preview = b.dataset.preview;
        localStorage.setItem('mfc.preview', state.preview);
        layoutPreview();
        if (state.preview !== 'off') setTimeout(() => { pushPreview(); focusPreview(); }, 50);
      })
    );
    window.addEventListener('resize', layoutPreview);

    $('#moreBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      $('#morePop').hidden = !$('#morePop').hidden;
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.menu')) $('#morePop').hidden = true;
    });
    $('#morePop').addEventListener('click', async (e) => {
      const a = e.target.closest('[data-action]');
      if (!a) return;
      $('#morePop').hidden = true;
      const act = a.dataset.action;
      if (act === 'backups') openBackups();
      if (act === 'export') {
        const blob = new Blob([JSON.stringify(state.content, null, 2)], { type: 'application/json' });
        const link = h('a', { href: URL.createObjectURL(blob), download: `magus-presentation-${new Date().toISOString().slice(0, 10)}.json` });
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      if (act === 'import') $('#importInput').click();
      if (act === 'signout') {
        if (isDirty() && !confirm('You have unsaved changes. Sign out anyway?')) return;
        window.onbeforeunload = null;
        state.savedJSON = JSON.stringify(state.content);
        B.signOut();
      }
      if (act === 'reset') {
        if (!confirm('Replace everything with the original content? Nothing is saved until you press Save changes.')) return;
        try {
          const d = await call(() => B.defaults());
          load(d, { asSaved: false });
          toast('Original content loaded. Press Save changes to keep it.');
        } catch (err) {
          if (!err.handled) toast(err.message, 'is-error');
        }
      }
    });
    $('#importInput').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (!data.settings || !Array.isArray(data.sections)) throw new Error('This file is not a presentation content file.');
        load(data, { asSaved: false });
        toast('Imported. Press Save changes to keep it.');
      } catch (err) {
        toast(err.message, 'is-error');
      }
    });
  }

  /* GitHub Pages: connect with a fine-grained access token before editing */
  async function connectGitHub() {
    const saved = BK.savedConfig();
    if (saved) return BK.githubBackend(saved);
    const defaults = await BK.repoDefaults();
    const gate = $('#gate');
    const form = $('#gateForm');
    form.repo.value = defaults.owner && defaults.repo ? `${defaults.owner}/${defaults.repo}` : '';
    form.branch.value = defaults.branch || 'main';
    const link = $('#tokenLink');
    link.href = 'https://github.com/settings/personal-access-tokens/new';
    gate.hidden = false;
    document.body.classList.add('is-gated');
    return new Promise((resolve) => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = $('#gateError');
        err.hidden = true;
        const [owner, repo] = form.repo.value.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').split('/');
        const cfg = { owner, repo, branch: form.branch.value.trim() || 'main', token: form.token.value.trim() };
        const btn = form.querySelector('button[type=submit]');
        btn.disabled = true;
        btn.textContent = 'Checking…';
        try {
          if (!owner || !repo || !cfg.token) throw new Error('Please fill in the repository and the access token.');
          const backend = BK.githubBackend(cfg);
          await backend.check();
          BK.rememberToken(cfg, form.remember.checked);
          gate.hidden = true;
          document.body.classList.remove('is-gated');
          resolve(backend);
        } catch (ex) {
          err.textContent = ex.message;
          err.hidden = false;
        } finally {
          btn.disabled = false;
          btn.textContent = 'Connect';
        }
      });
    });
  }

  async function start() {
    bindChrome();
    layoutPreview();
    const mode = await BK.detect();
    B = mode === 'server' ? BK.serverBackend() : await connectGitHub();
    document.body.dataset.mode = B.mode;
    if (B.liveUrl) $('#openSite').href = B.liveUrl;
    try {
      const content = await call(() => B.load());
      load(content);
      select('settings');
    } catch (e) {
      $('#editor').append(h('p', {}, 'Could not load content: ' + e.message));
    }
  }

  start();
})();
