/* Generate PNG favicons for Sura Codex (no external deps). */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function pngEncode(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Add filter byte (0) before each row
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

function render(size) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;

  // Background: brand dark navy #0f172a, rounded-ish (radial cut corners approximated by circle)
  // Draw a filled circle background with slight transparency at corners via squared falloff
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const idx = (y * size + x) * 4;
      // Background - dark navy
      buf[idx] = 15; buf[idx + 1] = 23; buf[idx + 2] = 42; buf[idx + 3] = 255;
      // Circular "S" glyph made of dots
      const inCircle = Math.abs(dist - r * 0.55) < size * 0.05;
      if (inCircle) {
        buf[idx] = 200; buf[idx + 1] = 217; buf[idx + 2] = 230; buf[idx + 3] = 255;
      }
    }
  }
  // Draw a gold "S" curve using a few segments
  for (let t = 0; t < 360; t++) {
    const ang = (t * Math.PI) / 180;
    const px = cx + r * 0.5 * Math.cos(ang);
    const py = cy + r * 0.5 * Math.sin(ang);
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const x = Math.round(px + dx);
        const y = Math.round(py + dy);
        if (x >= 0 && x < size && y >= 0 && y < size) {
          const idx = (y * size + x) * 4;
          buf[idx] = 212; buf[idx + 1] = 175; buf[idx + 2] = 55; buf[idx + 3] = 255; // gold #d4af37
        }
      }
    }
  }
  return pngEncode(size, size, buf);
}

/**
 * Build a multi-size .ico container. Modern browsers accept PNG-compressed
 * entries inside ICO (Vista+ and everything current). We embed 16, 32, 48 px
 * PNGs for the classic favicon.ico.
 */
function icoEncode(sizes, renderFn) {
  // ICONDIR header
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(sizes.length, 4);

  const entries = [];
  const images = sizes.map((size) => renderFn(size));
  let offset = 6 + sizes.length * 16;

  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    const png = images[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 = 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bit count
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    entries.push(entry);
  }

  return Buffer.concat([header, ...entries, ...images]);
}

const outDir = path.resolve(__dirname, '../client/public');
const icons = [
  ['favicon-16x16.png', 16],
  ['favicon-32x32.png', 32],
  ['favicon-192x192.png', 192],
  ['favicon-512x512.png', 512],
  ['apple-touch-icon.png', 180],
];

for (const [name, size] of icons) {
  fs.writeFileSync(path.join(outDir, name), render(size));
  console.log(`Generated ${name} (${size}x${size})`);
}

// Generate favicon.ico with multiple embedded sizes
const ico = icoEncode([16, 32, 48], render);
fs.writeFileSync(path.join(outDir, 'favicon.ico'), ico);
console.log('Generated favicon.ico (16+32+48 PNG-embedded)');
console.log('Done.');
