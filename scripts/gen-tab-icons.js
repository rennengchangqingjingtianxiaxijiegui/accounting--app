// 生成底部导航栏 PNG 图标（48x48 RGBA）
// 灰版(iconPath) + 淡蓝版(selectedIconPath)，适配原生 tabBar
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '../client/src/static/icons');
const S = 48;

// 颜色
const GRAY = [0x99, 0x99, 0x99, 0xFF];
const BLUE = [0x4A, 0x90, 0xD9, 0xFF];
const TRANS = [0x00, 0x00, 0x00, 0x00];

function buf(w, h) { return new Uint8Array(w * h * 4); }

function set(b, w, x, y, c) {
  if (x < 0 || y < 0 || x >= w || y >= w) return;
  const o = (y * w + x) * 4;
  b[o]=c[0]; b[o+1]=c[1]; b[o+2]=c[2]; b[o+3]=c[3];
}

// 填充圆
function circle(b, w, cx, cy, r, c) {
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++)
      if (dx*dx + dy*dy <= r*r) set(b, w, cx+dx, cy+dy, c);
}

// 填充矩形
function rect(b, w, x, y, rw, rh, c) {
  for (let dy = 0; dy < rh; dy++)
    for (let dx = 0; dx < rw; dx++)
      set(b, w, x+dx, y+dy, c);
}

// 填充圆角矩形
function rrect(b, w, x, y, rw, rh, r, c) {
  for (let dy = 0; dy < rh; dy++) {
    for (let dx = 0; dx < rw; dx++) {
      let rx = dx < r ? r - dx : (dx > rw - r ? dx - (rw - r) : 0);
      let ry = dy < r ? r - dy : (dy > rh - r ? dy - (rh - r) : 0);
      if (rx*rx + ry*ry <= r*r) set(b, w, x+dx, y+dy, c);
    }
  }
}

// 描边圆
function strokeCircle(b, w, cx, cy, r, stroke, c) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const d2 = dx*dx + dy*dy;
      if (d2 <= r*r && d2 > (r-stroke)*(r-stroke)) set(b, w, cx+dx, cy+dy, c);
    }
  }
}

// 描边圆角矩形
function strokeRrect(b, w, x, y, rw, rh, r, stroke, c) {
  for (let dy = -stroke; dy < rh + stroke; dy++) {
    for (let dx = -stroke; dx < rw + stroke; dx++) {
      const inOuter = inRrect(x - stroke, y - stroke, rw + stroke*2, rh + stroke*2, r+stroke, dx, dy);
      const inInner = inRrect(x + stroke, y + stroke, rw - stroke*2, rh - stroke*2, r - stroke, dx, dy);
      if (inOuter && !inInner) set(b, w, x + dx, y + dy, c);
    }
  }
}

function inRrect(rx, ry, rw, rh, r, dx, dy) {
  if (dx < rx || dy < ry || dx >= rx+rw || dy >= ry+rh) return false;
  let cx = dx < rx+r ? r - (dx-rx) : (dx >= rx+rw-r ? dx-(rx+rw-r) : 0);
  let cy = dy < ry+r ? r - (dy-ry) : (dy >= ry+rh-r ? dy-(ry+rh-r) : 0);
  return cx*cx + cy*cy <= r*r;
}

function filledRrect(b, w, x, y, rw, rh, r, c) {
  for (let dy = 0; dy < rh; dy++)
    for (let dx = 0; dx < rw; dx++)
      if (inRrect(x, y, rw, rh, r, dx, dy)) set(b, w, x+dx, y+dy, c);
}

// ---- 图标绘制函数 ----

// 记账：账本/记事本 + 笔
function drawRecord(b, w, color) {
  // 记事本（圆角矩形）
  strokeRrect(b, w, 6, 2, 30, 38, 4, 2.5, color);
  // 内页横线
  for (let ly = 14; ly <= 32; ly += 7) {
    for (let lx = 11; lx <= 30; lx++) set(b, w, lx, ly, color);
  }
  // 笔（斜线）
  for (let i = 0; i < 8; i++)
    for (let j = -1; j <= 1; j++)
      set(b, w, 35 + i - j, 40 - i + j, color);
  // 笔尖
  for (let i = 0; i < 3; i++) set(b, w, 41 + i, 34 - i, color);
}

// 报表：柱状图
function drawReport(b, w, color) {
  // 三条柱子
  rect(b, w, 7, 24, 9, 18, color);   // 左
  rect(b, w, 20, 10, 9, 32, color);  // 中(最高)
  rect(b, w, 33, 18, 9, 24, color);  // 右
  // 底部横线
  for (let x = 3; x <= 44; x++) {
    for (let y = 42; y <= 44; y++) set(b, w, x, y, color);
  }
}

// 我的：人物
function drawUser(b, w, color) {
  // 头（圆）
  circle(b, w, 24, 10, 9, color);
  // 身体（半圆弧）
  for (let dy = 18; dy <= 42; dy++) {
    const bodyR = 18 - Math.abs(dy - 30) * 0.3;
    for (let dx = -Math.floor(bodyR); dx <= Math.floor(bodyR); dx++) {
      const d2 = dx*dx + (dy-30)*(dy-30)*0.6;
      if (d2 < 200) set(b, w, 24+dx, dy, color);
    }
  }
}

// ---- PNG 编码 ----

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) c = (c & 1) ? ((c >>> 1) ^ 0xEDB88320) : (c >>> 1);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const combined = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(combined), 0);
  return Buffer.concat([len, t, data, crc]);
}

function encodePNG(width, height, pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // raw: filter byte 0 + RGBA per row
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0;
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const dst = y * (1 + width * 4) + 1 + x * 4;
      raw[dst] = pixels[src];
      raw[dst+1] = pixels[src+1];
      raw[dst+2] = pixels[src+2];
      raw[dst+3] = pixels[src+3];
    }
  }

  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

function generate(name, drawFn) {
  const grayBuf = buf(S, S);
  drawFn(grayBuf, S, GRAY);
  fs.writeFileSync(path.join(OUT, `tab-${name}.png`), encodePNG(S, S, grayBuf));

  const blueBuf = buf(S, S);
  drawFn(blueBuf, S, BLUE);
  fs.writeFileSync(path.join(OUT, `tab-${name}-active.png`), encodePNG(S, S, blueBuf));

  console.log(`  tab-${name}.png + tab-${name}-active.png  (48x48 RGBA)`);
}

console.log('生成 tabBar 图标 (48x48)...\n');
generate('record', drawRecord);
generate('report', drawReport);
generate('user', drawUser);
console.log('\n完成！共 6 个文件。');
