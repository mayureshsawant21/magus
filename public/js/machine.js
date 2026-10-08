/* Animated sewing machine for the chapter divider slides.
   Line art in white and light blue so it sits on the solid blue slide; the
   motion (needle, handwheel, spool, thread and fabric feed) is pure CSS, see
   .sew-* in style.css. */
window.MFC_SEWING_MACHINE = `
<svg class="sew" viewBox="0 0 640 440" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <!-- thread spool on the top of the arm -->
  <g class="sew-spool-group">
    <path class="sew-line" d="M452 108 V86" stroke-width="3"/>
    <rect class="sew-fill sew-line" x="436" y="58" width="32" height="30" rx="4" stroke-width="2.5"/>
    <g class="sew-spool">
      <path class="sew-soft" d="M436 66 H468 M436 73 H468 M436 80 H468" stroke-width="1.6"/>
    </g>
    <path class="sew-line" d="M430 58 H474 M430 88 H474" stroke-width="3"/>
  </g>

  <!-- thread: spool -> tension dial -> take-up lever -> needle -->
  <path class="sew-thread" d="M452 58 C 452 30, 300 34, 230 66 S 168 112, 172 150 L 172 196 L 166 300" stroke-width="1.8"/>

  <!-- machine body: base, pillar, arm and head -->
  <path class="sew-fill sew-line" d="M150 284 V150 Q150 112 188 112 H500 Q538 112 538 150 V352 H452 V206 Q452 192 438 192 H236 Q222 192 222 206 V284 Z" stroke-width="3"/>
  <path class="sew-soft" d="M188 132 H480 M236 176 H438" stroke-width="1.6"/>
  <rect class="sew-fill sew-line" x="60" y="352" width="540" height="38" rx="8" stroke-width="3"/>
  <path class="sew-soft" d="M84 371 H576" stroke-width="1.4" stroke-dasharray="2 10"/>

  <!-- tension dial and stitch selector -->
  <circle class="sew-line" cx="186" cy="150" r="14" stroke-width="2.5"/>
  <circle class="sew-soft" cx="186" cy="150" r="5" stroke-width="2"/>
  <circle class="sew-line" cx="494" cy="270" r="16" stroke-width="2.5"/>
  <path class="sew-soft" d="M494 258 V270 L503 276" stroke-width="2"/>

  <!-- handwheel on the right side, turning -->
  <g class="sew-wheel">
    <circle class="sew-fill sew-line" cx="566" cy="166" r="40" stroke-width="3"/>
    <circle class="sew-line" cx="566" cy="166" r="10" stroke-width="2.5"/>
    <path class="sew-soft" d="M566 132 V156 M566 176 V200 M532 166 H556 M576 166 H600" stroke-width="2.5"/>
  </g>

  <!-- needle bar, presser foot and needle, moving up and down -->
  <g class="sew-needle">
    <rect class="sew-fill sew-line" x="160" y="284" width="20" height="22" rx="3" stroke-width="2.5"/>
    <path class="sew-line" d="M170 306 V338" stroke-width="2.4"/>
    <circle class="sew-soft" cx="170" cy="331" r="1.6" stroke-width="1.4"/>
  </g>
  <path class="sew-line" d="M146 342 H196" stroke-width="3"/>

  <!-- fabric feeding through with stitches forming behind the needle -->
  <rect class="sew-cloth" x="70" y="344" width="520" height="8" rx="2"/>
  <path class="sew-weave" d="M70 348 H590" stroke-width="8"/>
  <path class="sew-stitch" d="M70 348 H170" stroke-width="2.4"/>
</svg>`;

/* Multi-head embroidery machine for the "Digital Media Plan" divider: a long
   machine seen at an angle, heads shrinking into the distance, with threads
   running from the overhead rack, needles working out of step, the frame
   shifting and status lights blinking. Motion is CSS, see .emb-* in style.css. */
window.MFC_EMBROIDERY = (function () {
  const N = 10;
  const X0 = 70, X1 = 640;
  const topY = (x) => 196 + ((x - X0) / (X1 - X0)) * 24;   // beam top recedes down
  const botY = (x) => 330 - ((x - X0) / (X1 - X0)) * 46;   // beam bottom recedes up
  const rackY = (x) => 66 + ((x - X0) / (X1 - X0)) * 70;
  const f = (n) => Math.round(n * 10) / 10;

  // head positions, closer together as they recede
  const heads = [];
  let x = 96;
  for (let i = 0; i < N; i++) {
    const s = 1 - 0.46 * (i / (N - 1));
    heads.push({ x, s });
    x += 60 * s;
  }

  const cones = heads
    .map(({ x, s }) => [-12, 0, 12]
      .map((dx, k) => {
        const cx = x + dx * s, base = topY(cx) - 2;
        return `<path class="${k === 1 ? 'emb-cone emb-cone--alt' : 'emb-cone'}" d="M${f(cx - 4.5 * s)} ${f(base)} L${f(cx - 2.5 * s)} ${f(base - 20 * s)} H${f(cx + 2.5 * s)} L${f(cx + 4.5 * s)} ${f(base)} Z" stroke-width="1.2"/>`;
      })
      .join(''))
    .join('');

  const threads = heads
    .map(({ x, s }, i) => [-8, -3, 3, 8]
      .map((dx) => `<path class="emb-thread" style="animation-delay:${-(i * 0.13).toFixed(2)}s" d="M${f(x + dx * s * 1.4)} ${f(rackY(x) + 6)} L${f(x + dx * s * 0.6)} ${f(topY(x) - 30 * s)}" stroke-width="${f(1.1 * s + 0.2)}"/>`)
      .join(''))
    .join('');

  const headsSvg = heads
    .map(({ x, s }, i) => {
      const w = 46 * s, h = 118 * s, top = topY(x) - 34 * s, left = x - w / 2;
      const needles = [-3, -1, 1, 3].map((k) => `M${f(x + k * 4.4 * s)} ${f(top + h - 26 * s)} V${f(top + h - 6 * s)}`).join(' ');
      return `
      <g>
        <rect class="emb-head" x="${f(left)}" y="${f(top)}" width="${f(w)}" height="${f(h)}" rx="${f(5 * s)}" stroke-width="${f(1.8 * s + 0.4)}"/>
        <rect class="emb-panel" x="${f(left + 6 * s)}" y="${f(top + 8 * s)}" width="${f(w - 12 * s)}" height="${f(18 * s)}" rx="${f(3 * s)}" stroke-width="${f(1.2 * s + 0.3)}"/>
        <circle class="emb-led" style="animation-delay:${-(i * 0.37).toFixed(2)}s" cx="${f(x)}" cy="${f(top + 17 * s)}" r="${f(3 * s)}"/>
        <path class="emb-soft" d="M${f(left + 8 * s)} ${f(top + 36 * s)} H${f(left + w - 8 * s)} M${f(left + 8 * s)} ${f(top + 46 * s)} H${f(left + w - 8 * s)}" stroke-width="${f(1.1 * s + 0.3)}"/>
        <g class="emb-needles" style="animation-delay:${-(i * 0.09).toFixed(2)}s"><path class="emb-line" d="${needles}" stroke-width="${f(1.4 * s + 0.3)}"/></g>
      </g>`;
    })
    .join('');

  const legs = [X0 + 20, 330].map((lx) => `<path class="emb-line" d="M${lx} ${f(botY(lx))} V${f(botY(lx) + 70 - (lx - X0) / 12)} M${lx - 34} ${f(botY(lx) + 70 - (lx - X0) / 12)} H${lx + 34}" stroke-width="2.6"/>`).join('');

  // finished garments leave the machine on a conveyor, in a fixed order:
  // t-shirt, frock, undergarments, socks, then round again (see .emb-out)
  const garments = [
    // men's t-shirt
    `<path d="M10 -46 L23 -53 Q32 -45 41 -53 L54 -46 L64 -32 L54 -25 L49 -30 V0 H15 V-30 L10 -25 L0 -32 Z"/>
     <path class="emb-garment-detail" d="M23 -53 Q32 -40 41 -53 M15 -12 H49"/>`,
    // girls' frock
    `<path d="M23 -58 L28 -59 Q32 -53 36 -59 L41 -58 L49 -50 L44 -45 L42 -47 L42 -33 L60 0 H4 L22 -33 L22 -47 L20 -45 L15 -50 Z"/>
     <path class="emb-garment-detail" d="M22 -33 H42 M8 -6 H56 M32 -33 l-3 5 l3 4 l3 -4 z"/>`,
    // men's briefs + women's bra and panty
    `<path d="M0 -30 H34 V-7 L25 -3 L17 -15 L9 -3 L0 -7 Z"/>
     <path class="emb-garment-detail" d="M0 -25 H34"/>
     <path d="M42 -38 Q44 -54 58 -46 Q72 -54 74 -38 Q66 -34 58 -40 Q50 -34 42 -38 Z M47 -50 L49 -60 M69 -50 L67 -60"/>
     <path d="M44 -26 H72 L69 -15 Q62 -6 60 0 H56 Q54 -6 47 -15 Z"/>`,
    // pair of socks
    `<path d="M4 -58 H18 V-24 Q18 -18 24 -16 L34 -13 Q40 -9 35 -2 L15 -5 Q4 -7 4 -20 Z"/>
     <path d="M28 -58 H42 V-24 Q42 -18 48 -16 L58 -13 Q64 -9 59 -2 L39 -5 Q28 -7 28 -20 Z"/>
     <path class="emb-garment-detail" d="M4 -50 H18 M28 -50 H42"/>`
  ]
    .map((g, i) => `<g class="emb-out" style="animation-delay:${-(7.5 - i * 2.5)}s"><g class="emb-garment" transform="translate(10 461)">${g}</g></g>`)
    .join('');

  const output = `
  <!-- chute from the machine down to the output conveyor -->
  <path class="emb-fill emb-line" d="M${X0 - 24} ${f(botY(X0) + 18)} L${X0 - 6} ${f(botY(X0) + 26)} L64 402 H10 Z" stroke-width="2.2"/>
  <!-- conveyor belt -->
  <g class="emb-belt">
    <rect class="emb-fill emb-line" x="10" y="462" width="660" height="12" rx="6" stroke-width="2"/>
    <path class="emb-belt-run" d="M16 462 H664" stroke-width="2"/>
    ${[22, 180, 340, 500, 658].map((rx) => `<g class="emb-roller"><circle class="emb-soft" cx="${rx}" cy="468" r="4" stroke-width="1.4"/><path class="emb-soft" d="M${rx - 3} 468 H${rx + 3}" stroke-width="1.2"/></g>`).join('')}
    <path class="emb-soft" d="M40 474 V494 M640 474 V494 M28 494 H52 M628 494 H652" stroke-width="2"/>
  </g>
  ${garments}
  <!-- outlet hood the garments emerge from -->
  <path class="emb-head" d="M4 402 H70 V462 H4 Z" stroke-width="2.2"/>
  <path class="emb-soft" d="M12 412 H62 M12 420 H62" stroke-width="1.4"/>
  <circle class="emb-led" cx="56" cy="440" r="3"/>`;

  return `
<svg class="sew emb" viewBox="0 0 680 500" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <!-- overhead thread rack with its posts -->
  <path class="emb-line" d="M${X0 - 14} 58 L${X1 + 10} ${f(rackY(X1) - 8)} M${X0 - 14} 70 L${X1 + 10} ${f(rackY(X1) + 4)}" stroke-width="2.4"/>
  <path class="emb-soft" d="M${X0 - 10} 62 V${f(topY(X0) - 4)} M330 ${f(rackY(330))} V${f(topY(330) - 4)} M${X1} ${f(rackY(X1))} V${f(topY(X1) - 4)}" stroke-width="2"/>
  ${threads}
  <!-- the beam, seen at an angle, with its end panel -->
  <path class="emb-fill emb-line" d="M${X0} ${topY(X0)} L${X1} ${topY(X1)} L${X1} ${botY(X1)} L${X0} ${botY(X0)} Z" stroke-width="2.6"/>
  <path class="emb-fill emb-line" d="M${X0 - 26} ${topY(X0) - 10} L${X0} ${topY(X0)} L${X0} ${botY(X0) + 24} L${X0 - 26} ${botY(X0) + 14} Z" stroke-width="2.6"/>
  ${cones}
  <!-- light strip glowing under the heads -->
  <path class="emb-glow" d="M${X0 + 6} ${f(botY(X0) - 34)} L${X1 - 6} ${f(botY(X1) - 20)}" stroke-width="7"/>
  <!-- embroidery frame shifting under the needles -->
  <g class="emb-frame">
    <path class="emb-soft" d="M${X0 + 8} ${f(botY(X0) - 22)} L${X1 - 8} ${f(botY(X1) - 12)}" stroke-width="3"/>
    <path class="emb-stitch" d="M${X0 + 8} ${f(botY(X0) - 15)} L${X1 - 8} ${f(botY(X1) - 7)}" stroke-width="1.6"/>
  </g>
  ${headsSvg}
  ${legs}
  ${output}
</svg>`;
})();
