/* Magus Fashion City: scroll presentation.
   Content comes from /api/content (or content.json when exported as a static site),
   is rendered into #deck, and then brought to life with GSAP + ScrollTrigger + Lenis. */
(function () {
  'use strict';

  const deck = document.getElementById('deck');
  const params = new URLSearchParams(location.search);
  const IS_PREVIEW = params.has('preview');
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const inr = new Intl.NumberFormat('en-IN');

  let state = { content: null, lenis: null, mm: null, cleanups: [], hzTweens: [], pinDark: false };

  /* ------------------------------------------------------------------ helpers */

  const esc = (v) =>
    String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  // *word* becomes an accented italic; line breaks are kept.
  const rich = (v) => esc(v).replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
  const plain = (v) => String(v ?? '').replace(/\*/g, '');
  const num = (v) => {
    const n = parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  };
  const fmt = (n, dec = 0) =>
    dec ? new Intl.NumberFormat('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n) : inr.format(Math.round(n));
  const decimals = (v) => ((String(v ?? '').match(/\.(\d+)/) || [0, ''])[1] || '').length;
  const pad = (n) => String(n).padStart(2, '0');
  const list = (v) => (Array.isArray(v) ? v : []);
  const csv = (v) => String(v ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const isVideo = (src) => /\.(mp4|webm)(\?|$)/i.test(src || '');

  // In the admin preview, files uploaded to GitHub are shown from the repo until the live site rebuilds.
  const asset = (u) => (u && state.uploadsBase && /^uploads\//.test(u) ? state.uploadsBase + u.slice(8) : u || '');

  function media(raw, alt, cls = '') {
    const src = asset(raw);
    if (!src) return `<div class="media media--empty ${cls}"><span>Add an image in the admin panel</span></div>`;
    if (isVideo(src)) return `<video class="media ${cls}" src="${esc(src)}" autoplay muted loop playsinline></video>`;
    return `<img class="media ${cls}" src="${esc(src)}" alt="${esc(plain(alt))}" loading="lazy" decoding="async">`;
  }

  const ICONS = window.MFC_ICON_PATHS || {};
  const icon = (name, cls = '') =>
    `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.sparkle}</svg>`;

  const head = (s, extra = '') => `
    <header class="sec-head ${extra}">
      ${s.eyebrow ? `<p class="eyebrow" data-reveal>${esc(s.eyebrow)}</p>` : ''}
      ${s.title ? `<h2 class="display split">${rich(s.title)}</h2>` : ''}
    </header>`;

  const counter = (value, prefix = '', suffix = '') => {
    const dec = typeof value === 'number' ? 0 : decimals(value);
    return `<span class="count" data-count="${num(value)}" data-dec="${dec}" data-prefix="${esc(prefix)}" data-suffix="${esc(suffix)}">${esc(prefix)}${fmt(num(value), dec)}${esc(suffix)}</span>`;
  };

  /* ---------------------------------------------------------------- renderers */

  const SPLIT_COLORS = ['var(--navy)', 'var(--sky)', '#b7c6ea', '#dfe6f6'];
  const SPLIT_TEXT = ['#fff', '#fff', '#111', '#111'];

  const R = {};

  R.cover = (s, c) => `
    ${s.image ? `<div class="cover-bg"><div class="cover-media">${media(s.image, s.title)}</div></div>` : ''}
    ${s.factory !== false && window.MFC_FACTORY ? `<div class="cover-art">${window.MFC_FACTORY}</div>` : ''}
    <div class="cover-logos" data-reveal>
      ${c.logos.secondary ? `<img src="${esc(asset(c.logos.secondary))}" alt="Magus" class="logo-invert">` : ''}
      ${c.logos.secondary && c.logos.primary ? '<span class="logo-divider"></span>' : ''}
      ${c.logos.primary ? `<img src="${esc(asset(c.logos.primary))}" alt="Magus Fashion City" class="logo-invert">` : ''}
    </div>
    <div class="slide-inner cover-inner">
      ${s.eyebrow ? `<p class="eyebrow" data-reveal>${esc(s.eyebrow)}</p>` : ''}
      <h1 class="display display--xl split">${rich(s.title)}</h1>
      ${s.subtitle ? `<p class="lede" data-reveal>${rich(s.subtitle)}</p>` : ''}
    </div>
    <div class="cover-foot" data-reveal>
      <span class="cover-by">${esc(s.preparedBy)}</span>
      <span class="scroll-cue"><span class="scroll-cue-line"></span>${esc(s.scrollHint || 'Scroll')}</span>
    </div>`;

  R.intro = (s) => `
    <div class="slide-inner intro-grid">
      <div class="intro-copy">
        ${head(s)}
        ${s.body ? `<p class="body-lg" data-reveal>${rich(s.body)}</p>` : ''}
        <div class="stats">
          ${list(s.stats)
            .map(
              (st) => `
            <div class="stat" data-reveal>
              <div class="stat-value">${counter(st.value, st.prefix, st.suffix)}</div>
              <div class="stat-label">${esc(st.label)}</div>
            </div>`
            )
            .join('')}
        </div>
      </div>
      <figure class="intro-figure">
        <div class="clip-reveal tall">${media(s.image, s.title)}</div>
        ${s.imageCaption ? `<figcaption class="caption">${esc(s.imageCaption)}</figcaption>` : ''}
      </figure>
    </div>`;

  R.chapter = (s) => `
    ${s.machine !== false ? `<div class="chapter-art">${(s.art === 'embroidery' ? window.MFC_EMBROIDERY : window.MFC_SEWING_MACHINE) || ''}</div>` : ''}
    <div class="chapter-bg" data-parallax="0.3">${s.image ? media(s.image, s.title) : ''}</div>
    <div class="slide-inner chapter-inner">
      ${s.eyebrow || s.number ? `<p class="eyebrow" data-reveal>${esc([s.number, s.eyebrow].filter(Boolean).join(' · '))}</p>` : ''}
      <h2 class="display display--xl split">${rich(s.title)}</h2>
      ${s.subtitle ? `<p class="lede" data-reveal>${rich(s.subtitle)}</p>` : ''}
    </div>`;

  R.brief = (s) => `
    <div class="slide-inner brief-grid">
      <div class="brief-side">
        ${head(s)}
        ${
          list(s.channels).length
            ? `<div class="chip-row" data-stagger>${list(s.channels).map((ch) => `<span class="chip">${esc(ch)}</span>`).join('')}</div>`
            : ''
        }
        ${s.image ? `<div class="clip-reveal brief-image">${media(s.image, s.title)}</div>` : ''}
      </div>
      <ol class="spec-list">
        ${list(s.items)
          .map(
            (it, i) => `
          <li class="spec" data-reveal>
            <span class="spec-icon">${icon(it.icon)}</span>
            <span class="spec-label"><small>${pad(i + 1)}</small>${esc(it.label)}</span>
            <span class="spec-value">${rich(it.value)}</span>
          </li>`
          )
          .join('')}
      </ol>
    </div>`;

  R.table = (s) => {
    const cols = list(s.columns);
    const rows = list(s.rows);
    const chartCols = list(s.chartColumns).map(Number).filter((n) => n >= 0 && n < cols.length);
    const dataRows = s.highlightLastRow ? rows.slice(0, -1) : rows;
    const palette = SPLIT_COLORS;
    const charts = chartCols
      .map((ci) => {
        const total = dataRows.reduce((a, r) => a + num(r[ci]), 0) || 1;
        return `
        <div class="split-chart" data-reveal>
          <div class="split-chart-head"><span>${esc(cols[ci])}</span><span>${s.chartTitle ? esc(s.chartTitle) : 'Share'}</span></div>
          <div class="split-bar">
            ${dataRows
              .map((r, i) => {
                const pct = (num(r[ci]) / total) * 100;
                return `<span class="split-seg${pct < 22 ? ' is-narrow' : ''}" title="${esc(r[0])}: ${esc(r[ci])}" style="--w:${pct.toFixed(2)}%;--c:${palette[i % palette.length]};--t:${SPLIT_TEXT[i % palette.length]}"><b>${esc(r[0])}</b><i>${Math.round(pct)}%</i></span>`;
              })
              .join('')}
          </div>
          <div class="split-legend">${dataRows
            .map((r, i) => `<span><i style="background:${palette[i % palette.length]}"></i>${esc(r[0])} · ${esc(r[ci])}</span>`)
            .join('')}</div>
        </div>`;
      })
      .join('');
    return `
    <div class="slide-inner">
      <div class="table-head">
        ${head(s)}
        ${s.intro ? `<p class="body-lg" data-reveal>${rich(s.intro)}</p>` : ''}
      </div>
      <div class="plan-table-wrap${s.dense ? ' plan-table-wrap--dense' : ''}" data-reveal>
        <table class="plan-table${s.dense ? ' plan-table--dense' : ''}">
          <thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>
          <tbody>
            ${rows
              .map(
                (r, ri) => `
              <tr class="${s.highlightLastRow && ri === rows.length - 1 ? 'is-total' : ''}">
                ${cols.map((c, ci) => `<td data-label="${esc(c)}"${/^[\s₹\d.,%-]+$/.test(r[ci] || '') ? ' class="num"' : ''}>${esc(r[ci] ?? '')}</td>`).join('')}
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>
      ${charts ? `<div class="split-charts">${charts}</div>` : ''}
      ${
        s.image
          ? `<figure class="table-image"><div class="clip-reveal">${media(s.image, s.imageCaption)}</div>${
              s.imageCaption ? `<figcaption class="caption">${esc(s.imageCaption)}</figcaption>` : ''
            }</figure>`
          : ''
      }
    </div>`;
  };

  R.channel = (s) => {
    const ap = s.adPreview || {};
    return `
    <div class="slide-inner">
      <div class="channel-top">
        <div>
          ${head(s)}
          ${s.lede ? `<p class="body-lg" data-reveal>${rich(s.lede)}</p>` : ''}
        </div>
        <div class="metric-row">
          ${list(s.metrics)
            .map(
              (m) => `
            <div class="metric" data-reveal>
              <span class="metric-label">${esc(m.label)}</span>
              <span class="metric-value">${counter(m.value, m.prefix, m.suffix)}</span>
            </div>`
            )
            .join('')}
        </div>
      </div>
      <div class="channel-body">
        <dl class="detail-list">
          ${list(s.details)
            .map(
              (d) => `
            <div class="detail" data-reveal>
              <dt>${esc(d.label)}</dt>
              <dd>${
                d.style === 'chips'
                  ? `<div class="chip-row" data-stagger>${csv(d.value).map((v) => `<span class="chip">${esc(v)}</span>`).join('')}</div>`
                  : d.style === 'tiles'
                  ? `<div class="tile-grid" data-stagger>${csv(d.value)
                      .map((v) => {
                        const m = v.match(/^(.*?)\s*\((.*)\)\s*$/);
                        const name = m ? m[1] : v;
                        return `<span class="tile"><b>${esc(name)}</b>${m ? `<small>${esc(m[2])}</small>` : ''}</span>`;
                      })
                      .join('')}</div>`
                  : `<span class="detail-text">${rich(d.value)}</span>`
              }</dd>
            </div>`
            )
            .join('')}
          ${
            list(s.textAds).length
              ? `<div class="detail" data-reveal><dt>Text Ads</dt><dd><ul class="tick-list">${list(s.textAds)
                  .map((t) => `<li>${icon('check')}<span>${rich(t)}</span></li>`)
                  .join('')}</ul></dd></div>`
              : ''
          }
        </dl>
        ${
          ap.enabled
            ? `<div class="serp" data-reveal>
            <div class="serp-bar">${icon('search')}<span>${esc(ap.headline ? plain(ap.headline).split('|')[0].trim().toLowerCase() : '')}</span></div>
            <div class="serp-result">
              <div class="serp-sponsored">Sponsored</div>
              <div class="serp-site"><span class="serp-fav"></span><span>${esc(ap.url)}</span></div>
              <div class="serp-title">${esc(ap.headline)}</div>
              <p class="serp-desc">${esc(ap.description)}</p>
              <div class="serp-links">${list(ap.sitelinks).map((l) => `<span>${esc(l)}</span>`).join('')}</div>
            </div>
            <p class="serp-note">Illustrative search ad preview</p>
          </div>`
            : ''
        }
      </div>
      ${
        list(s.creatives).length
          ? `<div class="creatives">
          <div class="creatives-head"><p class="eyebrow" data-reveal>${esc(s.creativesTitle || 'Ad creatives')}</p><span class="creatives-count">${pad(
              list(s.creatives).length
            )} formats</span></div>
          <div class="creative-row">
            ${list(s.creatives)
              .map(
                (cr, i) => `
              <article class="creative" data-creative>
                <div class="creative-frame">
                  ${media(cr.image, cr.title)}
                  <span class="badge ${String(cr.format).toLowerCase() === 'video' ? 'badge--video' : ''}">${
                  String(cr.format).toLowerCase() === 'video' ? icon('play') : icon('layers')
                }${esc(cr.format)}</span>
                </div>
                <h3 class="creative-title"><small>${pad(i + 1)}</small>${esc(cr.title)}</h3>
              </article>`
              )
              .join('')}
          </div>
        </div>`
          : ''
      }
    </div>`;
  };

  R.keywords = (s) => {
    const kws = list(s.keywords);
    return `
    <div class="slide-inner">
      <div class="kw-head">
        ${head(s)}
        ${s.intro ? `<p class="body-lg" data-reveal>${rich(s.intro)}</p>` : ''}
      </div>
      <ol class="kw-list" data-stagger>
        ${kws.map((k, i) => `<li><small>${pad(i + 1)}</small><span>${esc(k)}</span></li>`).join('')}
      </ol>
    </div>`;
  };

  R.results = (s, c) => {
    const cur = c.currency;
    const ch = list(s.channels).map((x) => ({ name: x.name, spend: num(x.spend), leads: num(x.leads) }));
    ch.forEach((x) => (x.cpl = x.leads ? x.spend / x.leads : 0));
    const totSpend = ch.reduce((a, x) => a + x.spend, 0);
    const totLeads = ch.reduce((a, x) => a + x.leads, 0);
    const blended = totLeads ? totSpend / totLeads : 0;
    const budget = num(s.totalBudget);
    const used = budget ? Math.min(100, (totSpend / budget) * 100) : 0;
    const metrics = [
      { key: 'spend', label: 'Spends', pre: cur },
      { key: 'leads', label: 'Leads', pre: '' },
      { key: 'cpl', label: 'Cost per lead', pre: cur }
    ];
    const R2 = 52;
    const circ = 2 * Math.PI * R2;
    return `
    <div class="slide-inner">
      ${head(s)}
      <div class="results-grid">
        <div class="results-summary">
          <div class="ring" data-reveal>
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle cx="60" cy="60" r="${R2}" class="ring-bg"/>
              <circle cx="60" cy="60" r="${R2}" class="ring-fg" style="--circ:${circ.toFixed(1)};--off:${(circ * (1 - used / 100)).toFixed(1)}"/>
            </svg>
            <div class="ring-label"><strong>${counter(used.toFixed(0), '', '%')}</strong><span>of budget deployed</span></div>
          </div>
          <div class="summary-list">
            <div class="summary" data-reveal><span>Total spends</span><strong>${counter(totSpend, cur)}</strong></div>
            <div class="summary" data-reveal><span>Total leads</span><strong>${counter(totLeads)}</strong></div>
            <div class="summary" data-reveal><span>Blended CPL</span><strong>${counter(blended, cur)}</strong></div>
          </div>
        </div>
        <div class="compare">
          <div class="compare-legend" data-reveal>${ch
            .map((x, i) => `<span><i class="dot dot--${i % 3}"></i>${esc(x.name)}</span>`)
            .join('')}</div>
          ${metrics
            .map((m) => {
              const max = Math.max(...ch.map((x) => x[m.key]), 1);
              return `
            <div class="compare-group" data-reveal>
              <p class="compare-label">${esc(m.label)}</p>
              ${ch
                .map(
                  (x, i) => `
                <div class="bar-line">
                  <span class="bar-name">${esc(x.name)}</span>
                  <span class="bar"><span class="bar-fill bar-fill--${i % 3}" style="--w:${((x[m.key] / max) * 100).toFixed(1)}%"></span></span>
                  <span class="bar-val">${esc(m.pre)}${fmt(x[m.key])}</span>
                </div>`
                )
                .join('')}
            </div>`;
            })
            .join('')}
        </div>
      </div>
      ${
        list(s.insights).length
          ? `<ul class="insights">${list(s.insights)
              .map((t, i) => `<li data-reveal><small>${pad(i + 1)}</small><p>${rich(t)}</p></li>`)
              .join('')}</ul>`
          : ''
      }
    </div>`;
  };

  R.totals = (s, c) => {
    const split = list(s.split).map((x) => ({ label: x.label, value: num(x.value) }));
    const total = split.reduce((a, x) => a + x.value, 0) || 1;
    return `
    <div class="slide-inner">
      <div class="table-head">
        ${head(s)}
        ${s.intro ? `<p class="body-lg" data-reveal>${rich(s.intro)}</p>` : ''}
      </div>
      <div class="totals-grid" style="--n:${list(s.metrics).length || 1}">
        ${list(s.metrics)
          .map(
            (m) => `
          <div class="total-tile" data-reveal>
            <span class="metric-label">${esc(m.label)}</span>
            <span class="total-value">${counter(m.value, m.prefix, m.suffix)}</span>
            ${m.note ? `<span class="total-note">${rich(m.note)}</span>` : ''}
          </div>`
          )
          .join('')}
      </div>
      ${
        split.length
          ? `<div class="split-chart totals-split" data-reveal>
          <div class="split-chart-head"><span>${esc(s.splitTitle || 'Split')}</span><span>Share</span></div>
          <div class="split-bar">${split
            .map((x, i) => {
              const pct = (x.value / total) * 100;
              return `<span class="split-seg" style="--w:${pct.toFixed(2)}%;--c:${SPLIT_COLORS[i % 4]};--t:${SPLIT_TEXT[i % 4]}"><b>${esc(
                x.label
              )} · ${esc(c.currency)}${fmt(x.value)}</b><i>${Math.round(pct)}%</i></span>`;
            })
            .join('')}</div>
        </div>`
          : ''
      }
    </div>`;
  };

  R.strategy = (s) => {
    const pts = list(s.points);
    const L = s.labels || {};
    return `
    <div class="slide-inner strategy-intro">
      ${head(s)}
    </div>
    <div class="hz-pin">
      <div class="hz-progress"><span class="hz-progress-count"><b>01</b> / ${pad(pts.length)}</span><span class="hz-progress-bar"><i></i></span></div>
      <div class="hz-track">
        ${pts
          .map(
            (p, i) => `
          <article class="point" data-index="${i}">
            <div class="point-media">
              <div class="point-media-inner">${media(p.image, p.title)}</div>
            </div>
            <div class="point-copy">
              <p class="eyebrow">Point ${pad(i + 1)} of ${pad(pts.length)}</p>
              <h3 class="point-title">${rich(p.title)}</h3>
              <div class="point-cols">
                <div class="point-block"><h4>${esc(L.what || 'What I would do')}</h4><p>${rich(p.what)}</p></div>
                <div class="point-block"><h4>${esc(L.why || 'Why it would work')}</h4><p>${rich(p.why)}</p></div>
                <div class="point-block point-block--accent"><h4>${esc(L.content || 'Content I would create')}</h4>
                  <ul>${list(p.content).map((t) => `<li>${rich(t)}</li>`).join('')}</ul></div>
              </div>
            </div>
          </article>`
          )
          .join('')}
      </div>
    </div>`;
  };

  const insightCards = (items, start = 0) =>
    list(items)
      .map(
        (it, i) => `
      <article class="insight${it.wide ? ' insight--wide' : ''}" data-insight>
        ${it.tag ? `<span class="insight-tag">${esc(it.tag)}</span>` : ''}
        <div class="insight-top"><span class="insight-icon">${icon(it.icon)}</span><span class="insight-num">${pad(start + i + 1)}</span></div>
        <h3>${rich(it.title)}</h3>
        ${it.text ? `<p>${rich(it.text)}</p>` : ''}
        ${csv(it.chips).length ? `<div class="chip-row">${csv(it.chips).map((x) => `<span class="chip">${esc(x)}</span>`).join('')}</div>` : ''}
      </article>`
      )
      .join('');

  R.insights = (s) => `
    <div class="slide-inner">
      <div class="table-head">
        ${head(s)}
        ${s.intro ? `<p class="body-lg" data-reveal>${rich(s.intro)}</p>` : ''}
      </div>
      <div class="insight-grid">${insightCards(s.items)}</div>
      ${
        list(s.ideas).length
          ? `<div class="insights-sub" data-reveal><h3>${rich(s.ideasTitle || 'More ideas')}</h3>${s.ideasIntro ? `<p>${rich(s.ideasIntro)}</p>` : ''}</div>
        <div class="insight-grid">${insightCards(s.ideas, list(s.items).length)}</div>`
          : ''
      }
    </div>`;

  R.kpis = (s) => {
    const items = list(s.items);
    const n = items.length || 1;
    return `
    <div class="slide-inner">
      ${head(s)}
      <div class="kpi-grid" style="--n:${n}">
        ${items
          .map(
            (it, i) => `
          <div class="kpi" data-reveal>
            <span class="kpi-num">${pad(i + 1)}</span>
            <h3 class="kpi-label">${esc(it.label)}</h3>
            <p>${rich(it.text)}</p>
          </div>`
          )
          .join('')}
      </div>
    </div>`;
  };

  R.closing = (s, c) => `
    <div class="closing-bg" data-parallax="0.2">${s.image ? media(s.image, s.title) : ''}</div>
    <div class="slide-inner closing-inner">
      ${s.eyebrow ? `<p class="eyebrow" data-reveal>${esc(s.eyebrow)}</p>` : ''}
      <h2 class="display display--xxl split">${rich(s.title)}</h2>
      ${s.subtitle ? `<p class="lede" data-reveal>${rich(s.subtitle)}</p>` : ''}
      <div class="closing-logos" data-stagger>
        ${['secondary', 'primary', 'presenter']
          .filter((k) => c.logos[k])
          .map((k) => `<img src="${esc(asset(c.logos[k]))}" alt="${k} logo" class="logo--${k}">`)
          .join('')}
      </div>
      ${list(s.contactLines).length ? `<p class="closing-contact" data-reveal>${list(s.contactLines).map(esc).join('<span>·</span>')}</p>` : ''}
    </div>`;

  /* ------------------------------------------------------------------- render */

  function applySettings(st) {
    const t = st.theme || {};
    const root = document.documentElement.style;
    const map = { ink: '--ink', navy: '--navy', sky: '--sky', ivory: '--ivory', accent: '--accent' };
    Object.entries(map).forEach(([k, v]) => (t[k] ? root.setProperty(v, t[k]) : root.removeProperty(v)));
    if (st.siteTitle) document.title = st.siteTitle;
    const meta = document.querySelector('meta[name="description"]');
    if (meta && st.metaDescription) meta.setAttribute('content', st.metaDescription);
    const logo = document.querySelector('.brand-logo');
    if (logo) {
      logo.src = asset(st.logos && st.logos.primary);
      logo.hidden = !(st.logos && st.logos.primary);
    }
    const loaderLogo = document.querySelector('.loader-logo');
    if (loaderLogo && st.logos && st.logos.primary) loaderLogo.src = st.logos.primary;
    const presenter = document.querySelector('.topbar-presenter');
    if (presenter) presenter.textContent = st.presenter && st.presenter.name ? st.presenter.name : '';
  }

  function render(content) {
    const st = content.settings || {};
    const ctx = { logos: st.logos || {}, currency: st.currencySymbol || '₹' };
    const sections = list(content.sections).filter((s) => s.enabled !== false && R[s.type]);
    deck.innerHTML = sections
      .map(
        (s, i) => `
      <section class="slide slide--${s.type}" id="${esc(s.id)}" data-theme="${s.theme === 'dark' ? 'dark' : 'light'}" data-label="${esc(
          s.navLabel || plain(s.title)
        )}" data-n="${i + 1}">
        ${R[s.type](s, ctx)}
      </section>`
      )
      .join('');

    // chapter index overlay + side thread
    const navItems = sections.map((s, i) => ({ id: s.id, label: s.navLabel || plain(s.title), n: i + 1 }));
    document.getElementById('indexList').innerHTML = navItems
      .map((it) => `<li><a href="#${esc(it.id)}" data-goto="${esc(it.id)}"><small>${pad(it.n)}</small><span>${esc(it.label)}</span></a></li>`)
      .join('');
    const dots = document.getElementById('threadDots');
    if (dots) dots.innerHTML = navItems
      .map(
        (it, i) =>
          `<button class="thread-dot" style="--p:${navItems.length > 1 ? (i / (navItems.length - 1)) * 100 : 0}%" data-goto="${esc(
            it.id
          )}" aria-label="${esc(it.label)}"><span>${esc(it.label)}</span></button>`
      )
      .join('');
    document.querySelector('.topbar-total').textContent = pad(navItems.length);
    document.body.classList.toggle('no-hint', st.showKeyboardHint === false);
  }

  /* ------------------------------------------------------------------- motion */

  function splitWords(el) {
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) frag.appendChild(document.createTextNode(' '));
            else {
              const w = document.createElement('span');
              w.className = 'w';
              const inner = document.createElement('span');
              inner.className = 'wi';
              inner.textContent = p;
              w.appendChild(inner);
              frag.appendChild(w);
            }
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') walk(child);
      });
    };
    walk(el);
  }

  function setupSmoothScroll() {
    if (REDUCED || typeof Lenis === 'undefined') return null;
    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (t) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    state.cleanups.push(() => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    });
    return lenis;
  }

  function animateCount(el) {
    const end = parseFloat(el.dataset.count) || 0;
    const pre = el.dataset.prefix || '';
    const suf = el.dataset.suffix || '';
    const dec = Number(el.dataset.dec) || 0;
    const obj = { v: 0 };
    gsap.to(obj, {
      v: end,
      duration: 1.8,
      ease: 'power3.out',
      onUpdate: () => (el.textContent = pre + fmt(obj.v, dec) + suf),
      scrollTrigger: { trigger: el, start: 'top 90%', once: true }
    });
  }

  function setupMotion() {
    gsap.registerPlugin(ScrollTrigger);
    const slides = [...deck.querySelectorAll('.slide')];

    document.querySelectorAll('.split').forEach(splitWords);

    if (!REDUCED) {
      // headings: words rise out of a mask
      deck.querySelectorAll('.split').forEach((h) => {
        const isCover = h.closest('.slide--cover');
        gsap.from(h.querySelectorAll('.wi'), {
          yPercent: 115,
          rotate: 4,
          duration: 1.15,
          ease: 'expo.out',
          stagger: 0.06,
          delay: isCover ? 0.25 : 0,
          scrollTrigger: isCover ? null : { trigger: h, start: 'top 86%' }
        });
      });

      // single elements fade up
      deck.querySelectorAll('[data-reveal]').forEach((el) => {
        if (el.closest('.point')) return;
        const inCover = el.closest('.slide--cover');
        gsap.from(el, {
          y: 36,
          autoAlpha: 0,
          duration: 1.1,
          ease: 'power3.out',
          delay: inCover ? 0.7 : 0,
          scrollTrigger: inCover ? null : { trigger: el, start: 'top 90%' }
        });
      });

      // groups fade up one after another
      deck.querySelectorAll('[data-stagger]').forEach((g) => {
        gsap.from(g.children, {
          y: 22,
          autoAlpha: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.05,
          scrollTrigger: { trigger: g, start: 'top 88%' }
        });
      });

      // images wipe open
      deck.querySelectorAll('.clip-reveal').forEach((wrap) => {
        const m = wrap.querySelector('.media');
        const tl = gsap.timeline({ scrollTrigger: { trigger: wrap, start: 'top 85%' } });
        tl.fromTo(wrap, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' });
        if (m) tl.from(m, { scale: 1.3, duration: 1.8, ease: 'expo.out' }, 0.2);
      });

      // slow parallax on background images
      deck.querySelectorAll('[data-parallax]').forEach((el) => {
        const amt = parseFloat(el.dataset.parallax) || 0.2;
        gsap.fromTo(
          el,
          { yPercent: -amt * 40 },
          { yPercent: amt * 40, ease: 'none', scrollTrigger: { trigger: el.closest('.slide'), start: 'top bottom', end: 'bottom top', scrub: true } }
        );
      });

      // cover: the skyline settles while the title lifts away
      const cover = deck.querySelector('.slide--cover');
      if (cover) {
        gsap.to(cover.querySelector('.cover-inner'), {
          yPercent: -18,
          autoAlpha: 0.15,
          ease: 'none',
          scrollTrigger: { trigger: cover, start: 'top top', end: 'bottom top', scrub: true }
        });
      }

      // creatives cascade in with a slight lift and tilt
      deck.querySelectorAll('.creative-row').forEach((row) => {
        gsap.from(row.querySelectorAll('[data-creative]'), {
          y: 80,
          autoAlpha: 0,
          duration: 1.2,
          ease: 'expo.out',
          stagger: 0.09,
          scrollTrigger: { trigger: row, start: 'top 85%' }
        });
      });

      // insight cards rise in a cascade
      deck.querySelectorAll('.insight-grid').forEach((grid) => {
        gsap.from(grid.querySelectorAll('[data-insight]'), {
          y: 60,
          autoAlpha: 0,
          duration: 1.1,
          ease: 'expo.out',
          stagger: 0.08,
          scrollTrigger: { trigger: grid, start: 'top 85%' }
        });
      });

      // table rows
      deck.querySelectorAll('.plan-table tbody tr').forEach((tr, i) => {
        gsap.from(tr, { x: -30, autoAlpha: 0, duration: 0.9, ease: 'power3.out', delay: i * 0.08, scrollTrigger: { trigger: tr.closest('table'), start: 'top 80%' } });
      });
    }

    // bars, split charts and rings animate via a class toggle
    deck.querySelectorAll('.split-bar, .compare-group, .ring').forEach((el) => {
      ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => el.classList.add('is-in') });
    });

    deck.querySelectorAll('.count').forEach((el) => (REDUCED ? null : animateCount(el)));

    setupStrategy();

    // header + thread react to the slide in view
    slides.forEach((sl, i) => {
      ScrollTrigger.create({
        trigger: sl,
        start: 'top 45%',
        end: 'bottom 45%',
        onToggle: (self) => self.isActive && setActive(sl, i)
      });
    });
    if (slides[0]) setActive(slides[0], 0);

    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        document.documentElement.style.setProperty('--progress', self.progress.toFixed(4));
        updateTailor(self.progress);
      }
    });
  }

  // the right-hand thread: first 75% of the deck runs the thread down, the rest stitches the shirt
  const tailor = {
    el: document.querySelector('.tailor'),
    thread: document.querySelector('.tailor-thread'),
    shirt: document.querySelector('.tailor-shirt'),
    needle: document.querySelector('.tailor-needle')
  };
  function updateTailor(p) {
    if (!tailor.el) return;
    const t1 = Math.min(1, p / 0.75);
    const t2 = Math.max(0, Math.min(1, (p - 0.75) / 0.22));
    tailor.thread.style.strokeDashoffset = (1.05 * (1 - t1)).toFixed(4);
    tailor.shirt.style.strokeDashoffset = (1.05 * (1 - t2)).toFixed(4);
    tailor.needle.setAttribute('transform', `translate(0 ${(20 + 306 * t1).toFixed(1)})`);
    tailor.el.classList.toggle('is-done', p > 0.985);
  }

  function setActive(sl, i) {
    document.body.dataset.theme = sl.classList.contains('slide--strategy') && state.pinDark ? 'dark' : sl.dataset.theme;
    document.body.classList.toggle('at-start', i === 0 && sl.classList.contains('slide--cover'));
    document.querySelector('.topbar-index').textContent = pad(i + 1);
    const name = document.querySelector('.topbar-name');
    if (name.textContent !== sl.dataset.label) {
      name.textContent = sl.dataset.label;
      if (!REDUCED) gsap.fromTo(name, { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out' });
    }
    document.querySelectorAll('.thread-dot').forEach((d, j) => d.classList.toggle('is-active', j === i));
    document.querySelectorAll('#indexList a').forEach((a, j) => a.classList.toggle('is-active', j === i));
    if (!IS_PREVIEW && sl.id && history.replaceState) history.replaceState(null, '', '#' + sl.id);
  }

  /* strategy: pinned horizontal gallery on wide screens, stacked cards on small ones */
  function setupStrategy() {
    const sec = deck.querySelector('.slide--strategy');
    if (!sec) return;
    const pin = sec.querySelector('.hz-pin');
    const track = sec.querySelector('.hz-track');
    const points = [...track.querySelectorAll('.point')];
    const countEl = sec.querySelector('.hz-progress-count b');
    const barEl = sec.querySelector('.hz-progress-bar i');

    state.mm = gsap.matchMedia();
    state.mm.add('(min-width: 901px)', () => {
      const dist = () => Math.max(0, track.scrollWidth - pin.clientWidth);
      const tween = gsap.to(track, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: {
          trigger: pin,
          pin: true,
          scrub: 0.8,
          start: 'top top',
          end: () => '+=' + dist(),
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const idx = Math.min(points.length - 1, Math.round(self.progress * (points.length - 1)));
            countEl.textContent = pad(idx + 1);
            barEl.style.transform = `scaleX(${self.progress})`;
            points.forEach((p, j) => p.classList.toggle('is-current', j === idx));
          }
        }
      });
      state.hzTweens = [{ tween, points, dist, pin }];
      ScrollTrigger.create({
        trigger: pin,
        start: 'top 45%',
        end: () => 'bottom+=' + dist() + ' 45%',
        onToggle: (self) => {
          state.pinDark = self.isActive;
          document.body.dataset.theme = self.isActive ? 'dark' : sec.dataset.theme;
        }
      });

      if (!REDUCED) {
        points.forEach((p) => {
          const st = { trigger: p, containerAnimation: tween, start: 'left 85%', end: 'left 25%', scrub: true };
          gsap.fromTo(p.querySelector('.point-media-inner .media'), { scale: 1.25, xPercent: -6 }, { scale: 1, xPercent: 0, ease: 'none', scrollTrigger: st });
          gsap.from(p.querySelectorAll('.point-copy > *, .point-block'), {
            y: 30,
            autoAlpha: 0,
            stagger: 0.06,
            ease: 'power2.out',
            scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left 75%', end: 'left 40%', scrub: true }
          });
        });
      }
      return () => {
        state.hzTweens = [];
        state.pinDark = false;
      };
    });
    state.mm.add('(max-width: 900px)', () => {
      points.forEach((p) => {
        if (REDUCED) return;
        gsap.from(p, { y: 50, autoAlpha: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: p, start: 'top 85%' } });
      });
    });

    sec.querySelectorAll('[data-point]').forEach((b) => b.addEventListener('click', () => goToPoint(Number(b.dataset.point))));
  }

  function pointPosition(i) {
    const h = state.hzTweens[0];
    if (!h) {
      const p = deck.querySelectorAll('.point')[i];
      return p ? p.getBoundingClientRect().top + window.scrollY - 80 : null;
    }
    const st = h.tween.scrollTrigger;
    const first = h.points[0].offsetLeft;
    const d = h.dist() || 1;
    const x = Math.min(d, h.points[i].offsetLeft - first);
    return st.start + (x / d) * (st.end - st.start);
  }

  function goToPoint(i) {
    const y = pointPosition(i);
    if (y != null) scrollToY(y);
  }

  /* --------------------------------------------------------------- navigation */

  function scrollToY(y, immediate) {
    if (state.lenis) state.lenis.scrollTo(y, { immediate: !!immediate, duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4), force: true });
    else window.scrollTo({ top: y, behavior: immediate || REDUCED ? 'auto' : 'smooth' });
  }

  function sectionTop(el) {
    return el.getBoundingClientRect().top + window.scrollY;
  }

  function goToId(id, immediate) {
    const el = document.getElementById(id);
    if (el) scrollToY(sectionTop(el), immediate);
    closeIndex();
  }

  // Every section is a stop; each strategy point is a stop too, so the arrow keys step through them.
  function stops() {
    const out = [];
    deck.querySelectorAll('.slide').forEach((sl) => {
      out.push(Math.round(sectionTop(sl)));
      if (sl.classList.contains('slide--strategy')) {
        sl.querySelectorAll('.point').forEach((_, i) => {
          const y = pointPosition(i);
          if (y != null) out.push(Math.round(y));
        });
      }
    });
    return [...new Set(out)].sort((a, b) => a - b);
  }

  function step(dir) {
    const y = state.lenis ? state.lenis.targetScroll : window.scrollY;
    const all = stops();
    const target = dir > 0 ? all.find((s) => s > y + 4) : [...all].reverse().find((s) => s < y - 4);
    if (target != null) scrollToY(target);
    else if (dir > 0) scrollToY(document.documentElement.scrollHeight);
  }

  function openIndex() {
    document.body.classList.add('index-open');
  }
  function closeIndex() {
    document.body.classList.remove('index-open');
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  function bindUI() {
    document.addEventListener('click', (e) => {
      const go = e.target.closest('[data-goto]');
      if (go) {
        e.preventDefault();
        goToId(go.dataset.goto);
      }
    });
    document.getElementById('indexBtn').addEventListener('click', () =>
      document.body.classList.contains('index-open') ? closeIndex() : openIndex()
    );
    document.getElementById('indexClose').addEventListener('click', closeIndex);
    document.getElementById('fsBtn').addEventListener('click', toggleFullscreen);
    document.querySelector('.brand').addEventListener('click', (e) => {
      e.preventDefault();
      scrollToY(0);
    });

    window.addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea, select, [contenteditable]') || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (k === 'ArrowDown' || k === 'PageDown' || k === 'ArrowRight' || (k === ' ' && !e.shiftKey)) {
        e.preventDefault();
        step(1);
      } else if (k === 'ArrowUp' || k === 'PageUp' || k === 'ArrowLeft' || (k === ' ' && e.shiftKey)) {
        e.preventDefault();
        step(-1);
      } else if (k === 'Home') {
        e.preventDefault();
        scrollToY(0);
      } else if (k === 'End') {
        e.preventDefault();
        scrollToY(document.documentElement.scrollHeight);
      } else if (k === 'f' || k === 'F') toggleFullscreen();
      else if (k === 'i' || k === 'I' || k === 'm' || k === 'M') {
        document.body.classList.contains('index-open') ? closeIndex() : openIndex();
      } else if (k === 'Escape') closeIndex();
      document.body.classList.add('hint-dismissed');
    });
  }

  /* ---------------------------------------------------------------- lifecycle */

  function teardown() {
    state.cleanups.forEach((fn) => fn());
    state.cleanups = [];
    if (state.mm) state.mm.revert();
    ScrollTrigger.getAll().forEach((t) => t.kill());
    gsap.globalTimeline.clear();
    state.lenis = null;
  }

  function waitForImages() {
    const imgs = [...deck.querySelectorAll('img')].slice(0, 6);
    return Promise.race([
      Promise.all(imgs.map((im) => (im.complete ? 1 : new Promise((r) => ((im.onload = r), (im.onerror = r)))))),
      new Promise((r) => setTimeout(r, 1800))
    ]);
  }

  async function boot(content, { keepScroll = false, focus = null } = {}) {
    const y = window.scrollY;
    teardown();
    state.content = content;
    applySettings(content.settings || {});
    render(content);
    state.lenis = setupSmoothScroll();
    setupMotion();
    await (document.fonts ? document.fonts.ready : Promise.resolve());
    ScrollTrigger.refresh();
    if (focus) goToId(focus, true);
    else if (keepScroll) scrollToY(y, true);
  }

  async function loadContent() {
    for (const url of ['/api/content', 'api/content', 'content.json']) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) return await res.json();
      } catch (e) {
        /* try the next source */
      }
    }
    throw new Error('Could not load presentation content.');
  }

  async function start() {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    bindUI();
    let content;
    try {
      content = await loadContent();
    } catch (e) {
      deck.innerHTML = `<section class="slide" data-theme="light"><div class="slide-inner"><h2 class="display">Content could not be loaded.</h2><p class="body-lg">Start the server with <code>npm start</code>.</p></div></section>`;
      document.body.classList.remove('is-loading');
      return;
    }
    const showLoader = !IS_PREVIEW && content.settings && content.settings.showIntroLoader !== false;
    const hash = decodeURIComponent((location.hash || '').slice(1)) || params.get('section');
    applySettings(content.settings || {});
    render(content);
    if (showLoader) {
      // wait for "Start Stitching", then let the shirt and trousers finish (about 3.2 s) and hold 1.5 s
      const btn = document.getElementById('startBtn');
      document.body.classList.add('is-waiting');
      btn.focus();
      await new Promise((resolve) => btn.addEventListener('click', resolve, { once: true }));
      document.body.classList.remove('is-waiting');
      document.body.classList.add('is-stitching');
      await Promise.all([waitForImages(), new Promise((r) => setTimeout(r, REDUCED ? 0 : 4700))]);
    } else {
      await waitForImages();
    }
    document.body.classList.remove('is-loading');
    document.body.classList.add('is-ready');
    deck.innerHTML = '';
    await boot(content, { focus: hash || null });

    // live preview from the admin panel (same origin only)
    window.addEventListener('message', (e) => {
      if (e.origin !== location.origin || !e.data || e.data.type !== 'mfc:preview') return;
      state.uploadsBase = e.data.uploadsBase || null;
      boot(e.data.content, { keepScroll: !e.data.focus, focus: e.data.focus || null });
    });
    if (IS_PREVIEW && window.parent !== window) window.parent.postMessage({ type: 'mfc:ready' }, location.origin);

    let rt;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => ScrollTrigger.refresh(), 200);
    });
  }

  start();
})();
