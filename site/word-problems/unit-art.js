// Chalk sketches for the unit headers on the contents page, one per unit, drawn in the unit's colour.
// Each entry is the inside of an SVG with viewBox 0 0 600 180; keep the left ~200 px light (the unit title sits there
// on narrow screens). Classes, styled in book.html:
//   d  a stroke that draws itself in when the unit scrolls into view (--k orders the strokes)
//   t  text or a filled shape that fades in
//   a  faint chalk white instead of the unit colour;  faint  even fainter
// A sketch may add one looping motion after it is drawn: give an element a class and add a .seen .unit-art .NAME
// rule with its keyframes in book.html (see the examples there: swap-a, hop, spin, tilt, breathe, ...).
'use strict';
(() => {
  let k = 0;
  const P = (d, cls = '', extra = '') => `<path class="d ${cls}" pathLength="1" style="--k:${k++}" d="${d}" ${extra}/>`;
  const Tx = (x, y, s, size = 24, cls = '', anchor = 'start') => `<text class="t ${cls}" style="--k:${k++}" x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}">${s}</text>`;
  const C = (cx, cy, r, cls = '') => `<circle class="d ${cls}" pathLength="1" style="--k:${k++}" cx="${cx}" cy="${cy}" r="${r}"/>`;
  const reset = s => { k = 0; return s; };

  window.UNIT_ART = [
    // Unit 1: Foundations & Linear Models (Tape diagram with x and 2x summing to 72)
    reset(
      // Left bar (x)
      P('M230 65 h100 v40 h-100 z', '') +
      Tx(280, 92, 'x', 24, '', 'middle') +
      // Right bar (2x)
      P('M338 65 h200 v40 h-200 z', '') +
      Tx(438, 92, '2x', 24, '', 'middle') +
      // Sum bracket below
      P('M230 118 v10 h150 v10 v-10 h150 v-10', 'a') +
      Tx(380, 155, '= 72', 26, 'a', 'middle') +
      // Faint equation above
      Tx(380, 42, 'x + 2x = 72', 22, 'a faint', 'middle')
    ),
    // Unit 2: Motion & Rates (Distance = Rate x Time line with a moving marker)
    reset(
      P('M230 110 h320', '') +
      P('M230 95 v30', 'a') +
      P('M550 95 v30', 'a') +
      Tx(230, 80, 'A', 22, 'a', 'middle') +
      Tx(550, 80, 'B', 22, 'a', 'middle') +
      Tx(390, 75, 'd = r · t', 24, '', 'middle') +
      `<circle class="t hop" r="7" fill="currentColor" stroke="none" style="--k:${k++};offset-path:path('M230 110 H550')"/>`
    ),
    // Unit 3: Concentrations & Systems (Beaker / balance / mixture)
    reset(
      P('M260 55 v75 q0 20 20 20 h60 q20 0 20 -20 v-75', '') +
      P('M260 100 h100', 'a') +
      Tx(310, 125, '30%', 20, '', 'middle') +
      Tx(390, 110, '+', 28, 'a', 'middle') +
      P('M420 55 v75 q0 20 20 20 h60 q20 0 20 -20 v-75', '') +
      P('M420 90 h100', 'a') +
      Tx(470, 125, '50%', 20, '', 'middle')
    )
  ];
})();
