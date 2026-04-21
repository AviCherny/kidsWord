// ColorBook picture definitions
// Each region is independently colorable. Shapes are ordered back-to-front.
// viewBox is set per picture to give generous tap targets for small kids.

export const PICTURES = [
  // ─── ANIMALS ────────────────────────────────────────────────────────────────

  {
    id: 'cat',
    label: { en: 'Cat', he: 'חתול' },
    emoji: '🐱',
    category: 'animals',
    viewBox: '0 0 200 230',
    regions: [
      // tail – sweeping curve to the right side
      {
        id: 'tail',
        type: 'path',
        attrs: { d: 'M 130,185 C 175,175 195,145 185,115 C 178,95 162,92 158,105 C 154,118 168,128 162,148 C 156,165 138,168 130,185 Z' },
      },
      // body
      { id: 'body', type: 'ellipse', attrs: { cx: 100, cy: 168, rx: 60, ry: 48 } },
      // head
      { id: 'head', type: 'circle', attrs: { cx: 100, cy: 95, r: 52 } },
      // ears
      { id: 'left_ear',  type: 'path', attrs: { d: 'M 55,68 L 42,18 L 82,48 Z' } },
      { id: 'right_ear', type: 'path', attrs: { d: 'M 145,68 L 158,18 L 118,48 Z' } },
      // eyes
      { id: 'left_eye',  type: 'circle', attrs: { cx: 82,  cy: 88, r: 10 } },
      { id: 'right_eye', type: 'circle', attrs: { cx: 118, cy: 88, r: 10 } },
      // nose
      { id: 'nose', type: 'path', attrs: { d: 'M 100,105 L 93,112 L 107,112 Z' } },
    ],
    decorations: [
      // whiskers left
      { type: 'line', attrs: { x1: 55, y1: 108, x2: 88,  y2: 112 }, stroke: '#555', strokeWidth: 1.5 },
      { type: 'line', attrs: { x1: 55, y1: 114, x2: 88,  y2: 115 }, stroke: '#555', strokeWidth: 1.5 },
      // whiskers right
      { type: 'line', attrs: { x1: 145, y1: 108, x2: 112, y2: 112 }, stroke: '#555', strokeWidth: 1.5 },
      { type: 'line', attrs: { x1: 145, y1: 114, x2: 112, y2: 115 }, stroke: '#555', strokeWidth: 1.5 },
      // mouth
      { type: 'path', attrs: { d: 'M 93,116 Q 100,124 107,116' }, stroke: '#555', strokeWidth: 1.5, fill: 'none' },
      // pupils
      { type: 'ellipse', attrs: { cx: 82,  cy: 88, rx: 4, ry: 6 }, fill: '#222' },
      { type: 'ellipse', attrs: { cx: 118, cy: 88, rx: 4, ry: 6 }, fill: '#222' },
    ],
  },

  {
    id: 'fish',
    label: { en: 'Fish', he: 'דג' },
    emoji: '🐟',
    category: 'animals',
    viewBox: '0 0 240 180',
    regions: [
      // tail on left
      {
        id: 'tail',
        type: 'path',
        attrs: { d: 'M 55,90 L 20,50 L 20,130 Z' },
      },
      // body faces right
      { id: 'body', type: 'ellipse', attrs: { cx: 130, cy: 90, rx: 80, ry: 48 } },
      // dorsal fin on top
      {
        id: 'top_fin',
        type: 'path',
        attrs: { d: 'M 100,44 C 115,15 145,12 160,42 L 130,42 Z' },
      },
      // pectoral fin bottom
      {
        id: 'bottom_fin',
        type: 'path',
        attrs: { d: 'M 115,132 C 125,155 150,158 155,135 L 130,132 Z' },
      },
      // eye
      { id: 'eye', type: 'circle', attrs: { cx: 188, cy: 82, r: 13 } },
    ],
    decorations: [
      // pupil
      { type: 'circle', attrs: { cx: 191, cy: 80, r: 5 }, fill: '#222' },
      // mouth
      { type: 'path', attrs: { d: 'M 210,92 Q 218,98 210,104' }, stroke: '#555', strokeWidth: 2, fill: 'none' },
      // scale lines
      { type: 'path', attrs: { d: 'M 140,58 Q 155,75 140,90' }, stroke: '#aaa', strokeWidth: 1.5, fill: 'none' },
      { type: 'path', attrs: { d: 'M 115,55 Q 130,72 115,88' }, stroke: '#aaa', strokeWidth: 1.5, fill: 'none' },
    ],
  },

  {
    id: 'bird',
    label: { en: 'Bird', he: 'ציפור' },
    emoji: '🐦',
    category: 'animals',
    viewBox: '0 0 200 200',
    regions: [
      // tail fan
      {
        id: 'tail',
        type: 'path',
        attrs: { d: 'M 38,130 L 10,155 L 25,165 L 38,145 L 52,165 L 66,155 Z' },
      },
      // body – slightly tilted teardrop pointing right
      { id: 'body', type: 'ellipse', attrs: { cx: 108, cy: 130, rx: 62, ry: 42 } },
      // wing overlay
      {
        id: 'wing',
        type: 'path',
        attrs: { d: 'M 75,108 C 90,70 140,65 155,95 C 140,88 105,90 90,118 Z' },
      },
      // head
      { id: 'head', type: 'circle', attrs: { cx: 148, cy: 92, r: 34 } },
      // beak
      { id: 'beak', type: 'path', attrs: { d: 'M 178,88 L 198,95 L 178,102 Z' } },
      // eye
      { id: 'eye', type: 'circle', attrs: { cx: 158, cy: 84, r: 9 } },
    ],
    decorations: [
      { type: 'circle', attrs: { cx: 160, cy: 83, r: 4 }, fill: '#222' },
      // feet
      { type: 'path', attrs: { d: 'M 108,170 L 108,185 M 98,185 L 108,185 L 118,185 M 103,185 L 100,193 M 108,185 L 108,193 M 113,185 L 116,193' }, stroke: '#555', strokeWidth: 2, fill: 'none' },
    ],
  },

  {
    id: 'butterfly',
    label: { en: 'Butterfly', he: 'פרפר' },
    emoji: '🦋',
    category: 'animals',
    viewBox: '0 0 220 200',
    regions: [
      // left top wing
      {
        id: 'left_top_wing',
        type: 'path',
        attrs: { d: 'M 110,95 C 90,55 30,30 15,70 C 5,98 40,130 110,115 Z' },
      },
      // right top wing
      {
        id: 'right_top_wing',
        type: 'path',
        attrs: { d: 'M 110,95 C 130,55 190,30 205,70 C 215,98 180,130 110,115 Z' },
      },
      // left bottom wing
      {
        id: 'left_bottom_wing',
        type: 'path',
        attrs: { d: 'M 110,115 C 85,120 30,145 35,170 C 40,190 80,188 110,158 Z' },
      },
      // right bottom wing
      {
        id: 'right_bottom_wing',
        type: 'path',
        attrs: { d: 'M 110,115 C 135,120 190,145 185,170 C 180,190 140,188 110,158 Z' },
      },
      // body
      { id: 'body', type: 'ellipse', attrs: { cx: 110, cy: 128, rx: 8, ry: 42 } },
    ],
    decorations: [
      // head dot
      { type: 'circle', attrs: { cx: 110, cy: 83, r: 7 }, fill: '#555' },
      // antennae
      { type: 'path', attrs: { d: 'M 107,78 C 100,60 88,52 84,44' }, stroke: '#555', strokeWidth: 2, fill: 'none' },
      { type: 'circle', attrs: { cx: 84, cy: 44, r: 4 }, fill: '#555' },
      { type: 'path', attrs: { d: 'M 113,78 C 120,60 132,52 136,44' }, stroke: '#555', strokeWidth: 2, fill: 'none' },
      { type: 'circle', attrs: { cx: 136, cy: 44, r: 4 }, fill: '#555' },
      // wing spots left
      { type: 'circle', attrs: { cx: 62, cy: 80, r: 10 }, fill: 'rgba(255,255,255,0.3)', stroke: '#aaa', strokeWidth: 1 },
      { type: 'circle', attrs: { cx: 65, cy: 155, r: 7  }, fill: 'rgba(255,255,255,0.3)', stroke: '#aaa', strokeWidth: 1 },
      // wing spots right
      { type: 'circle', attrs: { cx: 158, cy: 80, r: 10 }, fill: 'rgba(255,255,255,0.3)', stroke: '#aaa', strokeWidth: 1 },
      { type: 'circle', attrs: { cx: 155, cy: 155, r: 7  }, fill: 'rgba(255,255,255,0.3)', stroke: '#aaa', strokeWidth: 1 },
    ],
  },

  // ─── VEHICLES ────────────────────────────────────────────────────────────────

  {
    id: 'car',
    label: { en: 'Car', he: 'מכונית' },
    emoji: '🚗',
    category: 'vehicles',
    viewBox: '0 0 240 160',
    regions: [
      // main body — long rounded rectangle
      {
        id: 'body',
        type: 'path',
        attrs: { d: 'M 20,105 Q 20,125 40,125 L 200,125 Q 220,125 220,105 L 220,85 L 20,85 Z' },
      },
      // roof / cabin
      {
        id: 'roof',
        type: 'path',
        attrs: { d: 'M 65,85 L 78,48 Q 80,42 88,42 L 165,42 Q 172,42 174,48 L 185,85 Z' },
      },
      // windshield (front glass)
      {
        id: 'windshield',
        type: 'path',
        attrs: { d: 'M 152,80 L 162,52 Q 163,46 168,46 L 178,46 L 184,80 Z' },
      },
      // rear glass
      {
        id: 'rear_glass',
        type: 'path',
        attrs: { d: 'M 70,80 L 80,52 Q 82,46 88,46 L 98,46 L 88,80 Z' },
      },
      // headlight
      { id: 'headlight', type: 'rect', attrs: { x: 205, y: 90, width: 18, height: 14, rx: 4 } },
      // taillight
      { id: 'taillight', type: 'rect', attrs: { x: 18, y: 90, width: 15, height: 14, rx: 4 } },
      // wheels
      { id: 'left_wheel',  type: 'circle', attrs: { cx: 65,  cy: 128, r: 22 } },
      { id: 'right_wheel', type: 'circle', attrs: { cx: 178, cy: 128, r: 22 } },
    ],
    decorations: [
      // wheel hubcaps
      { type: 'circle', attrs: { cx: 65,  cy: 128, r: 10 }, fill: '#ccc' },
      { type: 'circle', attrs: { cx: 178, cy: 128, r: 10 }, fill: '#ccc' },
      // door line
      { type: 'line', attrs: { x1: 122, y1: 84, x2: 122, y2: 120 }, stroke: '#555', strokeWidth: 1.5 },
      // door handle
      { type: 'rect', attrs: { x: 105, y: 98, width: 14, height: 5, rx: 2 }, fill: '#888' },
    ],
  },

  {
    id: 'rocket',
    label: { en: 'Rocket', he: 'רקטה' },
    emoji: '🚀',
    category: 'vehicles',
    viewBox: '0 0 160 240',
    regions: [
      // flame
      {
        id: 'flame',
        type: 'path',
        attrs: { d: 'M 65,205 C 60,225 80,240 80,240 C 80,240 100,225 95,205 Z' },
      },
      // left fin
      { id: 'left_fin',  type: 'path', attrs: { d: 'M 55,195 L 22,220 L 55,165 Z' } },
      // right fin
      { id: 'right_fin', type: 'path', attrs: { d: 'M 105,195 L 138,220 L 105,165 Z' } },
      // body
      {
        id: 'body',
        type: 'path',
        attrs: { d: 'M 55,50 Q 55,28 80,20 Q 105,28 105,50 L 105,200 L 55,200 Z' },
      },
      // nose cone
      {
        id: 'nose',
        type: 'path',
        attrs: { d: 'M 55,50 Q 55,28 80,20 Q 105,28 105,50 Z' },
      },
      // window
      { id: 'window', type: 'circle', attrs: { cx: 80, cy: 110, r: 22 } },
    ],
    decorations: [
      // window shine
      { type: 'circle', attrs: { cx: 72, cy: 102, r: 7 }, fill: 'rgba(255,255,255,0.5)' },
      // body stripe
      { type: 'line', attrs: { x1: 55, y1: 155, x2: 105, y2: 155 }, stroke: '#aaa', strokeWidth: 2 },
    ],
  },

  {
    id: 'train',
    label: { en: 'Train', he: 'רכבת' },
    emoji: '🚂',
    category: 'vehicles',
    viewBox: '0 0 260 180',
    regions: [
      // main body
      { id: 'body', type: 'rect', attrs: { x: 15, y: 60, width: 160, height: 85, rx: 8 } },
      // front cab (rounded right end)
      {
        id: 'front',
        type: 'path',
        attrs: { d: 'M 175,60 L 230,60 Q 248,60 248,78 L 248,135 Q 248,145 238,145 L 175,145 Z' },
      },
      // chimney
      { id: 'chimney', type: 'rect', attrs: { x: 52, y: 38, width: 22, height: 24, rx: 4 } },
      // windows on body
      { id: 'window1', type: 'rect', attrs: { x: 28,  y: 72, width: 38, height: 30, rx: 5 } },
      { id: 'window2', type: 'rect', attrs: { x: 80,  y: 72, width: 38, height: 30, rx: 5 } },
      { id: 'window3', type: 'rect', attrs: { x: 132, y: 72, width: 32, height: 30, rx: 5 } },
      // front window
      { id: 'front_window', type: 'rect', attrs: { x: 188, y: 70, width: 44, height: 38, rx: 6 } },
      // wheels
      { id: 'left_wheel',   type: 'circle', attrs: { cx: 48,  cy: 152, r: 18 } },
      { id: 'middle_wheel', type: 'circle', attrs: { cx: 108, cy: 152, r: 18 } },
      { id: 'right_wheel',  type: 'circle', attrs: { cx: 168, cy: 152, r: 18 } },
      { id: 'front_wheel',  type: 'circle', attrs: { cx: 222, cy: 152, r: 16 } },
    ],
    decorations: [
      // wheel centers
      { type: 'circle', attrs: { cx: 48,  cy: 152, r: 7 }, fill: '#ccc' },
      { type: 'circle', attrs: { cx: 108, cy: 152, r: 7 }, fill: '#ccc' },
      { type: 'circle', attrs: { cx: 168, cy: 152, r: 7 }, fill: '#ccc' },
      { type: 'circle', attrs: { cx: 222, cy: 152, r: 6 }, fill: '#ccc' },
      // rail line
      { type: 'line', attrs: { x1: 10, y1: 168, x2: 255, y2: 168 }, stroke: '#888', strokeWidth: 3 },
      // smoke puff
      { type: 'circle', attrs: { cx: 63, cy: 28, r: 9  }, fill: '#ddd' },
      { type: 'circle', attrs: { cx: 75, cy: 20, r: 7  }, fill: '#eee' },
      { type: 'circle', attrs: { cx: 85, cy: 14, r: 5  }, fill: '#f5f5f5' },
    ],
  },

  // ─── OBJECTS ─────────────────────────────────────────────────────────────────

  {
    id: 'house',
    label: { en: 'House', he: 'בית' },
    emoji: '🏠',
    category: 'objects',
    viewBox: '0 0 220 220',
    regions: [
      // chimney (behind roof)
      { id: 'chimney', type: 'rect', attrs: { x: 148, y: 42, width: 24, height: 45, rx: 3 } },
      // roof triangle
      { id: 'roof', type: 'path', attrs: { d: 'M 18,95 L 110,22 L 202,95 Z' } },
      // wall
      { id: 'wall', type: 'rect', attrs: { x: 28, y: 93, width: 164, height: 112, rx: 4 } },
      // door
      { id: 'door', type: 'path', attrs: { d: 'M 88,205 L 88,148 Q 88,138 100,138 Q 112,138 112,148 L 112,205 Z' } },
      // windows
      { id: 'window_left',  type: 'rect', attrs: { x: 42,  y: 112, width: 42, height: 40, rx: 4 } },
      { id: 'window_right', type: 'rect', attrs: { x: 136, y: 112, width: 42, height: 40, rx: 4 } },
    ],
    decorations: [
      // window cross-bars
      { type: 'line', attrs: { x1: 63,  y1: 112, x2: 63,  y2: 152 }, stroke: '#666', strokeWidth: 1.5 },
      { type: 'line', attrs: { x1: 42,  y1: 132, x2: 84,  y2: 132 }, stroke: '#666', strokeWidth: 1.5 },
      { type: 'line', attrs: { x1: 157, y1: 112, x2: 157, y2: 152 }, stroke: '#666', strokeWidth: 1.5 },
      { type: 'line', attrs: { x1: 136, y1: 132, x2: 178, y2: 132 }, stroke: '#666', strokeWidth: 1.5 },
      // door knob
      { type: 'circle', attrs: { cx: 106, cy: 175, r: 3 }, fill: '#888' },
      // roof ridge line
      { type: 'line', attrs: { x1: 18, y1: 95, x2: 202, y2: 95 }, stroke: '#555', strokeWidth: 2 },
    ],
  },

  {
    id: 'flower',
    label: { en: 'Flower', he: 'פרח' },
    emoji: '🌸',
    category: 'objects',
    viewBox: '0 0 200 240',
    regions: [
      // stem
      { id: 'stem', type: 'rect', attrs: { x: 93, y: 148, width: 14, height: 72, rx: 4 } },
      // leaves
      {
        id: 'leaf_left',
        type: 'path',
        attrs: { d: 'M 93,180 C 65,165 50,175 60,195 C 70,210 93,196 93,180 Z' },
      },
      {
        id: 'leaf_right',
        type: 'path',
        attrs: { d: 'M 107,180 C 135,165 150,175 140,195 C 130,210 107,196 107,180 Z' },
      },
      // petals – 8 arranged around center
      { id: 'petal_top',    type: 'ellipse', attrs: { cx: 100, cy: 82,  rx: 16, ry: 28, transform: 'rotate(0   100 112)' } },
      { id: 'petal_tr',     type: 'ellipse', attrs: { cx: 100, cy: 82,  rx: 16, ry: 28, transform: 'rotate(45  100 112)' } },
      { id: 'petal_right',  type: 'ellipse', attrs: { cx: 100, cy: 82,  rx: 16, ry: 28, transform: 'rotate(90  100 112)' } },
      { id: 'petal_br',     type: 'ellipse', attrs: { cx: 100, cy: 82,  rx: 16, ry: 28, transform: 'rotate(135 100 112)' } },
      { id: 'petal_bottom', type: 'ellipse', attrs: { cx: 100, cy: 82,  rx: 16, ry: 28, transform: 'rotate(180 100 112)' } },
      { id: 'petal_bl',     type: 'ellipse', attrs: { cx: 100, cy: 82,  rx: 16, ry: 28, transform: 'rotate(225 100 112)' } },
      { id: 'petal_left',   type: 'ellipse', attrs: { cx: 100, cy: 82,  rx: 16, ry: 28, transform: 'rotate(270 100 112)' } },
      { id: 'petal_tl',     type: 'ellipse', attrs: { cx: 100, cy: 82,  rx: 16, ry: 28, transform: 'rotate(315 100 112)' } },
      // center circle on top
      { id: 'center', type: 'circle', attrs: { cx: 100, cy: 112, r: 22 } },
    ],
    decorations: [
      // center texture dots
      { type: 'circle', attrs: { cx: 93,  cy: 106, r: 3 }, fill: '#fff8' },
      { type: 'circle', attrs: { cx: 107, cy: 106, r: 3 }, fill: '#fff8' },
      { type: 'circle', attrs: { cx: 100, cy: 118, r: 3 }, fill: '#fff8' },
    ],
  },

  {
    id: 'sun',
    label: { en: 'Sun', he: 'שמש' },
    emoji: '☀️',
    category: 'objects',
    viewBox: '0 0 220 220',
    regions: [
      // 8 rays at 45° intervals – elongated ellipses rotated around center
      { id: 'ray1', type: 'ellipse', attrs: { cx: 110, cy: 110, rx: 10, ry: 46, transform: 'rotate(0   110 110)' } },
      { id: 'ray2', type: 'ellipse', attrs: { cx: 110, cy: 110, rx: 10, ry: 46, transform: 'rotate(45  110 110)' } },
      { id: 'ray3', type: 'ellipse', attrs: { cx: 110, cy: 110, rx: 10, ry: 46, transform: 'rotate(90  110 110)' } },
      { id: 'ray4', type: 'ellipse', attrs: { cx: 110, cy: 110, rx: 10, ry: 46, transform: 'rotate(135 110 110)' } },
      { id: 'ray5', type: 'ellipse', attrs: { cx: 110, cy: 110, rx: 10, ry: 46, transform: 'rotate(180 110 110)' } },
      { id: 'ray6', type: 'ellipse', attrs: { cx: 110, cy: 110, rx: 10, ry: 46, transform: 'rotate(225 110 110)' } },
      { id: 'ray7', type: 'ellipse', attrs: { cx: 110, cy: 110, rx: 10, ry: 46, transform: 'rotate(270 110 110)' } },
      { id: 'ray8', type: 'ellipse', attrs: { cx: 110, cy: 110, rx: 10, ry: 46, transform: 'rotate(315 110 110)' } },
      // center circle (rendered last = on top)
      { id: 'center', type: 'circle', attrs: { cx: 110, cy: 110, r: 44 } },
    ],
    decorations: [
      // face: eyes
      { type: 'circle', attrs: { cx: 97,  cy: 102, r: 5 }, fill: '#333' },
      { type: 'circle', attrs: { cx: 123, cy: 102, r: 5 }, fill: '#333' },
      // face: smile
      { type: 'path', attrs: { d: 'M 94,118 Q 110,132 126,118' }, stroke: '#333', strokeWidth: 3, fill: 'none' },
    ],
  },
];
