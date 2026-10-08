/* Delivery scene for the campaign brief: a truck painted with garment designs
   drives slowly from the factory to a retail shop, on a loop. All motion is CSS
   (.dl-* in style.css). */
window.MFC_DELIVERY = `
<svg class="dl" viewBox="0 0 560 200" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <!-- factory -->
  <g class="dl-factory">
    <path class="dl-smoke" d="M104 52 q-6 -8 0 -14 q8 -6 14 2" stroke-width="1.6"/>
    <path class="dl-smoke dl-smoke--late" d="M106 52 q-6 -8 0 -14 q8 -6 14 2" stroke-width="1.6"/>
    <path class="dl-fill dl-line" d="M100 58 H116 V104 H100 Z" stroke-width="2"/>
    <path class="dl-fill dl-line" d="M6 180 V104 L36 86 V104 L66 86 V104 L96 86 V104 H122 V180 Z" stroke-width="2.2"/>
    <path class="dl-soft" d="M16 118 H38 V134 H16 Z M48 118 H70 V134 H48 Z M80 118 H102 V134 H80 Z" stroke-width="1.6"/>
    <path class="dl-line" d="M44 180 V150 H84 V180 M44 158 H84 M44 166 H84" stroke-width="1.8"/>
    <text class="dl-label" x="64" y="198" text-anchor="middle">FACTORY</text>
  </g>

  <!-- retail shop -->
  <g class="dl-shop">
    <path class="dl-fill dl-line" d="M436 180 V104 H550 V180 Z" stroke-width="2.2"/>
    <path class="dl-line" d="M430 104 L438 84 H548 L556 104 Z" stroke-width="2.2"/>
    <path class="dl-awning" d="M430 104 q9 10 18 0 q9 10 18 0 q9 10 18 0 q9 10 18 0 q9 10 18 0 q9 10 18 0 q8 10 16 0" stroke-width="2"/>
    <path class="dl-soft" d="M444 124 H500 V172 H444 Z" stroke-width="1.6"/>
    <!-- a shirt and a dress on display -->
    <path class="dl-soft" d="M452 138 l6 -3 q4 4 8 0 l6 3 l4 6 l-4 2 l-2 -2 v20 h-16 v-20 l-2 2 l-4 -2 z" stroke-width="1.4"/>
    <path class="dl-soft" d="M484 135 h6 q0 3 3 3 l3 6 l8 22 h-24 l8 -22 z" stroke-width="1.4"/>
    <path class="dl-line" d="M512 180 V128 H538 V180 M532 154 V158" stroke-width="1.8"/>
    <circle class="dl-lamp" cx="525" cy="116" r="3"/>
    <text class="dl-label" x="493" y="198" text-anchor="middle">RETAIL</text>
  </g>

  <!-- road -->
  <path class="dl-line" d="M0 184 H560" stroke-width="1.6"/>
  <path class="dl-soft" d="M130 190 H428" stroke-width="1.4" stroke-dasharray="10 10"/>

  <!-- the truck, driving along the road on a loop -->
  <g class="dl-truck">
    <g class="dl-body">
      <rect class="dl-fill dl-line" x="0" y="118" width="104" height="52" rx="4" stroke-width="2.2"/>
      <!-- garment designs painted on the container -->
      <path class="dl-art" d="M12 135 l7 -4 q5 5 10 0 l7 4 l5 8 l-5 3 l-3 -3 v20 h-18 v-20 l-3 3 l-5 -3 z" stroke-width="1.5"/>
      <path class="dl-art" d="M52 131 h8 q0 4 4 4 l2 8 l9 21 h-38 l9 -21 l2 -8 q4 0 4 -4 z" transform="translate(4 0)" stroke-width="1.5"/>
      <path class="dl-art" d="M80 131 h18 l2 33 h-7 l-4 -24 l-4 24 h-7 z M80 136 h18" stroke-width="1.5"/>
      <path class="dl-fill dl-line" d="M106 170 V140 Q106 134 112 134 H130 L146 150 V170 Z" stroke-width="2.2"/>
      <path class="dl-soft" d="M112 140 H128 L139 151 H112 Z" stroke-width="1.6"/>
      <path class="dl-line" d="M146 162 H150" stroke-width="2.2"/>
      <circle class="dl-lamp" cx="144" cy="158" r="2"/>
    </g>
    <g class="dl-wheel"><circle class="dl-tyre dl-line" cx="24" cy="174" r="10" stroke-width="2.2"/><path class="dl-soft" d="M24 167 V181 M17 174 H31" stroke-width="1.6"/></g>
    <g class="dl-wheel"><circle class="dl-tyre dl-line" cx="80" cy="174" r="10" stroke-width="2.2"/><path class="dl-soft" d="M80 167 V181 M73 174 H87" stroke-width="1.6"/></g>
    <g class="dl-wheel"><circle class="dl-tyre dl-line" cx="128" cy="174" r="10" stroke-width="2.2"/><path class="dl-soft" d="M128 167 V181 M121 174 H135" stroke-width="1.6"/></g>
  </g>
</svg>`;
