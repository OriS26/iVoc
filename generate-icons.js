import fs from 'fs';
import zlib from 'zlib';

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const toCrc = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(toCrc), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function createPng(width, height) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  // Draw background: slate-900 (#0f172a -> 15, 23, 42)
  // Draw an indigo/violet icon (#6366f1 -> 99, 102, 241) with a stylish "V" (Vocab)
  const cx = width / 2;
  const cy = height / 2;
  const r = width * 0.42;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      
      // Rounded rect / circle base
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Gradient background in circle/rounded shape
      let bgR = 15, bgG = 23, bgB = 42; // #0f172a
      let fgR = 99, fgG = 102, fgB = 241; // #6366f1 (Indigo)

      // Base rounded card
      const cornerR = width * 0.22;
      const qx = Math.max(Math.abs(dx) - (cx - cornerR), 0);
      const qy = Math.max(Math.abs(dy) - (cy - cornerR), 0);
      const cornerDist = Math.sqrt(qx * qx + qy * qy);

      let inCard = cornerDist <= cornerR;
      let alpha = inCard ? 255 : 0;

      // Draw inside card: nice gradient
      let curR = 24, curG = 32, curB = 58;
      // Let's create an inner glowing ring or circle
      if (dist < r * 0.85) {
        curR = 30; curG = 41; curB = 75;
      }

      // Draw "V" logo:
      // Left stroke: from (cx - width*0.25, cy - height*0.25) to (cx, cy + height*0.25)
      // Right stroke: from (cx, cy + height*0.25) to (cx + width*0.25, cy - height*0.25)
      const topY = cy - height * 0.22;
      const botY = cy + height * 0.25;
      const strokeW = width * 0.08;

      let isV = false;
      if (y >= topY && y <= botY) {
        const progress = (y - topY) / (botY - topY);
        const leftX = (cx - width * 0.25) + progress * (width * 0.25);
        const rightX = (cx + width * 0.25) - progress * (width * 0.25);
        if (Math.abs(x - leftX) <= strokeW || Math.abs(x - rightX) <= strokeW) {
          isV = true;
        }
      }

      if (isV && inCard) {
        curR = 129; curG = 140; curB = 248; // #818cf8 (Indigo accent)
      }

      rawData[pxOffset] = inCard ? curR : 0;
      rawData[pxOffset + 1] = inCard ? curG : 0;
      rawData[pxOffset + 2] = inCard ? curB : 0;
      rawData[pxOffset + 3] = alpha;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
}

fs.writeFileSync('public/pwa-512x512.png', createPng(512, 512));
fs.writeFileSync('public/pwa-192x192.png', createPng(192, 192));
fs.writeFileSync('public/apple-touch-icon.png', createPng(180, 180));
fs.writeFileSync('public/favicon.ico', createPng(32, 32)); // PNG favicon works in all modern browsers

console.log('Icons generated successfully.');

