// Draws the procedural "paper rig" placeholder sprite described in
// characterAnimations.js. All poses are authored assuming the fighter faces
// right; facing left is handled by a single horizontal mirror, so pose data
// never needs to be duplicated.
const D2R = Math.PI / 180;

const RIG = {
  hip: { x: 0, y: -62 },
  torsoLen: 58,
  headRadius: 17,
  upperLimb: 30,
  lowerLimb: 28,
  limbWidth: 14
};

function roundedLimb(ctx, length, width, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-width / 2, 0);
  ctx.lineTo(width / 2, 0);
  ctx.lineTo(width / 2 - 2, length);
  ctx.lineTo(-width / 2 + 2, length);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, length, width / 2 - 1, 0, Math.PI * 2);
  ctx.fill();
}

function drawChain(ctx, upperAngle, upperLen, lowerAngle, lowerLen, width, color, capColor) {
  ctx.save();
  ctx.rotate(upperAngle * D2R);
  roundedLimb(ctx, upperLen, width, color);
  ctx.translate(0, upperLen);
  ctx.rotate(lowerAngle * D2R);
  roundedLimb(ctx, lowerLen, width * 0.85, color);
  ctx.beginPath();
  ctx.arc(0, lowerLen, width * 0.42, 0, Math.PI * 2);
  ctx.fillStyle = capColor;
  ctx.fill();
  ctx.restore();
}

function drawProp(ctx, prop, palette, headRadius) {
  ctx.save();
  if (prop === 'cap_green') {
    ctx.fillStyle = palette.secondary;
    ctx.beginPath();
    ctx.arc(0, -headRadius * 0.35, headRadius * 1.08, Math.PI * 1.05, Math.PI * 1.95);
    ctx.fill();
    ctx.fillRect(-headRadius * 0.1, -headRadius * 0.55, headRadius * 1.15, headRadius * 0.3);
  } else if (prop === 'hair_gray' || prop === 'hair_dark') {
    ctx.fillStyle = prop === 'hair_gray' ? '#d5d8dc' : '#262626';
    ctx.beginPath();
    ctx.arc(0, -headRadius * 0.25, headRadius * 1.12, Math.PI * 1.05, Math.PI * 1.95);
    ctx.fill();
  } else if (prop === 'braids') {
    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.arc(0, -headRadius * 0.3, headRadius * 1.05, Math.PI * 1.05, Math.PI * 1.95);
    ctx.fill();
    ctx.fillRect(-headRadius * 0.95, -headRadius * 0.1, 5, headRadius * 1.5);
  }
  ctx.restore();
}

export function drawCharacter(ctx, x, feetY, facing, pose, palette, prop, opts = {}) {
  const { flash = false, alpha = 1 } = opts;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, feetY);
  ctx.scale(facing, 1);
  ctx.translate(pose.offsetX, pose.offsetY);
  ctx.scale(1, pose.squash);

  const legColor = flash ? '#ffffff' : palette.secondary;
  const armColor = flash ? '#ffffff' : palette.accent;
  const skinColor = flash ? '#ffffff' : palette.skin;
  const torsoColor = flash ? '#ffffff' : palette.primary;

  // back leg (farther from viewer's reading order, drawn first/behind)
  ctx.save();
  ctx.translate(RIG.hip.x, RIG.hip.y);
  drawChain(ctx, pose.legBack.hip, RIG.upperLimb, pose.legBack.knee, RIG.lowerLimb, RIG.limbWidth, legColor, skinColor);
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
    drawChain(ctx, pose.armBack.shoulder, RIG.upperLimb, pose.armBack.elbow, RIG.lowerLimb, RIG.limbWidth * 0.8, armColor, skinColor);
    ctx.restore();

    ctx.fillStyle = torsoColor;
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(18, 0);
    ctx.lineTo(13, -RIG.torsoLen);
    ctx.lineTo(-13, -RIG.torsoLen);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.translate(0, -RIG.torsoLen);
    ctx.rotate(pose.headTilt * D2R);
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(0, -RIG.headRadius, RIG.headRadius, 0, Math.PI * 2);
    ctx.fill();
    drawProp(ctx, prop, palette, RIG.headRadius);
    ctx.restore();
  });

  // front leg
  ctx.save();
  ctx.translate(RIG.hip.x, RIG.hip.y);
  drawChain(ctx, pose.legFront.hip, RIG.upperLimb, pose.legFront.knee, RIG.lowerLimb, RIG.limbWidth, legColor, skinColor);
  ctx.restore();

  // front arm (drawn last so it reads on top during punches)
  withUpperBody(() => {
    ctx.save();
    ctx.translate(0, -RIG.torsoLen);
    drawChain(ctx, pose.armFront.shoulder, RIG.upperLimb, pose.armFront.elbow, RIG.lowerLimb, RIG.limbWidth * 0.8, armColor, skinColor);
    ctx.restore();
  });

  ctx.restore();
}

export function interpolateFrame(animation, elapsedMs) {
  const frames = animation.frames;
  let t = elapsedMs;
  let index = 0;
  while (index < frames.length - 1 && t >= frames[index].duration) {
    t -= frames[index].duration;
    index += 1;
  }
  if (index === frames.length - 1 && animation.loop && frames.length > 1) {
    const total = frames.reduce((s, f) => s + f.duration, 0);
    const looped = elapsedMs % total;
    let acc = 0;
    for (let i = 0; i < frames.length; i++) {
      acc += frames[i].duration;
      if (looped < acc) return { pose: frames[i].pose, finished: false, index: i };
    }
  }
  const finished = index === frames.length - 1 && !animation.loop && elapsedMs >= frames[index].duration;
  return { pose: frames[index].pose, finished, index };
}
