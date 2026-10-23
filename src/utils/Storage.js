import { STORAGE_KEYS } from './constants.js';

const DEFAULT_SETTINGS = {
  musicVolume: 0.6,
  sfxVolume: 0.8,
  difficulty: 'normal',
  keymap: {
    p1: { left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS', punch: 'KeyF', kick: 'KeyG', block: 'KeyH' },
    p2: { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', punch: 'KeyJ', kick: 'KeyK', block: 'KeyL' }
  },
  controlMode: 'auto' // 'auto' | 'keyboard' | 'touch'
};

function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export const Storage = {
  loadSettings() {
    const stored = safeParse(localStorage.getItem(STORAGE_KEYS.SETTINGS), {});
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
      keymap: {
        p1: { ...DEFAULT_SETTINGS.keymap.p1, ...(stored.keymap && stored.keymap.p1) },
        p2: { ...DEFAULT_SETTINGS.keymap.p2, ...(stored.keymap && stored.keymap.p2) }
      }
    };
  },
  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      /* storage unavailable (private mode, quota) - ignore, settings stay in-memory */
    }
  },
  loadRecords() {
    return safeParse(localStorage.getItem(STORAGE_KEYS.RECORDS), { wins: {}, matches: 0 });
  },
  saveRecords(records) {
    try {
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    } catch {
      /* ignore */
    }
  }
};

export { DEFAULT_SETTINGS };
