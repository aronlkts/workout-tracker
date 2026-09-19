// Draws the RepWeek mark straight to PNG. The box has no image tooling
// installed, and the mark is only rectangles, so a tiny encoder beats a
// dependency. Shapes are rendered at 4x and boxed down for clean edges.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const BG = [0x14, 0x15, 0x1a];
const FG = [0xc6, 0xff, 0x4d];
const SS = 4;

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolour
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 3 + 1);
    raw[rowStart] = 0; // filter: none
    rgb.copy(raw, rowStart + 1, y * size * 3, (y + 1) * size * 3);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Dumbbell on a unit square: bar, inner plates, outer plates. */
function inGlyph(x, y, scale) {
  const c = 0.5;
  const at = (v) => (v - c) / scale + c;
  const u = at(x);
  const v = at(y);
  const rect = (x0, x1, y0, y1) => u >= x0 && u <= x1 && v >= y0 && v <= y1;
  return (
    rect(0.25, 0.75, 0.455, 0.545) ||
    rect(0.215, 0.305, 0.36, 0.64) ||
    rect(0.695, 0.785, 0.36, 0.64) ||
    rect(0.155, 0.215, 0.405, 0.595) ||
    rect(0.785, 0.845, 0.405, 0.595)
  );
}

function inRounded(u, v, radius) {
  const dx = Math.max(radius - u, 0, u - (1 - radius));
  const dy = Math.max(radius - v, 0, v - (1 - radius));
  return dx * dx + dy * dy <= radius * radius;
}

function render(size, { radius = 0.18, scale = 1 } = {}) {
  const big = size * SS;
  const out = Buffer.alloc(size * size * 3);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let bg = 0;
      let fg = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const u = (x * SS + sx + 0.5) / big;
          const v = (y * SS + sy + 0.5) / big;
          if (!inRounded(u, v, radius)) continue;
          bg += 1;
          if (inGlyph(u, v, scale)) fg += 1;
        }
      }
      const total = SS * SS;
      const i = (y * size + x) * 3;
      for (let ch = 0; ch < 3; ch++) {
        // Outside the rounded shape stays flat background, so the icon is
        // opaque everywhere — iOS does its own masking.
        const inside = (BG[ch] * (bg - fg) + FG[ch] * fg) / Math.max(bg, 1);
        out[i + ch] = Math.round((inside * bg + BG[ch] * (total - bg)) / total);
      }
    }
  }
  return encodePng(size, out);
}

const targets = [
  ['public/icon-192.png', 192, { radius: 0.18, scale: 1 }],
  ['public/icon-512.png', 512, { radius: 0.18, scale: 1 }],
  // Maskable art must survive a circular crop, so the glyph sits smaller.
  ['public/icon-maskable-512.png', 512, { radius: 0, scale: 0.68 }],
  ['public/apple-touch-icon.png', 180, { radius: 0, scale: 1 }],
];

for (const [path, size, opts] of targets) {
  writeFileSync(path, render(size, opts));
  console.log(`wrote ${path} (${size}x${size})`);
}

writeFileSync(
  'public/favicon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="18" fill="#14151A"/>
  <g fill="#C6FF4D">
    <rect x="25" y="45.5" width="50" height="9"/>
    <rect x="21.5" y="36" width="9" height="28"/>
    <rect x="69.5" y="36" width="9" height="28"/>
    <rect x="15.5" y="40.5" width="6" height="19"/>
    <rect x="78.5" y="40.5" width="6" height="19"/>
  </g>
</svg>
`,
);
console.log('wrote public/favicon.svg');
