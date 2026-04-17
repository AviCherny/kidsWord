// Each level defines a target grid (5×5 by default)
// Colors: R=red, B=blue, Y=yellow, G=green, O=orange, P=purple, W=white(empty)
// null = empty cell

export const LEGO_LEVELS = [
  {
    id: 0,
    name: 'Heart ❤️',
    cols: 3,
    rows: 3,
    grid: [
      ['R',  'R',  'R' ],
      ['R',  'R',  'R' ],
      [null, 'R',  null],
    ],
    palette: ['R'],
  },
  {
    id: 1,
    name: 'House 🏠',
    cols: 5,
    rows: 5,
    // Row 0 = top
    grid: [
      [null, null, 'R',  null, null],
      [null, 'R',  'R',  'R',  null],
      ['Y',  'Y',  'Y',  'Y',  'Y' ],
      ['Y',  'B',  'Y',  'B',  'Y' ],
      ['Y',  'Y',  'G',  'Y',  'Y' ],
    ],
    palette: ['R', 'Y', 'B', 'G'],
  },
  {
    id: 2,
    name: 'Rocket 🚀',
    cols: 5,
    rows: 6,
    grid: [
      [null, null, 'R',  null, null],
      [null, 'R',  'R',  'R',  null],
      [null, 'B',  'B',  'B',  null],
      [null, 'B',  'B',  'B',  null],
      ['O',  'B',  'B',  'B',  'O' ],
      [null, 'O',  null, 'O',  null],
    ],
    palette: ['R', 'B', 'O'],
  },
  {
    id: 3,
    name: 'Tree 🌲',
    cols: 5,
    rows: 5,
    grid: [
      [null, null, 'G',  null, null],
      [null, 'G',  'G',  'G',  null],
      ['G',  'G',  'G',  'G',  'G' ],
      [null, null, 'Y',  null, null],
      [null, null, 'Y',  null, null],
    ],
    palette: ['G', 'Y'],
  },
  {
    id: 4,
    name: 'Robot 🤖',
    cols: 5,
    rows: 6,
    grid: [
      [null, 'B',  'B',  'B',  null],
      ['B',  'G',  'B',  'G',  'B' ],
      ['B',  'B',  'B',  'B',  'B' ],
      [null, 'B',  'B',  'B',  null],
      ['B',  null, null, null, 'B' ],
      ['B',  null, null, null, 'B' ],
    ],
    palette: ['B', 'G', 'R'],
  },
  {
    id: 5,
    name: 'Butterfly 🦋',
    cols: 7,
    rows: 5,
    grid: [
      ['P',  null, null, 'O',  null, null, 'P' ],
      ['P',  'P',  null, 'O',  null, 'P',  'P' ],
      [null, 'P',  'P',  'Y',  'P',  'P',  null],
      [null, null, 'P',  'Y',  'P',  null, null],
      [null, null, null, 'Y',  null, null, null],
    ],
    palette: ['P', 'O', 'Y'],
  },
  {
    id: 6,
    name: 'Crown 👑',
    cols: 7,
    rows: 4,
    grid: [
      ['Y',  null, 'Y',  null, 'Y',  null, 'Y' ],
      ['Y',  'Y',  'Y',  'Y',  'Y',  'Y',  'Y' ],
      ['Y',  'R',  'Y',  'B',  'Y',  'R',  'Y' ],
      ['Y',  'Y',  'Y',  'Y',  'Y',  'Y',  'Y' ],
    ],
    palette: ['Y', 'R', 'B'],
  },
];

export const COLOR_MAP = {
  R: { fill: '#ef5350', label: 'Red'    },
  B: { fill: '#42a5f5', label: 'Blue'   },
  Y: { fill: '#ffd54f', label: 'Yellow' },
  G: { fill: '#66bb6a', label: 'Green'  },
  O: { fill: '#ff8a65', label: 'Orange' },
  P: { fill: '#ab47bc', label: 'Purple' },
};
