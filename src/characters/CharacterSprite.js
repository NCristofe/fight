// Generic black stick-figure renderer. Deliberately minimal/placeholder
// (no per-character color, no accessories) - see README for how to swap
// in real sprite sheets later without touching combat/animation logic.
const D2R = Math.PI / 180;
const LINE_WIDTH = 9;

const RIG = {
  hip: { x: 0, y: -62 },
  torsoLen: 58,
  headRadius: 18,
  upperLimb: 30,
  lowerLimb: 28,
  swordBlade: 62,
  swordHilt: 8,
  swordGripAngle: 140
};

// The blade is cocked back from the forearm so a hanging arm holds it up and
// forward (a guard stance) instead of pointing at the floor, and it still
// follows every arm pose during slashes.
function drawSword(ctx, handLen) {
  ctx.save();
  ctx.translate(0, handLen);
  ctx.rotate(RIG.swordGripAngle * D2R);
  ctx.lineWidth = LINE_WIDTH * 0.45;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, RIG.swordHilt + RIG.swordBlade);
  ctx.stroke();
  ctx.lineWidth = LINE_WIDTH * 0.4;
  ctx.beginPath();
  ctx.moveTo(-9, RIG.swordHilt);
  ctx.lineTo(9, RIG.swordHilt);
  ctx.stroke();
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

/** Draws a sword lying on the ground (dropped after a disarm). */
export function drawGroundSword(ctx, x, groundY) {
  ctx.save();
  ctx.translate(x, groundY - 6);
  ctx.rotate(-18 * D2R);
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = LINE_WIDTH * 0.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-RIG.swordBlade / 2, 0);
  ctx.lineTo(RIG.swordBlade / 2 + RIG.swordHilt, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(RIG.swordBlade / 2 - 6, -7);
  ctx.lineTo(RIG.swordBlade / 2 - 6, 7);
  ctx.lineWidth = LINE_WIDTH * 0.35;
  ctx.stroke();
  ctx.restore();
}

export function drawCharacter(ctx, x, feetY, facing, pose, opts = {}) {
  const { flash = false, alpha = 1, color = '#161616', hasSword = true } = opts;
  const drawColor = flash ? '#ffffff' : color;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, feetY);
  ctx.scale(facing, 1);
  ctx.translate(pose.offsetX, pose.offsetY);
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

  // front arm (drawn last so it reads on top during strikes) + sword
  withUpperBody(() => {
    ctx.save();
    ctx.translate(0, -RIG.torsoLen);
    strokeChain(ctx, pose.armFront.shoulder, RIG.upperLimb * 0.95, pose.armFront.elbow, RIG.lowerLimb * 0.95, hasSword ? drawSword : null);
    ctx.restore();
  });

  ctx.restore();
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

function lerpPose(a, b, t) {
  return {
    bodyLean: lerp(a.bodyLean, b.bodyLean, t),
    headTilt: lerp(a.headTilt, b.headTilt, t),
    armFront: lerpLimb(a.armFront, b.armFront, t),
    armBack: lerpLimb(a.armBack, b.armBack, t),
    legFront: lerpLeg(a.legFront, b.legFront, t),
    legBack: lerpLeg(a.legBack, b.legBack, t),
    offsetX: lerp(a.offsetX, b.offsetX, t),
    offsetY: lerp(a.offsetY, b.offsetY, t),
    squash: lerp(a.squash, b.squash, t)
  };
}

const easeOut = (t) => 1 - (1 - t) * (1 - t);

/**
 * Smoothly interpolates between consecutive keyframes of an animation
 * (instead of snapping on each frame boundary), so strikes read as fluid
 * motion rather than a slideshow of poses.
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
  const progress = easeOut(Math.min(1, t / current.duration));
  const pose = lerpPose(current.pose, frames[nextIndex].pose, progress);
  return { pose, finished: false, index };
}
