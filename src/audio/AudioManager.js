// All audio here is synthesized at runtime with the Web Audio API - no
// external/commercial audio files are used anywhere in the project.
const MUSIC_PATTERNS = {
  menu: { notes: [196, 220, 246, 220, 261, 220, 246, 196], tempo: 220, wave: 'triangle' },
  fight: { notes: [146, 146, 174, 146, 196, 174, 146, 130], tempo: 160, wave: 'square' },
  select: { notes: [220, 246, 261, 293, 261, 246], tempo: 190, wave: 'triangle' }
};

export class AudioManager {
  constructor(settings) {
    this.settings = settings;
    this.ctx = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicPlaying = false;
    this.musicTimer = null;
  }

  ensureContext() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.settings.musicVolume;
      this.musicGain.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.settings.sfxVolume;
      this.sfxGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMusicVolume(v) {
    this.settings.musicVolume = v;
    if (this.musicGain) this.musicGain.gain.value = v;
  }

  setSfxVolume(v) {
    this.settings.sfxVolume = v;
    if (this.sfxGain) this.sfxGain.gain.value = v;
  }

  tone({ freq, duration, type = 'sine', gain = 0.3, slideTo = null, delay = 0 }) {
    this.ensureContext();
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(slideTo, 1), t0 + duration);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  noise({ duration = 0.15, gain = 0.3 }) {
    this.ensureContext();
    const size = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 1800;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    src.connect(filt);
    filt.connect(g);
    g.connect(this.sfxGain);
    src.start();
  }

  sfx(name) {
    switch (name) {
      case 'jab':
        this.tone({ freq: 240, slideTo: 150, duration: 0.05, type: 'square', gain: 0.3 });
        break;
      case 'hook':
        this.noise({ duration: 0.07, gain: 0.25 });
        this.tone({ freq: 140, slideTo: 55, duration: 0.14, type: 'square', gain: 0.4, delay: 0.03 });
        break;
      case 'highKick':
        this.noise({ duration: 0.06, gain: 0.2 });
        this.tone({ freq: 260, slideTo: 110, duration: 0.1, type: 'triangle', gain: 0.3, delay: 0.05 });
        break;
      case 'lowKick':
        this.noise({ duration: 0.1, gain: 0.35 });
        this.tone({ freq: 100, slideTo: 50, duration: 0.09, type: 'square', gain: 0.3 });
        break;
      case 'block':
        this.tone({ freq: 650, slideTo: 420, duration: 0.08, type: 'triangle', gain: 0.25 });
        break;
      case 'hit':
        this.noise({ duration: 0.18, gain: 0.5 });
        break;
      case 'select':
        this.tone({ freq: 440, duration: 0.07, type: 'square', gain: 0.25 });
        break;
      case 'confirm':
        this.tone({ freq: 660, slideTo: 880, duration: 0.15, type: 'square', gain: 0.3 });
        break;
      case 'back':
        this.tone({ freq: 320, slideTo: 200, duration: 0.1, type: 'square', gain: 0.22 });
        break;
      case 'ko':
        this.tone({ freq: 220, slideTo: 40, duration: 0.8, type: 'sawtooth', gain: 0.4 });
        break;
      case 'round':
        this.tone({ freq: 523, duration: 0.18, type: 'square', gain: 0.3 });
        break;
      default:
        break;
    }
  }

  startMusic(pattern = 'menu') {
    this.ensureContext();
    this.stopMusic();
    this.musicPlaying = true;
    this.musicStep = 0;
    this.currentPattern = pattern;
    this.scheduleMusicStep();
  }

  scheduleMusicStep() {
    if (!this.musicPlaying) return;
    const def = MUSIC_PATTERNS[this.currentPattern] || MUSIC_PATTERNS.menu;
    const note = def.notes[this.musicStep % def.notes.length];
    this.tone({ freq: note, duration: def.tempo / 1000 + 0.05, type: def.wave, gain: 0.08 });
    if (this.musicStep % 4 === 0) {
      this.tone({ freq: note / 2, duration: def.tempo / 500, type: 'sine', gain: 0.07 });
    }
    this.musicStep += 1;
    this.musicTimer = setTimeout(() => this.scheduleMusicStep(), def.tempo);
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) clearTimeout(this.musicTimer);
    this.musicTimer = null;
  }
}
