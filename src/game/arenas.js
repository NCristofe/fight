import { LOGICAL_WIDTH as W, LOGICAL_HEIGHT as H, GROUND_Y as G } from '../utils/constants.js';

// Deterministic pseudo-random so static scenery never shimmers between frames.
const rnd = (i) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

function vGradient(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, W, y1 - y0);
}

function glow(ctx, x, y, r, color) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,200,120,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function vignette(ctx, strength = 0.35) {
  const g = ctx.createRadialGradient(W / 2, G * 0.6, G * 0.45, W / 2, G * 0.6, W * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(20,8,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawSwordProp(ctx, x, y, angle, len = 90) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#2b1a0e';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-len / 2 - 14, 0);
  ctx.lineTo(-len / 2, 0);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-len / 2, -9);
  ctx.lineTo(-len / 2, 9);
  ctx.stroke();
  ctx.fillStyle = '#cfd6dc';
  ctx.beginPath();
  ctx.moveTo(-len / 2, -3);
  ctx.lineTo(len / 2, -1);
  ctx.lineTo(len / 2, 1);
  ctx.lineTo(-len / 2, 3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- Dojo
function drawDojo(ctx, t) {
  vGradient(ctx, 0, G, [[0, '#f1e4c2'], [1, '#dcc597']]);

  // shoji panels between wooden posts
  const panelW = W / 6;
  ctx.strokeStyle = 'rgba(92,60,34,0.55)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const x0 = i * panelW;
    for (let k = 1; k < 3; k++) {
      ctx.beginPath();
      ctx.moveTo(x0 + (panelW * k) / 3, 54);
      ctx.lineTo(x0 + (panelW * k) / 3, G - 60);
      ctx.stroke();
    }
    for (let y = 130; y < G - 60; y += 76) {
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + panelW, y);
      ctx.stroke();
    }
  }
  ctx.fillStyle = '#5a3a22';
  for (let i = 0; i <= 6; i++) ctx.fillRect(i * panelW - 7, 46, 14, G - 46);

  // beams and wainscot
  ctx.fillStyle = '#3f2616';
  ctx.fillRect(0, 0, W, 46);
  ctx.fillStyle = '#2a1709';
  ctx.fillRect(0, 46, W, 7);
  ctx.fillStyle = '#6e4a2c';
  ctx.fillRect(0, G - 60, W, 60);
  ctx.fillStyle = '#3f2616';
  ctx.fillRect(0, G - 60, W, 5);

  // hanging scroll with a brush stroke
  const sx = W / 2 - 70;
  ctx.fillStyle = '#f8efd6';
  ctx.fillRect(sx, 86, 140, 240);
  ctx.fillStyle = '#3f2616';
  ctx.fillRect(sx - 6, 80, 152, 10);
  ctx.fillRect(sx - 6, 322, 152, 10);
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(W / 2 - 38, 136);
  ctx.bezierCurveTo(W / 2 + 60, 150, W / 2 - 60, 230, W / 2 + 34, 296);
  ctx.stroke();
  ctx.fillStyle = '#b3261e';
  ctx.fillRect(W / 2 + 34, 270, 26, 26);

  // sword rack
  ctx.fillStyle = '#3f2616';
  ctx.fillRect(48, G - 210, 12, 210);
  ctx.fillRect(168, G - 210, 12, 210);
  ctx.fillRect(48, G - 190, 132, 10);
  ctx.fillRect(48, G - 130, 132, 10);
  drawSwordProp(ctx, 114, G - 198, -0.04, 110);
  drawSwordProp(ctx, 114, G - 138, 0.03, 110);

  // paper lanterns, swaying
  [210, 760].forEach((lx, i) => {
    const sway = Math.sin(t / 900 + i * 2) * 7;
    ctx.strokeStyle = '#2a1709';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lx, 53);
    ctx.lineTo(lx + sway, 104);
    ctx.stroke();
    glow(ctx, lx + sway, 140, 120, 'rgba(255,196,96,0.42)');
    ctx.fillStyle = '#c2362a';
    ctx.beginPath();
    ctx.ellipse(lx + sway, 140, 27, 36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(80,10,5,0.6)';
    for (let k = -2; k <= 2; k++) {
      ctx.beginPath();
      ctx.ellipse(lx + sway, 140, 27, 6 + Math.abs(k) * 7, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#2a1709';
    ctx.fillRect(lx + sway - 12, 102, 24, 6);
    ctx.fillRect(lx + sway - 12, 172, 24, 6);
  });

  // polished wooden floor
  vGradient(ctx, G, H, [[0, '#cfa169'], [1, '#98693a']]);
  ctx.fillStyle = '#4e301a';
  ctx.fillRect(0, G, W, 5);
  ctx.strokeStyle = 'rgba(60,34,14,0.55)';
  ctx.lineWidth = 2;
  [G + 16, G + 38, G + 66, G + 100].forEach((y, row) => {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    const step = 120 + row * 30;
    for (let x = (row % 2) * (step / 2); x < W; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + [22, 28, 34, 40][row]);
      ctx.stroke();
    }
  });
  vignette(ctx, 0.3);
}

// -------------------------------------------------------------- Castle
function drawTorch(ctx, x, y, t, seed) {
  const f = 0.85 + Math.sin(t / 90 + seed) * 0.1 + Math.sin(t / 47 + seed * 2) * 0.05;
  glow(ctx, x, y - 12, 130, 'rgba(255,170,70,0.5)');
  ctx.fillStyle = '#2b2118';
  ctx.fillRect(x - 5, y, 10, 40);
  ctx.fillRect(x - 12, y - 2, 24, 8);
  ctx.fillStyle = '#e8590c';
  ctx.beginPath();
  ctx.ellipse(x, y - 14, 13 * f, 26 * f, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffb02e';
  ctx.beginPath();
  ctx.ellipse(x, y - 10, 8 * f, 17 * f, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff2b0';
  ctx.beginPath();
  ctx.ellipse(x, y - 6, 4 * f, 9 * f, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawCastle(ctx, t) {
  vGradient(ctx, 0, G, [[0, '#7c6aa8'], [0.45, '#e58f6e'], [1, '#f8cf84']]);

  // distant towers
  ctx.fillStyle = '#5a4a78';
  [[40, 90], [150, 130], [330, 70], [620, 110], [770, 80], [880, 140]].forEach(([x, h], i) => {
    ctx.fillRect(x, 190 - h, 56, h + 10);
    for (let m = 0; m < 3; m++) ctx.fillRect(x + m * 22, 190 - h - 12, 12, 12);
    ctx.fillStyle = Math.sin(t / 700 + i) > -0.2 ? '#ffd37a' : '#5a4a78';
    ctx.fillRect(x + 22, 190 - h + 22, 10, 16);
    ctx.fillStyle = '#5a4a78';
  });

  // stone curtain wall with battlements
  ctx.fillStyle = '#a79f94';
  ctx.fillRect(0, 196, W, G - 196);
  ctx.fillStyle = '#948c81';
  for (let x = 0; x < W; x += 64) ctx.fillRect(x + 6, 170, 38, 28);

  ctx.strokeStyle = 'rgba(70,60,50,0.38)';
  ctx.lineWidth = 2;
  for (let row = 0, y = 196; y < G; row++, y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    for (let x = (row % 2) * 40; x < W; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 30);
      ctx.stroke();
    }
  }

  // arched alcoves
  [290, 670].forEach((ax) => {
    ctx.fillStyle = '#6a635a';
    ctx.beginPath();
    ctx.moveTo(ax - 44, G);
    ctx.lineTo(ax - 44, 300);
    ctx.arc(ax, 300, 44, Math.PI, 0);
    ctx.lineTo(ax + 44, G);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#4d463e';
    ctx.lineWidth = 5;
    ctx.stroke();
  });

  // hanging banner
  const bx = W / 2;
  ctx.fillStyle = '#9d1f1f';
  ctx.beginPath();
  ctx.moveTo(bx - 50, 200);
  ctx.lineTo(bx + 50, 200);
  ctx.lineTo(bx + 50, 380);
  ctx.lineTo(bx, 350);
  ctx.lineTo(bx - 50, 380);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8c35c';
  ctx.fillRect(bx - 56, 194, 112, 10);
  ctx.beginPath();
  ctx.moveTo(bx, 240);
  ctx.lineTo(bx + 22, 275);
  ctx.lineTo(bx, 310);
  ctx.lineTo(bx - 22, 275);
  ctx.closePath();
  ctx.fill();

  drawTorch(ctx, 130, 250, t, 1);
  drawTorch(ctx, 830, 250, t, 4);

  // flagstone courtyard
  vGradient(ctx, G, H, [[0, '#a29b91'], [1, '#6f6960']]);
  ctx.fillStyle = '#4a443d';
  ctx.fillRect(0, G, W, 5);
  ctx.strokeStyle = 'rgba(40,34,28,0.5)';
  ctx.lineWidth = 2;
  [G + 22, G + 52, G + 90].forEach((y, row) => {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    const step = 150 + row * 40;
    for (let x = (row % 2) * (step / 2); x < W; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + [30, 38, 50][row]);
      ctx.stroke();
    }
  });
  vignette(ctx, 0.28);
}

// -------------------------------------------------------------- Bamboo
function drawStalk(ctx, x, width, color, nodeColor, gap, seed) {
  ctx.fillStyle = color;
  ctx.fillRect(x - width / 2, -10, width, G + 14);
  ctx.fillStyle = nodeColor;
  const off = rnd(seed) * gap;
  for (let y = off; y < G; y += gap) ctx.fillRect(x - width / 2 - 2, y, width + 4, Math.max(3, width * 0.16));
}

function drawLeaves(ctx, x, y, size, color, seed) {
  ctx.fillStyle = color;
  for (let k = 0; k < 5; k++) {
    const a = -1.2 + k * 0.6 + rnd(seed + k) * 0.3;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(size * 0.55, 0, size * 0.55, size * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawBamboo(ctx, t) {
  vGradient(ctx, 0, G, [[0, '#e6f3ee'], [1, '#b7d5c8']]);
  glow(ctx, 710, 110, 170, 'rgba(255,252,225,0.9)');
  ctx.fillStyle = '#fffbe6';
  ctx.beginPath();
  ctx.arc(710, 110, 52, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 16; i++) drawStalk(ctx, 30 + i * 62 + rnd(i) * 24, 10, 'rgba(120,170,150,0.45)', 'rgba(80,130,110,0.5)', 64, i);

  // drifting fog
  for (let b = 0; b < 3; b++) {
    const drift = ((t / (60 + b * 25) + b * 300) % (W + 600)) - 300;
    const g = ctx.createLinearGradient(drift - 300, 0, drift + 300, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.32)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(drift - 300, 180 + b * 70, 600, 60);
  }

  for (let i = 0; i < 9; i++) {
    const x = 50 + i * 112 + rnd(i + 40) * 30;
    drawStalk(ctx, x, 17, '#6c9f86', '#4c7d66', 92, i + 40);
  }

  // foreground stalks framing the arena
  [[34, 34], [118, 26], [846, 28], [928, 36]].forEach(([x, w], i) => {
    drawStalk(ctx, x, w, '#35654e', '#264a39', 120, i + 80);
    drawLeaves(ctx, x + w / 2, 90 + i * 40, 90, '#4f8d62', i * 7);
    drawLeaves(ctx, x - w / 2, 190 + i * 30, 80, '#44795a', i * 11 + 3);
  });

  // packed earth ground with grass tufts
  vGradient(ctx, G, H, [[0, '#d2bf95'], [1, '#a8935f']]);
  ctx.fillStyle = '#7a6a3f';
  ctx.fillRect(0, G, W, 4);
  ctx.strokeStyle = '#6f9a5e';
  ctx.lineWidth = 2;
  for (let i = 0; i < 26; i++) {
    const x = rnd(i + 200) * W;
    const y = G + 8 + rnd(i + 300) * 70;
    for (let k = -1; k <= 1; k++) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + k * 5, y - 10 - rnd(i + k) * 6);
      ctx.stroke();
    }
  }

  // falling leaves
  ctx.fillStyle = '#6aa874';
  for (let i = 0; i < 12; i++) {
    const x = (rnd(i + 500) * W + t * (0.02 + rnd(i) * 0.03) + Math.sin(t / 600 + i) * 24) % W;
    const y = (rnd(i + 600) * G + t * (0.03 + rnd(i + 9) * 0.03)) % G;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t / 500 + i);
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  vignette(ctx, 0.22);
}

export const ARENAS = [
  { id: 'dojo', name: 'Dojo ao Entardecer', draw: drawDojo },
  { id: 'castelo', name: 'Patio do Castelo', draw: drawCastle },
  { id: 'bambuzal', name: 'Bambuzal na Neblina', draw: drawBamboo }
];

export function getArenaById(id) {
  return ARENAS.find((a) => a.id === id) || ARENAS[0];
}
