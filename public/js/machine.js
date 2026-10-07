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
