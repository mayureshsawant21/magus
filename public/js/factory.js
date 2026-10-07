/* Animated garment factory for the cover slide, in the same line-art style as the
   divider sewing machine: fabric unrolls into two sewing stations, finished shirts
   ride a conveyor, and a packer boxes them. All motion is CSS (.f-* in style.css). */
(function () {
  'use strict';

  // a worker seen from the front, sitting or standing behind a table at height `table`
  const worker = (x, headY, table, armDir) => `
    <g class="f-worker">
      <circle class="f-fill f-line" cx="${x}" cy="${headY}" r="12" stroke-width="2.4"/>
      <path class="f-soft" d="M${x - 9} ${headY - 6} Q${x} ${headY - 16} ${x + 9} ${headY - 6}" stroke-width="2"/>
      <path class="f-fill f-line" d="M${x - 20} ${table} V${headY + 32} Q${x - 20} ${headY + 16} ${x - 6} ${headY + 16} H${x + 6} Q${x + 20} ${headY + 16} ${x + 20} ${headY + 32} V${table}" stroke-width="2.4"/>
      <path class="f-line f-arm" style="transform-origin: ${armDir < 0 ? '100% 0%' : '0% 0%'}" d="M${x - 16 * -armDir} ${headY + 26} Q${x + 4 * armDir} ${headY + 52} ${x + 26 * armDir} ${table - 8}" stroke-width="2.4"/>
      <path class="f-line f-arm f-arm--late" style="transform-origin: ${armDir < 0 ? '0% 0%' : '100% 0%'}" d="M${x + 16 * -armDir} ${headY + 26} Q${x + 10 * armDir} ${headY + 54} ${x + 34 * armDir} ${table - 6}" stroke-width="2.4"/>
    </g>`;

  // a small sewing station: worker, table, machine and the needle going up and down
  const station = (x, delay) => `
    <g>
      ${worker(x + 92, 168, 250, -1)}
      <path class="f-line" d="M${x} 250 H${x + 170} M${x + 12} 260 V360 M${x + 158} 260 V360" stroke-width="2.6"/>
      <rect class="f-fill f-line" x="${x}" y="250" width="170" height="10" rx="2" stroke-width="2.6"/>
      <rect class="f-cloth" x="${x + 18}" y="243" width="86" height="7" rx="1.5"/>
      <path class="f-weave" style="animation-delay:${delay}s" d="M${x + 18} 246.5 H${x + 104}" stroke-width="7"/>
      <path class="f-fill f-line" d="M${x + 70} 250 V214 Q${x + 70} 203 ${x + 81} 203 H${x + 138} Q${x + 148} 203 ${x + 148} 213 V250 H${x + 132} V223 H${x + 92} V236 Z" stroke-width="2.4"/>
      <circle class="f-soft" cx="${x + 140}" cy="214" r="6" stroke-width="2"/>
      <g class="f-needle" style="animation-delay:${delay}s">
        <path class="f-line" d="M${x + 77} 236 V249" stroke-width="2.2"/>
      </g>
      <path class="f-line" d="M${x + 68} 247 H${x + 88}" stroke-width="2.4"/>
    </g>`;

  // a finished shirt riding the conveyor
  const shirt = (delay) => `
    <g class="f-ride" style="animation-delay:${delay}s">
      <path class="f-shirt" d="M8 324 l9 -5 q5 6 10 0 l9 5 l7 10 l-7 4 v20 h-28 v-20 l-7 -4 z" stroke-width="1.8"/>
      <path class="f-soft" d="M22 324 v34" stroke-width="1.4"/>
    </g>`;

  window.MFC_FACTORY = `
<svg class="factory" viewBox="0 0 760 470" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <!-- saw-tooth factory roof with north-light windows -->
  <path class="f-soft" d="M20 96 V74 L86 34 V74 L152 34 V74 L218 34 V74 L284 34 V74 L350 34 V74 L416 34 V74 L482 34 V74 L548 34 V74 L614 34 V74 L680 34 V74 L740 38 V96 H20" stroke-width="2"/>
  <path class="f-soft" d="M86 42 V70 M152 42 V70 M218 42 V70 M284 42 V70 M350 42 V70 M416 42 V70 M482 42 V70 M548 42 V70 M614 42 V70 M680 42 V70" stroke-width="5" stroke-opacity="0.35"/>

  <!-- hanging lamps with a soft pulsing light -->
  <g>
    <path class="f-soft" d="M220 96 V120 M420 96 V120 M650 96 V150" stroke-width="1.6"/>
    <path class="f-fill f-line" d="M208 132 L214 120 H226 L232 132 Z M408 132 L414 120 H426 L432 132 Z M638 162 L644 150 H656 L662 162 Z" stroke-width="2"/>
    <path class="f-glow" d="M208 132 L150 250 H290 L232 132 Z"/>
    <path class="f-glow f-glow--late" d="M408 132 L350 250 H490 L432 132 Z"/>
    <path class="f-glow" d="M638 162 L590 330 H710 L662 162 Z"/>
  </g>

  <!-- fabric roll feeding the first station -->
  <path class="f-line" d="M56 228 L40 420 M94 228 L110 420" stroke-width="2.4"/>
  <g class="f-roll">
    <circle class="f-fill f-line" cx="75" cy="228" r="24" stroke-width="2.6"/>
    <path class="f-soft" d="M75 210 V246 M57 228 H93" stroke-width="2"/>
  </g>
  <path class="f-cloth" d="M75 252 C 100 262, 120 250, 148 246 L148 253 C 120 257, 100 270, 75 259 Z"/>

  ${station(130, 0)}
  ${station(330, -0.2)}

  <!-- conveyor carrying finished shirts to packing -->
  <rect class="f-fill f-line" x="112" y="360" width="500" height="18" rx="9" stroke-width="2.6"/>
  <path class="f-belt" d="M122 360 H602" stroke-width="2.6"/>
  ${[130, 200, 270, 340, 410, 480, 550, 594]
    .map((cx) => `<g class="f-roller"><circle class="f-line" cx="${cx}" cy="369" r="5" stroke-width="2"/><path class="f-soft" d="M${cx - 4} 369 H${cx + 4}" stroke-width="1.6"/></g>`)
    .join('')}
  <path class="f-line" d="M150 378 V430 M570 378 V430" stroke-width="2.4"/>
  ${shirt(0)}${shirt(-2.5)}${shirt(-5)}

  <!-- packing: a packer boxes shirts; finished boxes stack up -->
  ${worker(694, 236, 330, -1)}
  <rect class="f-fill f-line" x="618" y="330" width="130" height="10" rx="2" stroke-width="2.6"/>
  <path class="f-line" d="M628 340 V430 M738 340 V430" stroke-width="2.4"/>
  <rect class="f-fill f-line" x="634" y="298" width="56" height="32" rx="2" stroke-width="2.4"/>
  <path class="f-line f-flap" d="M634 298 L618 284" stroke-width="2.4"/>
  <path class="f-line f-flap f-flap--late" d="M690 298 L706 284" stroke-width="2.4"/>
  <path class="f-shirt f-drop" d="M650 296 l6 -3 q4 4 8 0 l6 3 l4 6 l-4 2 v8 h-20 v-8 l-4 -2 z" stroke-width="1.6"/>
  <rect class="f-fill f-line" x="640" y="394" width="40" height="36" rx="2" stroke-width="2.2"/>
  <rect class="f-fill f-line" x="684" y="394" width="40" height="36" rx="2" stroke-width="2.2"/>
  <rect class="f-fill f-line" x="662" y="358" width="40" height="36" rx="2" stroke-width="2.2"/>
  <path class="f-soft" d="M640 404 H680 M684 404 H724 M662 368 H702" stroke-width="1.6"/>

  <!-- floor -->
  <path class="f-line" d="M20 430 H750" stroke-width="2.6"/>
  <path class="f-soft" d="M30 446 H740" stroke-width="1.4" stroke-dasharray="2 12"/>
</svg>`;
})();
