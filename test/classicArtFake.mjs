// DF-ART (world/classicArt.js): A STAND-IN FOR THE PLAYER'S ARENA2 IN THE TESTS - no game data enters the repo, so the
// port's models' Daggerfall pictures are read here through a `classicRgba` whose every picture NAMES the record it is:
// each texel of (archive, record) is `texelOf(archive, record)`. Two records keep their own shape, for the laws that
// read it: Daggerfall's leaded window (54_43 - its panes 47,59,60 between leads 103,103,116 at rows 11-46, columns
// 12-63, timber round them; world/classicArt.js isGlass) and the brazier's fire flat (210_0 - 40 x 52, its flames over
// its bowl, everything else clear).

/** The colour every texel of a fake (archive, record) wears. */
export const texelOf = (archive, record) => [archive & 255, record & 255, (archive >> 8) & 255];
export const PANE = Object.freeze([47, 59, 60]);
export const LEAD = Object.freeze([103, 103, 116]);
export const TIMBER = Object.freeze([122, 75, 43]);

function picture(w, h, at) {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [r, g, b, a = 255] = at(x, y), i = (y * w + x) * 4;
    data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = a;
  }
  return { width: w, height: h, data };
}
const window5443 = () => picture(64, 100, (x, y) => {
  if (y < 11 || y > 46 || x < 12) return TIMBER;
  return (x - 12) % 6 === 1 || (y - 11) % 6 === 1 ? LEAD : PANE;
});
const fire2100 = () => picture(40, 52, (x, y) => (y >= 27 ? [180, 150, 40] : Math.abs(x - 20) < 2 + y / 3 ? [250, 170, 40] : [0, 0, 0, 0]));

/**
 * The reader: `classicRgba(archive, record, frame)` resolving to a top-down RGBA picture (64 x 64 but the two above),
 * or null for a record named in `missing` (`[[archive, record], ...]` - not in that player's data). `asked` lists every
 * call, in order.
 */
export function fakeClassicRgba({ missing = [], size = 64 } = {}) {
  const asked = [];
  const read = async (archive, record, frame = 0) => {
    asked.push([archive, record, frame]);
    if (missing.some(([a, r]) => a === archive && r === record)) return null;
    if (archive === 54 && record === 43) return window5443();
    if (archive === 210 && record === 0) return fire2100();
    const c = texelOf(archive, record);
    return picture(size, size, () => c);
  };
  read.asked = asked;
  return read;
}

/** The colour of a picture's texel (x, y), and its alpha. */
export const texel = (pic, x, y) => { const i = (y * pic.width + x) * 4; return [pic.data[i], pic.data[i + 1], pic.data[i + 2], pic.data[i + 3]]; };
