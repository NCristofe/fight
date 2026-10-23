// Stick-figure swordsman renderer. All poses are authored for a fighter facing
// right; facing left is a single mirror. The sword angle is independent of the
// forearm (pose.sword) so blade arcs can be animated separately from the arm.
const D2R = Math.PI / 180;
const LINE_WIDTH = 9;

const RIG = {
  hip: { x: 0, y: -62 },
  torsoLen: 58,
  headRadius: 18,
  upperLimb: 30,
  lowerLimb: 28,
  swordBlade: 70,
  swordHilt: 10
};

const STEEL = '#dfe5ea';
const STEEL_FLASH = '#ffffff';

let lastTipDevice = null;

function drawBlade(ctx, outline, steel) {
  const len = RIG.swordBlade;
  const base = RIG.swordHilt;
  // grip
  ctx.lineWidth = LINE_WIDTH * 0.55;
  ctx.strokeStyle = outline;
  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.lineTo(0, base);
  ctx.stroke();
  // pommel
  ctx.fillStyle = outline;
  ctx.beginPath();
  ctx.arc(0, -3, LINE_WIDTH * 0.4, 0, Math.PI * 2);
  ctx.fill();
  // crossguard
  ctx.lineWidth = LINE_WIDTH * 0.5;
  ctx.beginPath();
  ctx.moveTo(-10, base);
  ctx.lineTo(10, base);
  ctx.stroke();
  // blade: outlined tapered steel
  ctx.beginPath();
  ctx.moveTo(-3.4, base);
  ctx.lineTo(3.4, base);
  ctx.lineTo(0.8, base + len);
  ctx.lineTo(-0.8, base + len);
  ctx.closePath();
  ctx.fillStyle = steel;
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = outline;
  ctx.stroke();
}

function drawHeldSword(ctx, handLen, angle, outline, steel) {
  ctx.save();
  ctx.translate(0, handLen);
  ctx.rotate(angle * D2R);
  drawBlade(ctx, outline, steel);
  const m = ctx.getTransform();
  const p = m.transformPoint(new DOMPoint(0, RIG.swordHilt + RIG.swordBlade));
  lastTipDevice = { x: p.x, y: p.y };
  ctx.restore();
}

function strokeChain(ctx, upperAngle, upperLen, lowerAngle, lowerLen, tipDraw) {
  ctx.save();
  ctx.rotate(upperAngle * D2R);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, upperLen);
  ctx.stroke();
  ctx.translate(0, upperLen);
  ctx.beginPath();
  ctx.arc(0, 0, LINE_WIDTH * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(lowerAngle * D2R);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, lowerLen);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, lowerLen, LINE_WIDTH * 0.4, 0, Math.PI * 2);
  ctx.fill();
  if (tipDraw) tipDraw(ctx, lowerLen);
  ctx.restore();
}

/** Sword lying on the ground (dropped after a disarm). */
export function drawGroundSword(ctx, x, groundY, time = 0) {
  const pulse = 0.5 + 0.5 * Math.sin(time / 260);
  ctx.save();
  ctx.fillStyle = `rgba(255, 236, 150, ${0.25 + pulse * 0.25})`;
  ctx.beginPath();
  ctx.ellipse(x, groundY + 2, 52 + pulse * 6, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(x, groundY - 7);
  ctx.rotate(-14 * D2R);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // draw the sword horizontally: rotate blade axis from +y to +x
  ctx.rotate(-90 * D2R);
  ctx.translate(0, -RIG.swordBlade / 2);
  drawBlade(ctx, '#1c1c1c', STEEL);
  ctx.restore();
}

/**
 * Draws the fighter. Returns the world-space (logical coords) position of the
 * sword tip, or null if unarmed, so the renderer can trace blade trails.
 */
export function drawCharacter(ctx, x, feetY, facing, pose, opts = {}) {
  const { flash = false, alpha = 1, color = '#161616', hasSword = true } = opts;
  const drawColor = flash ? '#ffffff' : color;
  const steel = flash ? STEEL_FLASH : STEEL;
  const base = ctx.getTransform();
  lastTipDevice = null;

  // Lowest foot decides ground contact, so bent knees lower the whole body
  // instead of leaving the feet floating.
  const footDrop = (leg) =>
    RIG.hip.y + RIG.upperLimb * Math.cos(leg.hip * D2R) + RIG.lowerLimb * Math.cos((leg.hip + leg.knee) * D2R);
  const groundShift = -Math.max(footDrop(pose.legFront), footDrop(pose.legBack));

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, feetY);
  ctx.scale(facing, 1);
  ctx.translate(pose.offsetX, pose.offsetY + groundShift);
  if (pose.tilt) ctx.rotate(pose.tilt * D2R);
  ctx.scale(1, pose.squash);

  ctx.strokeStyle = drawColor;
  ctx.fillStyle = drawColor;
  ctx.lineWidth = LINE_WIDTH;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // back leg
  ctx.save();
  ctx.translate(RIG.hip.x, RIG.hip.y);
  strokeChain(ctx, pose.legBack.hip, RIG.upperLimb, pose.legBack.knee, RIG.lowerLimb);
  ctx.restore();

  const withUpperBody = (fn) => {
    ctx.save();
    ctx.translate(RIG.hip.x, RIG.hip.y);
    ctx.rotate(pose.bodyLean * D2R);
    fn();
    ctx.restore();
  };

  // back arm + torso + head
  withUpperBody(() => {
    ctx.save();
    ctx.translate(0, -RIG.torsoLen);
    strokeChain(ctx, pose.armBack.shoulder, RIG.upperLimb * 0.95, pose.armBack.elbow, RIG.lowerLimb * 0.95);
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -RIG.torsoLen);
    ctx.stroke();

    ctx.save();
    ctx.translate(0, -RIG.torsoLen);
    ctx.rotate(pose.headTilt * D2R);
    ctx.beginPath();
    ctx.arc(0, -RIG.headRadius, RIG.headRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // front leg
  ctx.save();
  ctx.translate(RIG.hip.x, RIG.hip.y);
  strokeChain(ctx, pose.legFront.hip, RIG.upperLimb, pose.legFront.knee, RIG.lowerLimb);
  ctx.restore();

  // sword arm last so the blade reads on top of everything
  withUpperBody(() => {
    ctx.save();
    ctx.translate(0, -RIG.torsoLen);
    const tip = hasSword
      ? (c, handLen) => drawHeldSword(c, handLen, pose.sword, drawColor, steel)
      : null;
    strokeChain(ctx, pose.armFront.shoulder, RIG.upperLimb * 0.95, pose.armFront.elbow, RIG.lowerLimb * 0.95, tip);
    ctx.restore();
  });

  ctx.restore();

  if (!lastTipDevice) return null;
  const p = base.inverse().transformPoint(new DOMPoint(lastTipDevice.x, lastTipDevice.y));
  return { x: p.x, y: p.y };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpLimb(a, b, t) {
  return { shoulder: lerp(a.shoulder, b.shoulder, t), elbow: lerp(a.elbow, b.elbow, t) };
}

function lerpLeg(a, b, t) {
  return { hip: lerp(a.hip, b.hip, t), knee: lerp(a.knee, b.knee, t) };
}

export function lerpPose(a, b, t) {
  return {
    bodyLean: lerp(a.bodyLean, b.bodyLean, t),
    headTilt: lerp(a.headTilt, b.headTilt, t),
    armFront: lerpLimb(a.armFront, b.armFront, t),
    armBack: lerpLimb(a.armBack, b.armBack, t),
    legFront: lerpLeg(a.legFront, b.legFront, t),
    legBack: lerpLeg(a.legBack, b.legBack, t),
    sword: lerp(a.sword, b.sword, t),
    tilt: lerp(a.tilt, b.tilt, t),
    offsetX: lerp(a.offsetX, b.offsetX, t),
    offsetY: lerp(a.offsetY, b.offsetY, t),
    squash: lerp(a.squash, b.squash, t)
  };
}

const EASINGS = {
  out: (t) => 1 - (1 - t) * (1 - t),
  in: (t) => t * t,
  inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  linear: (t) => t
};

/**
 * Interpolates between keyframes. Each frame may set `ease` ('in' for
 * wind-ups that accelerate into the strike, 'out' for recoveries, etc.);
 * the easing shapes the motion INTO the next frame.
 */
export function interpolateFrame(animation, elapsedMs) {
  const frames = animation.frames;
  if (frames.length <= 1) {
    return { pose: frames[0].pose, finished: !animation.loop, index: 0 };
  }

  let t = elapsedMs;
  let index = 0;
  while (index < frames.length - 1 && t >= frames[index].duration) {
    t -= frames[index].duration;
    index += 1;
  }

  const atLastFrame = index === frames.length - 1;
  if (atLastFrame && !animation.loop) {
    return { pose: frames[index].pose, finished: elapsedMs >= frames[index].duration, index };
  }

  const current = frames[index];
  const nextIndex = (index + 1) % frames.length;
  const ease = EASINGS[current.ease] || EASINGS.out;
  const progress = ease(Math.min(1, t / current.duration));
  const pose = lerpPose(current.pose, frames[nextIndex].pose, progress);
  return { pose, finished: false, index };
}
