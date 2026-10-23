import { LOGICAL_WIDTH, LOGICAL_HEIGHT, GROUND_Y } from '../utils/constants.js';

function skyGradient(ctx, top, bottom) {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, LOGICAL_WIDTH, GROUND_Y);
}

function groundStrip(ctx, color, lineColor) {
  ctx.fillStyle = color;
  ctx.fillRect(0, GROUND_Y, LOGICAL_WIDTH, LOGICAL_HEIGHT - GROUND_Y);
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  for (let x = -40; x < LOGICAL_WIDTH + 40; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y + 4);
    ctx.lineTo(x - 18, LOGICAL_HEIGHT);
    ctx.stroke();
  }
}

function buildingsSilhouette(ctx, color, seedOffset, t, twinkle) {
  ctx.fillStyle = color;
  const count = 9;
  const w = LOGICAL_WIDTH / count;
  for (let i = 0; i < count; i++) {
    const h = 90 + ((i * 53 + seedOffset * 31) % 140);
    const x = i * w;
    ctx.fillRect(x, GROUND_Y - h, w - 6, h);
    if (twinkle) {
      const flick = Math.sin(t / 400 + i * 1.7) > 0.6;
      ctx.fillStyle = flick ? '#ffe08a' : '#3a3a55';
      for (let wy = GROUND_Y - h + 10; wy < GROUND_Y - 10; wy += 16) {
        for (let wx = x + 6; wx < x + w - 10; wx += 14) {
          ctx.fillRect(wx, wy, 6, 8);
        }
      }
      ctx.fillStyle = color;
    }
  }
}

export const ARENAS = [
  {
    id: 'praca',
    name: 'Praca da Republica',
    draw(ctx, t) {
      skyGradient(ctx, '#7ec8e3', '#cfe8c9');
      buildingsSilhouette(ctx, '#5a7a9c', 2, t, false);
      // praca statue silhouette
      ctx.fillStyle = '#8c8c8c';
      ctx.fillRect(LOGICAL_WIDTH / 2 - 10, GROUND_Y - 150, 20, 110);
      ctx.beginPath();
      ctx.arc(LOGICAL_WIDTH / 2, GROUND_Y - 160, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6fae6f';
      for (let i = 0; i < 6; i++) {
        const x = 40 + i * 160;
        ctx.beginPath();
        ctx.arc(x, GROUND_Y - 40, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#5a3d2b';
        ctx.fillRect(x - 5, GROUND_Y - 20, 10, 24);
        ctx.fillStyle = '#6fae6f';
      }
      groundStrip(ctx, '#c9b183', '#a9926b');
    }
  },
  {
    id: 'avenida',
    name: 'Avenida das Luzes',
    draw(ctx, t) {
      skyGradient(ctx, '#140a2b', '#3a2060');
      buildingsSilhouette(ctx, '#241a3d', 5, t, true);
      ctx.fillStyle = '#ff5fa2';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      const blink = Math.sin(t / 300) > 0 ? 1 : 0.4;
      ctx.globalAlpha = blink;
      ctx.fillText('BR FIGHTER', LOGICAL_WIDTH / 2, 90);
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
      groundStrip(ctx, '#201a30', '#6a5fae');
      ctx.fillStyle = '#f4e04d';
      for (let i = 0; i < 4; i++) {
        const x = ((t / 10 + i * 260) % (LOGICAL_WIDTH + 200)) - 100;
        ctx.fillRect(x, GROUND_Y - 6, 70, 5);
      }
    }
  },
  {
    id: 'palco',
    name: 'Palco do Debate',
    draw(ctx, t) {
      skyGradient(ctx, '#1b1b2b', '#3b2440');
      ctx.fillStyle = '#5c1f2e';
      ctx.fillRect(0, 60, LOGICAL_WIDTH, GROUND_Y - 60);
      for (let i = 0; i < 14; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#6c2435' : '#53192a';
        ctx.fillRect((i * LOGICAL_WIDTH) / 14, 60, LOGICAL_WIDTH / 14 - 2, GROUND_Y - 60);
      }
      const sway = Math.sin(t / 900) * 8;
      ctx.fillStyle = 'rgba(255,255,220,0.12)';
      ctx.beginPath();
      ctx.moveTo(LOGICAL_WIDTH * 0.25 + sway, 0);
      ctx.lineTo(LOGICAL_WIDTH * 0.25 - 80 + sway, GROUND_Y);
      ctx.lineTo(LOGICAL_WIDTH * 0.25 + 80 + sway, GROUND_Y);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(LOGICAL_WIDTH * 0.75 - sway, 0);
      ctx.lineTo(LOGICAL_WIDTH * 0.75 - 80 - sway, GROUND_Y);
      ctx.lineTo(LOGICAL_WIDTH * 0.75 + 80 - sway, GROUND_Y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#caa24a';
      ctx.fillRect(60, GROUND_Y - 90, 70, 90);
      ctx.fillRect(LOGICAL_WIDTH - 130, GROUND_Y - 90, 70, 90);
      groundStrip(ctx, '#3c2230', '#6c3a4a');
    }
  }
];

export function getArenaById(id) {
  return ARENAS.find((a) => a.id === id) || ARENAS[0];
}
