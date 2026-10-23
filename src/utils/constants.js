// Logical resolution the whole game is simulated and drawn at (16:9).
// The Renderer scales this up to fill whatever physical screen is available.
export const LOGICAL_WIDTH = 960;
export const LOGICAL_HEIGHT = 540;

export const GROUND_Y = 448;
export const STAGE_LEFT = 60;
export const STAGE_RIGHT = LOGICAL_WIDTH - 60;

export const GRAVITY = 2100; // px/s^2
export const JUMP_VELOCITY = -760; // px/s
export const WALK_SPEED = 210; // px/s
export const PUSH_DISTANCE = 56; // minimum horizontal gap kept between fighters

export const FIXED_DT = 1 / 60;

export const ROUND_TIME_SECONDS = 60;
export const ROUNDS_TO_WIN = 2; // best of 3

export const MAX_HEALTH = 100;
export const MAX_ENERGY = 100;

export const STORAGE_KEYS = {
  SETTINGS: 'brfighter.settings.v1',
  RECORDS: 'brfighter.records.v1'
};
