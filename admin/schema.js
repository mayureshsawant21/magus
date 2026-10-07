/* Field definitions for every editable part of the presentation.
   The admin form is generated from this, so adding a field here is all it takes
   to make it editable. Text marked `accent` supports *asterisks* for the gold italic. */
(function () {
  'use strict';

  const ICONS = [
    'factory', 'wallet', 'calendar', 'target', 'megaphone', 'users', 'pin', 'chart', 'search', 'play',
    'globe', 'layers', 'sparkle', 'check', 'star', 'rupee', 'needle',
    'tent', 'newspaper', 'building', 'file', 'chat', 'bus', 'handshake', 'calculator', 'gift', 'billboard'
  ];

  const eyebrow = { key: 'eyebrow', label: 'Eyebrow', type: 'text', help: 'Small uppercase label above the heading.' };
  const title = { key: 'title', label: 'Heading', type: 'text', accent: true };

  const metricFields = [
    { key: 'label', label: 'Label', type: 'text', width: 'half' },
    { key: 'value', label: 'Number', type: 'text', width: 'half', help: 'Digits only; it counts up and is formatted the Indian way (1,45,000).' },
    { key: 'prefix', label: 'Prefix', type: 'text', width: 'half', placeholder: '₹' },
    { key: 'suffix', label: 'Suffix', type: 'text', width: 'half', placeholder: '+' }
  ];

  const SECTION_TYPES = {
    cover: {
      label: 'Cover',
      description: 'Full-screen opening slide with logos, title and skyline image.',
      fields: [
        eyebrow,
        { ...title, type: 'textarea', rows: 2 },
        { key: 'subtitle', label: 'Subtitle', type: 'textarea', rows: 3 },
        { key: 'preparedBy', label: 'Prepared by line', type: 'text' },
        { key: 'scrollHint', label: 'Scroll hint', type: 'text' },
        { key: 'factory', label: 'Show the animated garment factory', type: 'toggle' },
        { key: 'image', label: 'Background image', type: 'image' }
      ],
      defaults: { eyebrow: 'Eyebrow', title: 'New *cover*', subtitle: '', preparedBy: '', scrollHint: 'Scroll to begin', image: 'assets/img/hero-city.svg' }
    },
    intro: {
      label: 'Intro with stats',
      description: 'Heading, paragraph, counting statistics and a tall image.',
      fields: [
        eyebrow,
        title,
        { key: 'body', label: 'Paragraph', type: 'textarea', rows: 4 },
        { key: 'image', label: 'Image', type: 'image' },
        { key: 'imageCaption', label: 'Image caption', type: 'text' },
        { key: 'stats', label: 'Statistics', type: 'list', itemLabel: 'Statistic', titleKey: 'label', fields: metricFields }
      ],
      defaults: { eyebrow: 'Eyebrow', title: 'New *section*', body: '', image: '', imageCaption: '', stats: [] }
    },
    chapter: {
      label: 'Chapter divider',
      description: 'Big numbered divider that opens a new part.',
      fields: [
        { key: 'number', label: 'Chapter number', type: 'text', width: 'half' },
        { ...eyebrow, width: 'half' },
        title,
        { key: 'subtitle', label: 'Subtitle', type: 'textarea', rows: 3 },
        { key: 'machine', label: 'Show the animated machine', type: 'toggle' },
        { key: 'art', label: 'Machine', type: 'select', options: [ { value: 'sewing', label: 'Sewing machine' }, { value: 'embroidery', label: 'Multi-head embroidery machine' } ] },
        { key: 'image', label: 'Background image (faded)', type: 'image' }
      ],
      defaults: { machine: true, art: 'sewing', number: '03', eyebrow: 'Part Three', title: 'New *chapter*', subtitle: '', image: '' }
    },
    brief: {
      label: 'Brief / spec list',
      description: 'Heading with a numbered list of label + value rows, each with an icon.',
      fields: [
        eyebrow,
        title,
        { key: 'items', label: 'Rows', type: 'list', itemLabel: 'Row', titleKey: 'label', fields: [
          { key: 'icon', label: 'Icon', type: 'icon', options: ICONS, width: 'half' },
          { key: 'label', label: 'Label', type: 'text', width: 'half' },
          { key: 'value', label: 'Value', type: 'text', accent: true }
        ] },
        { key: 'channels', label: 'Channel chips', type: 'strings', itemLabel: 'Chip' },
        { key: 'image', label: 'Image', type: 'image' }
      ],
      defaults: { eyebrow: 'Eyebrow', title: 'New *brief*', items: [], channels: [], image: '' }
    },
    table: {
      label: 'Table (media plan)',
      description: 'Editable table with optional split bars and an optional reference image.',
      fields: [
        eyebrow,
        title,
        { key: 'intro', label: 'Intro text', type: 'textarea', rows: 2 },
        { key: 'table', label: 'Table', type: 'table' },
        { key: 'highlightLastRow', label: 'Highlight the last row as a total', type: 'toggle' },
        { key: 'dense', label: 'Compact layout for tables with many columns', type: 'toggle' },
        { key: 'chartColumns', label: 'Show split bars for these columns', type: 'columnPicker', help: 'Only numeric columns make sense here.' },
        { key: 'chartTitle', label: 'Split bar label', type: 'text' },
        { key: 'image', label: 'Reference image (e.g. the original media plan)', type: 'image' },
        { key: 'imageCaption', label: 'Image caption', type: 'text' }
      ],
      defaults: { eyebrow: 'Eyebrow', title: 'New *table*', intro: '', columns: ['Column A', 'Column B'], rows: [['', '']], highlightLastRow: false, chartColumns: [], chartTitle: 'Share', image: '', imageCaption: '' }
    },
    channel: {
      label: 'Channel / targeting',
      description: 'Targeting details, headline numbers, ad creatives and an optional search ad preview.',
      fields: [
        eyebrow,
        title,
        { key: 'lede', label: 'Intro line', type: 'textarea', rows: 2 },
        { key: 'metrics', label: 'Headline numbers', type: 'list', itemLabel: 'Number', titleKey: 'label', fields: metricFields },
        { key: 'details', label: 'Targeting details', type: 'list', itemLabel: 'Detail', titleKey: 'label', fields: [
          { key: 'label', label: 'Label', type: 'text', width: 'half' },
          { key: 'style', label: 'Show as', type: 'select', width: 'half', options: [ { value: 'text', label: 'Large text' }, { value: 'chips', label: 'Chips (comma separated)' }, { value: 'tiles', label: 'Tiles (comma separated, note in brackets)' } ] },
          { key: 'value', label: 'Value', type: 'textarea', rows: 2, help: 'For tiles, write each item like: Economic Times (Business news), Fibre2Fashion (Textile trade)' }
        ] },
        { key: 'textAds', label: 'Text ad notes', type: 'strings', itemLabel: 'Note' },
        { key: 'creativesTitle', label: 'Creatives heading', type: 'text' },
        { key: 'creatives', label: 'Ad creatives', type: 'list', itemLabel: 'Creative', titleKey: 'title', fields: [
          { key: 'title', label: 'Title', type: 'text', width: 'half' },
          { key: 'format', label: 'Format', type: 'select', width: 'half', options: ['Static', 'Video', 'Carousel', 'Display', 'Native'] },
          { key: 'image', label: 'Image or video', type: 'image' }
        ] },
        { key: 'adPreview', label: 'Search ad preview', type: 'object', fields: [
          { key: 'enabled', label: 'Show the search ad preview', type: 'toggle' },
          { key: 'headline', label: 'Headline', type: 'text' },
          { key: 'url', label: 'Display URL', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea', rows: 2 },
          { key: 'sitelinks', label: 'Sitelinks', type: 'strings', itemLabel: 'Sitelink' }
        ] }
      ],
      defaults: { eyebrow: 'Channel', title: 'New *channel*', lede: '', metrics: [], details: [], textAds: [], creativesTitle: 'Ad creatives', creatives: [], adPreview: { enabled: false, headline: '', url: '', description: '', sitelinks: [] } }
    },
    totals: {
      label: 'Overall totals',
      description: 'Big headline numbers with notes, plus an optional split bar.',
      fields: [
        eyebrow,
        title,
        { key: 'intro', label: 'Intro text', type: 'textarea', rows: 2 },
        { key: 'metrics', label: 'Numbers', type: 'list', itemLabel: 'Number', titleKey: 'label', fields: [
          ...metricFields,
          { key: 'note', label: 'Note under the number', type: 'text' }
        ] },
        { key: 'splitTitle', label: 'Split bar label', type: 'text' },
        { key: 'split', label: 'Split bar parts', type: 'list', itemLabel: 'Part', titleKey: 'label', fields: [
          { key: 'label', label: 'Label', type: 'text', width: 'half' },
          { key: 'value', label: 'Amount (number)', type: 'text', width: 'half' }
        ] }
      ],
      defaults: { eyebrow: 'Overall', title: 'New *totals*', intro: '', metrics: [], splitTitle: '', split: [] }
    },
    keywords: {
      label: 'Keywords',
      description: 'Animated search bar, scrolling keyword ribbons and a numbered list.',
      fields: [
        eyebrow,
        title,
        { key: 'intro', label: 'Intro text', type: 'textarea', rows: 2 },
        { key: 'searchPlaceholder', label: 'Search button text', type: 'text' },
        { key: 'keywords', label: 'Keywords', type: 'strings', itemLabel: 'Keyword', bulk: true }
      ],
      defaults: { eyebrow: 'Keywords', title: 'New *keywords*', intro: '', searchPlaceholder: 'Search', keywords: [] }
    },
    results: {
      label: 'Results comparison',
      description: 'Budget ring, totals and bar comparisons. CPL, totals and shares are calculated for you.',
      fields: [
        eyebrow,
        title,
        { key: 'totalBudget', label: 'Total budget (number)', type: 'text', help: 'Used for the "budget deployed" ring.' },
        { key: 'channels', label: 'Channels', type: 'list', itemLabel: 'Channel', titleKey: 'name', fields: [
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'spend', label: 'Spends (number)', type: 'text', width: 'half' },
          { key: 'leads', label: 'Leads (number)', type: 'text', width: 'half' }
        ] },
        { key: 'insights', label: 'Insights', type: 'strings', itemLabel: 'Insight', multiline: true }
      ],
      defaults: { eyebrow: 'Results', title: 'New *results*', totalBudget: '0', channels: [], insights: [] }
    },
    strategy: {
      label: 'Strategy points (horizontal)',
      description: 'Pinned horizontal gallery: one panel per point with what / why / content.',
      fields: [
        eyebrow,
        title,
        { key: 'labels', label: 'Column labels', type: 'object', fields: [
          { key: 'what', label: 'First column', type: 'text' },
          { key: 'why', label: 'Second column', type: 'text' },
          { key: 'content', label: 'Third column', type: 'text' }
        ] },
        { key: 'points', label: 'Points', type: 'list', itemLabel: 'Point', titleKey: 'title', numbered: true, fields: [
          { key: 'title', label: 'Title', type: 'text', accent: true },
          { key: 'what', label: 'What I would do', type: 'textarea', rows: 3 },
          { key: 'why', label: 'Why it would work', type: 'textarea', rows: 3 },
          { key: 'content', label: 'Content I would create', type: 'strings', itemLabel: 'Idea' },
          { key: 'image', label: 'Image', type: 'image' }
        ] }
      ],
      defaults: { eyebrow: 'Playbook', title: 'New *strategy*', labels: { what: 'What I would do', why: 'Why it would work', content: 'Content I would create' }, points: [] }
    },
    insights: {
      label: 'Insight cards',
      description: 'Cards with an icon, text and chips, plus an optional second group of ideas.',
      fields: [
        eyebrow,
        title,
        { key: 'intro', label: 'Intro text', type: 'textarea', rows: 2 },
        { key: 'items', label: 'Cards', type: 'list', itemLabel: 'Card', titleKey: 'title', fields: [
          { key: 'icon', label: 'Icon', type: 'icon', options: ICONS },
          { key: 'title', label: 'Title', type: 'text', accent: true },
          { key: 'text', label: 'Description', type: 'textarea', rows: 3 },
          { key: 'chips', label: 'Chips (comma separated)', type: 'textarea', rows: 2 },
          { key: 'tag', label: 'Badge (optional)', type: 'text', width: 'half' },
          { key: 'wide', label: 'Wide card', type: 'toggle', width: 'half' }
        ] },
        { key: 'ideasTitle', label: 'Second group heading', type: 'text', accent: true },
        { key: 'ideasIntro', label: 'Second group intro', type: 'textarea', rows: 2 },
        { key: 'ideas', label: 'Second group cards', type: 'list', itemLabel: 'Idea', titleKey: 'title', fields: [
          { key: 'icon', label: 'Icon', type: 'icon', options: ICONS },
          { key: 'title', label: 'Title', type: 'text', accent: true },
          { key: 'text', label: 'Description', type: 'textarea', rows: 3 },
          { key: 'chips', label: 'Chips (comma separated)', type: 'textarea', rows: 2 },
          { key: 'tag', label: 'Badge (optional)', type: 'text', width: 'half' },
          { key: 'wide', label: 'Wide card', type: 'toggle', width: 'half' }
        ] }
      ],
      defaults: { eyebrow: 'Insights', title: 'New *insights*', intro: '', items: [], ideasTitle: '', ideasIntro: '', ideas: [] }
    },
    kpis: {
      label: 'KPI funnel',
      description: 'A tapering funnel with one column per metric.',
      fields: [
        eyebrow,
        title,
        { key: 'items', label: 'Metrics', type: 'list', itemLabel: 'Metric', titleKey: 'label', fields: [
          { key: 'label', label: 'Name', type: 'text' },
          { key: 'text', label: 'Description', type: 'textarea', rows: 2 }
        ] }
      ],
      defaults: { eyebrow: 'Metrics', title: 'New *metrics*', items: [] }
    },
    closing: {
      label: 'Closing',
      description: 'Large thank-you with all logos.',
      fields: [
        eyebrow,
        title,
        { key: 'subtitle', label: 'Subtitle', type: 'textarea', rows: 2 },
        { key: 'contactLines', label: 'Contact line items', type: 'strings', itemLabel: 'Item' },
        { key: 'image', label: 'Background image (faded)', type: 'image' }
      ],
      defaults: { eyebrow: '', title: 'Thank *you*.', subtitle: '', contactLines: [], image: '' }
    }
  };

  const COMMON_FIELDS = [
    { key: 'navLabel', label: 'Name in navigation', type: 'text', width: 'half' },
    { key: 'theme', label: 'Background', type: 'select', width: 'half', options: [ { value: 'light', label: 'White (light)' }, { value: 'dark', label: 'Blue (dark)' } ] },
    { key: 'id', label: 'Link id', type: 'slug', help: 'Used in links like /#media-plan. Lowercase letters, numbers and dashes.' }
  ];

  const SETTINGS_FIELDS = [
    { key: 'siteTitle', label: 'Browser tab title', type: 'text' },
    { key: 'metaDescription', label: 'Share description', type: 'textarea', rows: 2 },
    { key: 'presenter', label: 'Presenter', type: 'object', fields: [
      { key: 'name', label: 'Name', type: 'text', width: 'half' },
      { key: 'role', label: 'Role', type: 'text', width: 'half' }
    ] },
    { key: 'logos', label: 'Logos', type: 'object', fields: [
      { key: 'primary', label: 'Main logo (Magus Fashion City)', type: 'image' },
      { key: 'secondary', label: 'Secondary logo (Magus)', type: 'image' },
      { key: 'presenter', label: 'Presenter logo', type: 'image' }
    ] },
    { key: 'theme', label: 'Colours', type: 'object', fields: [
      { key: 'ink', label: 'Dark slide colour', type: 'color', width: 'half' },
      { key: 'ivory', label: 'Light slide colour', type: 'color', width: 'half' },
      { key: 'navy', label: 'Accent blue', type: 'color', width: 'half' },
      { key: 'sky', label: 'Secondary blue (charts)', type: 'color', width: 'half' },
      { key: 'accent', label: 'Highlight colour', type: 'color', width: 'half' }
    ] },
    { key: 'currencySymbol', label: 'Currency symbol', type: 'text', width: 'half' },
    { key: 'showIntroLoader', label: 'Show the logo intro when the page opens', type: 'toggle' },
    { key: 'showKeyboardHint', label: 'Show the keyboard hint at the bottom', type: 'toggle' }
  ];

  window.MFC_SCHEMA = { SECTION_TYPES, COMMON_FIELDS, SETTINGS_FIELDS, ICONS };
})();
