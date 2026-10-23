// Keyframe animation data for the stick-figure swordsman.
//
// ANGLE CONVENTION (all poses authored for a fighter facing right):
//   0 = limb hangs straight down, NEGATIVE = swings toward the front/up,
//   POSITIVE = swings backward.  bodyLean/headTilt: positive leans forward.
//   armFront.elbow / legs knee: negative elbow folds the forearm up/forward,
//   positive knee folds the shin backward (natural knee bend).
//   pose.sword is the blade angle relative to the forearm; blade world angle =
//   bodyLean + shoulder + elbow + sword  (0 = down, -90 = forward, +-180 = up).
//   offsetX = forward lunge, offsetY = extra drop, tilt = whole-body rotation
//   about the feet (negative = falls backward). Feet are auto-grounded by the
//   renderer, so crouches only need leg angles.
//
// Each frame's `duration` is the time to travel from that frame's pose to the
// NEXT frame's pose (the last frame is simply held). Attack animation totals
// are matched to the move's startup+active+recovery in characterData.js so the
// blade reaches its contact pose inside the active window.

const pose = (o = {}) => ({
  bodyLean: 4,
  headTilt: 0,
  armFront: { shoulder: -55, elbow: -65 },
  armBack: { shoulder: -30, elbow: -85 },
  legFront: { hip: -22, knee: 14 },
  legBack: { hip: 16, knee: 22 },
  sword: -40,
  tilt: 0,
  offsetX: 0,
  offsetY: 0,
  squash: 1,
  ...o
});

const GUARD = pose();

export const ANIMATIONS = {
  idle: {
    loop: true,
    frames: [
      { duration: 420, ease: 'inOut', pose: GUARD },
      {
        duration: 420,
        ease: 'inOut',
        pose: pose({
          bodyLean: 6,
          armFront: { shoulder: -50, elbow: -72 },
          armBack: { shoulder: -26, elbow: -90 },
          legFront: { hip: -26, knee: 22 },
          legBack: { hip: 18, knee: 32 },
          sword: -36
        })
      }
    ]
  },

  walk_forward: {
    loop: true,
    frames: [
      { duration: 110, ease: 'linear', pose: pose({ bodyLean: 9, legFront: { hip: -36, knee: 8 }, legBack: { hip: 22, knee: 34 } }) },
      { duration: 110, ease: 'linear', pose: pose({ bodyLean: 9, legFront: { hip: -4, knee: 12 }, legBack: { hip: -22, knee: 78 } }) },
      { duration: 110, ease: 'linear', pose: pose({ bodyLean: 9, legFront: { hip: 22, knee: 34 }, legBack: { hip: -36, knee: 8 } }) },
      { duration: 110, ease: 'linear', pose: pose({ bodyLean: 9, legFront: { hip: -22, knee: 78 }, legBack: { hip: -4, knee: 12 } }) }
    ]
  },

  walk_back: {
    loop: true,
    frames: [
      { duration: 120, ease: 'linear', pose: pose({ bodyLean: 0, legFront: { hip: -28, knee: 8 }, legBack: { hip: 16, knee: 30 } }) },
      { duration: 120, ease: 'linear', pose: pose({ bodyLean: 0, legFront: { hip: -22, knee: 70 }, legBack: { hip: -4, knee: 12 } }) },
      { duration: 120, ease: 'linear', pose: pose({ bodyLean: 0, legFront: { hip: 16, knee: 30 }, legBack: { hip: -28, knee: 8 } }) },
      { duration: 120, ease: 'linear', pose: pose({ bodyLean: 0, legFront: { hip: -4, knee: 12 }, legBack: { hip: -22, knee: 70 } }) }
    ]
  },

  jump: {
    loop: false,
    frames: [
      {
        duration: 1e9,
        pose: pose({
          bodyLean: 6,
          armFront: { shoulder: -110, elbow: -50 },
          armBack: { shoulder: -70, elbow: -60 },
          legFront: { hip: -75, knee: 95 },
          legBack: { hip: -10, knee: 105 },
          sword: -30
        })
      }
    ]
  },

  fall: {
    loop: false,
    frames: [
      {
        duration: 1e9,
        pose: pose({
          bodyLean: 2,
          armFront: { shoulder: -125, elbow: -30 },
          armBack: { shoulder: -85, elbow: -40 },
          legFront: { hip: -20, knee: 14 },
          legBack: { hip: 24, knee: 12 },
          sword: -20
        })
      }
    ]
  },

  crouch: {
    loop: false,
    frames: [
      {
        duration: 1e9,
        pose: pose({
          bodyLean: 16,
          armFront: { shoulder: -48, elbow: -40 },
          armBack: { shoulder: -25, elbow: -70 },
          legFront: { hip: -75, knee: 105 },
          legBack: { hip: 32, knee: 112 },
          sword: -80
        })
      }
    ]
  },

  // Corte Rapido: wind-up behind the head, diagonal downward cut, step forward.
  slash: {
    loop: false,
    frames: [
      { duration: 55, ease: 'in', pose: GUARD },
      {
        duration: 60,
        ease: 'in',
        pose: pose({
          bodyLean: -12,
          armFront: { shoulder: -170, elbow: -30 },
          armBack: { shoulder: -40, elbow: -110 },
          legFront: { hip: -14, knee: 14 },
          legBack: { hip: 22, knee: 26 },
          sword: -28,
          offsetX: -4
        })
      },
      {
        duration: 45,
        ease: 'out',
        pose: pose({
          bodyLean: 18,
          armFront: { shoulder: -75, elbow: -6 },
          armBack: { shoulder: 30, elbow: -30 },
          legFront: { hip: -46, knee: 34 },
          legBack: { hip: 26, knee: 10 },
          sword: 20,
          offsetX: 22
        })
      },
      {
        duration: 170,
        ease: 'out',
        pose: pose({
          bodyLean: 20,
          armFront: { shoulder: -45, elbow: -10 },
          armBack: { shoulder: 25, elbow: -25 },
          legFront: { hip: -44, knee: 34 },
          legBack: { hip: 26, knee: 10 },
          sword: 34,
          offsetX: 24
        })
      },
      { duration: 1, pose: GUARD }
    ]
  },

  // Golpe Descendente: slow overhead chop with a deep lunge.
  heavySlash: {
    loop: false,
    frames: [
      { duration: 80, ease: 'in', pose: GUARD },
      {
        duration: 90,
        ease: 'in',
        pose: pose({
          bodyLean: -18,
          headTilt: -6,
          armFront: { shoulder: -158, elbow: -62 },
          armBack: { shoulder: -148, elbow: -72 },
          legFront: { hip: -12, knee: 34 },
          legBack: { hip: 24, knee: 42 },
          sword: 9,
          offsetX: -6
        })
      },
      {
        duration: 60,
        ease: 'out',
        pose: pose({
          bodyLean: 30,
          headTilt: 10,
          armFront: { shoulder: -78, elbow: -14 },
          armBack: { shoulder: -70, elbow: -20 },
          legFront: { hip: -62, knee: 62 },
          legBack: { hip: 34, knee: 24 },
          sword: 14,
          offsetX: 32
        })
      },
      {
        duration: 330,
        ease: 'out',
        pose: pose({
          bodyLean: 32,
          headTilt: 12,
          armFront: { shoulder: -64, elbow: -12 },
          armBack: { shoulder: -58, elbow: -18 },
          legFront: { hip: -62, knee: 62 },
          legBack: { hip: 34, knee: 24 },
          sword: 32,
          offsetX: 34
        })
      },
      { duration: 1, pose: GUARD }
    ]
  },

  // Estocada: coil, then a long lunging stab with the blade level.
  thrust: {
    loop: false,
    frames: [
      { duration: 50, ease: 'in', pose: GUARD },
      {
        duration: 55,
        ease: 'in',
        pose: pose({
          bodyLean: -6,
          armFront: { shoulder: 10, elbow: -100 },
          armBack: { shoulder: -50, elbow: -60 },
          legFront: { hip: -20, knee: 30 },
          legBack: { hip: 22, knee: 40 },
          sword: 6,
          offsetX: -10
        })
      },
      {
        duration: 55,
        ease: 'out',
        pose: pose({
          bodyLean: 20,
          armFront: { shoulder: -92, elbow: -2 },
          armBack: { shoulder: 40, elbow: -20 },
          legFront: { hip: -72, knee: 52 },
          legBack: { hip: 30, knee: 6 },
          sword: -2,
          offsetX: 40
        })
      },
      {
        duration: 200,
        ease: 'out',
        pose: pose({
          bodyLean: 22,
          armFront: { shoulder: -90, elbow: -4 },
          armBack: { shoulder: 40, elbow: -20 },
          legFront: { hip: -72, knee: 52 },
          legBack: { hip: 30, knee: 6 },
          sword: -2,
          offsetX: 42
        })
      },
      { duration: 1, pose: GUARD }
    ]
  },

  // Rasteira: drop low and sweep the blade along the ground.
  lowSlash: {
    loop: false,
    frames: [
      { duration: 60, ease: 'in', pose: GUARD },
      {
        duration: 60,
        ease: 'in',
        pose: pose({
          bodyLean: -8,
          armFront: { shoulder: 62, elbow: -10 },
          armBack: { shoulder: 20, elbow: -50 },
          legFront: { hip: -70, knee: 100 },
          legBack: { hip: 34, knee: 108 },
          sword: 50
        })
      },
      {
        duration: 60,
        ease: 'out',
        pose: pose({
          bodyLean: 24,
          armFront: { shoulder: -88, elbow: -4 },
          armBack: { shoulder: 30, elbow: -30 },
          legFront: { hip: -80, knee: 108 },
          legBack: { hip: 40, knee: 20 },
          sword: -8,
          offsetX: 26
        })
      },
      {
        duration: 220,
        ease: 'out',
        pose: pose({
          bodyLean: 28,
          armFront: { shoulder: -70, elbow: -8 },
          armBack: { shoulder: 30, elbow: -30 },
          legFront: { hip: -80, knee: 108 },
          legBack: { hip: 40, knee: 20 },
          sword: -4,
          offsetX: 30
        })
      },
      { duration: 1, pose: GUARD }
    ]
  },

  // Golpe Aereo: diving diagonal cut while airborne.
  airSlash: {
    loop: false,
    frames: [
      {
        duration: 40,
        ease: 'in',
        pose: pose({
          bodyLean: 2,
          armFront: { shoulder: -125, elbow: -30 },
          armBack: { shoulder: -85, elbow: -40 },
          legFront: { hip: -20, knee: 14 },
          legBack: { hip: 24, knee: 12 },
          sword: -20
        })
      },
      {
        duration: 60,
        ease: 'out',
        pose: pose({
          bodyLean: -10,
          armFront: { shoulder: -172, elbow: -28 },
          armBack: { shoulder: -150, elbow: -30 },
          legFront: { hip: -60, knee: 80 },
          legBack: { hip: 10, knee: 90 },
          sword: -28
        })
      },
      {
        duration: 50,
        ease: 'out',
        pose: pose({
          bodyLean: 24,
          armFront: { shoulder: -78, elbow: -8 },
          armBack: { shoulder: -30, elbow: -30 },
          legFront: { hip: -52, knee: 70 },
          legBack: { hip: 22, knee: 84 },
          sword: 24
        })
      },
      {
        duration: 200,
        ease: 'out',
        pose: pose({
          bodyLean: 18,
          armFront: { shoulder: -50, elbow: -10 },
          armBack: { shoulder: -20, elbow: -40 },
          legFront: { hip: -30, knee: 30 },
          legBack: { hip: 20, knee: 24 },
          sword: 34
        })
      },
      { duration: 1, pose: GUARD }
    ]
  },

  // Blade held upright in front of the face.
  block: {
    loop: false,
    frames: [
      { duration: 50, ease: 'out', pose: GUARD },
      {
        duration: 1e9,
        pose: pose({
          bodyLean: -2,
          headTilt: -2,
          armFront: { shoulder: -85, elbow: -95 },
          armBack: { shoulder: -78, elbow: -98 },
          legFront: { hip: -30, knee: 26 },
          legBack: { hip: 22, knee: 30 },
          sword: -2,
          offsetX: -4
        })
      }
    ]
  },

  hitstun: {
    loop: false,
    frames: [
      { duration: 50, ease: 'out', pose: GUARD },
      {
        duration: 90,
        ease: 'out',
        pose: pose({
          bodyLean: -28,
          headTilt: -16,
          armFront: { shoulder: 55, elbow: -20 },
          armBack: { shoulder: 70, elbow: -20 },
          legFront: { hip: -8, knee: 22 },
          legBack: { hip: 34, knee: 40 },
          sword: 10,
          offsetX: -14
        })
      },
      {
        duration: 180,
        ease: 'inOut',
        pose: pose({
          bodyLean: -14,
          headTilt: -8,
          armFront: { shoulder: -10, elbow: -60 },
          armBack: { shoulder: 20, elbow: -50 },
          legFront: { hip: -16, knee: 20 },
          legBack: { hip: 24, knee: 30 },
          sword: -30,
          offsetX: -10
        })
      },
      { duration: 1, pose: GUARD }
    ]
  },

  stunned: {
    loop: true,
    frames: [
      { duration: 250, ease: 'inOut', pose: pose({ headTilt: 14, bodyLean: 6 }) },
      { duration: 250, ease: 'inOut', pose: pose({ headTilt: -14, bodyLean: -6 }) }
    ]
  },

  win: {
    loop: true,
    frames: [
      {
        duration: 380,
        ease: 'inOut',
        pose: pose({
          bodyLean: -4,
          armFront: { shoulder: -165, elbow: -15 },
          armBack: { shoulder: 20, elbow: -30 },
          legFront: { hip: -18, knee: 12 },
          legBack: { hip: 14, knee: 14 },
          sword: -12
        })
      },
      {
        duration: 380,
        ease: 'inOut',
        pose: pose({
          bodyLean: 0,
          armFront: { shoulder: -175, elbow: -8 },
          armBack: { shoulder: 24, elbow: -30 },
          legFront: { hip: -18, knee: 12 },
          legBack: { hip: 14, knee: 14 },
          sword: -4
        })
      }
    ]
  },

  lose: {
    loop: false,
    frames: [
      {
        duration: 110,
        ease: 'out',
        pose: pose({
          bodyLean: -26,
          headTilt: -14,
          armFront: { shoulder: 60, elbow: -20 },
          armBack: { shoulder: 70, elbow: -20 },
          legFront: { hip: -8, knee: 22 },
          legBack: { hip: 34, knee: 40 },
          sword: 10,
          offsetX: -14
        })
      },
      {
        duration: 160,
        ease: 'in',
        pose: pose({
          bodyLean: -20,
          headTilt: -10,
          armFront: { shoulder: 70, elbow: -10 },
          armBack: { shoulder: 80, elbow: -10 },
          legFront: { hip: -20, knee: 70 },
          legBack: { hip: 30, knee: 90 },
          sword: 20,
          offsetX: -26,
          tilt: -20
        })
      },
      {
        duration: 200,
        ease: 'in',
        pose: pose({
          bodyLean: -6,
          headTilt: -4,
          armFront: { shoulder: 100, elbow: -10 },
          armBack: { shoulder: 110, elbow: -10 },
          legFront: { hip: -10, knee: 10 },
          legBack: { hip: 8, knee: 10 },
          sword: 20,
          offsetX: -40,
          offsetY: -10,
          tilt: -88
        })
      },
      {
        duration: 1e9,
        pose: pose({
          bodyLean: -4,
          headTilt: -2,
          armFront: { shoulder: 112, elbow: -8 },
          armBack: { shoulder: 120, elbow: -8 },
          legFront: { hip: -8, knee: 8 },
          legBack: { hip: 8, knee: 8 },
          sword: 20,
          offsetX: -40,
          offsetY: -8,
          tilt: -90
        })
      }
    ]
  }
};

export function getAnimation(stateKey) {
  return ANIMATIONS[stateKey] || ANIMATIONS.idle;
}
