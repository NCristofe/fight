// Shared procedural "rig" animation data used by every character.
// Each state is a sequence of pose keyframes (joint angles in degrees, offsets in px)
// applied to a common paper-doll skeleton drawn by CharacterSprite.js.
//
// This is the PROVISIONAL sprite system described in the project brief: it renders
// clearly-identified placeholder fighters (not flat colored rectangles) while keeping
// a clean seam to swap in real pixel-art sheets later. See README.md ("Substituindo
// os sprites provisorios") for how to do that without touching combat/animation logic.
//
// Pose fields (all relative to the character's own facing direction, "front" = facing opponent):
//   bodyLean, headTilt            -> torso / head rotation
//   armFront/armBack              -> { shoulder, elbow } angles, limb nearer/farther from opponent
//   legFront/legBack              -> { hip, knee } angles
//   offsetY                       -> vertical offset (crouch, jump arc, hit recoil)
//   offsetX                       -> forward lunge offset (specials, dashes)
//   squash                        -> vertical scale (impact squash/stretch)

const pose = (overrides = {}) => ({
  bodyLean: 0,
  headTilt: 0,
  armFront: { shoulder: -38, elbow: 18 },
  armBack: { shoulder: 24, elbow: -14 },
  legFront: { hip: 14, knee: 8 },
  legBack: { hip: -14, knee: 8 },
  offsetX: 0,
  offsetY: 0,
  squash: 1,
  ...overrides
});

export const ANIMATIONS = {
  idle: {
    loop: true,
    frames: [
      { duration: 500, pose: pose() },
      { duration: 500, pose: pose({ offsetY: -3, armFront: { shoulder: -16, elbow: 22 } }) }
    ]
  },
  walk_forward: {
    loop: true,
    frames: [
      { duration: 160, pose: pose({ legFront: { hip: 28, knee: 20 }, legBack: { hip: -22, knee: 35 }, bodyLean: 4 }) },
      { duration: 160, pose: pose({ legFront: { hip: -4, knee: 6 }, legBack: { hip: 4, knee: 6 }, bodyLean: 2 }) },
      { duration: 160, pose: pose({ legFront: { hip: -22, knee: 35 }, legBack: { hip: 28, knee: 20 }, bodyLean: 4 }) },
      { duration: 160, pose: pose({ legFront: { hip: 4, knee: 6 }, legBack: { hip: -4, knee: 6 }, bodyLean: 2 }) }
    ]
  },
  walk_back: {
    loop: true,
    frames: [
      { duration: 170, pose: pose({ legFront: { hip: 20, knee: 24 }, legBack: { hip: -24, knee: 16 }, bodyLean: -4 }) },
      { duration: 170, pose: pose({ legFront: { hip: -4, knee: 6 }, legBack: { hip: 4, knee: 6 }, bodyLean: -2 }) },
      { duration: 170, pose: pose({ legFront: { hip: -24, knee: 16 }, legBack: { hip: 20, knee: 24 }, bodyLean: -4 }) },
      { duration: 170, pose: pose({ legFront: { hip: 4, knee: 6 }, legBack: { hip: -4, knee: 6 }, bodyLean: -2 }) }
    ]
  },
  jump: {
    loop: false,
    frames: [
      { duration: 90, pose: pose({ legFront: { hip: 40, knee: 60 }, legBack: { hip: 40, knee: 60 }, offsetY: 6 }) },
      { duration: 1e9, pose: pose({ legFront: { hip: -10, knee: 30 }, legBack: { hip: 15, knee: 30 }, offsetY: -8, armFront: { shoulder: -40, elbow: 10 } }) }
    ]
  },
  crouch: {
    loop: false,
    frames: [{ duration: 1e9, pose: pose({ squash: 0.72, offsetY: 18, legFront: { hip: 55, knee: 80 }, legBack: { hip: -55, knee: 80 }, bodyLean: 6, headTilt: 4 }) }]
  },
  slash: {
    loop: false,
    frames: [
      { duration: 50, pose: pose({ armFront: { shoulder: -110, elbow: 40 }, bodyLean: -10 }) },
      { duration: 70, pose: pose({ armFront: { shoulder: 30, elbow: -10 }, bodyLean: 14, offsetX: 10 }) },
      { duration: 40, pose: pose({ armFront: { shoulder: 50, elbow: -15 }, bodyLean: 10, offsetX: 10 }) },
      { duration: 150, pose: pose({ armFront: { shoulder: -20, elbow: 15 }, bodyLean: 0 }) }
    ]
  },
  heavySlash: {
    loop: false,
    frames: [
      { duration: 120, pose: pose({ armFront: { shoulder: -150, elbow: 60 }, bodyLean: -20, headTilt: -6, offsetY: -4 }) },
      { duration: 80, pose: pose({ armFront: { shoulder: -40, elbow: 10 }, bodyLean: 6 }) },
      { duration: 100, pose: pose({ armFront: { shoulder: 70, elbow: -20 }, bodyLean: 22, offsetX: 16, squash: 0.9 }) },
      { duration: 220, pose: pose({ armFront: { shoulder: 20, elbow: 10 }, bodyLean: 6 }) }
    ]
  },
  thrust: {
    loop: false,
    frames: [
      { duration: 70, pose: pose({ armFront: { shoulder: 10, elbow: -60 }, bodyLean: -8 }) },
      {
        duration: 70,
        pose: pose({
          armFront: { shoulder: -10, elbow: -5 },
          bodyLean: 14,
          offsetX: 26,
          legFront: { hip: 40, knee: 10 },
          legBack: { hip: -10, knee: 20 }
        })
      },
      { duration: 30, pose: pose({ armFront: { shoulder: -8, elbow: -4 }, bodyLean: 16, offsetX: 28 }) },
      { duration: 180, pose: pose({ armFront: { shoulder: -20, elbow: 15 }, bodyLean: 4, offsetX: 0 }) }
    ]
  },
  lowSlash: {
    loop: false,
    frames: [
      { duration: 70, pose: pose({ legFront: { hip: -20, knee: 70 }, armFront: { shoulder: 30, elbow: -30 }, squash: 0.88, offsetY: 8, bodyLean: -6 }) },
      { duration: 80, pose: pose({ legFront: { hip: 40, knee: 15 }, armFront: { shoulder: -60, elbow: 20 }, squash: 0.86, offsetY: 10, bodyLean: 10 }) },
      { duration: 40, pose: pose({ legFront: { hip: 38, knee: 14 }, armFront: { shoulder: -58, elbow: 18 }, squash: 0.86, offsetY: 10, bodyLean: 10 }) },
      { duration: 170, pose: pose({ legFront: { hip: 8, knee: 10 }, armFront: { shoulder: -20, elbow: 15 }, squash: 1, offsetY: 0, bodyLean: 2 }) }
    ]
  },
  block: {
    loop: true,
    frames: [{ duration: 1e9, pose: pose({ armFront: { shoulder: -60, elbow: 90 }, armBack: { shoulder: -50, elbow: 90 }, bodyLean: -6, offsetX: -4 }) }]
  },
  hitstun: {
    loop: false,
    frames: [{ duration: 1e9, pose: pose({ bodyLean: -18, headTilt: -14, offsetX: -10, armFront: { shoulder: 30, elbow: -10 } }) }]
  },
  stunned: {
    loop: true,
    frames: [
      { duration: 250, pose: pose({ headTilt: 14, bodyLean: 6, offsetY: -2 }) },
      { duration: 250, pose: pose({ headTilt: -14, bodyLean: -6, offsetY: 0 }) }
    ]
  },
  win: {
    loop: true,
    frames: [
      { duration: 300, pose: pose({ armFront: { shoulder: -140, elbow: 10 }, armBack: { shoulder: -140, elbow: 10 }, offsetY: -4 }) },
      { duration: 300, pose: pose({ armFront: { shoulder: -120, elbow: 10 }, armBack: { shoulder: -120, elbow: 10 }, offsetY: 0 }) }
    ]
  },
  lose: {
    loop: false,
    frames: [{ duration: 1e9, pose: pose({ bodyLean: -40, headTilt: -20, offsetY: 30, squash: 0.5, armFront: { shoulder: 60, elbow: 0 }, armBack: { shoulder: 60, elbow: 0 } }) }]
  }
};

export function getAnimation(stateKey) {
  return ANIMATIONS[stateKey] || ANIMATIONS.idle;
}
